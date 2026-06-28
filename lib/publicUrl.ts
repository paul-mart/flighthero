/** Public-folder asset URL that respects Vite base path (e.g. /flight-app/ on GitHub Pages). */
export function publicUrl(path: string): string {
  const base = import.meta.env.BASE_URL;
  const normalized = path.startsWith('/') ? path.slice(1) : path;
  return `${base}${normalized}`;
}

/** In-app hash link, e.g. /flight-app/#deals */
export function homeHashUrl(hash: string): string {
  const fragment = hash.startsWith('#') ? hash : `#${hash}`;
  const base = import.meta.env.BASE_URL;
  return `${base}${fragment}`;
}
