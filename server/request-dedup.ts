/**
 * Deduplicates concurrent identical requests.
 * If the same request key is in-flight, returns the same promise.
 */

const inflight = new Map<string, Promise<Response>>();
const MAX_INFLIGHT = 500;

export function deduplicateRequest(
  key: string,
  handler: () => Promise<Response>
): Promise<Response> {
  const existing = inflight.get(key);
  if (existing) return existing;

  if (inflight.size > MAX_INFLIGHT) {
    // Don't deduplicate if too many in-flight
    return handler();
  }

  const promise = handler().finally(() => {
    inflight.delete(key);
  });

  inflight.set(key, promise);
  return promise;
}
