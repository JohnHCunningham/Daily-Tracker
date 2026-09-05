import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userData } = await supabase
      .from('Users')
      .select('account_id')
      .eq('auth_id', user.id)
      .single()

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Use service role client to bypass RLS/PostgREST issues
    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: stages, error } = await serviceClient
      .from('crm_pipeline_stages')
      .select('*')
      .eq('account_id', userData.account_id)
      .order('stage_order')

    if (error) {
      console.error('Stage query error:', error)
      return NextResponse.json({ stages: [], error: error.message })
    }

    return NextResponse.json({ stages: stages || [] })
  } catch (error) {
    console.error('Stages API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error', stages: [] },
      { status: 500 }
    )
  }
}
