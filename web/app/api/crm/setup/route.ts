import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { readFileSync } from 'fs'
import { join } from 'path'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    const supabase = await createClient()

    // Check auth - only admin can run setup
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userData } = await supabase
      .from('Users')
      .select('role')
      .eq('auth_id', user.id)
      .single()

    if (userData?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 })
    }

    // Read the migration file
    const migrationPath = join(process.cwd(), '../supabase/migrations/101_crm_leads_schema.sql')
    const sql = readFileSync(migrationPath, 'utf-8')

    // Note: Supabase client doesn't support raw SQL execution from the browser SDK
    // User needs to run this in the Supabase dashboard SQL editor

    return NextResponse.json({
      message: 'Please run the migration SQL in your Supabase dashboard',
      instructions: [
        '1. Go to https://supabase.com/dashboard/project/qwqlsbccwnwrdpcaccjz/sql/new',
        '2. Copy and paste the SQL from: /supabase/migrations/101_crm_leads_schema.sql',
        '3. Click "Run"',
        '4. Refresh the /crm page'
      ],
      migrationFile: '/supabase/migrations/101_crm_leads_schema.sql'
    })
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
