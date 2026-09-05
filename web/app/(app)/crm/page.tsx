'use client'

import { useCallback, useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { HiPlus, HiFilter, HiSearch, HiRefresh } from 'react-icons/hi'
import toast from 'react-hot-toast'
import KanbanColumn from './components/KanbanColumn'
import LeadCard from './components/LeadCard'
import LeadFormModal from './components/LeadFormModal'
import QuickOutreachModal from './components/QuickOutreachModal'
import TicklerPanel from './components/TicklerPanel'
import ImportModal from './components/ImportModal'

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
}

export interface PipelineStage {
  stage_key: string
  stage_label: string
  stage_order: number
  color: string
}

const DEFAULT_STAGES: PipelineStage[] = [
  { stage_key: 'pending', stage_label: 'Pending', stage_order: 0, color: '#8F847A' },
  { stage_key: 'request_sent', stage_label: 'Request Sent', stage_order: 1, color: '#C9A687' },
  { stage_key: 'observability', stage_label: 'Observability', stage_order: 2, color: '#D4B89A' },
  { stage_key: 'free_analysis', stage_label: 'Free Analysis', stage_order: 3, color: '#D4633E' },
  { stage_key: 'mirror', stage_label: 'Mirror', stage_order: 4, color: '#E87456' },
  { stage_key: 'breakup', stage_label: 'Breakup', stage_order: 5, color: '#B5583E' },
  { stage_key: 'call', stage_label: 'Call', stage_order: 6, color: '#2A221C' },
]

type FilterClassification = 'all' | 'V-A' | 'V-B'
type FilterCategory = 'all' | string

export default function CRMPage() {
  const [leads, setLeads] = useState<CRMLead[]>([])
  const [stages, setStages] = useState<PipelineStage[]>(DEFAULT_STAGES)
  const [loading, setLoading] = useState(true)
  const [accountId, setAccountId] = useState<string | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [showNewLeadModal, setShowNewLeadModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [selectedLead, setSelectedLead] = useState<CRMLead | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterClassification, setFilterClassification] = useState<FilterClassification>('all')
  const [filterCategory, setFilterCategory] = useState<FilterCategory>('all')
  const [showFilters, setShowFilters] = useState(false)
  const supabase = createClient()

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const loadLeads = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()

    // TEMPORARY: Mock user for testing
    const mockAccountId = 'c2cba487-7057-4140-ba84-e53c750781d7'

    if (!user) {
      // Use mock account for testing
      setAccountId(mockAccountId)
    } else {
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
    }

    // Fetch from API route instead of using Supabase client directly
    try {
      const response = await fetch('/api/crm/data')
      const data = await response.json()

      if (data.stages && data.stages.length > 0) {
        setStages(data.stages)
      }

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

  // Group leads by stage with filtering
  const leadsByStage = useMemo(() => {
    let filtered = leads

    // Search filter
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

    // Classification filter
    if (filterClassification !== 'all') {
      filtered = filtered.filter((lead) => lead.classification === filterClassification)
    }

    // Category filter
    if (filterCategory !== 'all') {
      filtered = filtered.filter((lead) => lead.category === filterCategory)
    }

    // Group by stage
    return stages.reduce((acc, stage) => {
      acc[stage.stage_key] = filtered.filter((lead) => lead.status === stage.stage_key)
      return acc
    }, {} as Record<string, CRMLead[]>)
  }, [leads, stages, searchQuery, filterClassification, filterCategory])

  // Get unique categories for filter
  const categories = useMemo(() => {
    const cats = new Set(leads.map((l) => l.category).filter(Boolean) as string[])
    return Array.from(cats).sort()
  }, [leads])

  // Pipeline stats
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

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    const leadId = active.id as string
    const newStage = over.id as string

    // Find the lead
    const lead = leads.find((l) => l.id === leadId)
    if (!lead || lead.status === newStage) return

    // Get new stage order
    const stage = stages.find((s) => s.stage_key === newStage)
    if (!stage) return

    // Optimistic update
    setLeads((prev) =>
      prev.map((l) =>
        l.id === leadId
          ? { ...l, status: newStage, pipeline_stage_order: stage.stage_order }
          : l
      )
    )

    // Update database
    const { error } = await supabase
      .from('crm_leads')
      .update({
        status: newStage,
        pipeline_stage_order: stage.stage_order,
        updated_at: new Date().toISOString(),
      })
      .eq('id', leadId)

    if (error) {
      toast.error('Failed to move lead')
      void loadLeads() // Revert on error
    } else {
      toast.success(`Moved to ${stage.stage_label}`)
    }
  }

  const activeLead = activeId ? leads.find((l) => l.id === activeId) : null

  // Handle card click for quick outreach modal
  const handleCardClick = useCallback((lead: CRMLead) => {
    setSelectedLead(lead)
  }, [])

  // Handle lead advancement from modal
  const handleLeadAdvanced = useCallback((updatedLead: CRMLead) => {
    setLeads((prev) =>
      prev.map((l) => (l.id === updatedLead.id ? updatedLead : l))
    )
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-terracotta"></div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
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

      {/* Tickler Panel - Due Today */}
      <TicklerPanel leads={leads} onLeadClick={handleCardClick} />

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto pb-4">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 min-w-max">
            {stages.map((stage) => (
              <KanbanColumn
                key={stage.stage_key}
                stage={stage}
                leads={leadsByStage[stage.stage_key] || []}
                onCardClick={handleCardClick}
              />
            ))}
          </div>

          <DragOverlay>
            {activeLead && <LeadCard lead={activeLead} isDragging />}
          </DragOverlay>
        </DndContext>
      </div>

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

      {/* Quick Outreach Modal */}
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
