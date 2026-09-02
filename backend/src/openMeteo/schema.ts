import { z } from 'zod';
import { UpstreamError } from './http.js';

export const nullableNumbers = z.array(z.number().nullable());

export function timeSeries<Columns extends z.ZodRawShape>(columns: Columns) {
  return z
    .object({ time: z.array(z.string()), ...columns })
    .refine(columnsShareOneLength, { message: 'has columns of different lengths' });
}

export function variablesOf(timeSeriesSchema: { shape: object }): string {
  return Object.keys(timeSeriesSchema.shape)
    .filter((column) => column !== 'time')
    .join(',');
}

export function parseUpstream<Output>(
  schema: z.ZodType<Output>,
  body: unknown,
  what: string,
): Output {
  const result = schema.safeParse(body);
  if (!result.success) {
    throw new UpstreamError(`${what}: ${describeIssues(result.error)}`);
  }
  return result.data;
}

export function parseLocations<Output>(
  location: z.ZodType<Output>,
  body: unknown,
  requested: number,
  what: string,
): Output[] {
  const oneOrMany = z.union([z.array(location), location.transform((single) => [single])]);
  const locations = parseUpstream(oneOrMany, body, what);
  if (locations.length !== requested) {
    throw new UpstreamError(
      `${what} returned ${String(locations.length)} locations for ${String(requested)} requested`,
    );
  }
  return locations;
}

function columnsShareOneLength(block: object): boolean {
  const lengths = Object.values(block as Record<string, unknown>)
    .filter(Array.isArray)
    .map((column) => column.length);
  return new Set(lengths).size <= 1;
}

function describeIssues(error: z.ZodError): string {
  return error.issues
    .map((issue) => `${issue.path.map(String).join('.') || 'body'} ${issue.message}`)
    .join('; ');
}
