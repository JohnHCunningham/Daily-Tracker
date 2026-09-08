'use client'

import { useState, useEffect } from 'react'
import { HiClipboard, HiCheck, HiExternalLink } from 'react-icons/hi'
import toast from 'react-hot-toast'
import {
  type Persona,
  type Stage,
  PERSONA_LABELS,
  STAGE_LABELS,
  STAGE_NOTES,
  TEMPLATES,
  RESEARCH_LINK,
  getStageFromStatus,
  getPersonaFromLead,
  personalizeTemplate,
} from '@/lib/crm/outreach-messages'

interface MessageTemplatesProps {
  category?: string | null
  currentStage?: string | null
  firstName?: string
  title?: string | null
  company?: string | null
}

const PERSONA_COLORS: Record<Persona, string> = {
  'sales-leadership': 'bg-terracotta/15 text-terracotta border-terracotta/30',
  'enablement': 'bg-green-100 text-green-700 border-green-300',
  'sandler-franchisee': 'bg-blue-100 text-blue-700 border-blue-300',
  'partner': 'bg-clay/20 text-espresso border-clay',
}

export default function MessageTemplates({ category, currentStage, firstName, title, company }: MessageTemplatesProps) {
  const defaultStage = getStageFromStatus(currentStage || null)
  const defaultPersona = getPersonaFromLead(title || null, category || null)

  const [selectedStage, setSelectedStage] = useState<Stage>(defaultStage)
  const [selectedPersona, setSelectedPersona] = useState<Persona>(defaultPersona)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Update when props change
  useEffect(() => {
    setSelectedStage(getStageFromStatus(currentStage || null))
    setSelectedPersona(getPersonaFromLead(title || null, category || null))
  }, [currentStage, category, title])

  const handleCopy = (stage: Stage, persona: Persona) => {
    const template = TEMPLATES[stage][persona]
    if (!template) return

    const text = personalizeTemplate(template, { first_name: firstName ?? null, company: company ?? null })

    navigator.clipboard.writeText(text)
    setCopiedId(`${stage}-${persona}`)
    toast.success('Copied to clipboard')

    setTimeout(() => setCopiedId(null), 2000)
  }

  const currentTemplate = personalizeTemplate(TEMPLATES[selectedStage][selectedPersona], {
    first_name: firstName ?? null,
    company: company ?? null,
  })

  return (
    <div className="bg-bone-light rounded-xl border border-bone-dark shadow-card">
      {/* Header */}
      <div className="px-3 sm:px-4 py-3 border-b border-bone-dark bg-bone/50">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-semibold text-espresso">Quick Copy</h3>
          <a
            href={RESEARCH_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-terracotta hover:text-terracotta-bright flex items-center gap-1 flex-shrink-0"
          >
            Research <HiExternalLink className="text-sm" />
          </a>
        </div>
        <p className="text-xs text-stone mt-1 hidden sm:block">
          Value-first: Connect → Observability → Mirror → Free Analysis → Call → Breakup
        </p>
      </div>

      {/* Stage Tabs - Horizontal Scroll on Mobile */}
      <div className="px-3 py-2 border-b border-bone-dark overflow-x-auto scrollbar-hide">
        <div className="flex gap-1 min-w-max">
          {(Object.entries(STAGE_LABELS) as [Stage, string][]).map(([stage, label]) => (
            <button
              key={stage}
              onClick={() => setSelectedStage(stage)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                selectedStage === stage
                  ? 'bg-terracotta text-white'
                  : 'bg-bone text-stone hover:bg-bone-dark hover:text-espresso'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Persona Selector */}
      <div className="px-3 py-2 border-b border-bone-dark">
        <div className="flex flex-wrap gap-2">
          {(Object.entries(PERSONA_LABELS) as [Persona, string][]).map(([persona, label]) => (
            <button
              key={persona}
              onClick={() => setSelectedPersona(persona)}
              className={`px-2.5 py-1 text-xs font-medium rounded-full border transition-colors ${
                selectedPersona === persona
                  ? PERSONA_COLORS[persona]
                  : 'bg-bone border-bone-dark text-stone hover:border-clay'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Stage Note */}
      <div className="px-4 py-2 bg-terracotta/5 border-b border-bone-dark">
        <p className="text-xs text-stone leading-relaxed">
          <span className="font-semibold text-terracotta">{STAGE_LABELS[selectedStage]}:</span>{' '}
          {STAGE_NOTES[selectedStage]}
        </p>
      </div>

      {/* Message Preview */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${PERSONA_COLORS[selectedPersona]}`}>
              {PERSONA_LABELS[selectedPersona]}
            </span>
            <span className="text-xs text-stone-light font-mono">
              {STAGE_LABELS[selectedStage]}
            </span>
          </div>
          <button
            onClick={() => handleCopy(selectedStage, selectedPersona)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex-shrink-0 ${
              copiedId === `${selectedStage}-${selectedPersona}`
                ? 'bg-green-500 text-white'
                : 'bg-terracotta text-white hover:bg-terracotta-bright'
            }`}
          >
            {copiedId === `${selectedStage}-${selectedPersona}` ? (
              <>
                <HiCheck className="text-sm" />
                Copied!
              </>
            ) : (
              <>
                <HiClipboard className="text-sm" />
                Copy
              </>
            )}
          </button>
        </div>

        {/* Message Text */}
        <div className="bg-bone rounded-lg border border-bone-dark p-3 max-h-[300px] overflow-y-auto">
          <pre className="text-sm text-espresso whitespace-pre-wrap leading-relaxed font-sans">
            {currentTemplate}
          </pre>
        </div>

        {/* Quick Tips */}
        {selectedStage === 'call' && (
          <p className="text-xs text-terracotta mt-2">
            Replace [date] with the scheduled call date.
          </p>
        )}
      </div>

      {/* All Messages Quick Access */}
      <details className="border-t border-bone-dark">
        <summary className="px-4 py-2 text-xs font-medium text-stone cursor-pointer hover:bg-bone/50">
          All {PERSONA_LABELS[selectedPersona]} messages
        </summary>
        <div className="px-4 pb-4 space-y-2">
          {(Object.entries(STAGE_LABELS) as [Stage, string][]).map(([stage, label]) => {
            if (stage === selectedStage) return null
            return (
              <div
                key={stage}
                className="flex items-center justify-between p-2 bg-bone rounded-lg border border-bone-dark"
              >
                <span className="text-xs font-medium text-espresso">{label}</span>
                <button
                  onClick={() => handleCopy(stage, selectedPersona)}
                  className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                    copiedId === `${stage}-${selectedPersona}`
                      ? 'bg-green-500 text-white'
                      : 'bg-terracotta/10 text-terracotta hover:bg-terracotta/20'
                  }`}
                >
                  {copiedId === `${stage}-${selectedPersona}` ? 'Copied!' : 'Copy'}
                </button>
              </div>
            )
          })}
        </div>
      </details>
    </div>
  )
}
