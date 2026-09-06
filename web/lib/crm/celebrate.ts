// Celebration + gamification utilities for the CRM.
// Used to reward John for advancing leads and hitting milestones.
// Kept in lib/ so both the modal and the lead-detail page share one source.
import confetti from 'canvas-confetti'

// Round numbers that trigger a milestone celebration.
export const MILESTONES = [5, 10, 25, 50, 100, 200, 500, 1000]

export function isMilestone(n: number): boolean {
  return MILESTONES.includes(n)
}

// Party-hat + encouragement copy for a milestone count.
export function milestoneMessage(n: number): string {
  const lines: Record<number, string> = {
    5: "5 moved today! 🎉 You're rolling.",
    10: '10 moved today! 🎊 Double digits — keep pushing.',
    25: "25 moved today! 🥳 That's a real day of work.",
    50: '50 moved today! 🎉🎉 Half a century. Outstanding.',
    100: "100 moved today! 🏆 You're a machine.",
    200: '200 moved today! 🚀 Absolutely crushing it.',
    500: '500 moved today! 👑 Legendary.',
    1000: '1000 moved today! 🏆🏆 The whole board. Wow.',
  }
  return lines[n] ?? `${n} moved today! 🎉 Keep going!`
}

// Brand palette (terracotta/clay/espresso — matches the CRM light theme).
const COLORS = ['#B5583E', '#D4633E', '#E87456', '#C9A687', '#D4B89A', '#2A221C']

// Fire a confetti burst. `big=true` for milestone celebrations.
export function fireConfetti(big = false): void {
  if (big) {
    // Milestone: side cannons firing for ~1.2s + a center burst.
    const end = Date.now() + 1200
    ;(function frame() {
      confetti({ particleCount: 3, angle: 60, spread: 60, origin: { x: 0, y: 0.7 }, colors: COLORS })
      confetti({ particleCount: 3, angle: 120, spread: 60, origin: { x: 1, y: 0.7 }, colors: COLORS })
      if (Date.now() < end) requestAnimationFrame(frame)
    })()
    confetti({ particleCount: 140, spread: 100, origin: { y: 0.6 }, colors: COLORS })
  } else {
    // Single advance: a small, quick burst.
    confetti({
      particleCount: 40,
      spread: 70,
      origin: { y: 0.6 },
      colors: COLORS,
      scalar: 0.8,
      disableForReducedMotion: true,
    })
  }
}
