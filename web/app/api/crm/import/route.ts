import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { classifyLead, categorizeLead } from '@/lib/crm/classify'

export const dynamic = 'force-dynamic'

interface ImportLead {
  name?: string
  first_name?: string
  last_name?: string
  title?: string
  company?: string
  linkedin_url?: string
  email?: string
  status?: string
  stage?: string  // HTML kanban stage
  category?: string
  classification?: 'V-A' | 'V-B'
  priority?: string  // HTML: high → V-A
  profile_signal?: 'ONE_STAR' | 'VIEWED' | null
  signal?: string  // HTML: ONE_STAR, VIEWED
  notes?: string
  // Stage date columns (from Google Sheet CSV export)
  ebbinghaus?: string
  if?: string
  free_analysis?: string
  free_analysis_sent?: string
  mirror?: string
  mirror_sent?: string
  breakup?: string
  breakup_sent?: string
}

// Map HTML kanban stages to Supabase status
const STAGE_MAP: Record<string, string> = {
  pending: 'pending',
  sent: 'request_sent',
  ebbinghaus: 'observability',
  free: 'free_analysis',
  mirror: 'mirror',
  breakup: 'breakup',
  call: 'call',
}

const STAGE_ORDER: Record<string, number> = {
  pending: 0,
  request_sent: 1,
  observability: 2,
  free_analysis: 3,
  mirror: 4,
  breakup: 5,
  call: 6,
}

// Parse CSV string into array of objects
function parseCSV(csvData: string): ImportLead[] {
  const lines = csvData.trim().split('\n')
  if (lines.length < 2) return []

  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/['"]/g, '').replace(/\s+/g, '_'))
  const leads: ImportLead[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i])
    if (values.length === 0) continue

    const lead: Record<string, string> = {}
    headers.forEach((header, idx) => {
      if (values[idx]) {
        lead[header] = values[idx].trim()
      }
    })

    leads.push({
      name: lead.name || lead.full_name,
      first_name: lead.first_name || lead.firstname,
      last_name: lead.last_name || lead.lastname,
      title: lead.title || lead.job_title,
      company: lead.company || lead.organization,
      linkedin_url: lead.linkedin_url || lead.linkedin || lead.profile_url,
      email: lead.email,
      status: lead.status,
      stage: lead.stage,
      category: lead.category,
      classification: lead.classification as 'V-A' | 'V-B' | undefined,
      priority: lead.priority,
      profile_signal: lead.profile_signal as 'ONE_STAR' | 'VIEWED' | undefined,
      signal: lead.signal,
      notes: lead.notes,
      // Stage date columns for detection
      ebbinghaus: lead.ebbinghaus,
      if: lead.if,
      free_analysis: lead.free_analysis,
      free_analysis_sent: lead.free_analysis_sent,
      mirror: lead.mirror,
      mirror_sent: lead.mirror_sent,
      breakup: lead.breakup,
      breakup_sent: lead.breakup_sent,
    })
  }

  return leads
}

// Parse a single CSV line handling quoted values
function parseCSVLine(line: string): string[] {
  const values: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  values.push(current.trim())

  return values
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { csvData, leads: jsonLeads } = body

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userData } = await supabase
      .from('Users')
      .select('account_id, email')
      .eq('auth_id', user.id)
      .single()

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Use service role client to bypass PostgREST issues
    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const currentUser = { account_id: userData.account_id, email: userData.email }

    // Parse leads from CSV or use provided JSON array
    let leadsToImport: ImportLead[] = []
    if (csvData) {
      console.log('CSV Data received:', csvData.substring(0, 200))
      leadsToImport = parseCSV(csvData)
      console.log('Parsed leads count:', leadsToImport.length)
      if (leadsToImport.length > 0) {
        console.log('First lead:', leadsToImport[0])
      }
    } else if (jsonLeads && Array.isArray(jsonLeads)) {
      leadsToImport = jsonLeads
    }

    console.log('Total leads to import:', leadsToImport.length)

    if (leadsToImport.length === 0) {
      return NextResponse.json(
        { error: 'No leads to import' },
        { status: 400 }
      )
    }

    const results = { imported: 0, updated: 0, skipped: 0, errors: [] as string[] }

    for (const lead of leadsToImport) {
      try {
        // Parse name if not split
        let firstName = lead.first_name
        let lastName = lead.last_name

        if (!firstName && !lastName && lead.name) {
          const parts = lead.name.trim().split(/\s+/)
          firstName = parts[0] || ''
          lastName = parts.slice(1).join(' ') || ''
          console.log(`Split name "${lead.name}" into firstName="${firstName}", lastName="${lastName}"`)
        }

        console.log(`Processing lead: firstName="${firstName}", lastName="${lastName}", company="${lead.company}"`)

        if (!firstName) {
          console.log('Skipping lead - no first name')
          results.skipped++
          continue
        }

        // Detect stage from "Sent" date columns (most advanced stage with a date)
        // Start with status column mapping as the baseline
        let status = 'pending' // default

        // Map the Status column from CSV to proper database values
        if (lead.status) {
          const statusLower = lead.status.toLowerCase()
          if (statusLower === 'pending') {
            status = 'pending'
          } else if (statusLower === 'acceptances' || statusLower === 'accepted') {
            status = 'request_sent'  // Acceptances = they accepted connection request
          } else if (statusLower === 'not interested') {
            status = 'not_interested'
          } else if (statusLower === 'discovery call') {
            status = 'call'
          }
        }

        // Override with stage detection from date columns (more accurate than Status column)
        if (lead.breakup_sent && lead.breakup_sent !== 'Pending' && lead.breakup_sent.match(/\d{4}-\d{2}-\d{2}/)) {
          status = 'breakup'
          console.log(`→ Detected stage from date: breakup`)
        } else if (lead.mirror_sent && lead.mirror_sent !== 'Pending' && lead.mirror_sent.match(/\d{4}-\d{2}-\d{2}/)) {
          status = 'mirror'
          console.log(`→ Detected stage from date: mirror`)
        } else if (lead.free_analysis_sent && lead.free_analysis_sent !== 'Pending' && lead.free_analysis_sent.match(/\d{4}-\d{2}-\d{2}/)) {
          status = 'free_analysis'
          console.log(`→ Detected stage from date: free_analysis`)
        } else if (lead.if && lead.if.match(/\d{4}-\d{2}-\d{2}/)) {
          // "If" column has Ebbinghaus date
          status = 'observability'
          console.log(`→ Detected stage from date: observability`)
        }

        console.log(`Final status for ${firstName} ${lastName}: ${status}`)

        // Auto-classify using robust classification system
        // Priority:
        // 1. Use provided classification if valid
        // 2. Use priority column (high → V-A)
        // 3. Auto-classify from title + company
        let classification: 'V-A' | 'V-B' = 'V-B'

        if (lead.classification === 'V-A' || lead.classification === 'V-B') {
          // Trust provided classification
          classification = lead.classification
          console.log(`→ Using provided classification: ${classification}`)
        } else if (lead.priority === 'high') {
          // Legacy: high priority → V-A
          classification = 'V-A'
          console.log(`→ Classification from priority=high: V-A`)
        } else {
          // Auto-classify from title
          classification = classifyLead({
            title: lead.title,
            company: lead.company,
            strictICP: false, // Set to true if you want to enforce SaaS/tech filter
          })
          console.log(`→ Auto-classified from title "${lead.title}": ${classification}`)
        }

        // Auto-categorize from title (always auto-detect for consistency)
        const category = categorizeLead(lead.title)
        console.log(`→ Category: ${category}`)

        // Map profile_signal from signal
        let profileSignal = lead.profile_signal || null
        if (lead.signal === 'ONE_STAR') {
          profileSignal = 'ONE_STAR'
        } else if (lead.signal === 'VIEWED') {
          profileSignal = 'VIEWED'
        }

        // Check for existing lead
        console.log(`Checking for existing lead: ${firstName} ${lastName} at ${lead.company}`)
        const { data: existing, error: checkError } = await serviceClient
          .from('crm_leads')
          .select('id')
          .eq('account_id', currentUser.account_id)
          .eq('first_name', firstName)
          .eq('last_name', lastName || '')
          .eq('company', lead.company || '')
          .maybeSingle()

        if (checkError) {
          console.log('Check error:', checkError)
          results.errors.push(`Check failed for ${firstName} ${lastName}: ${checkError.message}`)
          continue
        }

        if (existing) {
          console.log(`Updating existing lead: ${existing.id} with status: ${status}`)
          // Update existing
          const { error: updateError } = await serviceClient
            .from('crm_leads')
            .update({
              title: lead.title,
              linkedin_url: lead.linkedin_url,
              email: lead.email,
              status,
              classification,
              profile_signal: profileSignal,
              category,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existing.id)

          if (updateError) {
            console.log('Update error:', updateError)
            results.errors.push(`Update failed for ${firstName} ${lastName}: ${updateError.message}`)
          } else {
            console.log('Update successful')
            results.updated++
          }
        } else {
          console.log(`Inserting new lead: ${firstName} ${lastName}`)
          // Insert new
          const { error: insertError } = await serviceClient
            .from('crm_leads')
            .insert({
              account_id: currentUser.account_id,
              first_name: firstName,
              last_name: lastName || '',
              title: lead.title || null,
              company: lead.company || null,
              linkedin_url: lead.linkedin_url || null,
              email: lead.email || null,
              status,
              pipeline_stage_order: 0,
              classification,
              profile_signal: profileSignal,
              category,
              notes: lead.notes || null,
            })

          if (insertError) {
            console.log('Insert error:', insertError)
            results.errors.push(`Insert failed for ${firstName} ${lastName}: ${insertError.message}`)
          } else {
            console.log('Insert successful')
            results.imported++
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error'
        results.errors.push(msg)
        results.skipped++
      }
    }

    return NextResponse.json({
      success: true,
      ...results,
      total: leadsToImport.length,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
