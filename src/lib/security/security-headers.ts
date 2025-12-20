/**
 * Security Headers Configuration and Audit
 *
 * Provides security headers management, validation, and audit functionality
 * for CSP, HSTS, X-Frame-Options, and other security headers.
 *
 * @module security/security-headers
 */

// Security headers configuration type
export interface SecurityHeadersConfig {
  // Content-Security-Policy
  contentSecurityPolicy: {
    enabled: boolean;
    directives: Record<string, string[]>;
    reportUri?: string;
    reportOnly: boolean;
  };

  // Strict-Transport-Security (HSTS)
  strictTransportSecurity: {
    enabled: boolean;
    maxAge: number;
    includeSubDomains: boolean;
    preload: boolean;
  };

  // X-Frame-Options
  xFrameOptions: {
    enabled: boolean;
    value: 'DENY' | 'SAMEORIGIN' | 'ALLOW-FROM';
    allowFrom?: string;
  };

  // X-Content-Type-Options
  xContentTypeOptions: {
    enabled: boolean;
  };

  // X-XSS-Protection (deprecated but still useful for older browsers)
  xXSSProtection: {
    enabled: boolean;
    mode: 'block' | 'report';
    reportUri?: string;
  };

  // Referrer-Policy
  referrerPolicy: {
    enabled: boolean;
    value: string;
  };

  // Permissions-Policy (formerly Feature-Policy)
  permissionsPolicy: {
    enabled: boolean;
    directives: Record<string, string[]>;
  };

  // Cross-Origin headers
  crossOriginEmbedderPolicy: {
    enabled: boolean;
    value: 'unsafe-none' | 'require-corp' | 'credentialless';
  };

  crossOriginOpenerPolicy: {
    enabled: boolean;
    value: 'unsafe-none' | 'same-origin-allow-popups' | 'same-origin';
  };

  crossOriginResourcePolicy: {
    enabled: boolean;
    value: 'same-site' | 'same-origin' | 'cross-origin';
  };
}

// Audit result type
export interface SecurityHeadersAuditResult {
  score: number; // 0-100
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  passed: string[];
  failed: string[];
  warnings: string[];
  recommendations: string[];
  details: Record<string, {
    present: boolean;
    value?: string;
    status: 'pass' | 'fail' | 'warning';
    recommendation?: string;
  }>;
}

// Default configuration (production-ready)
const DEFAULT_CONFIG: SecurityHeadersConfig = {
  contentSecurityPolicy: {
    enabled: true,
    reportOnly: false,
    directives: {
      'default-src': ["'self'"],
      'script-src': [
        "'self'",
        "'unsafe-inline'", // Required for some React patterns
        "'unsafe-eval'", // Required for development
        'https://www.googletagmanager.com',
        'https://www.google-analytics.com',
      ],
      'style-src': [
        "'self'",
        "'unsafe-inline'", // Required for styled-components/emotion
        'https://fonts.googleapis.com',
      ],
      'font-src': [
        "'self'",
        'https://fonts.gstatic.com',
        'data:',
      ],
      'img-src': [
        "'self'",
        'data:',
        'blob:',
        'https:',
      ],
      'connect-src': [
        "'self'",
        // Self-hosted Supabase domains
        'https://api.repclub.net',
        'https://functions.repclub.net',
        'wss://api.repclub.net',
        // Third-party services
        'https://www.google-analytics.com',
        'https://api.stripe.com',
        'https://api.pwnedpasswords.com', // For breach checking
      ],
      'frame-ancestors': ["'none'"],
      'base-uri': ["'self'"],
      'form-action': ["'self'"],
      'upgrade-insecure-requests': [],
    },
  },
  strictTransportSecurity: {
    enabled: true,
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  xFrameOptions: {
    enabled: true,
    value: 'DENY',
  },
  xContentTypeOptions: {
    enabled: true,
  },
  xXSSProtection: {
    enabled: true,
    mode: 'block',
  },
  referrerPolicy: {
    enabled: true,
    value: 'strict-origin-when-cross-origin',
  },
  permissionsPolicy: {
    enabled: true,
    directives: {
      'camera': [],
      'microphone': [],
      'geolocation': [],
      'payment': ["'self'"],
      'usb': [],
      'accelerometer': [],
      'gyroscope': [],
      'magnetometer': [],
    },
  },
  crossOriginEmbedderPolicy: {
    enabled: false, // Can break some third-party integrations
    value: 'unsafe-none',
  },
  crossOriginOpenerPolicy: {
    enabled: true,
    value: 'same-origin-allow-popups',
  },
  crossOriginResourcePolicy: {
    enabled: true,
    value: 'same-origin',
  },
};

/**
 * SecurityHeadersService - Manages security headers
 */
class SecurityHeadersService {
  private config: SecurityHeadersConfig;

  constructor(config?: Partial<SecurityHeadersConfig>) {
    this.config = this.mergeConfig(DEFAULT_CONFIG, config);
  }

  /**
   * Deep merge configuration
   */
  private mergeConfig(
    base: SecurityHeadersConfig,
    override?: Partial<SecurityHeadersConfig>
  ): SecurityHeadersConfig {
    if (!override) return base;

    return {
      contentSecurityPolicy: {
        ...base.contentSecurityPolicy,
        ...override.contentSecurityPolicy,
        directives: {
          ...base.contentSecurityPolicy.directives,
          ...override.contentSecurityPolicy?.directives,
        },
      },
      strictTransportSecurity: {
        ...base.strictTransportSecurity,
        ...override.strictTransportSecurity,
      },
      xFrameOptions: {
        ...base.xFrameOptions,
        ...override.xFrameOptions,
      },
      xContentTypeOptions: {
        ...base.xContentTypeOptions,
        ...override.xContentTypeOptions,
      },
      xXSSProtection: {
        ...base.xXSSProtection,
        ...override.xXSSProtection,
      },
      referrerPolicy: {
        ...base.referrerPolicy,
        ...override.referrerPolicy,
      },
      permissionsPolicy: {
        ...base.permissionsPolicy,
        ...override.permissionsPolicy,
        directives: {
          ...base.permissionsPolicy.directives,
          ...override.permissionsPolicy?.directives,
        },
      },
      crossOriginEmbedderPolicy: {
        ...base.crossOriginEmbedderPolicy,
        ...override.crossOriginEmbedderPolicy,
      },
      crossOriginOpenerPolicy: {
        ...base.crossOriginOpenerPolicy,
        ...override.crossOriginOpenerPolicy,
      },
      crossOriginResourcePolicy: {
        ...base.crossOriginResourcePolicy,
        ...override.crossOriginResourcePolicy,
      },
    };
  }

  /**
   * Generate all security headers
   */
  getSecurityHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};

    // Content-Security-Policy
    if (this.config.contentSecurityPolicy.enabled) {
      const cspHeader = this.config.contentSecurityPolicy.reportOnly
        ? 'Content-Security-Policy-Report-Only'
        : 'Content-Security-Policy';
      headers[cspHeader] = this.buildCSP();
    }

    // Strict-Transport-Security (HSTS)
    if (this.config.strictTransportSecurity.enabled) {
      let hsts = `max-age=${this.config.strictTransportSecurity.maxAge}`;
      if (this.config.strictTransportSecurity.includeSubDomains) {
        hsts += '; includeSubDomains';
      }
      if (this.config.strictTransportSecurity.preload) {
        hsts += '; preload';
      }
      headers['Strict-Transport-Security'] = hsts;
    }

    // X-Frame-Options
    if (this.config.xFrameOptions.enabled) {
      let value = this.config.xFrameOptions.value;
      if (value === 'ALLOW-FROM' && this.config.xFrameOptions.allowFrom) {
        value = `ALLOW-FROM ${this.config.xFrameOptions.allowFrom}`;
      }
      headers['X-Frame-Options'] = value;
    }

    // X-Content-Type-Options
    if (this.config.xContentTypeOptions.enabled) {
      headers['X-Content-Type-Options'] = 'nosniff';
    }

    // X-XSS-Protection
    if (this.config.xXSSProtection.enabled) {
      let value = '1';
      if (this.config.xXSSProtection.mode === 'block') {
        value += '; mode=block';
      }
      if (this.config.xXSSProtection.reportUri) {
        value += `; report=${this.config.xXSSProtection.reportUri}`;
      }
      headers['X-XSS-Protection'] = value;
    }

    // Referrer-Policy
    if (this.config.referrerPolicy.enabled) {
      headers['Referrer-Policy'] = this.config.referrerPolicy.value;
    }

    // Permissions-Policy
    if (this.config.permissionsPolicy.enabled) {
      headers['Permissions-Policy'] = this.buildPermissionsPolicy();
    }

    // Cross-Origin-Embedder-Policy
    if (this.config.crossOriginEmbedderPolicy.enabled) {
      headers['Cross-Origin-Embedder-Policy'] = this.config.crossOriginEmbedderPolicy.value;
    }

    // Cross-Origin-Opener-Policy
    if (this.config.crossOriginOpenerPolicy.enabled) {
      headers['Cross-Origin-Opener-Policy'] = this.config.crossOriginOpenerPolicy.value;
    }

    // Cross-Origin-Resource-Policy
    if (this.config.crossOriginResourcePolicy.enabled) {
      headers['Cross-Origin-Resource-Policy'] = this.config.crossOriginResourcePolicy.value;
    }

    return headers;
  }

  /**
   * Build Content-Security-Policy header value
   */
  private buildCSP(): string {
    const { directives, reportUri } = this.config.contentSecurityPolicy;

    const parts: string[] = [];

    for (const [directive, values] of Object.entries(directives)) {
      if (values.length === 0) {
        parts.push(directive);
      } else {
        parts.push(`${directive} ${values.join(' ')}`);
      }
    }

    if (reportUri) {
      parts.push(`report-uri ${reportUri}`);
    }

    return parts.join('; ');
  }

  /**
   * Build Permissions-Policy header value
   */
  private buildPermissionsPolicy(): string {
    const { directives } = this.config.permissionsPolicy;

    return Object.entries(directives)
      .map(([feature, allowList]) => {
        if (allowList.length === 0) {
          return `${feature}=()`;
        }
        return `${feature}=(${allowList.join(' ')})`;
      })
      .join(', ');
  }

  /**
   * Audit security headers on a page
   */
  async auditHeaders(url?: string): Promise<SecurityHeadersAuditResult> {
    const targetUrl = url || window.location.href;
    const details: SecurityHeadersAuditResult['details'] = {};
    const passed: string[] = [];
    const failed: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];

    try {
      // For client-side audit, we check document headers
      // Note: Some headers may not be visible to JavaScript
      const response = await fetch(targetUrl, { method: 'HEAD', mode: 'no-cors' });
      const headers = response.headers;

      // Check Content-Security-Policy
      const csp = headers.get('Content-Security-Policy');
      if (csp) {
        passed.push('Content-Security-Policy is present');
        details['Content-Security-Policy'] = {
          present: true,
          value: csp.substring(0, 100) + (csp.length > 100 ? '...' : ''),
          status: 'pass',
        };
      } else {
        failed.push('Content-Security-Policy is missing');
        details['Content-Security-Policy'] = {
          present: false,
          status: 'fail',
          recommendation: 'Add a Content-Security-Policy header to prevent XSS attacks',
        };
        recommendations.push('Implement Content-Security-Policy header');
      }

      // Check HSTS
      const hsts = headers.get('Strict-Transport-Security');
      if (hsts) {
        const maxAgeMatch = hsts.match(/max-age=(\d+)/);
        const maxAge = maxAgeMatch ? parseInt(maxAgeMatch[1]) : 0;

        if (maxAge >= 31536000) {
          passed.push('HSTS is properly configured');
          details['Strict-Transport-Security'] = {
            present: true,
            value: hsts,
            status: 'pass',
          };
        } else {
          warnings.push('HSTS max-age should be at least 1 year');
          details['Strict-Transport-Security'] = {
            present: true,
            value: hsts,
            status: 'warning',
            recommendation: 'Increase max-age to at least 31536000 (1 year)',
          };
        }
      } else {
        failed.push('Strict-Transport-Security (HSTS) is missing');
        details['Strict-Transport-Security'] = {
          present: false,
          status: 'fail',
          recommendation: 'Add HSTS header to enforce HTTPS connections',
        };
        recommendations.push('Add Strict-Transport-Security header with max-age of 1 year');
      }

      // Check X-Frame-Options
      const xfo = headers.get('X-Frame-Options');
      if (xfo) {
        passed.push('X-Frame-Options is present');
        details['X-Frame-Options'] = {
          present: true,
          value: xfo,
          status: xfo === 'DENY' || xfo === 'SAMEORIGIN' ? 'pass' : 'warning',
        };
      } else {
        // Check for frame-ancestors in CSP as alternative
        if (csp?.includes('frame-ancestors')) {
          passed.push('Frame protection via CSP frame-ancestors');
          details['X-Frame-Options'] = {
            present: false,
            status: 'pass',
            recommendation: 'Protected via CSP frame-ancestors',
          };
        } else {
          warnings.push('X-Frame-Options is missing');
          details['X-Frame-Options'] = {
            present: false,
            status: 'warning',
            recommendation: 'Add X-Frame-Options header or CSP frame-ancestors',
          };
        }
      }

      // Check X-Content-Type-Options
      const xcto = headers.get('X-Content-Type-Options');
      if (xcto === 'nosniff') {
        passed.push('X-Content-Type-Options is properly set');
        details['X-Content-Type-Options'] = {
          present: true,
          value: xcto,
          status: 'pass',
        };
      } else {
        failed.push('X-Content-Type-Options is missing or incorrect');
        details['X-Content-Type-Options'] = {
          present: false,
          status: 'fail',
          recommendation: 'Set X-Content-Type-Options to "nosniff"',
        };
        recommendations.push('Add X-Content-Type-Options: nosniff');
      }

      // Check Referrer-Policy
      const referer = headers.get('Referrer-Policy');
      if (referer) {
        passed.push('Referrer-Policy is present');
        details['Referrer-Policy'] = {
          present: true,
          value: referer,
          status: 'pass',
        };
      } else {
        warnings.push('Referrer-Policy is missing');
        details['Referrer-Policy'] = {
          present: false,
          status: 'warning',
          recommendation: 'Add Referrer-Policy header for privacy',
        };
      }

      // Check Permissions-Policy
      const pp = headers.get('Permissions-Policy');
      if (pp) {
        passed.push('Permissions-Policy is present');
        details['Permissions-Policy'] = {
          present: true,
          value: pp.substring(0, 100) + (pp.length > 100 ? '...' : ''),
          status: 'pass',
        };
      } else {
        warnings.push('Permissions-Policy is missing');
        details['Permissions-Policy'] = {
          present: false,
          status: 'warning',
          recommendation: 'Add Permissions-Policy to control browser features',
        };
      }

    } catch {
      // Fallback for same-origin restrictions
      warnings.push('Unable to fetch headers due to CORS restrictions');
    }

    // Calculate score
    const totalChecks = passed.length + failed.length + warnings.length;
    const score = Math.round((passed.length / Math.max(totalChecks, 1)) * 100);

    // Determine grade
    let grade: SecurityHeadersAuditResult['grade'];
    if (score >= 95 && failed.length === 0) grade = 'A+';
    else if (score >= 85 && failed.length <= 1) grade = 'A';
    else if (score >= 70) grade = 'B';
    else if (score >= 55) grade = 'C';
    else if (score >= 40) grade = 'D';
    else grade = 'F';

    return {
      score,
      grade,
      passed,
      failed,
      warnings,
      recommendations,
      details,
    };
  }

  /**
   * Generate _headers file content for Cloudflare Pages
   */
  generateCloudflareHeaders(): string {
    const headers = this.getSecurityHeaders();
    const lines: string[] = [
      '/*',
      ...Object.entries(headers).map(([name, value]) => `  ${name}: ${value}`),
      '',
    ];

    // Add caching headers
    lines.push(
      '# HTML - no cache',
      '/index.html',
      '  Cache-Control: no-cache, no-store, must-revalidate',
      '',
      '# Assets - immutable',
      '/assets/*',
      '  Cache-Control: public, max-age=31536000, immutable',
      '',
    );

    return lines.join('\n');
  }

  /**
   * Update configuration
   */
  configure(config: Partial<SecurityHeadersConfig>): void {
    this.config = this.mergeConfig(this.config, config);
  }

  /**
   * Get current configuration
   */
  getConfig(): SecurityHeadersConfig {
    return JSON.parse(JSON.stringify(this.config));
  }

  /**
   * Add a CSP directive
   */
  addCSPDirective(directive: string, values: string[]): void {
    this.config.contentSecurityPolicy.directives[directive] = [
      ...(this.config.contentSecurityPolicy.directives[directive] || []),
      ...values,
    ];
  }

  /**
   * Remove a CSP directive value
   */
  removeCSPDirectiveValue(directive: string, value: string): void {
    const current = this.config.contentSecurityPolicy.directives[directive];
    if (current) {
      this.config.contentSecurityPolicy.directives[directive] = current.filter(v => v !== value);
    }
  }
}

// Export singleton instance
export const securityHeaders = new SecurityHeadersService();

// Convenience exports
export const getSecurityHeaders = () => securityHeaders.getSecurityHeaders();
export const validateSecurityHeaders = (url?: string) => securityHeaders.auditHeaders(url);

// Export default config for reference
export { DEFAULT_CONFIG as DEFAULT_SECURITY_HEADERS_CONFIG };
