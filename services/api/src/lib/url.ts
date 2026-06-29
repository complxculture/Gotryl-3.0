const PRIVATE_IP_RE =
  /^(localhost|0\.0\.0\.0|127\.|10\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|::1$|\[::1\]|fe80:|fc[0-9a-f]{2}:|fd[0-9a-f]{2}:)/i;

export function isPrivateUrl(rawUrl: string): boolean {
  try {
    const { hostname } = new URL(rawUrl);
    // Single-label hostnames (no dots) are internal — covers Docker service names like postgres, redis, executor
    if (!hostname.includes('.')) return true;
    return PRIVATE_IP_RE.test(hostname);
  } catch {
    return true;
  }
}
