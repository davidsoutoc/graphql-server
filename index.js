import { ApolloServer, gql } from 'apollo-server'

const persons = [
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

const typeDefs = gql`
  type Address {
    street: String!
    city: String!
  }

  type Person {
    name: String!
    phone: String
    street: String!
    city: String!
    address: String!
    check: String!
    id: ID!
  }

  type Query {
    personCount: Int!
    allPersons: [Person]!
    findPerson(name: String!): Person
  }
`

const resolvers = {
  Query: {
    personCount: () => persons.length,
    allPersons: () => persons,
    findPerson: (root, args) => persons.find(person => person.name === args.name)
  },
  Person: {
    address: (root) => `${root.street}, ${root.city}`,
    check: () => 'checked!'
  }
}


const server = new ApolloServer({
  typeDefs,
  resolvers
})

server.listen().then(({ url }) => {
  console.log(`Server ready at ${url}`)
})