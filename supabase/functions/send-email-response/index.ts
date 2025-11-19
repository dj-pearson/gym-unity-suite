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

    // Get message and thread info
    const { data: message, error: messageError } = await supabaseClient
      .from('email_messages')
      .select(`
        *,
        thread:email_threads(
          id,
          domain,
          smtp:smtp_settings(*)
        )
      `)
      .eq('id', messageId)
      .single();

    if (messageError || !message) {
      return new Response(
        JSON.stringify({ error: 'Message not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const smtpSettings = message.thread?.smtp?.[0];
    if (!smtpSettings) {
      return new Response(
        JSON.stringify({ error: 'SMTP settings not configured for this thread' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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

    // Send email via SMTP
    const client = new SMTPClient({
      connection: {
        hostname: smtpSettings.smtp_host,
        port: smtpSettings.smtp_port,
        tls: smtpSettings.use_tls,
        auth: {
          username: smtpSettings.smtp_username,
          password: smtpSettings.smtp_password,
        },
      },
    });

    await client.send({
      from: `${smtpSettings.from_name || 'Support'} <${smtpSettings.from_email}>`,
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
