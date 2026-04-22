import { serve } from 'https://deno.land/std/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js'

// 🔐 constant-time compare
const safeCompare = (a: string, b: string) => {
  if (a.length !== b.length) return false
  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return result === 0
}

serve(async (req) => {
  console.log("WEBHOOK HIT START")

  try {
    console.log("STEP 1: method =", req.method)

    const rawBody = await req.text()
    console.log("STEP 2: RAW BODY =", rawBody)

    const signature = req.headers.get('x-paystack-signature')
    console.log("STEP 3: SIGNATURE =", signature)

    if (!signature) {
      console.log("STEP 4: NO SIGNATURE")
      return new Response('Missing signature', { status: 400 })
    }

  // ✅ Only POST
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    // 🔍 Read raw body ONCE
    const rawBody = await req.text()
    console.log("RAW BODY:", rawBody)

    const signature = req.headers.get('x-paystack-signature')
    console.log("SIGNATURE:", signature)

    if (!signature) {
      return new Response('Missing signature', { status: 400 })
    }

    // 🔐 Verify signature
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(Deno.env.get('PAYSTACK_SECRET_KEY')!),
      { name: 'HMAC', hash: 'SHA-512' },
      false,
      ['sign']
    )

    const signed = await crypto.subtle.sign(
      'HMAC',
      key,
      new TextEncoder().encode(rawBody)
    )

    const computed = Array.from(new Uint8Array(signed))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')

    if (!safeCompare(computed, signature)) {
      return new Response('Invalid signature', { status: 401 })
    }

    // 🔍 Parse JSON safely
    let body: any
    try {
      body = JSON.parse(rawBody)
    } catch {
      return new Response('Invalid JSON', { status: 400 })
    }

    console.log("EVENT RECEIVED:", body)

    // ✅ Validate payload
    if (!body?.event || !body?.data) {
      return new Response('Invalid payload', { status: 400 })
    }

    // ✅ Only process success
    if (body.event !== 'charge.success') {
      console.log("IGNORED EVENT:", body.event)
      return new Response('Ignored', { status: 200 })
    }

    const { email, amount, reference } = body.data

    if (!email || !amount || !reference) {
      return new Response('Missing fields', { status: 400 })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const amountInNaira = amount / 100

    // 🔒 Idempotency (IMPORTANT)
    const { data: existing } = await supabase
      .from('transactions')
      .select('id')
      .eq('reference', reference)
      .maybeSingle()

    if (existing) {
      console.log("DUPLICATE:", reference)
      return new Response('Already processed', { status: 200 })
    }

    // 🔍 Find user
    const { data: user } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (!user) {
      return new Response('User not found', { status: 400 })
    }

    // 💾 Insert transaction
    const { error: txError } = await supabase
      .from('transactions')
      .insert({
        reference,
        user_id: user.id,
        amount: amountInNaira,
        type: 'funding',
        status: 'completed',
      })

    if (txError) {
      console.error('TX ERROR:', txError)
      return new Response('Transaction failed', { status: 500 })
    }

    // 💰 Update wallet
    const { error: walletError } = await supabase.rpc('increment_wallet', {
      user_id: user.id,
      amount: amountInNaira,
    })

    if (walletError) {
      console.error('WALLET ERROR:', walletError)
      return new Response('Wallet update failed', { status: 500 })
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )

  } catch (err) {
    console.error('WEBHOOK ERROR:', err)
    return new Response('Server error', { status: 500 })
  }
})