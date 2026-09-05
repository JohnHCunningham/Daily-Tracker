/**
 * CRM Lead Classification System
 *
 * Classification (V-A vs V-B) determines buyer quality
 * Category determines role/function
 *
 * V-A = Budget authority (the buyers)
 * V-B = Everyone else
 */

// ==================== CLASSIFICATION (V-A vs V-B) ====================

/**
 * Canonical regex patterns for V-A titles
 * Any match → V-A (budget authority)
 */
const VA_TITLE_PATTERNS = [
  /\bvp\b/i,
  /\bvice president\b/i,
  /\bsvp\b/i,
  /\bevp\b/i,
  /\bavp\b/i,
  /\bchief\b/i,
  /\bcro\b/i,
  /\bcso\b/i,
  /\bcoo\b/i,
  /\bpresident\b/i,
  /\brevenue officer\b/i,
  /\bhead of sales\b/i,
  /\bdirector of sales\b/i,
  /\bsales director\b/i,
  /\bdirector.*enablement\b/i,
  /\benablement.*director\b/i,
  /\bfranchisee\b/i,
  /\bfranchise owner\b/i,
  /\bfractional sales leader\b/i,
  /\bregional.*sales\b/i,
  /\bglobal.*sales\b/i,
]

/**
 * Adjacent roles that should be V-B even with "VP" or "Director" title
 * These are non-sales roles or outside ICP
 */
const ADJACENT_ROLE_PATTERNS = [
  /\baccountant\b/i,
  /\baccounting\b/i,
  /\bconsultant\b/i,
  /\bconsulting\b/i,
  /\boperations\b/i,
  /\bops\b/i,
  /\bproduct\b/i,
  /\bengineering\b/i,
  /\bmarketing\b/i,
  /\bfinance\b/i,
  /\bhr\b/i,
  /\bhuman resources\b/i,
  /\blegal\b/i,
  /\bit\b/i,
  /\bsecurity\b/i,
]

/**
 * V-B role patterns (individual contributors, non-buyers)
 */
const VB_ROLE_PATTERNS = [
  /\baccount executive\b/i,
  /\bae\b/i,
  /\bsdr\b/i,
  /\bbdr\b/i,
  /\bsales development\b/i,
  /\bbusiness development\b/i,
  /\bsales rep\b/i,
  /\bsales associate\b/i,
  /\bfounder\b/i,  // Unless scale-up CEO, but default to V-B
  /\btrainer\b/i,  // Unless Sandler franchisee
]

/**
 * ICP company indicators (SaaS/tech)
 * Used to validate V-A classification
 */
const ICP_COMPANY_PATTERNS = [
  /\bsaas\b/i,
  /\bsoftware\b/i,
  /\btech\b/i,
  /\btechnology\b/i,
  /\bcloud\b/i,
  /\bplatform\b/i,
  /\bdigital\b/i,
  /\bapi\b/i,
  /\bdata\b/i,
  /\bai\b/i,
  /\banalytics\b/i,
]

/**
 * Classify a lead as V-A (buyer) or V-B
 *
 * Rules:
 * 1. Check if title matches V-A patterns
 * 2. Exclude if adjacent role (accountant, consultant, ops, etc.)
 * 3. Default to V-B if no title or unknown
 * 4. Optionally validate against ICP fit (company info)
 */
export function classifyLead(params: {
  title?: string | null
  company?: string | null
  strictICP?: boolean
}): 'V-A' | 'V-B' {
  const { title, company, strictICP = false } = params

  // No title → default V-B
  if (!title) return 'V-B'

  const titleLower = title.toLowerCase()

  // Check for adjacent roles first (overrides VP/Director titles)
  const isAdjacentRole = ADJACENT_ROLE_PATTERNS.some(pattern => pattern.test(titleLower))
  if (isAdjacentRole) return 'V-B'

  // Check for explicit V-B roles
  const isVBRole = VB_ROLE_PATTERNS.some(pattern => pattern.test(titleLower))
  if (isVBRole) return 'V-B'

  // Check for V-A title patterns
  const isVATitle = VA_TITLE_PATTERNS.some(pattern => pattern.test(titleLower))

  if (isVATitle) {
    // If strict ICP validation is enabled, check company fit
    if (strictICP && company) {
      const isICPFit = ICP_COMPANY_PATTERNS.some(pattern => pattern.test(company))
      if (!isICPFit) {
        // V-A title but not ICP company → still V-B
        return 'V-B'
      }
    }
    return 'V-A'
  }

  // Default: unknown title → V-B
  return 'V-B'
}

// ==================== CATEGORY (ROLE/FUNCTION) ====================

/**
 * Category types matching CRM database
 */
export type Category =
  | 'VP'
  | 'Manager'
  | 'Enablement'
  | 'CRO'
  | 'Sandler Franchisee'
  | 'Sandler User'
  | 'Sales Trainers'
  | 'Other'

/**
 * Categorize a lead by role/function
 *
 * Priority order:
 * 1. Sandler (franchisee vs user)
 * 2. Enablement
 * 3. CRO / Chief Revenue Officer
 * 4. VP / SVP / EVP
 * 5. Director / Head of Sales → VP category
 * 6. Sales Manager
 * 7. Trainer
 * 8. Other (unknown or IC)
 */
export function categorizeLead(title?: string | null): Category {
  if (!title) return 'Other'

  const t = title.toLowerCase()

  // Sandler (highest priority for ICP)
  if (t.includes('sandler')) {
    if (t.includes('franchise') || t.includes('owner')) {
      return 'Sandler Franchisee'
    }
    return 'Sandler User'
  }

  // Enablement
  if (t.includes('enablement')) {
    return 'Enablement'
  }

  // CRO / Chief Revenue Officer
  if (t.includes('cro') || t.includes('chief revenue') || t.includes('chief sales')) {
    return 'CRO'
  }

  // VP / Vice President / SVP / EVP
  if (
    /\bvp\b/i.test(t) ||
    t.includes('vice president') ||
    /\bsvp\b/i.test(t) ||
    /\bevp\b/i.test(t) ||
    /\bavp\b/i.test(t)
  ) {
    return 'VP'
  }

  // Director / Head of Sales → VP category (decision makers)
  if (
    (t.includes('director') || t.includes('head of')) &&
    (t.includes('sales') || t.includes('revenue'))
  ) {
    return 'VP'
  }

  // Sales Manager
  if (t.includes('manager') && t.includes('sales')) {
    return 'Manager'
  }

  // Sales Trainers
  if (t.includes('trainer') || t.includes('training') || t.includes('coach')) {
    return 'Sales Trainers'
  }

  // Default
  return 'Other'
}

// ==================== UTILITIES ====================

/**
 * Get classification explanation (for debugging/audit)
 */
export function explainClassification(params: {
  title?: string | null
  company?: string | null
}): {
  classification: 'V-A' | 'V-B'
  category: Category
  reason: string
} {
  const { title, company } = params
  const classification = classifyLead(params)
  const category = categorizeLead(title)

  let reason = ''

  if (!title) {
    reason = 'No title provided → default V-B'
  } else {
    const titleLower = title.toLowerCase()

    const adjacentRole = ADJACENT_ROLE_PATTERNS.find(p => p.test(titleLower))
    if (adjacentRole) {
      reason = `Adjacent role (${adjacentRole.source}) → V-B despite title`
    } else {
      const vbRole = VB_ROLE_PATTERNS.find(p => p.test(titleLower))
      if (vbRole) {
        reason = `Individual contributor role (${vbRole.source}) → V-B`
      } else {
        const vaPattern = VA_TITLE_PATTERNS.find(p => p.test(titleLower))
        if (vaPattern) {
          reason = `Budget authority title (${vaPattern.source}) → V-A`
        } else {
          reason = 'Title not recognized → default V-B'
        }
      }
    }
  }

  return {
    classification,
    category,
    reason,
  }
}

/**
 * Batch classify multiple leads
 */
export function batchClassify(leads: Array<{
  title?: string | null
  company?: string | null
}>): Array<{
  classification: 'V-A' | 'V-B'
  category: Category
}> {
  return leads.map(lead => ({
    classification: classifyLead(lead),
    category: categorizeLead(lead.title),
  }))
}

/**
 * Get classification statistics
 */
export function getClassificationStats(leads: Array<{
  title?: string | null
  company?: string | null
}>): {
  total: number
  vaCount: number
  vbCount: number
  categories: Record<Category, number>
} {
  const results = batchClassify(leads)

  const stats = {
    total: leads.length,
    vaCount: results.filter(r => r.classification === 'V-A').length,
    vbCount: results.filter(r => r.classification === 'V-B').length,
    categories: {} as Record<Category, number>,
  }

  // Count categories
  results.forEach(r => {
    stats.categories[r.category] = (stats.categories[r.category] || 0) + 1
  })

  return stats
}
