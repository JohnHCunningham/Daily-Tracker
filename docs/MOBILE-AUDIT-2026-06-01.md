# OCC App Mobile Responsiveness Audit

**Date:** June 1, 2026
**Auditor:** Hermes (occ-product-operator)
**Scope:** All 23 page.tsx files across authenticated and auth route groups

---

## Summary

The app's pages are already built with responsive Tailwind breakpoints. There are 348 responsive class usages (`md:`, `lg:`, `sm:`) across the codebase. The critical, singular blocker is the sidebar — it's hardcoded at 240px with no mobile hide/show mechanism.

**Estimated fix: ~5 hours (1 day).** Three files need changes: `Sidebar.tsx`, `TopBar.tsx`, `layout.tsx`.

---

## Pages Found (23)

### Authenticated Routes (`app/(app)/`)
| Route | Page | Mobile-Ready? |
|-------|------|---------------|
| `/dashboard` | Dashboard (leader + rep views) | ✅ Grids responsive, blocked by sidebar |
| `/copilot` | Call Prep / AI Copilot | ✅ `max-w-3xl`, `md:grid-cols-2` |
| `/settings` | Account, Billing, Branding | ✅ `max-w-2xl`, billing table `overflow-x-auto` |
| `/coaching` | Coaching Messages | ✅ Card/list layout |
| `/calls` | Call List | ✅ Card layout |
| `/calls/[callId]` | Call Detail | ✅ |
| `/team` | Team Management | ✅ `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` |
| `/team/[memberId]` | Team Member Detail | ✅ |
| `/team/invite` | Invite Flow | ✅ |
| `/goals` | Goals & Targets | ✅ |
| `/notes` | 1-on-1 Notes (two-panel chat) | ✅ `lg:grid-cols-[280px_1fr]` stacks on mobile |
| `/celebrations` | Wins/Celebrations | ✅ |
| `/reports` | Reports + data table | ✅ `overflow-x-auto` on table |
| `/integrations` | Integrations Hub | ✅ |
| `/integrations/fathom` | Fathom Setup | ✅ |
| `/integrations/hubspot` | HubSpot Setup | ✅ |
| `/support` | Support | ✅ |

### Auth Routes (`app/(auth)/`)
- login, signup, forgot-password, reset-password, accept-invite
- These are simple forms — already centered and responsive

### Public
- `/` landing page — already handled by separate Tailwind marketing build

---

## Tailwind Configuration

`tailwind.config.js` uses default breakpoints:
- `sm`: 640px, `md`: 768px, `lg`: 1024px, `xl`: 1280px, `2xl`: 1536px

No custom screens defined.

---

## Critical Issues

### 1. No Hamburger Menu / Sidebar Toggle (CRITICAL)

**`app/(app)/layout.tsx` (lines 66-67):**
```jsx
<div className="min-h-screen bg-gradient-to-br from-bone-light via-white to-bone flex">
  <Sidebar userRole={userRole} />   {/* ALWAYS visible, w-60 */}
  <div className="flex-1 flex flex-col min-h-screen">
    <TopBar ... />
```

- Sidebar is always rendered with fixed `w-60` (240px)
- No responsive classes to hide it on mobile
- No toggle state management
- On a 375px iPhone: content gets ~135px

**`app/(app)/components/Sidebar.tsx` (line 49):**
```jsx
<aside className="w-60 bg-gradient-to-b from-bone-light to-bone border-r border-bone-dark flex flex-col">
```
- `w-60` has NO responsive variants (`hidden lg:block`, `fixed`, `z-50`, `transition-transform`)
- No `useState` for isOpen
- No transform for slide-in/slide-out animation
- No close button for mobile view

### 2. TopBar Left Slot is Empty (CRITICAL)

**`app/(app)/components/TopBar.tsx` (line 26-27):**
```jsx
<header className="h-16 bg-white/80 backdrop-blur-sm border-b border-clay/20 flex items-center justify-between px-6 shadow-sm">
  <div />   {/* EMPTY — this is the hamburger slot */}
```
- The left `<div />` is a perfect placeholder for a hamburger button
- No `lg:hidden` icon (should import `HiMenu` / `HiX` from react-icons)

### 3. No Mobile Overlay/Backdrop (HIGH)

- When sidebar opens on mobile, there should be a semi-transparent backdrop
- Clicking backdrop should close sidebar
- Needs to be created as part of the toggle implementation

---

## Page-by-Page Responsiveness

### Dashboard (`dashboard/page.tsx`)
**Leader view:** Good grids
- `grid-cols-2 md:grid-cols-3` — KPI radials ✅
- `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` — team member cards ✅
- `grid-cols-1 lg:grid-cols-3` — methodology/coaching/attention ✅
- `flex-col md:flex-row` — billing card ✅

**Rep view:** Similarly good
- `grid-cols-2 lg:grid-cols-4` — pipeline radials ✅
- `grid-cols-1 lg:grid-cols-2` — coaching + breakdown ✅

**Verdict:** Already responsive. Only blocked by sidebar.

### Copilot (`copilot/page.tsx`)
- `max-w-3xl mx-auto` — natural centering ✅
- `grid-cols-1 md:grid-cols-2` — form fields ✅
- `w-full md:w-auto` — submit button ✅
- `p-8 md:p-10` — result card ✅
- No tables, no fixed widths over 100% ✅

**Verdict:** Well-built for mobile.

### Settings (`settings/page.tsx`)
- `max-w-2xl` container ✅
- `grid grid-cols-2` for brand colors — stacks okay ✅
- Billing history table: `overflow-x-auto` ✅
- Rep counter controls inline, wraps reasonably ✅

**Verdict:** Functional on mobile.

### Notes (`notes/page.tsx`)
- `grid-cols-1 lg:grid-cols-[280px_1fr]` — stacks on mobile ✅
- Messages use `max-w-[75%]` ✅
- Minor UX: member list above chat requires scrolling to see messages. A back-button pattern would improve navigation.

**Verdict:** Acceptable. Low-priority polish needed.

### Reports (`reports/page.tsx`)
- `overflow-x-auto` around data tables ✅
- Rep performance matrix (6 columns) scrolls horizontally — correct behavior ✅

**Verdict:** Correctly handled.

### Remaining Pages
Calls, Team, Coaching, Goals, Celebrations, Integrations — all use card/list layouts. No fixed-width tables. Team page uses `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`.

**Verdict:** Fine on mobile once sidebar is hidden.

---

## Estimated Fix Implementation

| Task | Hours | Files |
|------|-------|-------|
| Add `useState(isSidebarOpen)` + hamburger button to TopBar | 0.5 | `TopBar.tsx` |
| Add responsive classes to Sidebar: `hidden lg:flex fixed z-50 transition-transform` | 1.0 | `Sidebar.tsx` |
| Add overlay/backdrop for mobile | 0.5 | `layout.tsx` or new component |
| Wire toggle state through layout | 0.5 | `layout.tsx` |
| Test all 17 pages at mobile viewport | 1.5 | All pages |
| Polish: responsive padding, font tweaks, notes back-button | 1.0 | Various |
| **TOTAL** | **~5 hours** | |

---

## Key Files

| File | Role |
|------|------|
| `web/app/(app)/layout.tsx` | Root layout — sidebar + topbar + content |
| `web/app/(app)/components/Sidebar.tsx` | Sidebar nav — needs mobile toggle |
| `web/app/(app)/components/TopBar.tsx` | Top bar — needs hamburger button |
| `web/tailwind.config.js` | Breakpoints — using defaults |
| `web/app/globals.css` | Global styles — no mobile issues |

---

## The Bottom Line

The marketing site needed 11 pages completely rebuilt from raw HTML/CSS. The app needs a hamburger button, a toggle state, and three files edited. Every other page uses Tailwind responsive classes correctly. The sidebar is the only thing between the app and mobile readiness.
