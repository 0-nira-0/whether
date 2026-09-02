import { createServer } from 'node:http';
import { createSchema, createYoga } from 'graphql-yoga';

const schema = createSchema({
  typeDefs: /* GraphQL */ `
    type Query {
      health: String!
    }
  `,
  resolvers: {
    Query: {
      health: () => 'ok',
    },
  },
});

const yoga = createYoga({ schema });
const port = Number(process.env.PORT ?? 4000);

const server = createServer((request, response) => void yoga(request, response));

server.listen(port, () => {
  console.log(`GraphQL ready at http://localhost:${port}/graphql`);
});
