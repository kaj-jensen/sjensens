/**
 * Fixed-field operational events: never log request URLs, headers, bodies,
 * exception messages or provider responses, which can contain personal data.
 * @template Env
 * @param {(request: Request, env: Env) => Promise<Response>} handler
 */
export function protectRequest(handler) {
  /** @param {Request} request @param {Env} env */
  return async (request, env) => {
    try {
      const response = await handler(request, env);
      if (response.status < 500) return response;
      return reportFailure(response, request);
    } catch {
      return reportFailure(new Response('Webbplatsen är tillfälligt otillgänglig. Försök igen senare.', {
        status: 503,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Content-Security-Policy": "default-src 'none'; base-uri 'none'; frame-ancestors 'none'",
          "X-Content-Type-Options": "nosniff",
          "X-Frame-Options": "DENY",
          "Referrer-Policy": "no-referrer",
        },
      }), request);
    }
  };
}
/** @param {Response} response @param {Request} request */
function reportFailure(response, request) {
  const requestId = crypto.randomUUID();
  const method = ["GET", "HEAD", "POST", "OPTIONS", "PUT", "PATCH", "DELETE"].includes(request.method)
    ? request.method : "OTHER";
  try {
    console.error(JSON.stringify({ event: "request_failed", requestId, method, status: response.status }));
  } catch { /* Logging must never replace the controlled response. */ }
  const headers = new Headers(response.headers);
  headers.set("Cache-Control", "no-store");
  headers.set("X-Request-ID", requestId);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
