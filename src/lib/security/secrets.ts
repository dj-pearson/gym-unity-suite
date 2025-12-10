/**
 * Secret Management Utilities
 *
 * Provides utilities for secure secret management including:
 * - Environment variable validation
 * - Secret rotation helpers
 * - Vault/AWS Secrets Manager integration patterns
 * - Secure secret handling in the browser
 *
 * @module security/secrets
 */

import { logger } from '../monitoring/logger';

// Secret types
export type SecretSource = 'env' | 'vault' | 'aws-secrets-manager' | 'azure-keyvault' | 'gcp-secrets';
export type SecretType = 'api-key' | 'database-credentials' | 'encryption-key' | 'oauth-token' | 'webhook-secret';

// Secret metadata
export interface SecretMetadata {
  name: string;
  source: SecretSource;
  type: SecretType;
  required: boolean;
  rotatable: boolean;
  lastRotated?: string;
  expiresAt?: string;
  description?: string;
}

// Secret validation result
export interface SecretValidationResult {
  valid: boolean;
  missing: string[];
  invalid: string[];
  warnings: string[];
  expired: string[];
}

// Secrets configuration
export interface SecretsConfig {
  source: SecretSource;
  validateOnStartup: boolean;
  rotationCheckInterval?: number;
  vaultConfig?: {
    address: string;
    namespace?: string;
    mountPath: string;
    tokenEnvVar: string;
  };
  awsConfig?: {
    region: string;
    secretsPrefix: string;
  };
}

// Required secrets for the application
const REQUIRED_SECRETS: SecretMetadata[] = [
  {
    name: 'VITE_SUPABASE_URL',
    source: 'env',
    type: 'api-key',
    required: true,
    rotatable: false,
    description: 'Supabase project URL',
  },
  {
    name: 'VITE_SUPABASE_ANON_KEY',
    source: 'env',
    type: 'api-key',
    required: true,
    rotatable: true,
    description: 'Supabase anonymous/public key',
  },
  {
    name: 'VITE_SENTRY_DSN',
    source: 'env',
    type: 'api-key',
    required: false,
    rotatable: false,
    description: 'Sentry DSN for error tracking',
  },
  {
    name: 'VITE_STRIPE_PUBLISHABLE_KEY',
    source: 'env',
    type: 'api-key',
    required: false,
    rotatable: true,
    description: 'Stripe publishable key for payments',
  },
  {
    name: 'VITE_GA_ID',
    source: 'env',
    type: 'api-key',
    required: false,
    rotatable: false,
    description: 'Google Analytics tracking ID',
  },
];

// Server-side secrets (for edge functions)
const SERVER_SECRETS: SecretMetadata[] = [
  {
    name: 'SUPABASE_SERVICE_ROLE_KEY',
    source: 'env',
    type: 'api-key',
    required: true,
    rotatable: true,
    description: 'Supabase service role key - KEEP SECRET',
  },
  {
    name: 'STRIPE_SECRET_KEY',
    source: 'env',
    type: 'api-key',
    required: true,
    rotatable: true,
    description: 'Stripe secret key for payment processing',
  },
  {
    name: 'STRIPE_WEBHOOK_SECRET',
    source: 'env',
    type: 'webhook-secret',
    required: true,
    rotatable: true,
    description: 'Stripe webhook signing secret',
  },
  {
    name: 'RESEND_API_KEY',
    source: 'env',
    type: 'api-key',
    required: false,
    rotatable: true,
    description: 'Resend API key for email sending',
  },
  {
    name: 'OPENAI_API_KEY',
    source: 'env',
    type: 'api-key',
    required: false,
    rotatable: true,
    description: 'OpenAI API key for AI features',
  },
];

// Default configuration
const DEFAULT_CONFIG: SecretsConfig = {
  source: 'env',
  validateOnStartup: true,
};

/**
 * SecretsManager - Manages application secrets
 */
class SecretsManager {
  private config: SecretsConfig;
  private cache: Map<string, string> = new Map();
  private rotationCheckInterval: ReturnType<typeof setInterval> | null = null;

  constructor(config?: Partial<SecretsConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Initialize secrets management
   */
  async init(): Promise<void> {
    if (this.config.validateOnStartup) {
      const result = await this.validateSecrets();
      if (!result.valid) {
        logger.error('Secret validation failed', undefined, {
          component: 'secrets',
          metadata: {
            missing: result.missing,
            invalid: result.invalid,
          },
        });
      }
    }

    // Start rotation check if configured
    if (this.config.rotationCheckInterval) {
      this.startRotationCheck();
    }

    logger.info('Secrets manager initialized', {
      component: 'secrets',
      metadata: { source: this.config.source },
    });
  }

  /**
   * Get a secret value
   */
  async getSecret(name: string): Promise<string | undefined> {
    // Check cache first
    if (this.cache.has(name)) {
      return this.cache.get(name);
    }

    let value: string | undefined;

    switch (this.config.source) {
      case 'env':
        value = this.getEnvSecret(name);
        break;
      case 'vault':
        value = await this.getVaultSecret(name);
        break;
      case 'aws-secrets-manager':
        value = await this.getAWSSecret(name);
        break;
      default:
        value = this.getEnvSecret(name);
    }

    if (value) {
      this.cache.set(name, value);
    }

    return value;
  }

  /**
   * Get secret from environment variable
   */
  private getEnvSecret(name: string): string | undefined {
    // In browser context, only VITE_ prefixed vars are available
    if (typeof window !== 'undefined') {
      return import.meta.env[name];
    }
    // In Node/Deno context
    if (typeof Deno !== 'undefined') {
      return Deno.env.get(name);
    }
    return process.env[name];
  }

  /**
   * Get secret from HashiCorp Vault
   * This is a template - implement based on your Vault setup
   */
  private async getVaultSecret(name: string): Promise<string | undefined> {
    if (!this.config.vaultConfig) {
      logger.warn('Vault config not set, falling back to env', { component: 'secrets' });
      return this.getEnvSecret(name);
    }

    try {
      const token = this.getEnvSecret(this.config.vaultConfig.tokenEnvVar);
      if (!token) {
        throw new Error('Vault token not found');
      }

      const { address, namespace, mountPath } = this.config.vaultConfig;
      const url = `${address}/v1/${mountPath}/data/${name}`;

      const response = await fetch(url, {
        headers: {
          'X-Vault-Token': token,
          ...(namespace && { 'X-Vault-Namespace': namespace }),
        },
      });

      if (!response.ok) {
        throw new Error(`Vault request failed: ${response.status}`);
      }

      const data = await response.json();
      return data?.data?.data?.value;
    } catch (error) {
      logger.error('Failed to fetch secret from Vault', error, {
        component: 'secrets',
        metadata: { secretName: name },
      });
      return undefined;
    }
  }

  /**
   * Get secret from AWS Secrets Manager
   * This is a template - implement based on your AWS setup
   */
  private async getAWSSecret(name: string): Promise<string | undefined> {
    if (!this.config.awsConfig) {
      logger.warn('AWS config not set, falling back to env', { component: 'secrets' });
      return this.getEnvSecret(name);
    }

    try {
      // In a real implementation, use AWS SDK:
      // import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";
      //
      // const client = new SecretsManagerClient({ region: this.config.awsConfig.region });
      // const command = new GetSecretValueCommand({
      //   SecretId: `${this.config.awsConfig.secretsPrefix}/${name}`,
      // });
      // const response = await client.send(command);
      // return response.SecretString;

      logger.debug('AWS Secrets Manager integration not implemented', {
        component: 'secrets',
        metadata: { secretName: name },
      });
      return this.getEnvSecret(name);
    } catch (error) {
      logger.error('Failed to fetch secret from AWS', error, {
        component: 'secrets',
        metadata: { secretName: name },
      });
      return undefined;
    }
  }

  /**
   * Validate all required secrets
   */
  async validateSecrets(includeServer: boolean = false): Promise<SecretValidationResult> {
    const secrets = includeServer
      ? [...REQUIRED_SECRETS, ...SERVER_SECRETS]
      : REQUIRED_SECRETS;

    const missing: string[] = [];
    const invalid: string[] = [];
    const warnings: string[] = [];
    const expired: string[] = [];

    for (const secret of secrets) {
      const value = await this.getSecret(secret.name);

      if (!value) {
        if (secret.required) {
          missing.push(secret.name);
        } else {
          warnings.push(`Optional secret not set: ${secret.name}`);
        }
        continue;
      }

      // Validate format based on type
      if (!this.validateSecretFormat(value, secret.type)) {
        invalid.push(secret.name);
      }

      // Check expiration
      if (secret.expiresAt) {
        const expiresAt = new Date(secret.expiresAt);
        if (expiresAt < new Date()) {
          expired.push(secret.name);
        } else if (expiresAt.getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000) {
          warnings.push(`Secret expires soon: ${secret.name}`);
        }
      }
    }

    return {
      valid: missing.length === 0 && invalid.length === 0 && expired.length === 0,
      missing,
      invalid,
      warnings,
      expired,
    };
  }

  /**
   * Validate secret format based on type
   */
  private validateSecretFormat(value: string, type: SecretType): boolean {
    switch (type) {
      case 'api-key':
        // Most API keys are alphanumeric with some special chars
        return value.length >= 10 && /^[a-zA-Z0-9_-]+$/.test(value.replace(/\./g, ''));
      case 'database-credentials':
        // Should be a connection string or structured credentials
        return value.length >= 10;
      case 'encryption-key':
        // Should be base64 encoded or hex
        return /^[a-zA-Z0-9+/=]+$/.test(value) || /^[a-fA-F0-9]+$/.test(value);
      case 'oauth-token':
        return value.length >= 10;
      case 'webhook-secret':
        return value.length >= 10;
      default:
        return true;
    }
  }

  /**
   * Start rotation check interval
   */
  private startRotationCheck(): void {
    if (this.rotationCheckInterval) {
      clearInterval(this.rotationCheckInterval);
    }

    const interval = this.config.rotationCheckInterval || 24 * 60 * 60 * 1000; // Default 24 hours

    this.rotationCheckInterval = setInterval(async () => {
      const result = await this.validateSecrets();
      if (result.expired.length > 0) {
        logger.warn('Expired secrets detected', {
          component: 'secrets',
          metadata: { expired: result.expired },
        });
      }
      if (result.warnings.length > 0) {
        logger.info('Secret warnings', {
          component: 'secrets',
          metadata: { warnings: result.warnings },
        });
      }
    }, interval);
  }

  /**
   * Clear secret cache
   */
  clearCache(): void {
    this.cache.clear();
    logger.debug('Secret cache cleared', { component: 'secrets' });
  }

  /**
   * Get list of required secrets
   */
  getRequiredSecrets(): SecretMetadata[] {
    return [...REQUIRED_SECRETS];
  }

  /**
   * Get list of server secrets (for documentation)
   */
  getServerSecrets(): SecretMetadata[] {
    return [...SERVER_SECRETS];
  }

  /**
   * Generate environment template
   */
  generateEnvTemplate(includeServer: boolean = false): string {
    const secrets = includeServer
      ? [...REQUIRED_SECRETS, ...SERVER_SECRETS]
      : REQUIRED_SECRETS;

    const lines = [
      '# Gym Unity Suite - Environment Variables',
      `# Generated: ${new Date().toISOString()}`,
      '#',
      '# Copy this file to .env.local and fill in the values',
      '#',
      '',
    ];

    let currentType = '';
    for (const secret of secrets) {
      if (secret.type !== currentType) {
        lines.push('');
        lines.push(`# ${secret.type.toUpperCase().replace(/-/g, ' ')}`);
        currentType = secret.type;
      }
      lines.push(`# ${secret.description || secret.name}`);
      lines.push(`# Required: ${secret.required}`);
      lines.push(`${secret.name}=`);
    }

    return lines.join('\n');
  }

  /**
   * Shutdown secrets manager
   */
  shutdown(): void {
    if (this.rotationCheckInterval) {
      clearInterval(this.rotationCheckInterval);
    }
    this.clearCache();
  }
}

// Export singleton instance
export const secretsManager = new SecretsManager();

// Convenience exports
export const getSecret = (name: string) => secretsManager.getSecret(name);
export const validateSecrets = (includeServer?: boolean) => secretsManager.validateSecrets(includeServer);

// Export secret definitions for documentation
export { REQUIRED_SECRETS, SERVER_SECRETS };
