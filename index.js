import { ApolloServer, gql, UserInputError } from 'apollo-server'
import { v4 as uuid } from 'uuid'

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


const server = new ApolloServer({
  typeDefs,
  resolvers
})

server.listen().then(({ url }) => {
  console.log(`Server ready at ${url}`)
})