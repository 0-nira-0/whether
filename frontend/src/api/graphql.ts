import { z } from 'zod';

const ENDPOINT = '/graphql';

const envelope = z.object({
  data: z.unknown().optional(),
  errors: z.array(z.object({ message: z.string() })).optional(),
});

export class RequestFailed extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RequestFailed';
  }
}

export async function request<Data>(
  query: string,
  variables: Record<string, unknown>,
  answer: z.ZodType<Data>,
): Promise<Data> {
  let response: Response;
  try {
    response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query, variables }),
    });
  } catch {
    throw new RequestFailed('The forecast service did not answer');
  }
  if (!response.ok) {
    throw new RequestFailed(
      response.status >= 500
        ? 'The forecast service is not answering'
        : `The forecast service refused the request, ${String(response.status)}`,
    );
  }
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new RequestFailed('The forecast service answered with something that is not JSON');
  }
  const parsed = envelope.safeParse(body);
  if (!parsed.success) {
    throw new RequestFailed('The forecast service answered in a shape we do not know');
  }
  const failure = parsed.data.errors?.[0];
  if (failure !== undefined) {
    throw new RequestFailed(failure.message);
  }
  const data = answer.safeParse(parsed.data.data);
  if (!data.success) {
    throw new RequestFailed('The forecast service answered in a shape we do not know');
  }
  return data.data;
}
