'use client'

import { useState, useEffect } from 'react'
import { HiClipboard, HiCheck, HiExternalLink } from 'react-icons/hi'
import toast from 'react-hot-toast'

type Persona = 'sales-leadership' | 'enablement' | 'sandler-franchisee' | 'partner'
type Stage = 'connect' | 'observability' | 'free_analysis' | 'mirror' | 'breakup' | 'call'

interface MessageTemplatesProps {
  category?: string | null
  currentStage?: string | null
  firstName?: string
}

const PERSONA_LABELS: Record<Persona, string> = {
  'sales-leadership': 'Sales Leadership',
  'enablement': 'Enablement',
  'sandler-franchisee': 'Sandler Franchisee',
  'partner': 'Partner / Trainer',
}

const PERSONA_COLORS: Record<Persona, string> = {
  'sales-leadership': 'bg-terracotta/15 text-terracotta border-terracotta/30',
  'enablement': 'bg-green-100 text-green-700 border-green-300',
  'sandler-franchisee': 'bg-blue-100 text-blue-700 border-blue-300',
  'partner': 'bg-clay/20 text-espresso border-clay',
}

const STAGE_LABELS: Record<Stage, string> = {
  connect: 'Connect',
  observability: 'Observability',
  mirror: 'Mirror',
  free_analysis: 'Free Analysis',
  call: 'Call',
  breakup: 'Breakup',
}

const STAGE_NOTES: Record<Stage, string> = {
  connect: 'Connection request (2nd°) or InMail (3rd°). Before acceptance. Introduce the premise. Never pitch the product.',
  observability: 'First DM after they accept. Opens with "Thanks for connecting," offers the six-question test. OCC is never named here.',
  free_analysis: 'The reveal. They\'ve taken the test. This is where OCC gets named. End with "send me one call." Replace [X] with their score.',
  mirror: 'The nudge. Dissonance for direct track, referral ask for partner track.',
  breakup: 'Final send. Clean close, leave the door open.',
  call: 'Pre-call agenda note, sent before a discovery call.',
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

// Map CRM category to persona
function getPersonaFromCategory(category: string | null): Persona {
  switch (category) {
    case 'VP':
    case 'Manager':
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

// Message templates - polished from occ-quick-copy.html
const TEMPLATES: Record<Stage, Record<Persona, string>> = {
  connect: {
    'sales-leadership': `How many calls did your reps run today?

If the honest answer is "I'd have to check" — that's the gap I work on. Not activity for its own sake, but whether the methodology you paid for is actually being run.

Happy to send over what I'm finding.

— John`,
    'enablement': `I'm asking enablement leaders one question: can you point to the last time you knew — not believed — that a rep ran the methodology on a live call?

Most can't. Not a failing. There's no instrument for it.

I've been building one. If it's live for you, I'd like to compare notes.

— John`,
    'sandler-franchisee': `Your clients finish the training. Then nothing watches whether it stuck.

That's your renewal problem more than theirs — you can't show the behavior change you sold.

I built a scoring layer for exactly that. I'd value your honest reaction more than a sale.

— John`,
    'partner': `You own the methodology. You don't own anything that runs when you're not in the room.

I've been building that layer — the thing that keeps coaching your client's reps after the workshop ends.

If that's interesting, I'd like to show you before I show anyone else.

— John`,
  },
  observability: {
    'sales-leadership': `Thanks for connecting.

Here's the thing I keep finding: most sales leaders can name the methodology they bought, but can't say how many calls their reps ran this week without opening a report — and the report shows what's logged, not what happened.

I put together a six-question test that shows you where your visibility actually breaks. Two minutes, self-scored, nobody sees it but you.

Want the link?

— John`,
    'enablement': `Thanks for connecting.

You probably see it too: training gets delivered, and then nobody can say whether it changed anything on calls.

I put together a six-question test that shows a team exactly where that gap lives — activity, behavior, or methodology. Two minutes, self-scored, nobody sees it but you.

Want the link?

— John`,
    'sandler-franchisee': `Thanks for connecting.

Short version: your clients finish the training, and then you've got no way to prove it stuck. That's a renewal problem — and it's yours more than theirs.

I built a six-question test that surfaces where the visibility actually breaks. Two minutes, self-scored.

Want the link?

— John`,
    'partner': `Thanks for connecting.

Here's the gap I keep running into: trainers sell behavior change, but nobody can show it happened once the workshop ends.

I put together a six-question test that names where the break actually is — for you and for your clients. Two minutes, self-scored, nobody sees it but you.

Want the link?

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

How do you check? Not whether the training is working — whether any rep actually ran it on a call today.

If you've got a way, I'd like to hear it. If you haven't, that's the gap I built for.

— John`,
    'enablement': `One question, then I'll stop.

If a rep ran the methodology perfectly on a call this morning, would anyone — including you — know?

That's the whole thing I built. Send me one call and I'll show you rather than describe it.

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

export default function MessageTemplates({ category, currentStage, firstName }: MessageTemplatesProps) {
  const defaultStage = getStageFromStatus(currentStage || null)
  const defaultPersona = getPersonaFromCategory(category || null)

  const [selectedStage, setSelectedStage] = useState<Stage>(defaultStage)
  const [selectedPersona, setSelectedPersona] = useState<Persona>(defaultPersona)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Update when props change
  useEffect(() => {
    setSelectedStage(getStageFromStatus(currentStage || null))
    setSelectedPersona(getPersonaFromCategory(category || null))
  }, [currentStage, category])

  const handleCopy = (stage: Stage, persona: Persona) => {
    const template = TEMPLATES[stage][persona]
    if (!template) return

    // Replace placeholders
    let text = template
    if (firstName) {
      text = text.replace(/\[Name\]/g, firstName)
    }

    navigator.clipboard.writeText(text)
    setCopiedId(`${stage}-${persona}`)
    toast.success('Copied to clipboard')

    setTimeout(() => setCopiedId(null), 2000)
  }

  const currentTemplate = TEMPLATES[selectedStage][selectedPersona]

  return (
    <div className="bg-bone-light rounded-xl border border-bone-dark shadow-card">
      {/* Header */}
      <div className="px-3 sm:px-4 py-3 border-b border-bone-dark bg-bone/50">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-semibold text-espresso">Quick Copy</h3>
          <a
            href="https://oneclickcoaching.com/research"
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
        {selectedStage === 'free_analysis' && (
          <p className="text-xs text-terracotta mt-2">
            Replace [X] with their actual score from the research test.
          </p>
        )}
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
