import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { classifyLead, categorizeLead, explainClassification } from '@/lib/crm/classify'

export const dynamic = 'force-dynamic'

/**
 * Reclassify existing CRM leads using the canonical classification system
 *
 * Usage:
 * POST /api/crm/reclassify
 * Body: { dryRun?: boolean, leadIds?: string[] }
 *
 * - dryRun: true = show what would change without updating
 * - leadIds: array of specific lead IDs to reclassify (optional, defaults to all)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { dryRun = false, leadIds = null, strictICP = false } = body

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

    // Use service role client
    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Fetch leads to reclassify
    let query = serviceClient
      .from('crm_leads')
      .select('id, first_name, last_name, title, company, classification, category')
      .eq('account_id', userData.account_id)

    if (leadIds && Array.isArray(leadIds) && leadIds.length > 0) {
      query = query.in('id', leadIds)
    }

    const { data: leads, error: fetchError } = await query

    if (fetchError) {
      return NextResponse.json(
        { error: `Failed to fetch leads: ${fetchError.message}` },
        { status: 500 }
      )
    }

    if (!leads || leads.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No leads to reclassify',
        stats: { total: 0, changed: 0, unchanged: 0 },
        changes: [],
      })
    }

    const changes: Array<{
      id: string
      name: string
      title: string | null
      company: string | null
      oldClassification: string
      newClassification: 'V-A' | 'V-B'
      oldCategory: string | null
      newCategory: string
      reason: string
      willChange: boolean
    }> = []

    let changedCount = 0
    let unchangedCount = 0

    // Process each lead
    for (const lead of leads) {
      const result = explainClassification({
        title: lead.title,
        company: lead.company,
      })

      const newClassification = strictICP
        ? classifyLead({ title: lead.title, company: lead.company, strictICP: true })
        : result.classification

      const newCategory = result.category

      const classificationChanged = lead.classification !== newClassification
      const categoryChanged = lead.category !== newCategory
      const willChange = classificationChanged || categoryChanged

      if (willChange) {
        changedCount++
        changes.push({
          id: lead.id,
          name: `${lead.first_name} ${lead.last_name}`,
          title: lead.title,
          company: lead.company,
          oldClassification: lead.classification || 'null',
          newClassification,
          oldCategory: lead.category,
          newCategory,
          reason: result.reason,
          willChange: true,
        })
      } else {
        unchangedCount++
      }

      // Update database if not dry run
      if (!dryRun && willChange) {
        const { error: updateError } = await serviceClient
          .from('crm_leads')
          .update({
            classification: newClassification,
            category: newCategory,
            updated_at: new Date().toISOString(),
          })
          .eq('id', lead.id)

        if (updateError) {
          console.error(`Failed to update lead ${lead.id}:`, updateError)
        }
      }
    }

    return NextResponse.json({
      success: true,
      dryRun,
      stats: {
        total: leads.length,
        changed: changedCount,
        unchanged: unchangedCount,
      },
      changes: changes.slice(0, 100), // Limit to first 100 changes in response
      message: dryRun
        ? `Dry run: ${changedCount} leads would be updated`
        : `Updated ${changedCount} leads`,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * Get classification preview for a single lead
 *
 * GET /api/crm/reclassify?title=VP+of+Sales&company=TechCorp
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const title = searchParams.get('title')
  const company = searchParams.get('company')

  const result = explainClassification({ title, company })

  return NextResponse.json(result)
}
