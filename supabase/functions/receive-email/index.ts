import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

// Allowed origins for CORS - restrict to known trusted domains
const ALLOWED_ORIGINS = [
  'https://gym-unity-suite.com',
  'https://www.gym-unity-suite.com',
  'https://gym-unity-suite.pages.dev',
  'https://api.repclub.net',
  'https://functions.repclub.net',
  'http://localhost:8080',
  'http://localhost:3000',
  'http://localhost:5173',
];

// Get CORS headers based on origin
const getCorsHeaders = (origin?: string | null) => {
  const isAllowed = origin && ALLOWED_ORIGINS.some(allowed => origin === allowed);
  const allowedOrigin = isAllowed ? origin : ALLOWED_ORIGINS[0];

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
  };
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

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep('Function started');

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const payload = await req.json();
    logStep('Received email payload', payload as Record<string, unknown>);

    const { To, From, 'From Email': fromEmail, Subject, Date, Body, ID } = payload;

    if (!To || !fromEmail || !ID) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: To, From Email, or ID' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract domain from "To" email
    const domain = To.split('@')[1];
    
    // Find organization by domain (you may need to adjust this logic)
    // For now, we'll use the first organization
    const { data: org } = await supabaseClient
      .from('organizations')
      .select('id')
      .limit(1)
      .single();

    if (!org) {
      return new Response(
        JSON.stringify({ error: 'No organization found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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
        return new Response(
          JSON.stringify({ error: 'Failed to create thread', details: createError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      thread = newThread;
    }

    // Parse date
    const receivedDate = Date ? new Date(Date).toISOString() : new Date().toISOString();

    // Insert email message
    const { data: message, error: messageError } = await supabaseClient
      .from('email_messages')
      .insert({
        thread_id: thread.id,
        external_id: ID,
        to_email: To,
        from_name: From || null,
        from_email: fromEmail,
        subject: Subject || '(No Subject)',
        body: Body || '',
        received_date: receivedDate,
        status: 'open'
      })
      .select()
      .single();

    if (messageError) {
      console.error('Error creating message:', messageError);
      return new Response(
        JSON.stringify({ error: 'Failed to create message', details: messageError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    logStep('Email message created', { id: message.id, subject: message.subject });

    // Send notification email (non-blocking)
    sendNotificationEmail({
      ...message,
      domain: domain
    }).catch(err => console.error('Notification email failed:', err));

    return new Response(
      JSON.stringify({ success: true, message: 'Email received', data: message }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in receive-email function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
