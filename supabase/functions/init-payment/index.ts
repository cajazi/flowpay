import { serve } from 'https://deno.land/std/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json().catch(() => null)

    if (!body) {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON' }),
        { status: 400, headers: corsHeaders }
      )
    }

    const { email, amount } = body

    if (!email || !amount) {
      return new Response(
        JSON.stringify({ error: 'Missing fields' }),
        { status: 400, headers: corsHeaders }
      )
    }

    const secret = Deno.env.get('PAYSTACK_SECRET_KEY')

    const res = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secret}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        amount: amount * 100,
      }),
    })

    const data = await res.json()

    return new Response(
      JSON.stringify({
        authorization_url: data.data?.authorization_url,
      }),
      { status: 200, headers: corsHeaders }
    )

  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Server error' }),
      { status: 500, headers: corsHeaders }
    )
  }
})