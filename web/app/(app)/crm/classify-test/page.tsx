'use client'

import { useState } from 'react'
import { HiCheckCircle, HiXCircle, HiRefresh } from 'react-icons/hi'

export default function ClassifyTestPage() {
  const [title, setTitle] = useState('')
  const [company, setCompany] = useState('')
  const [result, setResult] = useState<any>(null)
  const [reclassifyStats, setReclassifyStats] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testClassification = async () => {
    if (!title) return

    try {
      const response = await fetch(
        `/api/crm/reclassify?title=${encodeURIComponent(title)}&company=${encodeURIComponent(company || '')}`
      )
      const data = await response.json()
      setResult(data)
    } catch (error) {
      console.error('Test failed:', error)
    }
  }

  const runReclassify = async (dryRun: boolean) => {
    setLoading(true)
    try {
      const response = await fetch('/api/crm/reclassify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dryRun }),
      })
      const data = await response.json()
      setReclassifyStats(data)
    } catch (error) {
      console.error('Reclassify failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const testCases = [
    { title: 'VP of Sales', company: 'TechCorp', expected: 'V-A, VP' },
    { title: 'Chief Revenue Officer', company: 'SalesSaaS', expected: 'V-A, CRO' },
    { title: 'Sales Enablement Director', company: 'CloudCo', expected: 'V-A, Enablement' },
    { title: 'Sandler Franchisee', company: 'Sandler Training', expected: 'V-A, Sandler Franchisee' },
    { title: 'Account Executive', company: 'TechCorp', expected: 'V-B, Other' },
    { title: 'SDR', company: 'SalesSaaS', expected: 'V-B, Other' },
    { title: 'VP of Marketing', company: 'TechCorp', expected: 'V-B, Other (adjacent role)' },
    { title: 'Consultant', company: 'Accenture', expected: 'V-B, Other' },
    { title: 'Sales Trainer', company: '', expected: 'V-B, Sales Trainers' },
  ]

  return (
    <div className="container max-w-6xl mx-auto p-8">
      <h1 className="text-3xl font-bold text-espresso mb-2">CRM Classification Test</h1>
      <p className="text-stone-light mb-8">
        Test the V-A/V-B classification system and category detection
      </p>

      {/* Single Test */}
      <div className="bg-white rounded-xl border border-bone-dark p-6 mb-8">
        <h2 className="text-xl font-semibold text-espresso mb-4">Test Single Lead</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-stone mb-2">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VP of Sales"
              className="w-full px-3 py-2 border border-bone-dark rounded-lg text-espresso"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone mb-2">Company (optional)</label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="TechCorp"
              className="w-full px-3 py-2 border border-bone-dark rounded-lg text-espresso"
            />
          </div>
        </div>
        <button
          onClick={testClassification}
          className="px-4 py-2 bg-terracotta text-white rounded-lg hover:bg-terracotta-bright"
        >
          Test Classification
        </button>

        {result && (
          <div className="mt-6 p-4 bg-bone rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
              <div>
                <span className="text-sm text-stone-light">Classification:</span>
                <p className={`text-lg font-bold ${result.classification === 'V-A' ? 'text-teal' : 'text-stone'}`}>
                  {result.classification}
                </p>
              </div>
              <div>
                <span className="text-sm text-stone-light">Category:</span>
                <p className="text-lg font-bold text-espresso">{result.category}</p>
              </div>
              <div>
                <span className="text-sm text-stone-light">Reason:</span>
                <p className="text-sm text-stone">{result.reason}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Test Cases */}
      <div className="bg-white rounded-xl border border-bone-dark p-6 mb-8">
        <h2 className="text-xl font-semibold text-espresso mb-4">Example Test Cases</h2>
        <p className="text-sm text-stone-light mb-4">Click any row to test it</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-bone text-left">
              <tr>
                <th className="px-4 py-2">Title</th>
                <th className="px-4 py-2">Company</th>
                <th className="px-4 py-2">Expected Result</th>
              </tr>
            </thead>
            <tbody>
              {testCases.map((tc, idx) => (
                <tr
                  key={idx}
                  onClick={() => {
                    setTitle(tc.title)
                    setCompany(tc.company)
                  }}
                  className="border-t border-bone-dark hover:bg-bone/50 cursor-pointer"
                >
                  <td className="px-4 py-2 font-medium">{tc.title}</td>
                  <td className="px-4 py-2 text-stone-light">{tc.company || '—'}</td>
                  <td className="px-4 py-2 text-stone">{tc.expected}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Batch Reclassify */}
      <div className="bg-white rounded-xl border border-bone-dark p-6">
        <h2 className="text-xl font-semibold text-espresso mb-4">Reclassify All Leads</h2>
        <p className="text-sm text-stone-light mb-4">
          Run the classification system on all existing leads to fix any misclassified entries.
        </p>

        <div className="flex gap-3 mb-6">
          <button
            onClick={() => runReclassify(true)}
            disabled={loading}
            className="px-4 py-2 bg-stone-light text-white rounded-lg hover:bg-stone disabled:opacity-50"
          >
            Dry Run (Preview)
          </button>
          <button
            onClick={() => runReclassify(false)}
            disabled={loading}
            className="px-4 py-2 bg-terracotta text-white rounded-lg hover:bg-terracotta-bright disabled:opacity-50"
          >
            {loading ? 'Running...' : 'Update Database'}
          </button>
        </div>

        {reclassifyStats && (
          <div className="p-4 bg-bone rounded-lg">
            <div className="flex items-center gap-2 mb-4">
              {reclassifyStats.dryRun ? (
                <span className="text-sm font-medium text-espresso bg-clay/20 px-2 py-1 rounded">
                  DRY RUN
                </span>
              ) : (
                <span className="text-sm font-medium text-terracotta bg-terracotta/10 px-2 py-1 rounded">
                  UPDATED
                </span>
              )}
              <span className="text-sm text-stone-light">{reclassifyStats.message}</span>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <span className="text-xs text-stone-light">Total Leads</span>
                <p className="text-2xl font-bold text-espresso">{reclassifyStats.stats.total}</p>
              </div>
              <div>
                <span className="text-xs text-stone-light">Changed</span>
                <p className="text-2xl font-bold text-terracotta">{reclassifyStats.stats.changed}</p>
              </div>
              <div>
                <span className="text-xs text-stone-light">Unchanged</span>
                <p className="text-2xl font-bold text-stone-light">{reclassifyStats.stats.unchanged}</p>
              </div>
            </div>

            {reclassifyStats.changes && reclassifyStats.changes.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-semibold text-espresso mb-2">Changes:</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {reclassifyStats.changes.map((change: any, idx: number) => (
                    <div key={idx} className="p-3 bg-white rounded border border-bone-dark text-xs">
                      <div className="font-medium text-espresso mb-1">{change.name}</div>
                      <div className="text-stone-light mb-1">{change.title || 'No title'}</div>
                      <div className="flex items-center gap-2">
                        <span className="text-stone">{change.oldClassification}</span>
                        <span>→</span>
                        <span className={change.newClassification === 'V-A' ? 'text-teal font-medium' : 'text-stone'}>
                          {change.newClassification}
                        </span>
                        <span className="text-stone-light">|</span>
                        <span className="text-stone">{change.oldCategory || 'null'}</span>
                        <span>→</span>
                        <span className="text-espresso font-medium">{change.newCategory}</span>
                      </div>
                      <div className="text-stone-light mt-1">{change.reason}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
