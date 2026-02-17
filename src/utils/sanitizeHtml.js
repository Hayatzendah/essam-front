import DOMPurify from 'dompurify';

const PURIFY_CONFIG = {
  ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'span', 'ol', 'ul', 'li', 'h1', 'h2', 'h3'],
  ALLOWED_ATTR: ['style', 'class', 'dir'],
};

export function sanitizeHtml(dirty) {
  if (!dirty) return '';
  return DOMPurify.sanitize(dirty, PURIFY_CONFIG);
}
