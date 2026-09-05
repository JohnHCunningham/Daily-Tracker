'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  HiArrowLeft,
  HiPencil,
  HiTrash,
  HiExternalLink,
  HiMail,
  HiPhone,
  HiCalendar,
  HiClock,
  HiPlus,
  HiStar,
} from 'react-icons/hi'
import toast from 'react-hot-toast'
import type { CRMLead } from '../page'
import { STAGE_ORDER, STAGE_LABELS, NEXT_STAGE, type StageKey } from '@/lib/crm/stages'
import LeadFormModal from '../components/LeadFormModal'
import MessageTemplates from '../components/MessageTemplates'
import CopyName from '../components/CopyName'
import { linkedinSearchUrl } from '@/lib/crm/outreach-messages'

interface LeadActivity {
  id: string
  activity_type: string
  activity_date: string
  subject: string | null
  body: string | null
  direction: string | null
  source_provider: string | null
}

interface LeadMeeting {
  id: string
  meeting_date: string
  meeting_title: string | null
  duration_minutes: number | null
  has_transcript: boolean
  transcript_summary: string | null
}

export default function LeadDetailPage({ params }: { params: { leadId: string } }) {
  const leadId = params.leadId
  const [lead, setLead] = useState<CRMLead | null>(null)
  const [activities, setActivities] = useState<LeadActivity[]>([])
  const [meetings, setMeetings] = useState<LeadMeeting[]>([])
  const [loading, setLoading] = useState(true)
  const [accountId, setAccountId] = useState<string | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [newNote, setNewNote] = useState('')
  const [savingNote, setSavingNote] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const loadLead = useCallback(async () => {
    if (!leadId) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: userData } = await supabase
      .from('Users')
      .select('account_id')
      .eq('auth_id', user.id)
      .single()

    if (!userData) {
      setLoading(false)
      return
    }

    setAccountId(userData.account_id)

    // Load lead
    const { data: leadData } = await supabase
      .from('crm_leads')
      .select('*')
      .eq('id', leadId)
      .eq('account_id', userData.account_id)
      .single()

    if (leadData) {
      setLead(leadData)
    }

    // Load activities
    const { data: activitiesData } = await supabase
      .from('crm_lead_activities')
      .select('*')
      .eq('lead_id', leadId)
      .order('activity_date', { ascending: false })
      .limit(50)

    if (activitiesData) {
      setActivities(activitiesData)
    }

    // Load meetings
    const { data: meetingsData } = await supabase
      .from('crm_lead_meetings')
      .select('*')
      .eq('lead_id', leadId)
      .order('meeting_date', { ascending: false })
      .limit(20)

    if (meetingsData) {
      setMeetings(meetingsData)
    }

    setLoading(false)
  }, [leadId, supabase])

  useEffect(() => {
    if (leadId) {
      void loadLead()
    }
  }, [leadId, loadLead])

  const handleDelete = async () => {
    if (!lead) return
    if (!confirm('Are you sure you want to delete this lead?')) return

    const { error } = await supabase.from('crm_leads').delete().eq('id', lead.id)

    if (error) {
      toast.error('Failed to delete lead')
    } else {
      toast.success('Lead deleted')
      router.push('/crm')
    }
  }

  const handleStageChange = async (newStage: string) => {
    if (!lead) return

    const stageOrder = STAGE_ORDER.indexOf(newStage as StageKey)

    const { error } = await supabase
      .from('crm_leads')
      .update({
        status: newStage,
        pipeline_stage_order: stageOrder,
        last_contact_at: new Date().toISOString(),
        stage_changed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', lead.id)

    if (error) {
      toast.error('Failed to update stage')
    } else {
      toast.success(`Moved to ${STAGE_LABELS[newStage as StageKey]}`)
      setLead({ ...lead, status: newStage, pipeline_stage_order: stageOrder })
    }
  }

  const handleAddNote = async () => {
    if (!lead || !newNote.trim()) return

    setSavingNote(true)

    // Add as activity
    const { error } = await supabase.from('crm_lead_activities').insert({
      lead_id: lead.id,
      account_id: accountId,
      activity_type: 'note',
      activity_date: new Date().toISOString(),
      body: newNote.trim(),
      direction: 'outbound',
      source_provider: 'manual',
    })

    if (error) {
      toast.error('Failed to add note')
    } else {
      toast.success('Note added')
      setNewNote('')
      void loadLead()
    }

    setSavingNote(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-terracotta"></div>
      </div>
    )
  }

  if (!lead) {
    return (
      <div className="text-center py-12">
        <p className="text-stone">Lead not found</p>
        <Link href="/crm" className="text-terracotta hover:underline mt-2 inline-block">
          Back to Pipeline
        </Link>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link
            href="/crm"
            className="p-2 hover:bg-bone-dark/20 rounded-lg transition-colors text-terracotta"
          >
            <HiArrowLeft className="text-xl" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <CopyName
                firstName={lead.first_name}
                lastName={lead.last_name}
                showIcon
                className="text-2xl font-bold text-espresso hover:text-terracotta transition-colors"
              />
              {lead.classification === 'V-A' && (
                <span className="text-xs font-bold text-teal bg-teal/10 px-2 py-1 rounded">V-A</span>
              )}
              {lead.profile_signal === 'ONE_STAR' && (
                <HiStar className="text-gold text-xl" title="ONE_STAR" />
              )}
            </div>
            {lead.title && <p className="text-stone-light">{lead.title}</p>}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowEditModal(true)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-stone hover:text-espresso border border-bone-dark rounded-lg hover:border-terracotta/50 transition-colors"
          >
            <HiPencil />
            Edit
          </button>
          <button
            onClick={handleDelete}
            className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:text-red-700 border border-bone-dark rounded-lg hover:border-red-200 transition-colors"
          >
            <HiTrash />
            Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Lead Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Info Card */}
          <div className="bg-white rounded-xl border border-bone-dark p-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="text-xs font-medium text-stone-light mb-1">Company</h3>
                <p className="text-espresso">{lead.company || '-'}</p>
              </div>
              <div>
                <h3 className="text-xs font-medium text-stone-light mb-1">Category</h3>
                <p className="text-espresso">{lead.category || '-'}</p>
              </div>
              <div>
                <h3 className="text-xs font-medium text-stone-light mb-1">Email</h3>
                {lead.email ? (
                  <a href={`mailto:${lead.email}`} className="text-terracotta hover:underline flex items-center gap-1">
                    <HiMail /> {lead.email}
                  </a>
                ) : (
                  <p className="text-stone">-</p>
                )}
              </div>
              <div>
                <h3 className="text-xs font-medium text-stone-light mb-1">LinkedIn</h3>
                <a
                  href={lead.linkedin_url || linkedinSearchUrl(lead.first_name, lead.last_name)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-terracotta hover:underline flex items-center gap-1"
                >
                  <HiExternalLink /> {lead.linkedin_url ? 'View Profile' : 'Search LinkedIn'}
                </a>
              </div>
            </div>

            {/* Pipeline Stage */}
            <div className="mt-6 pt-6 border-t border-bone-dark">
              <h3 className="text-xs font-medium text-stone-light mb-2">Pipeline Stage</h3>
              <div className="flex flex-wrap gap-2">
                {STAGE_ORDER.map((key) => (
                  <button
                    key={key}
                    onClick={() => handleStageChange(key)}
                    className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                      lead.status === key
                        ? 'bg-terracotta text-white'
                        : 'bg-bone text-stone hover:bg-terracotta/10 hover:text-terracotta'
                    }`}
                  >
                    {STAGE_LABELS[key]}
                  </button>
                ))}
              </div>
            </div>

            {/* DM Cadence Status */}
            <div className="mt-6 pt-6 border-t border-bone-dark">
              <h3 className="text-xs font-medium text-stone-light mb-3">DM Cadence</h3>
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-stone-light">Observability</p>
                  <p className={`font-medium ${lead.ebbinghaus_status === 'sent' ? 'text-green-600' : 'text-stone'}`}>
                    {lead.ebbinghaus_status}
                  </p>
                  {lead.ebbinghaus_date && (
                    <p className="text-xs text-stone-light">{new Date(lead.ebbinghaus_date).toLocaleDateString()}</p>
                  )}
                </div>
                <div>
                  <p className="text-stone-light">Free Analysis</p>
                  <p className={`font-medium ${lead.free_analysis_status === 'sent' ? 'text-green-600' : 'text-stone'}`}>
                    {lead.free_analysis_status}
                  </p>
                  {lead.free_analysis_date && (
                    <p className="text-xs text-stone-light">{new Date(lead.free_analysis_date).toLocaleDateString()}</p>
                  )}
                </div>
                <div>
                  <p className="text-stone-light">Mirror</p>
                  <p className={`font-medium ${lead.mirror_status === 'sent' ? 'text-green-600' : 'text-stone'}`}>
                    {lead.mirror_status}
                  </p>
                  {lead.mirror_date && (
                    <p className="text-xs text-stone-light">{new Date(lead.mirror_date).toLocaleDateString()}</p>
                  )}
                </div>
                <div>
                  <p className="text-stone-light">Breakup</p>
                  <p className={`font-medium ${lead.breakup_status === 'sent' ? 'text-green-600' : 'text-stone'}`}>
                    {lead.breakup_status}
                  </p>
                  {lead.breakup_date && (
                    <p className="text-xs text-stone-light">{new Date(lead.breakup_date).toLocaleDateString()}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Notes */}
            {lead.notes && (
              <div className="mt-6 pt-6 border-t border-bone-dark">
                <h3 className="text-xs font-medium text-stone-light mb-2">Notes</h3>
                <p className="text-sm text-stone whitespace-pre-wrap">{lead.notes}</p>
              </div>
            )}
          </div>

          {/* Add Note */}
          <div className="bg-white rounded-xl border border-bone-dark p-4">
            <h3 className="font-semibold text-espresso mb-3">Add Note</h3>
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Write a note..."
              rows={3}
              className="w-full px-4 py-2.5 bg-bone border border-bone-dark rounded-lg text-espresso focus:outline-none focus:border-terracotta resize-none"
            />
            <div className="flex justify-end mt-2">
              <button
                onClick={handleAddNote}
                disabled={!newNote.trim() || savingNote}
                className="flex items-center gap-2 px-4 py-2 bg-terracotta text-white rounded-lg hover:bg-terracotta-bright transition-colors disabled:opacity-50"
              >
                <HiPlus />
                Add Note
              </button>
            </div>
          </div>

          {/* Activity Timeline */}
          <div className="bg-white rounded-xl border border-bone-dark p-4">
            <h3 className="font-semibold text-espresso mb-4">Activity Timeline</h3>

            {activities.length === 0 && meetings.length === 0 ? (
              <p className="text-center py-8 text-stone-light">No activities yet</p>
            ) : (
              <div className="space-y-4">
                {/* Merge and sort activities + meetings */}
                {[
                  ...activities.map((a) => ({ type: 'activity' as const, date: a.activity_date, data: a })),
                  ...meetings.map((m) => ({ type: 'meeting' as const, date: m.meeting_date, data: m })),
                ]
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((item, idx) => (
                    <div key={idx} className="flex gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-bone flex items-center justify-center">
                        {item.type === 'meeting' ? (
                          <HiCalendar className="text-terracotta" />
                        ) : item.data.activity_type === 'note' ? (
                          <HiPencil className="text-stone" />
                        ) : item.data.activity_type === 'email' ? (
                          <HiMail className="text-stone" />
                        ) : (
                          <HiClock className="text-stone" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-espresso">
                            {item.type === 'meeting'
                              ? (item.data as LeadMeeting).meeting_title || 'Meeting'
                              : (item.data as LeadActivity).activity_type}
                          </p>
                          <p className="text-xs text-stone-light">
                            {new Date(item.date).toLocaleDateString()}
                          </p>
                        </div>
                        {item.type === 'activity' && (item.data as LeadActivity).body && (
                          <p className="text-sm text-stone mt-1 whitespace-pre-wrap">
                            {(item.data as LeadActivity).body}
                          </p>
                        )}
                        {item.type === 'meeting' && (item.data as LeadMeeting).transcript_summary && (
                          <p className="text-sm text-stone mt-1">
                            {(item.data as LeadMeeting).transcript_summary}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Message Templates */}
        <div className="space-y-6">
          <MessageTemplates
            category={lead.category}
            currentStage={lead.status}
            firstName={lead.first_name}
          />

          {/* Move to Next Stage */}
          <div className="bg-white rounded-xl border border-bone-dark p-4">
            <h3 className="font-semibold text-espresso mb-3">Move to Next Stage</h3>
            {lead.status === 'breakup' ? (
              <p className="text-sm text-stone-light">Breakup is the final stage.</p>
            ) : (
              <>
                <div className="flex items-center justify-between text-sm mb-3">
                  <span className="text-stone-light">Current</span>
                  <span className="font-medium text-espresso">
                    {STAGE_LABELS[lead.status as StageKey] || lead.status}
                  </span>
                </div>
                <button
                  onClick={() => handleStageChange(NEXT_STAGE[lead.status as StageKey])}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-terracotta text-white font-semibold rounded-lg hover:bg-terracotta-bright transition-colors"
                >
                  Advance to {STAGE_LABELS[NEXT_STAGE[lead.status as StageKey]]}
                </button>
              </>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl border border-bone-dark p-4">
            <h3 className="font-semibold text-espresso mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <a
                href={lead.linkedin_url || linkedinSearchUrl(lead.first_name, lead.last_name)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left text-espresso bg-bone rounded-lg hover:bg-terracotta/10 transition-colors"
              >
                <HiExternalLink />
                {lead.linkedin_url ? 'Open LinkedIn Profile' : 'Search LinkedIn'}
              </a>
              {lead.email && (
                <a
                  href={`mailto:${lead.email}`}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left text-espresso bg-bone rounded-lg hover:bg-terracotta/10 transition-colors"
                >
                  <HiMail />
                  Send Email
                </a>
              )}
            </div>
          </div>

          {/* Lead Metadata */}
          <div className="bg-white rounded-xl border border-bone-dark p-4">
            <h3 className="font-semibold text-espresso mb-3">Metadata</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-stone-light">Classification</dt>
                <dd className="text-espresso font-medium">{lead.classification}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-stone-light">Profile Signal</dt>
                <dd className="text-espresso">{lead.profile_signal || 'None'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-stone-light">DM Variant</dt>
                <dd className="text-espresso">{lead.dm_variant || 'None'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-stone-light">Created</dt>
                <dd className="text-espresso">{new Date(lead.created_at).toLocaleDateString()}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-stone-light">Last Updated</dt>
                <dd className="text-espresso">{new Date(lead.updated_at).toLocaleDateString()}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && accountId && (
        <LeadFormModal
          accountId={accountId}
          lead={lead}
          onClose={() => setShowEditModal(false)}
          onSaved={() => {
            setShowEditModal(false)
            void loadLead()
          }}
        />
      )}
    </div>
  )
}
