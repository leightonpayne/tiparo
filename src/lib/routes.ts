export function getFontIdFromPath(pathname: string) {
  const match = pathname.match(/^\/fonts\/([^/]+)$/);

  if (!match) {
    return null;
  }

  try {
    return decodeURIComponent(match[1]);
  } catch {
    return null;
  }
}
