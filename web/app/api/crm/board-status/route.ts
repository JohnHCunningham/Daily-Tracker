import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// Days after last contact before follow-up is due
const STAGE_FOLLOW_UP_DAYS: Record<string, number> = {
  pending: 0,
  request_sent: 4,
  observability: 3,
  free_analysis: 5,
  mirror: 7,
  breakup: 14,
}

const STAGE_ACTIONS: Record<string, string> = {
  pending: 'Send connection requests',
  request_sent: 'Check acceptances',
  observability: 'Send research link',
  free_analysis: 'Send analysis',
  mirror: 'Send mirror message',
  breakup: 'Send breakup message',
}

interface DueCount {
  stage: string
  count: number
  vaCount: number
  action: string
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: currentUser } = await supabase
      .from('Users')
      .select('account_id')
      .eq('auth_id', user.id)
      .single()

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get all leads
    const { data: leads } = await supabase
      .from('crm_leads')
      .select('id, status, classification, profile_signal, last_contact_at, created_at')
      .eq('account_id', currentUser.account_id)

    if (!leads) {
      return NextResponse.json({
        crm: 'No leads in pipeline',
        dueCounts: [],
        totalDue: 0,
      })
    }

    const now = Date.now()
    const dueCounts: DueCount[] = []
    let totalDue = 0
    let totalVaDue = 0

    // Calculate due counts by stage
    for (const [stage, followUpDays] of Object.entries(STAGE_FOLLOW_UP_DAYS)) {
      const stageLeads = leads.filter((lead) => lead.status === stage)
      let dueCount = 0
      let vaCount = 0

      for (const lead of stageLeads) {
        const referenceDate = lead.last_contact_at || lead.created_at
        if (!referenceDate) continue

        const refTime = new Date(referenceDate).getTime()
        const daysSinceContact = Math.floor((now - refTime) / (1000 * 60 * 60 * 24))
        const daysOverdue = daysSinceContact - followUpDays

        if (daysOverdue >= 0) {
          dueCount++
          if (lead.classification === 'V-A') vaCount++
        }
      }

      if (dueCount > 0) {
        dueCounts.push({
          stage,
          count: dueCount,
          vaCount,
          action: STAGE_ACTIONS[stage] || stage,
        })
        totalDue += dueCount
        totalVaDue += vaCount
      }
    }

    // Generate CRM status string for board-data.js
    let crmStatus = ''
    if (totalDue === 0) {
      crmStatus = 'All caught up! No prospects due today.'
    } else {
      const parts: string[] = []
      for (const dc of dueCounts) {
        const vaNote = dc.vaCount > 0 ? ` (${dc.vaCount} V-A)` : ''
        parts.push(`${dc.action}: ${dc.count}${vaNote}`)
      }
      crmStatus = parts.join(' · ')
    }

    // Get pipeline totals
    const pipelineStats = {
      total: leads.length,
      pending: leads.filter((l) => l.status === 'pending').length,
      request_sent: leads.filter((l) => l.status === 'request_sent').length,
      observability: leads.filter((l) => l.status === 'observability').length,
      free_analysis: leads.filter((l) => l.status === 'free_analysis').length,
      mirror: leads.filter((l) => l.status === 'mirror').length,
      breakup: leads.filter((l) => l.status === 'breakup').length,
      call: leads.filter((l) => l.status === 'call').length,
    }

    return NextResponse.json({
      date: new Date().toISOString().split('T')[0],
      crm: crmStatus,
      dueCounts,
      totalDue,
      totalVaDue,
      pipelineStats,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
