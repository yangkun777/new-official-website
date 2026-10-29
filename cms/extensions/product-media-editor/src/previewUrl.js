export function webOrigin() {
  if (typeof window === 'undefined') return 'http://localhost:3000';
  const { protocol, hostname, port } = window.location;
  if (port === '8055' || port === '') {
    return `${protocol}//${hostname}:3000`;
  }
  return `${protocol}//${hostname}:3000`;
}

export function resolvePreviewUrl(value, { width = 960, height, fit = 'inside' } = {}) {
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith('/') && !value.startsWith('//')) {
    return `${webOrigin()}${value}`;
  }
  const size = height ? `&height=${height}` : '';
  return `/assets/${encodeURIComponent(value)}?width=${width}${size}&fit=${fit}&quality=85`;
}
