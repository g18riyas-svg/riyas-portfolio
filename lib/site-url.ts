/** Server-controlled URLs only: never trust a caller's forwarded-host header. */
export function publicOrigin(requestUrl: string): string {
  const configuredUrl = process.env.SITE_URL || process.env.URL;
  const origin = new URL(configuredUrl || requestUrl);
  if (!['http:', 'https:'].includes(origin.protocol) || origin.username || origin.password) {
    throw new Error('SITE_URL must be an HTTP or HTTPS website URL.');
  }
  return origin.origin;
}

export function publicUrl(path: string, requestUrl: string): URL {
  // Callers supply fixed application paths, never an arbitrary user redirect.
  if (!path.startsWith('/') || path.startsWith('//')) throw new Error('Invalid redirect path.');
  return new URL(path, publicOrigin(requestUrl));
}

export function sameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin || origin === 'null') return false;
  try {
    const allowed = new Set([publicOrigin(request.url)]);
    // These exact aliases are provided by Netlify, not by the incoming request.
    for (const alias of [process.env.DEPLOY_URL, process.env.DEPLOY_PRIME_URL]) {
      if (alias) allowed.add(new URL(alias).origin);
    }
    return allowed.has(origin);
  } catch {
    return false;
  }
}
