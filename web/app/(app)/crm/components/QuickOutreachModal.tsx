'use client'

import { useState, useEffect, useCallback } from 'react'
import { HiX, HiClipboard, HiCheck, HiExternalLink, HiStar, HiEye, HiCalendar } from 'react-icons/hi'
import toast from 'react-hot-toast'
import type { CRMLead } from '../page'
import {
  type Persona,
  PERSONA_LABELS,
  STATUS_LABELS,
  SUBJECT_LINES,
  TEMPLATES,
  MEETING_LINK,
  getStageFromStatus,
  getPersonaFromLead,
  linkedinSearchUrl,
  personalizeTemplate,
} from '@/lib/crm/outreach-messages'
import { NEXT_STAGE, STAGE_LABELS, type StageKey } from '@/lib/crm/stages'
import CopyName from './CopyName'
import { fireConfetti, isMilestone, milestoneMessage } from '@/lib/crm/celebrate'

interface QuickOutreachModalProps {
  lead: CRMLead
  onClose: () => void
  onAdvanced: (lead: CRMLead) => void
  todayMovedCount?: number
}

export default function QuickOutreachModal({
  lead,
  onClose,
  onAdvanced,
  todayMovedCount = 0,
}: QuickOutreachModalProps) {
  const messageStage = getStageFromStatus(lead.status)
  const persona = getPersonaFromLead(lead.title, lead.category)
  const nextStage = NEXT_STAGE[lead.status as StageKey]
  const isAtFinalStage = lead.status === 'breakup'

  const [selectedPersona, setSelectedPersona] = useState<Persona>(persona)
  const [copied, setCopied] = useState(false)
  const [subjectCopied, setSubjectCopied] = useState(false)
  const [advancing, setAdvancing] = useState(false)

  const currentMessage = personalizeTemplate(TEMPLATES[messageStage][selectedPersona], lead)
  const currentSubject = SUBJECT_LINES[messageStage][selectedPersona]

  // Close on escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [onClose])

  const handleCopyAndAdvance = useCallback(async () => {
    if (advancing) return
    setAdvancing(true)

    try {
      // 1. Copy message to clipboard
      await navigator.clipboard.writeText(currentMessage)
      setCopied(true)

      // 2. Open LinkedIn (profile if we have the URL, else pre-filled search) in new tab
      const linkedinTarget = lead.linkedin_url || linkedinSearchUrl(lead.first_name, lead.last_name)
      window.open(linkedinTarget, '_blank')

      // 3. Call API to advance stage and log activity
      const response = await fetch('/api/crm/advance-stage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: lead.id,
          nextStage: nextStage,
          messageSent: currentMessage.substring(0, 200), // Log first 200 chars
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to advance stage')
      }

      const { lead: updatedLead } = await response.json()

      const newCount = todayMovedCount + 1
      if (isMilestone(newCount)) {
        fireConfetti(true)
        toast.success(milestoneMessage(newCount), { duration: 4500 })
      } else {
        fireConfetti(false)
        toast.success(`Copied! Moving to ${STAGE_LABELS[nextStage]}`)
      }
      onAdvanced(updatedLead)
      onClose()
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to advance stage')
      setAdvancing(false)
    }
  }, [lead, currentMessage, nextStage, onAdvanced, onClose, advancing, todayMovedCount])

  const handleCopyOnly = useCallback(async () => {
    await navigator.clipboard.writeText(currentMessage)
    setCopied(true)
    toast.success('Copied to clipboard')
    setTimeout(() => setCopied(false), 2000)
  }, [currentMessage])

  const handleCopySubject = useCallback(async () => {
    await navigator.clipboard.writeText(currentSubject)
    setSubjectCopied(true)
    toast.success('Subject copied')
    setTimeout(() => setSubjectCopied(false), 2000)
  }, [currentSubject])

  const handleOpenLinkedIn = useCallback(() => {
    const url = lead.linkedin_url || linkedinSearchUrl(lead.first_name, lead.last_name)
    window.open(url, '_blank')
  }, [lead.linkedin_url, lead.first_name, lead.last_name])

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-bone-dark bg-bone/30">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <CopyName
                  firstName={lead.first_name}
                  lastName={lead.last_name}
                  showIcon
                  className="font-bold text-lg text-espresso hover:text-terracotta transition-colors"
                />
                {lead.classification === 'V-A' && (
                  <span className="text-xs font-bold text-teal bg-teal/10 px-1.5 py-0.5 rounded flex-shrink-0">
                    V-A
                  </span>
                )}
                {lead.profile_signal === 'ONE_STAR' && (
                  <HiStar className="text-gold text-sm flex-shrink-0" title="ONE_STAR" />
                )}
                {lead.profile_signal === 'VIEWED' && (
                  <HiEye className="text-stone-light text-sm flex-shrink-0" title="VIEWED" />
                )}
              </div>
              {lead.title && (
                <p className="text-sm text-stone truncate">{lead.title}</p>
              )}
              {lead.company && (
                <p className="text-sm text-stone-light truncate">{lead.company}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-stone hover:bg-bone-dark hover:text-espresso transition-colors flex-shrink-0"
            >
              <HiX className="text-xl" />
            </button>
          </div>

          {/* Stage + ICP info */}
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <span className="text-xs px-2 py-1 bg-terracotta/10 text-terracotta rounded-full font-medium">
              Stage: {STATUS_LABELS[lead.status] || lead.status}
            </span>
            <span className="text-xs px-2 py-1 bg-clay/20 text-espresso rounded-full font-medium">
              ICP: {PERSONA_LABELS[selectedPersona]}
            </span>
            {lead.category && lead.category !== selectedPersona && (
              <span className="text-xs text-stone-light">
                (Category: {lead.category})
              </span>
            )}
          </div>
        </div>

        {/* Persona selector (if user wants to override auto-detection) */}
        <div className="px-5 py-2 border-b border-bone-dark bg-bone/20">
          <div className="flex flex-wrap gap-1.5">
            {(Object.entries(PERSONA_LABELS) as [Persona, string][]).map(([p, label]) => (
              <button
                key={p}
                onClick={() => setSelectedPersona(p)}
                className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                  selectedPersona === p
                    ? 'bg-terracotta text-white border-terracotta'
                    : 'bg-white text-stone border-bone-dark hover:border-terracotta/50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Subject line */}
        <div className="px-5 pt-5 pb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-stone-light uppercase tracking-wide">
              Subject Line
            </span>
            <button
              onClick={handleCopySubject}
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                subjectCopied
                  ? 'bg-terracotta text-white'
                  : 'text-terracotta hover:bg-terracotta/10'
              }`}
            >
              {subjectCopied ? <HiCheck /> : <HiClipboard />}
              {subjectCopied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <div className="bg-gradient-to-r from-terracotta/5 to-clay/10 rounded-lg border border-terracotta/20 px-4 py-3">
            <p className="text-sm font-semibold text-espresso">
              {currentSubject}
            </p>
          </div>
        </div>

        {/* Message preview */}
        <div className="flex-1 overflow-y-auto px-5 pb-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-stone-light uppercase tracking-wide">
              Message ({messageStage})
            </span>
            <button
              onClick={handleCopyOnly}
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                copied
                  ? 'bg-terracotta text-white'
                  : 'text-terracotta hover:bg-terracotta/10'
              }`}
            >
              {copied ? <HiCheck /> : <HiClipboard />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <div className="bg-bone rounded-xl border border-bone-dark p-4">
            <pre className="text-sm text-espresso whitespace-pre-wrap leading-relaxed font-sans">
              {currentMessage}
            </pre>
          </div>

          {/* Tips and Links */}
          {messageStage === 'call' && (
            <div className="mt-3 p-3 bg-teal/5 rounded-lg border border-teal/20">
              <p className="text-xs text-stone mb-1">Replace [date] and send your booking link:</p>
              <a
                href={MEETING_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-teal hover:text-teal/80 font-medium"
              >
                {MEETING_LINK} →
              </a>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-5 py-4 border-t border-bone-dark bg-bone/30 flex flex-wrap gap-2">
          <button
            onClick={handleCopyAndAdvance}
            disabled={advancing || isAtFinalStage}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${
              advancing
                ? 'bg-stone-light text-white cursor-wait'
                : isAtFinalStage
                ? 'bg-stone-light/50 text-stone cursor-not-allowed'
                : 'bg-gradient-to-r from-terracotta to-terracotta-bright text-white hover:shadow-lg'
            }`}
          >
            {advancing ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing...
              </>
            ) : isAtFinalStage ? (
              'At Final Stage'
            ) : (
              <>
                Copy & Next Stage
                <span className="text-white/70">→ {STATUS_LABELS[nextStage]}</span>
              </>
            )}
          </button>

          <button
            onClick={handleOpenLinkedIn}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-bone-dark rounded-xl text-sm font-medium text-espresso hover:border-terracotta/50 transition-colors"
          >
            <HiExternalLink className="text-base" />
            LinkedIn
          </button>

          {/* Book Call link - show for later stages */}
          {(lead.status === 'mirror' || lead.status === 'free_analysis' || lead.status === 'breakup' || lead.status === 'call') && (
            <a
              href={MEETING_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-4 py-2.5 bg-teal/10 border border-teal/30 rounded-xl text-sm font-medium text-teal hover:bg-teal/20 transition-colors"
            >
              <HiCalendar className="text-base" />
              Book Call
            </a>
          )}

          <button
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-medium text-stone hover:text-espresso transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
