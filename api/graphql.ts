import { createYoga } from 'graphql-yoga';
import { buildSchema } from '../backend/src/api/schema.js';

export default createYoga({ schema: buildSchema(), graphqlEndpoint: '/api/graphql' });
