import { serve } from 'https://deno.land/std/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js'

// ✅ SINGLE SOURCE OF TRUTH (NO DUPLICATES)
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
  'Content-Type': 'application/json',
}

// ✅ RESPONSE HELPER (SCALABLE)
const json = (data: any, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: corsHeaders,
  })

serve(async (req) => {
  // ✅ HANDLE PREFLIGHT (ONLY ONCE)
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    })
  }

  // ✅ ONLY POST
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  try {
    // 🔐 AUTH
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Unauthorized' }, 401)

    const token = authHeader.replace('Bearer ', '')

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return json({ error: 'Invalid token' }, 401)
    }

    // ✅ SAFE JSON PARSE
    let body
    try {
      body = await req.json()
    } catch {
      return json({ error: 'Invalid JSON' }, 400)
    }

    const receiverEmail = body.receiverEmail?.trim().toLowerCase()
    const amount = Number(body.amount)

    // ✅ VALIDATION
    if (!receiverEmail || isNaN(amount)) {
      return json({ error: 'Missing or invalid fields' }, 400)
    }

    if (amount <= 0) {
      return json({ error: 'Amount must be greater than zero' }, 400)
    }

    if (amount > 1_000_000) {
      return