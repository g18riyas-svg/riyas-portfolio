// Uploaded images are optimized at upload; bundled screenshots have responsive derivatives.
export function previewUrl(url: string, width: 160 | 640 | 960) {
  return /^\/projects\/[a-z0-9-]+\.webp$/.test(url)
    ? url.replace(/\.webp$/, `-${width}.webp`)
    : url;
}
export function previewSrcSet(url: string) {
  return url.startsWith('/projects/')
    ? `${previewUrl(url, 640)} 640w, ${previewUrl(url, 960)} 960w`
    : undefined;
}
