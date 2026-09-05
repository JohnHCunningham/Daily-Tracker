'use client'

import { useCallback, useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { HiPlus, HiFilter, HiSearch, HiRefresh } from 'react-icons/hi'
import toast from 'react-hot-toast'
import StageList from './components/StageList'
import LeadFormModal from './components/LeadFormModal'
import QuickOutreachModal from './components/QuickOutreachModal'
import TicklerPanel from './components/TicklerPanel'
import TodayMovement from './components/TodayMovement'
import ImportModal from './components/ImportModal'
import {
  STAGE_ORDER,
  STAGE_LABELS,
  STAGE_COLORS,
  STAGE_FOLLOW_UP_DAYS,
  type StageKey,
} from '@/lib/crm/stages'

export interface CRMLead {
  id: string
  first_name: string
  last_name: string
  title: string | null
  company: string | null
  linkedin_url: string | null
  email: string | null
  status: string
  pipeline_stage_order: number
  classification: 'V-A' | 'V-B'
  profile_signal: 'ONE_STAR' | 'VIEWED' | null
  category: string | null
  next_step: string | null
  notes: string | null
  last_contact_at: string | null
  ebbinghaus_status: string
  ebbinghaus_date: string | null
  free_analysis_status: string
  free_analysis_date: string | null
  mirror_status: string
  mirror_date: string | null
  breakup_status: string
  breakup_date: string | null
  dm_variant: string | null
  created_at: string
  updated_at: string
  stage_changed_at: string | null
}

type FilterClassification = 'all' | 'V-A' | 'V-B'
type FilterCategory = 'all' | string
type ActiveTab = 'overview' | StageKey

export default function CRMPage() {
  const router = useRouter()
  const [leads, setLeads] = useState<CRMLead[]>([])
  const [loading, setLoading] = useState(true)
  const [accountId, setAccountId] = useState<string | null>(null)
  const [showNewLeadModal, setShowNewLeadModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [selectedLead, setSelectedLead] = useState<CRMLead | null>(null)
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterClassification, setFilterClassification] = useState<FilterClassification>('all')
  const [filterCategory, setFilterCategory] = useState<FilterCategory>('all')
  const [showFilters, setShowFilters] = useState(false)
  const supabase = createClient()

  const loadLeads = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      window.location.href = '/login'
      return
    }

    const { data: userData } = await supabase
      .from('Users')
      .select('account_id, role')
      .eq('auth_id', user.id)
      .single()

    if (!userData) {
      setLoading(false)
      return
    }

    setAccountId(userData.account_id)

    try {
      const response = await fetch('/api/crm/data')
      const data = await response.json()

      if (data.leads) {
        setLeads(data.leads)
      }
    } catch (error) {
      console.error('Failed to load CRM data:', error)
      toast.error('Failed to load CRM data')
    }

    setLoading(false)
  }, [supabase])

  useEffect(() => {
    void loadLeads()
  }, [loadLeads])

  // Search + classification + category filters
  const filteredLeads = useMemo(() => {
    let filtered = leads

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (lead) =>
          lead.first_name.toLowerCase().includes(query) ||
          lead.last_name.toLowerCase().includes(query) ||
          (lead.company?.toLowerCase().includes(query) ?? false) ||
          (lead.email?.toLowerCase().includes(query) ?? false)
      )
    }

    if (filterClassification !== 'all') {
      filtered = filtered.filter((lead) => lead.classification === filterClassification)
    }

    if (filterCategory !== 'all') {
      filtered = filtered.filter((lead) => lead.category === filterCategory)
    }

    return filtered
  }, [leads, searchQuery, filterClassification, filterCategory])

  // Group by canonical stage order
  const leadsByStage = useMemo(() => {
    const acc: Record<string, CRMLead[]> = {}
    for (const stage of STAGE_ORDER) {
      acc[stage] = filteredLeads.filter((lead) => lead.status === stage)
    }
    return acc
  }, [filteredLeads])

  const stageStats = useMemo(() => {
    return STAGE_ORDER.map((stage) => {
      const stageLeads = leadsByStage[stage] || []
      const vaCount = stageLeads.filter((l) => l.classification === 'V-A').length
      const oneStarCount = stageLeads.filter((l) => l.profile_signal === 'ONE_STAR').length
      const followUpDays = STAGE_FOLLOW_UP_DAYS[stage]
      const dueCount =
        followUpDays != null && followUpDays >= 0
          ? stageLeads.filter((l) => {
              const ref = l.last_contact_at || l.created_at
              if (!ref) return false
              const days = (Date.now() - new Date(ref).getTime()) / (1000 * 60 * 60 * 24)
              return days - followUpDays >= 0
            }).length
          : 0
      return { stage, count: stageLeads.length, vaCount, oneStarCount, dueCount }
    })
  }, [leadsByStage])

  const categories = useMemo(() => {
    const cats = new Set(leads.map((l) => l.category).filter(Boolean) as string[])
    return Array.from(cats).sort()
  }, [leads])

  const stats = useMemo(() => {
    const vaCount = leads.filter((l) => l.classification === 'V-A').length
    const oneStarCount = leads.filter((l) => l.profile_signal === 'ONE_STAR').length
    return {
      total: leads.length,
      vaCount,
      vbCount: leads.length - vaCount,
      oneStarCount,
    }
  }, [leads])

  // Tickler "Due Today" chip → open outreach modal (fast send)
  const handleCardClick = useCallback((lead: CRMLead) => {
    setSelectedLead(lead)
  }, [])

  // Stage list row → navigate to detail page
  const handleOpenLead = useCallback(
    (lead: CRMLead) => {
      router.push(`/crm/${lead.id}`)
    },
    [router]
  )

  const handleLeadAdvanced = useCallback((updatedLead: CRMLead) => {
    setLeads((prev) => prev.map((l) => (l.id === updatedLead.id ? updatedLead : l)))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-terracotta"></div>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-espresso">Outreach Pipeline</h1>
          <p className="text-sm text-stone-light mt-1">
            {stats.total} leads · {stats.vaCount} V-A · {stats.oneStarCount} ONE_STAR
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-light" />
            <input
              type="text"
              placeholder="Search leads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white border border-bone-dark rounded-lg text-sm text-espresso placeholder-stone-light focus:outline-none focus:border-terracotta w-48"
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-lg border transition-colors ${
              showFilters || filterClassification !== 'all' || filterCategory !== 'all'
                ? 'bg-terracotta/10 border-terracotta text-terracotta'
                : 'bg-white border-bone-dark text-stone hover:border-terracotta/50'
            }`}
          >
            <HiFilter className="text-lg" />
          </button>

          {/* Refresh */}
          <button
            onClick={() => void loadLeads()}
            className="p-2 rounded-lg bg-white border border-bone-dark text-stone hover:border-terracotta/50 transition-colors"
          >
            <HiRefresh className="text-lg" />
          </button>

          {/* Import */}
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-bone-dark text-espresso font-semibold rounded-lg hover:border-terracotta/50 hover:shadow-md transition-all"
          >
            <HiPlus className="text-lg" />
            <span className="hidden sm:inline">Import</span>
          </button>

          {/* Add Lead */}
          <button
            onClick={() => setShowNewLeadModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-terracotta to-terracotta-bright text-white font-semibold rounded-lg hover:shadow-lg transition-all"
          >
            <HiPlus className="text-lg" />
            <span className="hidden sm:inline">Add Lead</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="flex flex-wrap gap-4 mb-4 p-4 bg-white rounded-xl border border-bone-dark">
          <div>
            <label className="block text-xs font-medium text-stone-light mb-1">Classification</label>
            <select
              value={filterClassification}
              onChange={(e) => setFilterClassification(e.target.value as FilterClassification)}
              className="px-3 py-1.5 bg-bone border border-bone-dark rounded-lg text-sm text-espresso focus:outline-none focus:border-terracotta"
            >
              <option value="all">All</option>
              <option value="V-A">V-A Only</option>
              <option value="V-B">V-B Only</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-light mb-1">Category</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-1.5 bg-bone border border-bone-dark rounded-lg text-sm text-espresso focus:outline-none focus:border-terracotta"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => {
              setFilterClassification('all')
              setFilterCategory('all')
              setSearchQuery('')
            }}
            className="self-end px-3 py-1.5 text-sm text-terracotta hover:text-terracotta-bright transition-colors"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Today's Movement */}
      <TodayMovement leads={leads} />

      {/* Tickler Panel - Next Up */}
      <TicklerPanel leads={leads} onLeadClick={handleCardClick} onSelectStage={setActiveTab} />

      {/* Stage Tabs */}
      <div className="flex gap-1 overflow-x-auto border-b border-bone-dark mb-6">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors ${
            activeTab === 'overview'
              ? 'border-terracotta text-terracotta'
              : 'border-transparent text-stone hover:text-espresso'
          }`}
        >
          Overview
        </button>

        {STAGE_ORDER.map((stage) => (
          <button
            key={stage}
            onClick={() => setActiveTab(stage)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors ${
              activeTab === stage
                ? 'border-terracotta text-terracotta'
                : 'border-transparent text-stone hover:text-espresso'
            }`}
          >
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: STAGE_COLORS[stage] }}
            />
            {STAGE_LABELS[stage]}
            <span className="text-xs text-stone-light bg-bone-dark/60 px-1.5 py-0.5 rounded-full">
              {leadsByStage[stage]?.length ?? 0}
            </span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {stageStats.map(({ stage, count, vaCount, oneStarCount, dueCount }) => (
            <button
              key={stage}
              onClick={() => setActiveTab(stage)}
              className="bg-white border border-bone-dark rounded-xl p-4 text-left transition-all hover:border-terracotta/40 hover:shadow-sm"
              style={{ borderTopColor: STAGE_COLORS[stage], borderTopWidth: '3px', borderTopStyle: 'solid' }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-espresso">{STAGE_LABELS[stage]}</span>
                <span className="text-2xl font-bold text-espresso">{count}</span>
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
                {vaCount > 0 && <span className="text-teal font-medium">{vaCount} V-A</span>}
                {oneStarCount > 0 && <span className="text-gold font-medium">{oneStarCount} ONE_STAR</span>}
                {dueCount > 0 && <span className="text-red-600 font-medium">{dueCount} due</span>}
              </div>
            </button>
          ))}
        </div>
      ) : (
        <StageList
          stage={activeTab}
          leads={leadsByStage[activeTab] || []}
          onOpenLead={handleOpenLead}
        />
      )}

      {/* New Lead Modal */}
      {showNewLeadModal && accountId && (
        <LeadFormModal
          accountId={accountId}
          onClose={() => setShowNewLeadModal(false)}
          onSaved={() => {
            setShowNewLeadModal(false)
            void loadLeads()
          }}
        />
      )}

      {/* Quick Outreach Modal (opened from the "Due Today" tickler) */}
      {selectedLead && (
        <QuickOutreachModal
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onAdvanced={handleLeadAdvanced}
        />
      )}

      {/* Import Modal */}
      {showImportModal && (
        <ImportModal
          onClose={() => setShowImportModal(false)}
          onImported={() => {
            setShowImportModal(false)
            void loadLeads()
          }}
        />
      )}
    </div>
  )
}
