import { ApolloServer, gql, UserInputError } from 'apollo-server'
import { v4 as uuid } from 'uuid'
import axios from 'axios'
import http from 'node:http'
import { URL } from 'node:url'

let persons = [
  {
    name: "Josh",
    phone: "123-456-7890",
    street: "Main St 1",
    city: "New York",
    id: "3d5f3b2e-1c4a-4d5e-8f3b-2e1c4a5d6f7g"
  },
  {
    name: "Alice",
    street: "Second St 5",
    city: "Los Angeles",
    id: "4e6f7g8h-2b3c-4d5e-9f0a-1b2c3d4e5f6g"
  },
  {
    name: "Bob",
    phone: "555-555-5555",
    street: "Third St 10",
    city: "Chicago",
    id: "5f6g7h8i-3c4d-5e6f-0a1b-2c3d4e5f6g7h"
  }
]

const graphqlPort = Number(process.env.PORT ?? 4000)
const webhookPort = Number(process.env.WEBHOOK_PORT ?? 4001)
const webhookPath = '/webhooks/github-issue-summary'
const githubApiBaseUrl = 'https://api.github.com'

const typeDefs = gql`
  enum YesNo {
    YES
    NO
  }

  type Address {
    street: String!
    city: String!
  }

  type Person {
    name: String!
    phone: String
    address: Address!
    id: ID!
  }

  type Query {
    personCount: Int!
    allPersons(phone: YesNo): [Person]!
    allPersonsFromRestApi(phone: YesNo): [Person]! # Duplicated query to fetch persons from a REST API
    findPerson(name: String!): Person
  }

  type Mutation {
    addPerson(
      name: String!
      phone: String
      street: String!
      city: String!
    ): Person
    editNumber(
      name: String!
      phone: String!
    ): Person
  }
`

const resolvers = {
  Query: {
    personCount: () => persons.length,
    allPersons: (root, args) => {
      // If we don't filter by person's phone, return all persons
      if (!args.phone) {
        return persons
      }
      const byPhone = args.phone === 'YES'
      return persons.filter(person => byPhone ? person.phone : !person.phone)
    },
    allPersonsFromRestApi: async (root, args) => {
      const {data: personsFromRestApi} = await axios.get('http://localhost:3001/persons')

      // If we don't filter by person's phone, return all persons
      if (!args.phone) {
        return personsFromRestApi
      }
      const byPhone = args.phone === 'YES'
      return personsFromRestApi.filter(person => byPhone ? person.phone : !person.phone)
    },
    findPerson: (root, args) => persons.find(person => person.name === args.name)
  },
  Mutation: {
    addPerson: (root, args) => {
      // const { name, phone, street, city } = args
      if (persons.find(p => p.name === args.name)) {
        throw new UserInputError('Name must be unique', { invalidArgs: args.name })
      }
      const person = { ...args, id: uuid() }
      persons.push(person) // simulate DB insert
      return person
    },
    // The problem with this implementation is that we are reading
    // the array twice (probably not a big deal with a small array,
    // but with a big one it could be a performance issue):
    // first with find to check if the person exists
    // and then with map to create the new array
    // I have commented two alternative implementations below
    editNumber: (root, args) => {
      const person = persons.find(p => p.name === args.name)
      if (!person) {
        return null
      }
      const updatedPerson = { ...person, phone: args.phone }
      persons = persons.map(p => p.name === args.name ? updatedPerson : p)

      return updatedPerson
    },
    //editNumberOnlyOneReadArray: (root, args) => {
    //  let updatedPerson = null
    //  persons = persons.map(p => {
    //    if (p.name === args.name) {
    //      updatedPerson = { ...p, phone: args.phone }
    //      return updatedPerson
    //    }
    //    return p
    //  })
    //  return updatedPerson
    //},
    //editNumberWithFindIndex: (root, args) => {
    //  const personIndex = persons.findIndex(p => p.name === args.name)
    //  if (personIndex === -1) {
    //    return null
    //  }
    //  const updatedPerson = { ...persons[personIndex], phone: args.phone }
    //  persons[personIndex] = updatedPerson

    //  return updatedPerson
    //}
  },
  Person: {
    address: (root) => {
      return {
        street: root.street,
        city: root.city
      }
    }
  }
  // version without Address type
  // Person: {
  //    address: (root) => `${root.street}, ${root.city}`,
  // }
}

const parseJsonBody = (req) => new Promise((resolve, reject) => {
  let body = ''

  req.on('data', chunk => {
    body += chunk

    if (body.length > 1_000_000) {
      reject(new Error('Request body is too large'))
      req.destroy()
    }
  })

  req.on('end', () => {
    if (!body) {
      resolve({})
      return
    }

    try {
      resolve(JSON.parse(body))
    } catch (error) {
      reject(new Error('Request body must be valid JSON'))
    }
  })

  req.on('error', reject)
})

const sendJson = (res, statusCode, payload) => {
  res.writeHead(statusCode, { 'content-type': 'application/json; charset=utf-8' })
  res.end(JSON.stringify(payload, null, 2))
}

const getWebhookToken = (req) => {
  const authorization = req.headers.authorization

  if (authorization?.startsWith('Bearer ')) {
    return authorization.slice('Bearer '.length)
  }

  return req.headers['x-webhook-token']
}

const isWebhookAuthorized = (req) => {
  const expectedToken = process.env.WEBHOOK_SHARED_SECRET

  if (!expectedToken) {
    return true
  }

  return getWebhookToken(req) === expectedToken
}

const normalizeRepository = (value) => {
  if (typeof value !== 'string') {
    return null
  }

  const trimmedValue = value.trim()

  if (!trimmedValue) {
    return null
  }

  const directMatch = trimmedValue.match(/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/)
  if (directMatch) {
    return trimmedValue
  }

  try {
    const parsedUrl = new URL(trimmedValue)

    if (!['github.com', 'www.github.com'].includes(parsedUrl.hostname)) {
      return null
    }

    const [owner, repo] = parsedUrl.pathname
      .split('/')
      .filter(Boolean)
      .slice(0, 2)

    if (!owner || !repo) {
      return null
    }

    return `${owner}/${repo.replace(/\.git$/, '')}`
  } catch {
    return null
  }
}

const normalizeRepositories = (repositories) => {
  if (!Array.isArray(repositories) || repositories.length === 0) {
    throw new Error('`repositories` must be a non-empty array of GitHub repository URLs or `owner/repo` values')
  }

  const normalizedRepositories = repositories
    .map(normalizeRepository)
    .filter(Boolean)

  if (normalizedRepositories.length !== repositories.length) {
    throw new Error('Every repository must be a valid GitHub URL or `owner/repo` value')
  }

  return [...new Set(normalizedRepositories)]
}

const normalizeLabels = (labels) => {
  if (!Array.isArray(labels) || labels.length === 0) {
    throw new Error('`labels` must be a non-empty array of label names')
  }

  const normalizedLabels = labels
    .filter(label => typeof label === 'string')
    .map(label => label.trim())
    .filter(Boolean)

  if (normalizedLabels.length === 0) {
    throw new Error('`labels` must contain at least one non-empty label name')
  }

  return [...new Set(normalizedLabels)]
}

const normalizeState = (state) => {
  const normalizedState = state ?? 'open'

  if (!['open', 'closed', 'all'].includes(normalizedState)) {
    throw new Error('`state` must be `open`, `closed`, or `all`')
  }

  return normalizedState
}

const normalizeSince = (since) => {
  if (!since) {
    return null
  }

  const parsedDate = new Date(since)

  if (Number.isNaN(parsedDate.getTime())) {
    throw new Error('`since` must be a valid ISO date string')
  }

  return parsedDate.toISOString()
}

const normalizePerRepoLimit = (value) => {
  if (value == null) {
    return 20
  }

  const parsedValue = Number(value)

  if (!Number.isInteger(parsedValue) || parsedValue < 1 || parsedValue > 100) {
    throw new Error('`perRepoLimit` must be an integer between 1 and 100')
  }

  return parsedValue
}

const buildGitHubRequestHeaders = () => {
  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'graphql-server-teams-webhook'
  }

  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`
  }

  return headers
}

const fetchRepositoryIssues = async ({ repository, labels, state, since, perRepoLimit }) => {
  const response = await axios.get(`${githubApiBaseUrl}/repos/${repository}/issues`, {
    headers: buildGitHubRequestHeaders(),
    params: {
      state,
      labels: labels.join(','),
      since: since ?? undefined,
      per_page: perRepoLimit,
      page: 1
    }
  })

  return response.data
    .filter(issue => !issue.pull_request)
    .slice(0, perRepoLimit)
    .map(issue => ({
      repository,
      number: issue.number,
      title: issue.title,
      url: issue.html_url,
      state: issue.state,
      createdAt: issue.created_at,
      updatedAt: issue.updated_at,
      labels: issue.labels.map(label => label.name)
    }))
}

const buildSummaryText = ({ repositories, labels, state, issuesByRepository, issues }) => {
  const header = [
    `GitHub issue summary`,
    `Labels: ${labels.join(', ')}`,
    `State: ${state}`,
    `Repositories scanned: ${repositories.length}`,
    `Matching issues: ${issues.length}`
  ]

  const repositoryLines = Object.entries(issuesByRepository).flatMap(([repository, repositoryIssues]) => {
    const firstIssues = repositoryIssues
      .sort((left, right) => new Date(right.updatedAt) - new Date(left.updatedAt))
      .slice(0, 5)
      .map(issue => `- #${issue.number} ${issue.title} (${issue.url})`)

    return [
      '',
      `${repository}: ${repositoryIssues.length} issue(s)`,
      ...(firstIssues.length > 0 ? firstIssues : ['- No matching issues'])
    ]
  })

  return [...header, ...repositoryLines].join('\n')
}

const createIssueSummary = async ({ repositories, labels, state, since, perRepoLimit }) => {
  const repositoryEntries = await Promise.all(
    repositories.map(async repository => {
      const issues = await fetchRepositoryIssues({ repository, labels, state, since, perRepoLimit })
      return [repository, issues]
    })
  )

  const issuesByRepository = Object.fromEntries(repositoryEntries)
  const issues = repositoryEntries
    .flatMap(([, repositoryIssues]) => repositoryIssues)
    .sort((left, right) => new Date(right.updatedAt) - new Date(left.updatedAt))

  return {
    generatedAt: new Date().toISOString(),
    filters: {
      repositories,
      labels,
      state,
      since,
      perRepoLimit
    },
    counts: {
      repositories: repositories.length,
      issues: issues.length
    },
    issuesByRepository,
    issues,
    text: buildSummaryText({ repositories, labels, state, issuesByRepository, issues })
  }
}

const normalizeSummaryRequest = (payload) => ({
  repositories: normalizeRepositories(payload.repositories),
  labels: normalizeLabels(payload.labels),
  state: normalizeState(payload.state),
  since: normalizeSince(payload.since),
  perRepoLimit: normalizePerRepoLimit(payload.perRepoLimit)
})

const webhookServer = http.createServer(async (req, res) => {
  if (req.method === 'GET' && req.url === '/healthz') {
    sendJson(res, 200, { ok: true })
    return
  }

  if (req.method !== 'POST' || req.url !== webhookPath) {
    sendJson(res, 404, {
      error: 'Not found',
      expectedPath: webhookPath
    })
    return
  }

  if (!isWebhookAuthorized(req)) {
    sendJson(res, 401, { error: 'Unauthorized' })
    return
  }

  try {
    const payload = await parseJsonBody(req)
    const normalizedRequest = normalizeSummaryRequest(payload)
    const summary = await createIssueSummary(normalizedRequest)

    sendJson(res, 200, summary)
  } catch (error) {
    if (axios.isAxiosError(error)) {
      sendJson(res, error.response?.status ?? 502, {
        error: 'GitHub API request failed',
        details: error.response?.data ?? error.message
      })
      return
    }

    sendJson(res, 400, {
      error: error.message
    })
  }
})


const server = new ApolloServer({
  typeDefs,
  resolvers
})

server.listen({ port: graphqlPort }).then(({ url }) => {
  console.log(`Server ready at ${url}`)
})

webhookServer.listen(webhookPort, () => {
  console.log(`Webhook server ready at http://localhost:${webhookPort}${webhookPath}`)
})
