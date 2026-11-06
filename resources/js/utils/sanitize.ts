import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitasi konten HTML dari database menggunakan isomorphic-dompurify
 * untuk mencegah serangan Stored / Reflected Cross-Site Scripting (XSS).
 */
export function sanitizeHtml(dirtyHtml: string | null | undefined): string {
    if (!dirtyHtml) return '';

    return DOMPurify.sanitize(dirtyHtml, {
        ALLOWED_TAGS: [
            'p',
            'br',
            'b',
            'i',
            'em',
            'strong',
            'u',
            's',
            'strike',
            'del',
            'h1',
            'h2',
            'h3',
            'h4',
            'h5',
            'h6',
            'ul',
            'ol',
            'li',
            'blockquote',
            'a',
            'span',
            'figure',
            'figcaption',
            'img',
            'hr',
        ],
        ALLOWED_ATTR: [
            'href',
            'target',
            'rel',
            'class',
            'src',
            'alt',
            'title',
            'width',
            'height',
            'loading',
        ],
        ALLOW_DATA_ATTR: false,
    });
}

/**
 * Memastikan URL untuk atribut href / src aman dari protokol berbahaya
 * seperti javascript:, vbscript:, atau data:text/html.
 */
export function sanitizeUrl(url: string | null | undefined, fallback = '#'): string {
    if (!url) return fallback;
    const trimmed = url.trim();
    if (
        trimmed.startsWith('/') ||
        trimmed.startsWith('https://') ||
        trimmed.startsWith('http://')
    ) {
        return trimmed;
    }
    return fallback;
}
