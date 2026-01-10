import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";
import {
  getCorsHeaders,
  handleCorsPreFlight,
  corsJsonResponse,
  corsErrorResponse,
} from "../_shared/cors.ts";
import {
  verifySendGridSignature,
  verifyMailgunSignature,
  verifyPostmarkSignature,
  verifyGenericHmac,
  logWebhookVerification,
} from "../_shared/webhook-verification.ts";
import {
  validate,
  Schema,
  sanitizeString,
  sanitizeEmail,
} from "../_shared/validation.ts";
import { trackError, createTimer } from "../_shared/monitoring.ts";

// Email payload validation schema
const emailPayloadSchema: Schema = {
  To: { type: "email", required: true },
  "From Email": { type: "email", required: true },
  ID: { type: "string", required: true, minLength: 1, maxLength: 500 },
  From: { type: "string", required: false, maxLength: 255 },
  Subject: { type: "string", required: false, maxLength: 1000 },
  Body: { type: "string", required: false, maxLength: 100000 },
  Date: { type: "string", required: false },
};

// Sanitize sensitive data from logs
const sanitizeForLog = (data: Record<string, unknown>): Record<string, unknown> => {
  const sanitized = { ...data };
  const sensitiveKeys = ['email', 'From Email', 'To', 'From', 'Body', 'body', 'from_email', 'to_email'];
  for (const key of sensitiveKeys) {
    if (key in sanitized && typeof sanitized[key] === 'string') {
      sanitized[key] = '[REDACTED]';
    }
  }
  return sanitized;
};

// Helper logging function with sanitization
const logStep = (step: string, details?: Record<string, unknown>) => {
  const sanitizedDetails = details ? sanitizeForLog(details) : undefined;
  const detailsStr = sanitizedDetails ? ` - ${JSON.stringify(sanitizedDetails)}` : '';
  console.log(`[RECEIVE-EMAIL] ${step}${detailsStr}`);
};

/**
 * Verify webhook signature based on provider
 */
function verifyEmailWebhookSignature(req: Request, body: string): { valid: boolean; error?: string } {
  // Detect provider from headers
  const sendgridSignature = req.headers.get("X-Twilio-Email-Event-Webhook-Signature");
  const sendgridTimestamp = req.headers.get("X-Twilio-Email-Event-Webhook-Timestamp");
  const mailgunSignature = req.headers.get("X-Mailgun-Signature");
  const postmarkSignature = req.headers.get("X-Postmark-Signature");

  // SendGrid/Twilio verification
  if (sendgridSignature && sendgridTimestamp) {
    const secret = Deno.env.get("SENDGRID_WEBHOOK_SECRET");
    if (!secret) {
      logStep("Warning: SENDGRID_WEBHOOK_SECRET not configured, skipping verification");
      return { valid: true }; // Allow if not configured (but log warning)
    }
    const result = verifySendGridSignature(body, sendgridSignature, sendgridTimestamp, secret);
    logWebhookVerification("sendgrid", result);
    return result;
  }

  // Mailgun verification
  if (mailgunSignature) {
    try {
      const signatureData = JSON.parse(mailgunSignature);
      const secret = Deno.env.get("MAILGUN_WEBHOOK_SECRET");
      if (!secret) {
        logStep("Warning: MAILGUN_WEBHOOK_SECRET not configured, skipping verification");
        return { valid: true };
      }
      const result = verifyMailgunSignature(
        signatureData.timestamp,
        signatureData.token,
        signatureData.signature,
        secret
      );
      logWebhookVerification("mailgun", result);
      return result;
    } catch {
      return { valid: false, error: "Invalid Mailgun signature format" };
    }
  }

  // Postmark verification
  if (postmarkSignature) {
    const secret = Deno.env.get("POSTMARK_WEBHOOK_SECRET");
    if (!secret) {
      logStep("Warning: POSTMARK_WEBHOOK_SECRET not configured, skipping verification");
      return { valid: true };
    }
    const result = verifyPostmarkSignature(body, postmarkSignature, secret);
    logWebhookVerification("postmark", result);
    return result;
  }

  // Generic HMAC verification for other providers
  const genericSignature = req.headers.get("X-Webhook-Signature") ||
                           req.headers.get("X-Hub-Signature-256");
  if (genericSignature) {
    const secret = Deno.env.get("EMAIL_WEBHOOK_SECRET");
    if (!secret) {
      logStep("Warning: EMAIL_WEBHOOK_SECRET not configured, skipping verification");
      return { valid: true };
    }
    const result = verifyGenericHmac(body, genericSignature, secret, {
      algorithm: "sha256",
      encoding: "hex",
      headerPrefix: "sha256=",
      provider: "generic-email",
    });
    logWebhookVerification("generic-email", result);
    return result;
  }

  // No signature header found - check if verification is required
  const requireVerification = Deno.env.get("REQUIRE_WEBHOOK_VERIFICATION") === "true";
  if (requireVerification) {
    return { valid: false, error: "No webhook signature found and verification is required" };
  }

  logStep("Warning: No webhook signature provided, proceeding without verification");
  return { valid: true };
}

const sendNotificationEmail = async (ticketData: any) => {
  try {
    const smtpEndpoint = Deno.env.get('AMAZON_SMTP_ENDPOINT');
    const smtpUsername = Deno.env.get('AMAZON_SMTP_USER_NAME');
    const smtpPassword = Deno.env.get('AMAZON_SMTP_PASSWORD');

    if (!smtpEndpoint || !smtpUsername || !smtpPassword) {
      console.error('SMTP credentials not configured');
      return;
    }

    const endpointParts = smtpEndpoint.split(':');
    const smtpHost = endpointParts[0];
    const smtpPort = endpointParts[1] ? parseInt(endpointParts[1]) : 587;

    const client = new SMTPClient({
      connection: {
        hostname: smtpHost,
        port: smtpPort,
        tls: true,
        auth: {
          username: smtpUsername,
          password: smtpPassword,
        },
      },
    });

    const emailBody = `
New Support Ticket Created

From: ${ticketData.from_name || 'Unknown'} (${ticketData.from_email})
To: ${ticketData.to_email}
Subject: ${ticketData.subject}
Received: ${new Date(ticketData.received_date).toLocaleString()}
External ID: ${ticketData.external_id}

Message:
${ticketData.body}

---
Thread: ${ticketData.domain}
Status: ${ticketData.status}
    `.trim();

    await client.send({
      from: ticketData.to_email,
      to: 'pearsonperformance@gmail.com',
      subject: `Ticket Created: ${ticketData.subject}`,
      content: emailBody,
      html: emailBody.replace(/\n/g, '<br>'),
    });

    await client.close();
    console.log('Notification email sent successfully');
  } catch (error) {
    console.error('Error sending notification email:', error);
  }
};

serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);
  const timer = createTimer('receive-email');

  if (req.method === 'OPTIONS') {
    return handleCorsPreFlight(origin);
  }

  try {
    logStep('Function started');

    // Get raw body for signature verification
    const rawBody = await req.text();
    timer.lap('body-read');

    // Verify webhook signature BEFORE processing
    const signatureResult = verifyEmailWebhookSignature(req, rawBody);
    if (!signatureResult.valid) {
      logStep('Webhook signature verification failed', { error: signatureResult.error });
      return corsErrorResponse(
        `Webhook signature verification failed: ${signatureResult.error}`,
        origin,
        401
      );
    }
    timer.lap('signature-verified');

    // Parse JSON body
    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return corsErrorResponse('Invalid JSON body', origin, 400);
    }

    // Validate payload schema
    const validation = validate(payload, emailPayloadSchema);
    if (!validation.valid) {
      logStep('Payload validation failed', { errors: validation.errors });
      return corsJsonResponse(
        { error: 'Validation failed', details: validation.errors },
        origin,
        400
      );
    }
    timer.lap('validated');

    logStep('Received email payload', payload as Record<string, unknown>);

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { To, From, 'From Email': fromEmail, Subject, Date, Body, ID } = payload;

    // Sanitize inputs
    const sanitizedTo = sanitizeEmail(To as string);
    const sanitizedFromEmail = sanitizeEmail(fromEmail as string);
    const sanitizedFrom = From ? sanitizeString(From as string) : null;
    const sanitizedSubject = Subject ? sanitizeString(Subject as string) : '(No Subject)';
    const sanitizedBody = Body ? sanitizeString(Body as string) : '';
    const sanitizedId = sanitizeString(ID as string);

    // Extract domain from sanitized "To" email
    const domain = sanitizedTo.split('@')[1];

    // Find organization by domain (you may need to adjust this logic)
    // For now, we'll use the first organization
    const { data: org } = await supabaseClient
      .from('organizations')
      .select('id')
      .limit(1)
      .single();

    if (!org) {
      return corsErrorResponse('No organization found', origin, 404);
    }
    timer.lap('org-found');

    // Check if thread exists for this domain, create if not
    let { data: thread, error: threadError } = await supabaseClient
      .from('email_threads')
      .select('id')
      .eq('organization_id', org.id)
      .eq('domain', domain)
      .single();

    if (!thread) {
      const { data: newThread, error: createError } = await supabaseClient
        .from('email_threads')
        .insert({
          organization_id: org.id,
          domain: domain,
          display_name: domain,
          is_active: true
        })
        .select('id')
        .single();

      if (createError) {
        console.error('Error creating thread:', createError);
        return corsErrorResponse(
          `Failed to create thread: ${createError.message}`,
          origin,
          500
        );
      }
      thread = newThread;
    }
    timer.lap('thread-resolved');

    // Parse date safely
    let receivedDate: string;
    try {
      receivedDate = Date ? new Date(Date as string).toISOString() : new Date().toISOString();
    } catch {
      receivedDate = new Date().toISOString();
    }

    // Insert email message with sanitized data
    const { data: message, error: messageError } = await supabaseClient
      .from('email_messages')
      .insert({
        thread_id: thread.id,
        external_id: sanitizedId,
        to_email: sanitizedTo,
        from_name: sanitizedFrom,
        from_email: sanitizedFromEmail,
        subject: sanitizedSubject,
        body: sanitizedBody,
        received_date: receivedDate,
        status: 'open'
      })
      .select()
      .single();

    if (messageError) {
      console.error('Error creating message:', messageError);
      return corsErrorResponse(
        `Failed to create message: ${messageError.message}`,
        origin,
        500
      );
    }
    timer.lap('message-created');

    logStep('Email message created', { id: message.id, subject: message.subject });

    // Send notification email (non-blocking)
    sendNotificationEmail({
      ...message,
      domain: domain
    }).catch(err => console.error('Notification email failed:', err));

    timer.stop();

    return corsJsonResponse(
      { success: true, message: 'Email received', data: message },
      origin,
      200
    );

  } catch (error: unknown) {
    // Track error with monitoring
    await trackError(error, {
      functionName: 'receive-email',
      metadata: { origin },
    });

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return corsErrorResponse(errorMessage, origin, 500);
  }
});
