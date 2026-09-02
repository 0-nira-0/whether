const UPSTREAM_TIMEOUT_MS = 10_000;

export class UpstreamError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'UpstreamError';
  }
}

export function openMeteoUrl(base: string, params: Record<string, string>): URL {
  const url = new URL(base);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return url;
}

export async function fetchJson(url: URL): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(url, { signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS) });
  } catch (cause) {
    throw new UpstreamError(`Open-Meteo did not respond: ${url.host}`, { cause });
  }
  if (!response.ok) {
    throw new UpstreamError(`Open-Meteo responded ${String(response.status)} for ${url.pathname}`);
  }
  return response.json();
}
