/**
 * Shared Webhook Signature Verification Module
 *
 * Provides secure webhook signature verification for various providers.
 * SECURITY: Always verify webhook signatures to prevent spoofing attacks.
 */

import { createHmac, timingSafeEqual } from "node:crypto";

export interface WebhookVerificationResult {
  valid: boolean;
  error?: string;
  provider?: string;
}

/**
 * Verify Stripe webhook signature
 * Uses Stripe's signature format: t=timestamp,v1=signature
 */
export function verifyStripeSignature(
  payload: string,
  signature: string,
  secret: string,
  tolerance = 300 // 5 minutes
): WebhookVerificationResult {
  try {
    if (!signature || !secret) {
      return { valid: false, error: "Missing signature or secret", provider: "stripe" };
    }

    // Parse the signature header
    const elements = signature.split(",");
    const timestamp = elements.find((e) => e.startsWith("t="))?.split("=")[1];
    const v1Signature = elements.find((e) => e.startsWith("v1="))?.split("=")[1];

    if (!timestamp || !v1Signature) {
      return { valid: false, error: "Invalid signature format", provider: "stripe" };
    }

    // Check timestamp tolerance (prevent replay attacks)
    const timestampSeconds = parseInt(timestamp, 10);
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - timestampSeconds) > tolerance) {
      return { valid: false, error: "Webhook timestamp outside tolerance", provider: "stripe" };
    }

    // Compute expected signature
    const signedPayload = `${timestamp}.${payload}`;
    const expectedSignature = createHmac("sha256", secret)
      .update(signedPayload)
      .digest("hex");

    // Timing-safe comparison
    const signatureBuffer = Buffer.from(v1Signature, "hex");
    const expectedBuffer = Buffer.from(expectedSignature, "hex");

    if (signatureBuffer.length !== expectedBuffer.length) {
      return { valid: false, error: "Signature length mismatch", provider: "stripe" };
    }

    if (!timingSafeEqual(signatureBuffer, expectedBuffer)) {
      return { valid: false, error: "Signature verification failed", provider: "stripe" };
    }

    return { valid: true, provider: "stripe" };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : "Unknown verification error",
      provider: "stripe",
    };
  }
}

/**
 * Verify SendGrid Inbound Parse webhook signature
 * Uses HMAC-SHA256 with Base64 encoding
 */
export function verifySendGridSignature(
  payload: string,
  signature: string,
  timestamp: string,
  secret: string,
  tolerance = 300
): WebhookVerificationResult {
  try {
    if (!signature || !timestamp || !secret) {
      return { valid: false, error: "Missing required parameters", provider: "sendgrid" };
    }

    // Check timestamp tolerance
    const timestampMs = parseInt(timestamp, 10);
    const now = Date.now();
    if (Math.abs(now - timestampMs) > tolerance * 1000) {
      return { valid: false, error: "Webhook timestamp outside tolerance", provider: "sendgrid" };
    }

    // Compute expected signature
    const signedPayload = `${timestamp}${payload}`;
    const expectedSignature = createHmac("sha256", secret)
      .update(signedPayload)
      .digest("base64");

    // Timing-safe comparison
    const signatureBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);

    if (signatureBuffer.length !== expectedBuffer.length) {
      return { valid: false, error: "Signature length mismatch", provider: "sendgrid" };
    }

    if (!timingSafeEqual(signatureBuffer, expectedBuffer)) {
      return { valid: false, error: "Signature verification failed", provider: "sendgrid" };
    }

    return { valid: true, provider: "sendgrid" };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : "Unknown verification error",
      provider: "sendgrid",
    };
  }
}

/**
 * Verify Mailgun webhook signature
 * Uses HMAC-SHA256 with hex encoding
 */
export function verifyMailgunSignature(
  timestamp: string,
  token: string,
  signature: string,
  secret: string,
  tolerance = 300
): WebhookVerificationResult {
  try {
    if (!timestamp || !token || !signature || !secret) {
      return { valid: false, error: "Missing required parameters", provider: "mailgun" };
    }

    // Check timestamp tolerance
    const timestampSeconds = parseInt(timestamp, 10);
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - timestampSeconds) > tolerance) {
      return { valid: false, error: "Webhook timestamp outside tolerance", provider: "mailgun" };
    }

    // Compute expected signature
    const signedPayload = `${timestamp}${token}`;
    const expectedSignature = createHmac("sha256", secret)
      .update(signedPayload)
      .digest("hex");

    // Timing-safe comparison
    const signatureBuffer = Buffer.from(signature, "hex");
    const expectedBuffer = Buffer.from(expectedSignature, "hex");

    if (signatureBuffer.length !== expectedBuffer.length) {
      return { valid: false, error: "Signature length mismatch", provider: "mailgun" };
    }

    if (!timingSafeEqual(signatureBuffer, expectedBuffer)) {
      return { valid: false, error: "Signature verification failed", provider: "mailgun" };
    }

    return { valid: true, provider: "mailgun" };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : "Unknown verification error",
      provider: "mailgun",
    };
  }
}

/**
 * Verify Postmark webhook signature
 * Uses HMAC-SHA256 with Base64 encoding
 */
export function verifyPostmarkSignature(
  payload: string,
  signature: string,
  secret: string
): WebhookVerificationResult {
  try {
    if (!signature || !secret) {
      return { valid: false, error: "Missing signature or secret", provider: "postmark" };
    }

    // Compute expected signature
    const expectedSignature = createHmac("sha256", secret)
      .update(payload)
      .digest("base64");

    // Timing-safe comparison
    const signatureBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);

    if (signatureBuffer.length !== expectedBuffer.length) {
      return { valid: false, error: "Signature length mismatch", provider: "postmark" };
    }

    if (!timingSafeEqual(signatureBuffer, expectedBuffer)) {
      return { valid: false, error: "Signature verification failed", provider: "postmark" };
    }

    return { valid: true, provider: "postmark" };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : "Unknown verification error",
      provider: "postmark",
    };
  }
}

/**
 * Verify Twilio webhook signature
 * Uses HMAC-SHA1 with Base64 encoding
 */
export function verifyTwilioSignature(
  url: string,
  params: Record<string, string>,
  signature: string,
  authToken: string
): WebhookVerificationResult {
  try {
    if (!signature || !authToken) {
      return { valid: false, error: "Missing signature or auth token", provider: "twilio" };
    }

    // Sort params and append to URL
    const sortedKeys = Object.keys(params).sort();
    let data = url;
    for (const key of sortedKeys) {
      data += key + params[key];
    }

    // Compute expected signature (Twilio uses SHA1)
    const expectedSignature = createHmac("sha1", authToken)
      .update(data)
      .digest("base64");

    // Timing-safe comparison
    const signatureBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);

    if (signatureBuffer.length !== expectedBuffer.length) {
      return { valid: false, error: "Signature length mismatch", provider: "twilio" };
    }

    if (!timingSafeEqual(signatureBuffer, expectedBuffer)) {
      return { valid: false, error: "Signature verification failed", provider: "twilio" };
    }

    return { valid: true, provider: "twilio" };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : "Unknown verification error",
      provider: "twilio",
    };
  }
}

/**
 * Generic HMAC verification for custom webhooks
 * Supports SHA256 and SHA512 with hex or base64 encoding
 */
export function verifyGenericHmac(
  payload: string,
  signature: string,
  secret: string,
  options: {
    algorithm?: "sha256" | "sha512";
    encoding?: "hex" | "base64";
    headerPrefix?: string;
    provider?: string;
  } = {}
): WebhookVerificationResult {
  const {
    algorithm = "sha256",
    encoding = "hex",
    headerPrefix = "",
    provider = "generic",
  } = options;

  try {
    if (!signature || !secret) {
      return { valid: false, error: "Missing signature or secret", provider };
    }

    // Remove header prefix if present
    const cleanSignature = headerPrefix && signature.startsWith(headerPrefix)
      ? signature.slice(headerPrefix.length)
      : signature;

    // Compute expected signature
    const expectedSignature = createHmac(algorithm, secret)
      .update(payload)
      .digest(encoding);

    // Timing-safe comparison
    const signatureBuffer = Buffer.from(cleanSignature, encoding === "hex" ? "hex" : "utf8");
    const expectedBuffer = Buffer.from(expectedSignature, encoding === "hex" ? "hex" : "utf8");

    if (signatureBuffer.length !== expectedBuffer.length) {
      return { valid: false, error: "Signature length mismatch", provider };
    }

    if (!timingSafeEqual(signatureBuffer, expectedBuffer)) {
      return { valid: false, error: "Signature verification failed", provider };
    }

    return { valid: true, provider };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : "Unknown verification error",
      provider,
    };
  }
}

/**
 * Verify webhook IP is from a trusted source (additional security layer)
 */
export function verifyWebhookIp(
  clientIp: string,
  allowedIpRanges: string[]
): WebhookVerificationResult {
  try {
    if (!clientIp) {
      return { valid: false, error: "No client IP provided" };
    }

    // Simple IP check (for production, use a proper IP range library)
    const isAllowed = allowedIpRanges.some((range) => {
      if (range.includes("/")) {
        // CIDR notation - simplified check
        const [baseIp, bits] = range.split("/");
        const baseOctets = baseIp.split(".").map(Number);
        const clientOctets = clientIp.split(".").map(Number);
        const maskBits = parseInt(bits, 10);
        const fullOctets = Math.floor(maskBits / 8);

        for (let i = 0; i < fullOctets; i++) {
          if (baseOctets[i] !== clientOctets[i]) return false;
        }
        return true;
      }
      return range === clientIp;
    });

    if (!isAllowed) {
      return { valid: false, error: "IP not in allowed range" };
    }

    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : "Unknown IP verification error",
    };
  }
}

/**
 * Known webhook IP ranges for common providers
 */
export const WEBHOOK_IP_RANGES = {
  stripe: [
    "3.18.12.63",
    "3.130.192.231",
    "13.235.14.237",
    "13.235.122.149",
    "18.211.135.69",
    "35.154.171.200",
    "52.15.183.38",
    "54.187.174.169",
    "54.187.205.235",
    "54.187.216.72",
  ],
  sendgrid: [
    "167.89.0.0/17",
    "208.117.48.0/20",
    "50.31.32.0/19",
    "198.37.144.0/20",
  ],
  twilio: [
    "54.172.60.0/23",
    "54.244.51.0/24",
    "54.171.127.192/26",
    "52.215.127.0/24",
  ],
};

/**
 * Log webhook verification attempt for audit purposes
 */
export function logWebhookVerification(
  provider: string,
  result: WebhookVerificationResult,
  metadata?: Record<string, unknown>
): void {
  const logData = {
    provider,
    verified: result.valid,
    error: result.error,
    timestamp: new Date().toISOString(),
    ...metadata,
  };

  if (result.valid) {
    console.log(`[WEBHOOK-VERIFY] Success:`, JSON.stringify(logData));
  } else {
    console.warn(`[WEBHOOK-VERIFY] Failed:`, JSON.stringify(logData));
  }
}
