import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { messageId, responseBody } = await req.json();

    if (!messageId || !responseBody) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: messageId or responseBody' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get message info
    const { data: message, error: messageError } = await supabaseClient
      .from('email_messages')
      .select('*')
      .eq('id', messageId)
      .single();

    if (messageError || !message) {
      return new Response(
        JSON.stringify({ error: 'Message not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get current user
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get SMTP settings from Supabase secrets (Amazon SES)
    const smtpEndpoint = Deno.env.get('AMAZON_SMTP_ENDPOINT');
    const smtpUsername = Deno.env.get('AMAZON_SMTP_USER_NAME');
    const smtpPassword = Deno.env.get('AMAZON_SMTP_PASSWORD');

    if (!smtpEndpoint || !smtpUsername || !smtpPassword) {
      return new Response(
        JSON.stringify({ error: 'SMTP settings not configured in Supabase secrets' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse SMTP endpoint to get host and port
    const endpointParts = smtpEndpoint.split(':');
    const smtpHost = endpointParts[0];
    const smtpPort = endpointParts[1] ? parseInt(endpointParts[1]) : 587;

    // Send email via Amazon SES SMTP
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

    // Use the original "to" email as the "from" address for the reply
    await client.send({
      from: message.to_email,
      to: message.from_email,
      subject: `Re: ${message.subject}`,
      content: responseBody,
      html: responseBody.replace(/\n/g, '<br>'),
    });

    await client.close();

    // Log the response
    const { error: logError } = await supabaseClient
      .from('email_responses')
      .insert({
        message_id: messageId,
        sent_by: user.id,
        response_body: responseBody,
      });

    if (logError) {
      console.error('Error logging response:', logError);
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Email sent successfully' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in send-email-response function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
