import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const payload = await req.json();
    console.log('Received email payload:', payload);

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

    console.log('Email message created:', message);

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
