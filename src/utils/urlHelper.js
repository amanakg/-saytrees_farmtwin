/**
 * URL and asset path resolution helpers
 */

/**
 * Resolves the base URL for the application.
 * Priority:
 * 1. process.env.BASE_URL if defined and non-empty.
 * 2. req.protocol + '://' + req.get('host') if req is available.
 * 3. Empty string as final fallback.
 *
 * Trailing slashes are stripped to avoid double slashes.
 */
function getBaseUrl(req) {
  let base = process.env.BASE_URL ? String(process.env.BASE_URL).trim() : '';
  if (!base && req && typeof req.get === 'function') {
    const host = req.get('host');
    if (host) {
      base = `${req.protocol || 'http'}://${host}`;
    }
  }
  return base.replace(/\/+$/, '');
}

/**
 * Normalizes an uploaded file path or existing image URL into a fully-qualified URL
 * using the configured BASE_URL.
 *
 * Examples:
 * - 'uploads/profileImages/abc.jpg' -> 'http://3.12.149.104:3001/uploads/profileImages/abc.jpg'
 * - '/uploads/farmImages/xyz.jpg'   -> 'http://3.12.149.104:3001/uploads/farmImages/xyz.jpg'
 * - 'http://localhost:3000/uploads/profileImages/abc.jpg' -> 'http://3.12.149.104:3001/uploads/profileImages/abc.jpg'
 */
function formatAssetUrl(req, relativeOrFullUrl) {
  if (!relativeOrFullUrl || typeof relativeOrFullUrl !== 'string') return '';
  let cleanPath = relativeOrFullUrl.trim();
  if (!cleanPath) return '';

  // If old URL had http://localhost:3000/uploads/... or similar host, extract the uploads/ path
  const uploadIndex = cleanPath.indexOf('uploads/');
  if (uploadIndex !== -1) {
    cleanPath = cleanPath.slice(uploadIndex);
  } else {
    // If it's an external URL (e.g. cloudfront, s3 direct), return as-is
    if (/^https?:\/\//i.test(cleanPath)) {
      return cleanPath;
    }
    cleanPath = cleanPath.replace(/^\/+/, '');
  }

  const base = getBaseUrl(req);
  return base ? `${base}/${cleanPath}` : `/${cleanPath}`;
}

module.exports = {
  getBaseUrl,
  formatAssetUrl
};
