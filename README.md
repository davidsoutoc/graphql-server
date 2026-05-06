# Graphql server

## Commands

```
npm init -y
```

```
npm install apollo-server graphql
```

```
node index.js
```


## JSON server

https://github.com/typicode/json-server

`npm install json-server`

Add new script in package.json file (I used port 3001 because I have busy port 3000):

`"json-server": "json-server --watch db.json --port 3001",`


Open browser indifferent page and go: Inspect > console
```
copy(JSON.stringify([
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
]))
```

Add in db.json:
```
{
  "persons": paste copied code here
}
```

Paste it in db.json file:
```
[{"name":"Josh","phone":"123-456-7890","street":"Main St 1","city":"New York","id":"3d5f3b2e-1c4a-4d5e-8f3b-2e1c4a5d6f7g"},{"name":"Alice","street":"Second St 5","city":"Los Angeles","id":"4e6f7g8h-2b3c-4d5e-9f0a-1b2c3d4e5f6g"},{"name":"Bob","phone":"555-555-5555","street":"Third St 10","city":"Chicago","id":"5f6g7h8i-3c4d-5e6f-0a1b-2c3d4e5f6g7h"}]
````

After executed in a new terminal
```
npm run json-server
```

Open: http://localhost:3001/persons

```
[
  {
    "name": "JoshAPI",
    "phone": "123-456-7890",
    "street": "Main St 1",
    "city": "New York",
    "id": "3d5f3b2e-1c4a-4d5e-8f3b-2e1c4a5d6f7g"
  },
  {
    "name": "Alice",
    "street": "Second St 5",
    "city": "Los Angeles",
    "id": "4e6f7g8h-2b3c-4d5e-9f0a-1b2c3d4e5f6g"
  },
  {
    "name": "Bob",
    "phone": "555-555-5555",
    "street": "Third St 10",
    "city": "Chicago",
    "id": "5f6g7h8i-3c4d-5e6f-0a1b-2c3d4e5f6g7h"
  }
]
```

## Utils

Page with REST and GraphQL to play:

https://rickandmortyapi.com/documentation

https://rickandmortyapi.com/graphql

## Code Scanning demo

This repository now includes an isolated GitHub Code Scanning setup for testing alerts with GitHub's built-in CodeQL rules, without touching the main app flow.

- Workflow: `.github/workflows/fugitoid.yml`
- Fixture file: `security-fixtures/code-scanning-fixtures.js`

The workflow uses the built-in `security-extended` query suite. The fixture file is intentionally isolated from the app and contains patterns meant to trigger built-in alerts such as code injection, log injection, and identity replacement.

## Workflow reuse

If you want to install the code scanning autofix workflow in another repository, use:

- [Reuse Fugitoid workflow](docs/fugitoid-install.md)
