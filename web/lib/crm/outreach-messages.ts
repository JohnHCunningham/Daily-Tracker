// Shared outreach messaging — single source of truth for CRM message templates.
// Both MessageTemplates.tsx (Quick Copy panel) and QuickOutreachModal.tsx import from here,
// so the copy can never drift between the two again.
//
// v2 (loaded 2026-09-06): rewritten to fix the leak between accept and conversation.
// Stage 2 delivers one real finding inline (no gated link), Stage 4 works without a
// quiz score, the referral ask moved out of Stage 3, and every message ends on
// something answerable.

export type Persona = 'sales-leadership' | 'enablement' | 'sandler-franchisee' | 'partner'
export type Stage = 'connect' | 'observability' | 'mirror' | 'free_analysis' | 'call' | 'breakup'

export const MEETING_LINK = 'https://tidycal.com/aiautomations/execution-exploration'
export const RESEARCH_LINK = 'https://www.oneclickcoaching.com/research.html'

// Build a LinkedIn people-search URL from a lead name. Used as a fallback when a
// lead has no stored linkedin_url, so John can jump straight to the search instead
// of copying the name and searching LinkedIn manually.
export function linkedinSearchUrl(firstName: string | null, lastName: string | null): string {
  const query = `${firstName ?? ''} ${lastName ?? ''}`.trim()
  return `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(query)}`
}

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
  connect: 'Connection request (2nd°) or InMail (3rd°). Earn the accept — nothing else. No pitch, no link, no ask.',
  observability: 'First DM after they accept. Give one real finding, no link. End on a question. OCC never named.',
  mirror: 'The nudge. Show them their own situation, give them an easy exit.',
  free_analysis: 'The concrete offer — send me one call. Works whether or not they touched the research page.',
  call: 'Pre-call agenda note. Do not price, do not give away a pilot in writing.',
  breakup: 'Final send. Three reasons — timing, problem, person. Clean close, leave the door open.',
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
    'sales-leadership': `Most VPs I ask can't say how many of their reps ran the methodology on today's calls. Not a criticism — nobody hears 40 calls a week. That's the problem I work on. Would like to connect.`,
    'enablement': `You can prove reps completed the training. Proving they run it on a live call is the harder half. That's the gap I work on. Would like to connect.`,
    'sandler-franchisee': `You teach it, then a client says it didn't stick and there's no data to argue with. I've been building a way to measure whether Sandler actually gets run after the training ends. Worth connecting?`,
    'partner': `Every trainer I talk to has the same renewal problem — no evidence the method is being run 90 days later. I've been building the measurement layer for it. Would like to connect.`,
  },
  observability: {
    'sales-leadership': `Thanks for connecting, [First].

One finding I keep coming back to: Dahling et al. studied sales teams and found coaching frequency only improved quota attainment where the manager's coaching skill was already high. Where it was low, more coaching made performance worse.

Which lands differently when most managers are working off four calls a week out of forty.

Curious how it works at [Company] — do your managers pick which calls to review, or is it whatever's top of mind that week?

— John`,
    'enablement': `Thanks for connecting, [First].

Kluger and DeNisi meta-analysed feedback interventions and found more than a third of them made performance worse. Feedback isn't automatically useful — it has to be anchored to something specific the person actually did.

Which is the part I think enablement gets blamed for unfairly. You can prove completion. Nobody's handed you an instrument for execution.

What are you using right now to tell whether a rep ran the framework on a live call?

— John`,
    'sandler-franchisee': `Thanks for connecting, [First].

Cepeda's meta-analysis on the spacing effect is the one that stuck with me — distributed practice beats a single session, and the gap is wider than most people assume.

Which is the argument for reinforcement. Except nearly every reinforcement program I've looked at measures attendance rather than whether the method actually gets run.

How do you handle the 90 days after an engagement wraps?

— John`,
    'partner': `Thanks for connecting, [First].

The finding I keep returning to: Kluger and DeNisi found over a third of feedback interventions made performance worse. Feedback has to be anchored to specific behaviour or it does damage.

Which is awkward for our side of the industry, because "be more consultative" is the most common coaching note in existence and it's anchored to nothing.

When a client tells you it didn't stick, what do you say?

— John`,
  },
  mirror: {
    'sales-leadership': `[First] — no reply needed if this isn't live for you.

A nine-rep team runs roughly 360 calls a quarter. A manager hears maybe 50. So 310 conversations happen with no record beyond a CRM note written by the person being coached.

That's not a discipline problem, it's arithmetic. Nobody coaches their way out of it.

If you've solved it, I'd like to know how. If you haven't, that's the thing I built for.

— John`,
    'enablement': `[First] — last one on this, then I'll leave it.

The pattern I keep running into: enablement gets measured on delivery — sessions run, completion, certifications — and then gets held responsible for adoption, which nobody gave you the tools to see.

If a rep ran your framework perfectly this morning, would anything in your stack tell you?

If yes, I'd like to hear what you're using. If no, that's the gap.

— John`,
    'sandler-franchisee': `[First] — one thought, then I'll leave it.

The renewal conversation I hear about most: the client says it didn't really stick, and the honest answer is that it's an execution problem on their side. True, and it never lands well.

The version that does land is a number. 31% before, 78% ninety days later.

Is that worth twenty minutes, or is reinforcement not really a line you sell?

— John`,
    'partner': `[First] — one thought, then I'll leave it.

Most reinforcement programs measure attendance. Which means at renewal you can say "your reps attended four sessions" and you can't say "your reps run the framework in 78% of discovery calls, up from 31%."

The second sentence is worth money. The first one isn't.

Is measurement something you've tried to solve, or has it not been worth the effort?

— John`,
  },
  free_analysis: {
    'sales-leadership': `[First] — something concrete instead of another message.

Send me one recorded discovery call from your team. I'll score it against whatever methodology you run and send back the annotated transcript: the moments where the rep drifted, quoted with timestamps, and the play I'd have their manager send before the next call.

One day's turnaround, no cost, and your reps don't need to know it happened.

If it's useless you'll know in five minutes and I'll stop. If it isn't, you'll have seen what your managers are missing on the other 39 calls this week.

Want to send one?

— John`,
    'enablement': `[First] — here's something concrete rather than another note.

Send me one call from a rep who's been through your program. I'll score it against your framework and send back the annotated transcript: which components landed, which didn't, and where the drift starts.

A day, no cost, no rep involvement.

Worst case you learn nothing and I go away. Best case it's your first piece of adoption evidence that isn't a survey.

Want to try one?

— John`,
    'sandler-franchisee': `[First] — a concrete offer rather than another message.

Send me one call. Yours, or a client's with names redacted. I'll score it against the Sandler components — upfront contract, pain funnel, budget, decision — and send back the annotated transcript with the coaching I'd draft for their manager.

A day's turnaround, no cost, and nothing carries my name unless you want it to.

If the output's useful we can talk about what it looks like running under your brand after an engagement. If it isn't, you've lost twenty minutes.

Want to send one?

— John`,
    'partner': `[First] — something concrete instead of another note.

Send me one call from a client team you've trained. I'll score it against your methodology and send back the annotated transcript: what got run, what got skipped, and the coaching note I'd draft for their manager.

A day, no cost, white-labelled if you'd rather it look like yours.

That's the whole artifact. If it's not useful you'll know immediately and I'll leave you alone.

Want to send one?

— John`,
  },
  call: {
    'sales-leadership': `Looking forward to [date], [First].

So we don't waste it, here's what I'd like to cover — tell me if you'd change it.

How coaching works on your team today and where it breaks down. Then one scored call, about five minutes, so you're reacting to something real rather than a description. Then we decide whether there's a next step.

Three endings are all fine: not for you, right idea wrong quarter, or we pick a starting point.

If there's a specific rep or deal stage you want me to look at, send it ahead and I'll come prepared.

— John`,
    'enablement': `Looking forward to [date], [First].

Quick agenda so we use it well — push back if you'd change it.

How adoption gets measured today and where that falls apart. Then one scored call, five minutes, so you're looking at something concrete. Then we decide if there's a next step.

"Not now" and "wrong problem" are both perfectly good outcomes.

If you can send one call ahead of time I'll score it and we'll spend the call on your data instead of my demo.

— John`,
    'sandler-franchisee': `Looking forward to [date], [First].

Upfront contract, since you'd do the same to me.

I want to understand how you handle the 90 days after an engagement ends and where that gets hard. I'll show you one scored call, five minutes. At the end, three outcomes all work: not for you, right idea wrong timing, or we pick one client and I show you what it does on their actual calls.

I'm not going to pitch you a subscription on a first call.

One thing that'd help me prepare: when does your next engagement start or wrap?

— John`,
    'partner': `Looking forward to [date], [First].

Agenda, so you can redirect it.

How you handle reinforcement now, what the renewal conversation sounds like, and where the evidence gap costs you. Then one scored call, five minutes. Then we decide whether there's anything here.

I'd rather find out it's not a fit on this call than three calls from now.

Useful to know ahead of time: when does your next client engagement land?

— John`,
  },
  breakup: {
    'sales-leadership': `[First] — I'll stop here.

Silence usually means one of three things, and any of them is a fine answer.

Wrong timing — name a quarter and I'll come back then, nothing in between.
Wrong problem — I'd like to know what the real one is.
Wrong person — who should I be talking to?

And if it's none of those and you're just busy, no reply needed and no hard feelings.

— John`,
    'enablement': `[First] — closing the loop, then I'll leave you alone.

Three possibilities, all fine.

Wrong timing — tell me a quarter and I'll come back then.
Wrong problem — what's the one actually on your list?
Wrong person — point me at them and I'll stop bothering you.

If none of those fit, no reply needed.

— John`,
    'sandler-franchisee': `[First] — last note, and I mean it.

If the timing's off, tell me roughly when your next engagement lands and I'll come back then rather than checking in every few weeks.

If the idea's wrong, I'd take one honest sentence on why over a polite no. You'd be doing me a real favour — I'd rather find out now than after another twenty of these conversations.

Either way, thanks for the connection.

— John`,
    'partner': `[First] — I'll leave it here.

If it's timing, tell me when your next engagement starts and I'll come back then.

If it's the idea, I'd rather have one honest sentence about why than a polite no. Genuinely useful to me at this stage.

And if I've misread what you do entirely, that's worth knowing too.

Thanks either way.

— John`,
  },
}

// Fill [First] and [Company] placeholders from a lead record, so John pastes a
// personalized message instead of "Thanks for connecting, [First]". [date] is
// left untouched — it's the scheduled call date, which only John knows.
export function personalizeTemplate(
  message: string,
  lead: { first_name: string | null; company: string | null }
): string {
  const first = lead.first_name ?? ''
  const company = lead.company ?? 'your company'
  return message
    .replace(/\[First\]/g, first)
    .replace(/\[Company\]/g, company)
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

// Title keywords are the cleanest, most specific signal. The category column is
// ~39% dirty from a botched import (degree + InMail + date data merged in), AND
// even some "clean" categories (e.g. "Enablement") contain mis-assigned VP-Sales
// people. So: title first, category only as a fallback for empty/ambiguous titles
// and for the Sandler Franchisee distinction (franchise owners often have titles
// like "President" that never say "Sandler").
function isSalesLeadershipTitle(t: string): boolean {
  return (
    t.includes('vice president') ||
    /\bvp\b/.test(t) || t.includes('svp') || t.includes('evp') || t.includes('rvp') ||
    t.includes('head of sales') ||
    t.includes('chief revenue') || /\bcro\b/.test(t) ||
    t.includes('sales director') || t.includes('director of sales') ||
    t.includes('sales manager') || t.includes('manager of sales') ||
    t.includes('sales leader') || t.includes('sales lead') ||
    t.includes('global sales') || t.includes('enterprise sales')
  )
}

export function getPersonaFromTitle(title: string | null): Persona {
  const t = (title || '').toLowerCase()
  if (!t) return 'partner'
  if (t.includes('enablement')) return 'enablement'
  if (t.includes('sandler')) return 'sandler-franchisee'
  return isSalesLeadershipTitle(t) ? 'sales-leadership' : 'partner'
}

// Primary persona resolver — title first, category fallback.
export function getPersonaFromLead(title: string | null, category: string | null): Persona {
  const t = (title || '').toLowerCase()
  if (t.includes('enablement')) return 'enablement'
  if (t.includes('sandler')) return 'sandler-franchisee'
  if (isSalesLeadershipTitle(t)) return 'sales-leadership'
  // Category fallback (only reached when the title gave no clear signal).
  if (category === 'Sandler Franchisee') return 'sandler-franchisee'
  if (category === 'Enablement') return 'enablement'
  if (category && ['VP', 'Manager', 'CRO', 'Sandler User'].includes(category)) return 'sales-leadership'
  return 'partner'
}
