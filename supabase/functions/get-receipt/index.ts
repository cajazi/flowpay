import { serve } from 'https://deno.land/std/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js'

serve(async (req) => {
  // ✅ Allow only POST
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405 }
    )
  }

  try {
    const body = await req.json().catch(() => null)

    if (!body || !body.transactionId) {
      return new Response(
        JSON.stringify({ error: 'Invalid request' }),
        { status: 400 }
      )
    }

    const { transactionId } = body

    // ✅ Authenticated user client
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      {
        global: {
          headers: {
            Authorization: req.headers.get('Authorization')!,
          },
        },
      }
    )

    const {
      data: { user },
      error: authError,
    } = await supabaseUser.auth.getUser()

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401 }
      )
    }

    // ✅ Admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // ✅ Fetch only user's transaction
    const { data, error } = await supabaseAdmin
      .from('transactions')
      .select('id, amount, status, sender_id, receiver_id, created_at')
      .eq('id', transactionId)
      .or(
        `sender_id.eq.${user.id},receiver_id.eq.${user.id}`
      )
      .single()

    if (error || !data) {
      return new Response(
        JSON.stringify({ error: 'Not found' }),
        { status: 404 }
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        data,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Server error' }),
      { status: 500 }
    )
  }
})