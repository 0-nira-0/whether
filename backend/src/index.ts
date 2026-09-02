import { createServer } from 'node:http';
import { createYoga } from 'graphql-yoga';
import { buildSchema } from './api/schema.js';

const yoga = createYoga({ schema: buildSchema() });
const port = Number(process.env.PORT ?? 4000);

const server = createServer((request, response) => void yoga(request, response));

server.listen(port, () => {
  console.log(`GraphQL ready at http://localhost:${port}/graphql`);
});
