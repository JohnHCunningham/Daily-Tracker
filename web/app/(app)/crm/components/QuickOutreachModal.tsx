'use client'

import { useState, useEffect, useCallback } from 'react'
import { HiX, HiClipboard, HiCheck, HiExternalLink, HiStar, HiEye, HiCalendar } from 'react-icons/hi'
import toast from 'react-hot-toast'
import type { CRMLead } from '../page'

type Persona = 'sales-leadership' | 'enablement' | 'sandler-franchisee' | 'partner'
type Stage = 'connect' | 'observability' | 'free_analysis' | 'mirror' | 'breakup' | 'call'

interface QuickOutreachModalProps {
  lead: CRMLead
  onClose: () => void
  onAdvanced: (lead: CRMLead) => void
}

const MEETING_LINK = 'https://tidycal.com/aiautomations/execution-exploration'
const RESEARCH_LINK = 'https://www.oneclickcoaching.com/research.html'

// Subject lines for each stage and persona
const SUBJECT_LINES: Record<Stage, Record<Persona, string>> = {
  connect: {
    'sales-leadership': 'The gap between training and execution',
    'enablement': 'Knowing vs believing',
    'sandler-franchisee': 'After the training ends',
    'partner': 'When you leave the room',
  },
  observability: {
    'sales-leadership': 'Research: where your visibility breaks',
    'enablement': 'Research: delivered vs proven',
    'sandler-franchisee': 'Research: the renewal gap',
    'partner': 'Research: proving behavior change',
  },
  free_analysis: {
    'sales-leadership': 'Your score: [X]',
    'enablement': 'Delivered vs proven',
    'sandler-franchisee': 'What your clients would score',
    'partner': 'The gap that kills renewals',
  },
  mirror: {
    'sales-leadership': 'One question',
    'enablement': 'Would anyone know?',
    'sandler-franchisee': 'One introduction',
    'partner': 'Who else should see this',
  },
  breakup: {
    'sales-leadership': 'Wrong timing, problem, or person?',
    'enablement': 'Timing, problem, or person',
    'sandler-franchisee': 'Not the right time?',
    'partner': 'Wrong idea entirely?',
  },
  call: {
    'sales-leadership': 'Proof on the table',
    'enablement': 'Show, not tell',
    'sandler-franchisee': 'White-label pilot',
    'partner': 'Co-branded proof',
  },
}

const STAGE_PROGRESSION: Record<string, string> = {
  pending: 'request_sent',
  request_sent: 'observability',
  observability: 'free_analysis',
  free_analysis: 'mirror',
  mirror: 'breakup',
  breakup: 'call',
  call: 'call', // stays at call
}

const STAGE_LABELS: Record<string, string> = {
  pending: 'Pending',
  request_sent: 'Request Sent',
  observability: 'Observability',
  free_analysis: 'Free Analysis',
  mirror: 'Mirror',
  breakup: 'Breakup',
  call: 'Call',
}

const PERSONA_LABELS: Record<Persona, string> = {
  'sales-leadership': 'Sales Leadership',
  'enablement': 'Enablement',
  'sandler-franchisee': 'Sandler Franchisee',
  'partner': 'Partner / Trainer',
}

// Map CRM status to message stage
function getStageFromStatus(status: string | null): Stage {
  switch (status) {
    case 'pending':
    case 'request_sent':
      return 'connect'
    case 'observability':
      return 'observability'
    case 'free_analysis':
      return 'free_analysis'
    case 'mirror':
      return 'mirror'
    case 'breakup':
      return 'breakup'
    case 'call':
      return 'call'
    default:
      return 'connect'
  }
}

// Map CRM category to persona (ICP)
function getPersonaFromCategory(category: string | null): Persona {
  switch (category) {
    case 'VP':
    case 'Manager':
    case 'CRO':
      return 'sales-leadership'
    case 'Enablement':
      return 'enablement'
    case 'Sandler Franchisee':
    case 'Sandler User':
      return 'sandler-franchisee'
    case 'Sales Trainers':
    case 'Other':
    default:
      return 'partner'
  }
}

// Message templates from MessageTemplates.tsx
const TEMPLATES: Record<Stage, Record<Persona, string>> = {
  connect: {
    'sales-leadership': `How many of your reps ran the methodology on today's calls?

If the honest answer is "I'd have to check" — that's the gap I work on. Not activity. Not training. Execution.

Happy to send over what I'm finding.

— John`,
    'enablement': `One question: when's the last time you knew — not hoped, knew — that a rep ran the methodology on a live call?

Most enablement leaders can't answer. Not because training failed. Because there's no instrument for it.

I've been building one. If this is live for you, I'd like to compare notes.

— John`,
    'sandler-franchisee': `Your clients finish the training. Then nothing watches whether it stuck.

That's your renewal problem — you can't show the behavior change you sold.

I built a scoring layer for exactly that. I'd value your honest reaction more than a sale.

— John`,
    'partner': `You own the methodology. You don't own anything that runs when you're not in the room.

I've been building that layer — the thing that keeps coaching your client's reps after the workshop ends.

If that's interesting, I'd like to show you before I show anyone else.

— John`,
  },
  observability: {
    'sales-leadership': `Thanks for connecting.

You can measure what got trained. You can measure what got logged. But can you measure what actually got run?

I put together research on this — six questions, two minutes, you get a scored result that shows where your visibility breaks. No sales pitch. Just a diagnostic you can use whether we ever talk again.

Real research, not a lead magnet disguised as one.

Here's the link: https://www.oneclickcoaching.com/research.html

— John`,
    'enablement': `Thanks for connecting.

Training gets delivered. Behavior gets hoped for. Results get measured later.

I built research that shows exactly where that gap lives — six questions, self-scored, you get a result that names whether you're missing activity data, behavior data, or execution proof.

No pitch. Just a diagnostic. Use it whether we talk again or not.

Here's the link: https://www.oneclickcoaching.com/research.html

— John`,
    'sandler-franchisee': `Thanks for connecting.

Your clients finish the training. You invoice. Then nobody can prove it stuck.

I put together research that surfaces where that visibility breaks — for you and for your clients. Six questions, two minutes, you get a scored result that shows the gap before renewal time.

No sales hype. Real diagnostic you can use right now.

Here's the link: https://www.oneclickcoaching.com/research.html

— John`,
    'partner': `Thanks for connecting.

Trainers sell behavior change. Clients buy it. Nobody proves it happened.

I built research that names exactly where that break is — six questions, self-scored result shows whether the gap is in your visibility, their execution, or the measurement layer.

Real research, not lead bait. Use it whether we ever work together or not.

Here's the link: https://www.oneclickcoaching.com/research.html

— John`,
  },
  free_analysis: {
    'sales-leadership': `You scored a [X].

That number is the answer to a question nobody asks out loud: if a rep ran the methodology on a call today, would you actually know?

That's what I built — the thing that scores every call and shows you, in one line, whether it's happening. Not the CRM. Not a survey. The call itself.

Send me one real call. I'll send back what it sees.

— John`,
    'enablement': `You scored a [X].

That's not a judgment on your training. It's a measure of the gap between what got delivered and what anyone can prove happened.

I built the instrument that closes it — every call scored, so you can finally answer "did the training change anything" with a number instead of a guess.

Send me one call from the team. I'll send back what it sees.

— John`,
    'sandler-franchisee': `You scored a [X].

Your clients would score about the same — not because the training's bad, but because nothing watches after the workshop ends.

That's the layer I built. It scores every call against the eight Sandler components and coaches what's missing, with the manager approving before anything reaches a rep. White-label, so it runs under your brand.

Send me one call — yours or a client's, redacted. I'll send back what it sees.

— John`,
    'partner': `You scored a [X].

That's the gap between the methodology you teach and what anyone can prove a rep runs afterward. It's also the thing that kills your renewals — your clients can't see the change they paid for.

I built the layer that closes it. Every call scored, coaching drafted, running under your brand, not mine.

Send me one call. I'll send back what it sees.

— John`,
  },
  mirror: {
    'sales-leadership': `One question, then I'll leave you alone.

You can measure what got trained. You can measure what got logged. But can you measure what actually got run?

If you've got a way to check whether reps ran the methodology on today's calls — not logged it, ran it — I'd like to hear it. If you haven't, that's the gap I built for.

— John`,
    'enablement': `One question, then I'll stop.

If a rep ran the methodology perfectly on a call this morning, would anyone know? Not hope. Not assume. Know.

Training delivered is not training run. Hope is not measurement. That's the whole thing I built.

Send me one call and I'll show you rather than describe it.

— John`,
    'sandler-franchisee': `One ask, then I'll leave it.

Who else in your network should I be talking to? One or two people whose reaction you'd trust.

I'd rather have the introduction than the arrangement.

— John`,
    'partner': `One ask, then I'll leave it.

Who else in your network should I be talking to? One or two people whose reaction you'd trust.

I'd rather have the introduction than the arrangement.

— John`,
  },
  breakup: {
    'sales-leadership': `I've sent a few notes. Silence usually means one of three things: wrong timing, wrong problem, or wrong person.

If it's timing — say a quarter and I'll come back then.
If it's the wrong problem — I'd like to know what the right one is.
If it's the wrong person — who?

— John`,
    'enablement': `I've sent a few notes. Silence usually means one of three things: wrong timing, wrong problem, or wrong person.

If it's timing — say a quarter and I'll come back then.
If it's the wrong problem — I'd like to know what the right one is.
If it's the wrong person — who?

— John`,
    'sandler-franchisee': `I've sent a couple of notes. If it's not the right time, that's fine and I won't keep asking.

If it's the wrong idea entirely, I'd like to know why. You'd be doing me a favour.

— John`,
    'partner': `I've sent a couple of notes. If it's not the right time, that's fine and I won't keep asking.

If it's the wrong idea entirely, I'd like to know why. You'd be doing me a favour.

— John`,
  },
  call: {
    'sales-leadership': `Looking forward to [date].

Rather than another conversation about methodology, I'd like to put proof on the table — a pilot with your team.

You pick the reps. I score their calls for thirty days. Coaching drafted, manager approved, behavior tracked. At the end, you tell me what changed.

Proof, not promises. I'm not looking for an invoice. I'm looking for one reference who's seen it work.

— John`,
    'enablement': `Looking forward to [date].

Rather than talking about training impact, I'd like to show you training impact — a pilot with your team.

You pick the cohort. I score their calls for thirty days. Every behavior measured against what you taught. At the end, you can finally answer "did it work" with evidence, not hope.

I'm not looking for a sale. I'm looking for proof you can show leadership.

— John`,
    'sandler-franchisee': `Looking forward to [date].

Rather than pitching you, I'd like to prove it to one of your clients.

You pick the account. I run it white-label under your brand. Thirty days of their calls scored against the eight Sandler components, coaching drafted for their managers. At the end, you tell them what you saw.

Your brand. Your client relationship. Our scoring layer.

I'm not looking for an invoice. I'm looking for a renewal you can prove.

— John`,
    'partner': `Looking forward to [date].

Rather than another partnership conversation, I'd like to show you what partnership looks like — a pilot with one of your clients.

You pick the account. We run it co-branded. Thirty days of their calls scored against your methodology, coaching drafted for their team. At the end, you tell me whether it strengthened the relationship or weakened it.

Your methodology. Your brand. Our layer.

I'm not looking for a contract. I'm looking for a client you kept because of it.

— John`,
  },
}

export default function QuickOutreachModal({ lead, onClose, onAdvanced }: QuickOutreachModalProps) {
  const messageStage = getStageFromStatus(lead.status)
  const persona = getPersonaFromCategory(lead.category)
  const nextStage = STAGE_PROGRESSION[lead.status] || lead.status
  const isAtFinalStage = lead.status === 'call'

  const [selectedPersona, setSelectedPersona] = useState<Persona>(persona)
  const [copied, setCopied] = useState(false)
  const [subjectCopied, setSubjectCopied] = useState(false)
  const [advancing, setAdvancing] = useState(false)

  const currentMessage = TEMPLATES[messageStage][selectedPersona]
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

      // 2. Open LinkedIn in new tab
      if (lead.linkedin_url) {
        window.open(lead.linkedin_url, '_blank')
      }

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

      toast.success(`Copied! Moving to ${STAGE_LABELS[nextStage]}`)
      onAdvanced(updatedLead)
      onClose()
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to advance stage')
      setAdvancing(false)
    }
  }, [lead, currentMessage, nextStage, onAdvanced, onClose, advancing])

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
    if (lead.linkedin_url) {
      window.open(lead.linkedin_url, '_blank')
    } else {
      toast.error('No LinkedIn URL for this lead')
    }
  }, [lead.linkedin_url])

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
                <h2 className="font-bold text-lg text-espresso truncate">
                  {lead.first_name} {lead.last_name}
                </h2>
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
              Stage: {STAGE_LABELS[lead.status] || lead.status}
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
                  ? 'bg-green-500 text-white'
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
                  ? 'bg-green-500 text-white'
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
          {messageStage === 'observability' && (
            <div className="mt-3 p-3 bg-terracotta/5 rounded-lg border border-terracotta/20">
              <p className="text-xs text-stone-light mb-1.5">
                💡 <span className="font-medium text-stone">Value-first positioning:</span> Real research they can use immediately, no pitch required.
              </p>
              <a
                href={RESEARCH_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-terracotta hover:text-terracotta-bright font-medium inline-flex items-center gap-1"
              >
                Preview research page <HiExternalLink className="text-xs" />
              </a>
            </div>
          )}
          {messageStage === 'free_analysis' && (
            <p className="text-xs text-terracotta mt-2">
              Replace [X] with their score from the research test.
            </p>
          )}
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
                <span className="text-white/70">→ {STAGE_LABELS[nextStage]}</span>
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
          {(lead.status === 'mirror' || lead.status === 'breakup' || lead.status === 'call') && (
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
