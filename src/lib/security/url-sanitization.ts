/**
 * URL Sanitization and Open Redirect Prevention
 * 
 * Provides utilities to sanitize URLs and prevent open redirect attacks
 * following OWASP security best practices.
 * 
 * @module security/url-sanitization
 */

/**
 * Sanitize a URL to prevent open redirect attacks
 * Only allows relative URLs or URLs matching the current origin
 * 
 * @param url - The URL to sanitize
 * @param allowedOrigins - Optional list of allowed external origins
 * @returns Sanitized URL (relative path) or fallback to "/"
 */
export function sanitizeRedirectURL(
  url: string | null | undefined,
  allowedOrigins: string[] = []
): string {
  // Return default if no URL provided
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return '/';
  }

  const trimmedUrl = url.trim();

  // Allow relative URLs that start with /
  if (trimmedUrl.startsWith('/') && !trimmedUrl.startsWith('//')) {
    // Prevent path traversal and ensure it's a valid path
    try {
      const pathUrl = new URL(trimmedUrl, window.location.origin);
      // Only return the pathname + search + hash (no origin)
      return pathUrl.pathname + pathUrl.search + pathUrl.hash;
    } catch {
      return '/';
    }
  }

  // Check if it's an absolute URL
  try {
    const urlObj = new URL(trimmedUrl);
    
    // Check if it matches current origin
    if (urlObj.origin === window.location.origin) {
      return urlObj.pathname + urlObj.search + urlObj.hash;
    }

    // Check if it's in the allowed origins list
    if (allowedOrigins.some(origin => urlObj.origin === origin)) {
      return trimmedUrl;
    }

    // External URL not allowed
    console.warn('[Security] Blocked potential open redirect:', trimmedUrl);
    return '/';
  } catch {
    // Invalid URL format
    console.warn('[Security] Invalid URL format:', trimmedUrl);
    return '/';
  }
}

/**
 * Sanitize HTML to prevent XSS attacks
 * Removes script tags and event handlers
 * 
 * @param html - The HTML string to sanitize
 * @returns Sanitized HTML string
 */
export function sanitizeHTML(html: string): string {
  if (!html || typeof html !== 'string') return '';

  return html
    // Remove script tags and their content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove event handlers (onclick, onerror, etc.)
    .replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '')
    // Remove javascript: protocol
    .replace(/javascript:/gi, '')
    // Remove data: protocol (can be used for XSS)
    .replace(/data:text\/html/gi, '');
}

/**
 * Sanitize input to prevent injection attacks
 * Removes potential SQL injection patterns and HTML tags
 * 
 * @param input - The input string to sanitize
 * @returns Sanitized input string
 */
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') return '';

  return input
    // Remove HTML tags
    .replace(/<[^>]*>/g, '')
    // Remove SQL injection patterns
    .replace(/['";\\]/g, '')
    // Trim whitespace
    .trim();
}

/**
 * Sanitize email to prevent email header injection
 * 
 * @param email - The email address to sanitize
 * @returns Sanitized email or empty string if invalid
 */
export function sanitizeEmail(email: string): string {
  if (!email || typeof email !== 'string') return '';

  // Remove newlines and carriage returns (email header injection)
  const sanitized = email.replace(/[\r\n]/g, '').trim().toLowerCase();

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(sanitized)) {
    return '';
  }

  return sanitized;
}

/**
 * Sanitize filename to prevent directory traversal
 * 
 * @param filename - The filename to sanitize
 * @returns Sanitized filename
 */
export function sanitizeFilename(filename: string): string {
  if (!filename || typeof filename !== 'string') return 'file';

  return filename
    // Remove directory traversal patterns
    .replace(/\.\./g, '')
    .replace(/[/\\]/g, '')
    // Remove special characters that could cause issues
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    // Limit length
    .substring(0, 255)
    // Ensure it's not empty
    || 'file';
}

/**
 * Check if a URL is safe for external navigation
 * 
 * @param url - The URL to check
 * @param allowedDomains - List of allowed external domains
 * @returns True if the URL is safe to navigate to
 */
export function isSafeExternalURL(
  url: string,
  allowedDomains: string[] = []
): boolean {
  if (!url || typeof url !== 'string') return false;

  try {
    const urlObj = new URL(url);
    
    // Allow same origin
    if (urlObj.origin === window.location.origin) {
      return true;
    }

    // Check allowed domains
    return allowedDomains.some(domain => 
      urlObj.hostname === domain || urlObj.hostname.endsWith(`.${domain}`)
    );
  } catch {
    return false;
  }
}

/**
 * Get safe redirect URL from query parameters
 * Commonly used in auth flows to redirect after login
 * 
 * @param searchParams - URLSearchParams object from useSearchParams or similar
 * @param paramName - Name of the redirect parameter (default: "redirect")
 * @param fallback - Fallback URL if no valid redirect found (default: "/dashboard")
 * @returns Safe redirect URL
 */
export function getSafeRedirectURL(
  searchParams: URLSearchParams,
  paramName: string = 'redirect',
  fallback: string = '/dashboard'
): string {
  const redirectParam = searchParams.get(paramName);
  const sanitized = sanitizeRedirectURL(redirectParam);
  
  // Return sanitized URL if it's valid, otherwise fallback
  return sanitized !== '/' ? sanitized : fallback;
}

/**
 * Validate and sanitize a callback URL for OAuth flows
 * 
 * @param callbackUrl - The callback URL to validate
 * @param allowedOrigins - List of allowed origins for callbacks
 * @returns Sanitized callback URL or null if invalid
 */
export function sanitizeOAuthCallback(
  callbackUrl: string,
  allowedOrigins: string[] = []
): string | null {
  if (!callbackUrl || typeof callbackUrl !== 'string') return null;

  try {
    const urlObj = new URL(callbackUrl);
    
    // Must use HTTPS in production
    if (window.location.protocol === 'https:' && urlObj.protocol !== 'https:') {
      console.warn('[Security] OAuth callback must use HTTPS in production');
      return null;
    }

    // Check if origin is allowed
    const isAllowed = 
      urlObj.origin === window.location.origin ||
      allowedOrigins.some(origin => urlObj.origin === origin);

    if (!isAllowed) {
      console.warn('[Security] OAuth callback origin not allowed:', urlObj.origin);
      return null;
    }

    return callbackUrl;
  } catch {
    return null;
  }
}
