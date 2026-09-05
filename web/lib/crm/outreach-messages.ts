// Shared outreach messaging — single source of truth for CRM message templates.
// Both MessageTemplates.tsx (Quick Copy panel) and QuickOutreachModal.tsx import from here,
// so the copy can never drift between the two again.

export type Persona = 'sales-leadership' | 'enablement' | 'sandler-franchisee' | 'partner'
export type Stage = 'connect' | 'observability' | 'mirror' | 'free_analysis' | 'call' | 'breakup'

export const MEETING_LINK = 'https://tidycal.com/aiautomations/execution-exploration'
export const RESEARCH_LINK = 'https://www.oneclickcoaching.com/research.html'

export const PERSONA_LABELS: Record<Persona, string> = {
  'sales-leadership': 'Sales Leadership',
  'enablement': 'Enablement',
  'sandler-franchisee': 'Sandler Franchisee',
  'partner': 'Partner / Trainer',
}

// Message-stage display order — matches the corrected pipeline order
// (pending/request_sent → connect, then observability → mirror → free_analysis → call → breakup).
export const STAGE_LABELS: Record<Stage, string> = {
  connect: 'Connect',
  observability: 'Observability',
  mirror: 'Mirror',
  free_analysis: 'Free Analysis',
  call: 'Call',
  breakup: 'Breakup',
}

export const STAGE_NOTES: Record<Stage, string> = {
  connect: 'Connection request (2nd°) or InMail (3rd°). Before acceptance. Introduce the premise. Never pitch the product.',
  observability: 'First DM after they accept. Opens with "Thanks for connecting," offers the six-question test. OCC is never named here.',
  mirror: 'The nudge. Dissonance for direct track, referral ask for partner track.',
  free_analysis: 'The reveal. They\'ve taken the test. This is where OCC gets named. End with "send me one call." Replace [X] with their score.',
  call: 'Pre-call agenda note, sent before a discovery call.',
  breakup: 'Final send. Clean close, leave the door open.',
}

// CRM status → display label (used for the stage badge in the modal)
export const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  request_sent: 'Request Sent',
  observability: 'Observability',
  mirror: 'Mirror',
  free_analysis: 'Free Analysis',
  call: 'Call',
  breakup: 'Breakup',
}

// Advance-stage progression. "breakup" is terminal.
export const STAGE_PROGRESSION: Record<string, string> = {
  pending: 'request_sent',
  request_sent: 'observability',
  observability: 'mirror',
  mirror: 'free_analysis',
  free_analysis: 'call',
  call: 'breakup',
  breakup: 'breakup',
}

export const SUBJECT_LINES: Record<Stage, Record<Persona, string>> = {
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
  mirror: {
    'sales-leadership': 'One question',
    'enablement': 'Would anyone know?',
    'sandler-franchisee': 'One introduction',
    'partner': 'Who else should see this',
  },
  free_analysis: {
    'sales-leadership': 'Your score: [X]',
    'enablement': 'Delivered vs proven',
    'sandler-franchisee': 'What your clients would score',
    'partner': 'The gap that kills renewals',
  },
  call: {
    'sales-leadership': 'Proof on the table',
    'enablement': 'Show, not tell',
    'sandler-franchisee': 'White-label pilot',
    'partner': 'Co-branded proof',
  },
  breakup: {
    'sales-leadership': 'Wrong timing, problem, or person?',
    'enablement': 'Timing, problem, or person',
    'sandler-franchisee': 'Not the right time?',
    'partner': 'Wrong idea entirely?',
  },
}

export const TEMPLATES: Record<Stage, Record<Persona, string>> = {
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
}

// Map CRM status to message stage
export function getStageFromStatus(status: string | null): Stage {
  switch (status) {
    case 'pending':
    case 'request_sent':
      return 'connect'
    case 'observability':
      return 'observability'
    case 'mirror':
      return 'mirror'
    case 'free_analysis':
      return 'free_analysis'
    case 'call':
      return 'call'
    case 'breakup':
      return 'breakup'
    default:
      return 'connect'
  }
}

// Map CRM category to persona (ICP)
export function getPersonaFromCategory(category: string | null): Persona {
  switch (category) {
    case 'VP':
    case 'Manager':
    case 'CRO':
    case 'Sandler User': // a Sandler User is a prospect using Sandler, not a franchisee
      return 'sales-leadership'
    case 'Enablement':
      return 'enablement'
    case 'Sandler Franchisee':
      return 'sandler-franchisee'
    case 'Sales Trainers':
    case 'Other':
    default:
      return 'partner'
  }
}
