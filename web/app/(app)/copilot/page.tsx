'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { HiLightningBolt, HiDocumentText, HiUserGroup, HiPhone, HiClipboardCheck } from 'react-icons/hi'

const STAGES = [
  'Discovery',
  'Qualification',
  'Demo / Presentation',
  'Proposal',
  'Negotiation',
  'Closing',
]

export default function CopilotPage() {
  const [prospect, setProspect] = useState('')
  const [company, setCompany] = useState('')
  const [stage, setStage] = useState('')
  const [concerns, setConcerns] = useState('')
  const [loading, setLoading] = useState(false)
  const [agenda, setAgenda] = useState<string | null>(null)
  const [methodology, setMethodology] = useState<string | null>(null)
  const [contextSources, setContextSources] = useState<Record<string, number> | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async () => {
    setLoading(true)
    setError(null)
    setAgenda(null)

    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      const res = await fetch('/api/copilot/prepare-call', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          prospect: prospect || undefined,
          company: company || undefined,
          stage: stage || undefined,
          concerns: concerns || undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate agenda')
      }

      setAgenda(data.agenda)
      setMethodology(data.methodology)
      setContextSources(data.contextSources)
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const hasContext = contextSources && (
    contextSources.notes > 0 ||
    contextSources.coaching > 0 ||
    contextSources.commitments > 0 ||
    contextSources.calls > 0
  )

  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      {/* Header */}
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-terracotta/10">
            <HiLightningBolt className="text-terracotta text-xl" />
          </div>
          <h1 className="text-2xl font-bold text-espresso">Call Preparation</h1>
        </div>
        <p className="text-stone text-base leading-relaxed max-w-xl">
          Generate a methodology-specific call agenda. Pulls in your notes, past calls, commitments, and coaching history to prepare you for what matters.
        </p>
      </div>

      {/* Form */}
      <div className="bg-white rounded-2xl border border-bone-dark/50 p-8 mb-10 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-semibold text-espresso mb-2">
              Prospect Name
            </label>
            <input
              type="text"
              value={prospect}
              onChange={(e) => setProspect(e.target.value)}
              placeholder="e.g. Sarah Chen"
              className="w-full rounded-xl border border-bone-dark bg-bone-light/30 px-4 py-3 text-espresso placeholder:text-stone-light focus:outline-none focus:border-terracotta/50 focus:ring-2 focus:ring-terracotta/10 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-espresso mb-2">
              Company
            </label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="e.g. Acme Corp"
              className="w-full rounded-xl border border-bone-dark bg-bone-light/30 px-4 py-3 text-espresso placeholder:text-stone-light focus:outline-none focus:border-terracotta/50 focus:ring-2 focus:ring-terracotta/10 transition-all"
            />
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-semibold text-espresso mb-2">
            Deal Stage
          </label>
          <div className="flex flex-wrap gap-2">
            {STAGES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStage(stage === s ? '' : s)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  stage === s
                    ? 'bg-terracotta text-white shadow-sm'
                    : 'bg-bone-light/50 text-stone hover:bg-bone-light border border-bone-dark/30'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-semibold text-espresso mb-2">
            Specific Concerns <span className="text-stone-light font-normal">(optional)</span>
          </label>
          <textarea
            value={concerns}
            onChange={(e) => setConcerns(e.target.value)}
            placeholder="e.g. They mentioned a competing solution. Last call went sideways on pricing. I need to re-establish trust."
            rows={3}
            className="w-full rounded-xl border border-bone-dark bg-bone-light/30 px-4 py-3 text-espresso placeholder:text-stone-light focus:outline-none focus:border-terracotta/50 focus:ring-2 focus:ring-terracotta/10 transition-all resize-none"
          />
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full md:w-auto inline-flex items-center justify-center gap-2 bg-terracotta text-white px-8 py-3.5 rounded-xl font-semibold hover:bg-terracotta-bright transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <HiLightningBolt className="text-lg" />
              Generate Call Agenda
            </>
          )}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-terracotta/5 border border-terracotta/20 rounded-2xl p-6 mb-10">
          <p className="text-terracotta text-sm">{error}</p>
        </div>
      )}

      {/* Result */}
      {agenda && (
        <div className="space-y-6">
          {/* Context Badge */}
          <div className="flex items-center gap-2 text-xs text-stone-light">
            <span className="font-semibold text-terracotta uppercase tracking-wider">
              {methodology} methodology
            </span>
            <span>·</span>
            {hasContext && (
              <>
                {contextSources!.calls > 0 && (
                  <span className="flex items-center gap-1">
                    <HiPhone className="text-xs" /> {contextSources!.calls} calls
                  </span>
                )}
                {contextSources!.notes > 0 && (
                  <span className="flex items-center gap-1">
                    <HiDocumentText className="text-xs" /> {contextSources!.notes} notes
                  </span>
                )}
                {contextSources!.coaching > 0 && (
                  <span className="flex items-center gap-1">
                    <HiUserGroup className="text-xs" /> {contextSources!.coaching} coaching
                  </span>
                )}
                {contextSources!.commitments > 0 && (
                  <span className="flex items-center gap-1">
                    <HiClipboardCheck className="text-xs" /> {contextSources!.commitments} commitments
                  </span>
                )}
              </>
            )}
          </div>

          {/* Agenda Card */}
          <div className="bg-white rounded-2xl border border-bone-dark/50 p-8 md:p-10 shadow-sm">
            <div
              className="prose prose-stone max-w-none
                prose-headings:text-espresso prose-headings:font-bold
                prose-h2:text-xl prose-h2:mt-10 prose-h2:mb-4 prose-h2:pb-2 prose-h2:border-b prose-h2:border-bone-dark/30
                prose-h3:text-lg prose-h3:mt-8 prose-h3:mb-3
                prose-p:text-stone prose-p:leading-relaxed
                prose-li:text-stone prose-li:leading-relaxed
                prose-strong:text-espresso
                prose-ul:my-4 prose-li:my-1
                [&_h2:first-of-type]:mt-0"
              dangerouslySetInnerHTML={{ __html: agenda
                .split('\n')
                .map(line => {
                  if (line.startsWith('## ')) return `<h2>${line.slice(3)}</h2>`
                  if (line.startsWith('### ')) return `<h3>${line.slice(4)}</h3>`
                  if (line.startsWith('- ')) return `<li>${line.slice(2)}</li>`
                  if (line.trim() === '') return '<br/>'
                  return `<p>${line}</p>`
                })
                .join('')
                .replace(/(<li>.*?<\/li>)+/g, '<ul>$&</ul>')
              }}
            />
          </div>
        </div>
      )}

      {/* Empty state */}
      {!agenda && !loading && (
        <div className="text-center py-20">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-bone-light/50 mx-auto mb-6">
            <HiLightningBolt className="text-stone-light text-2xl" />
          </div>
          <h2 className="text-lg font-bold text-espresso mb-2">Ready to prepare</h2>
          <p className="text-stone-light text-sm max-w-md mx-auto leading-relaxed">
            Fill in what you know about the upcoming call. The more context you provide, the sharper the agenda.
          </p>
        </div>
      )}
    </div>
  )
}
