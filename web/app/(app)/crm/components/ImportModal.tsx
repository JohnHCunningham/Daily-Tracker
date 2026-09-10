'use client'

import { useState } from 'react'
import { HiX, HiUpload, HiDocumentText } from 'react-icons/hi'
import toast from 'react-hot-toast'

interface ImportModalProps {
  onClose: () => void
  onImported: () => void
}

export default function ImportModal({ onClose, onImported }: ImportModalProps) {
  const [csvData, setCsvData] = useState('')
  const [importing, setImporting] = useState(false)

  const handleImport = async () => {
    if (!csvData.trim()) {
      toast.error('Please paste CSV data')
      return
    }

    setImporting(true)

    try {
      const response = await fetch('/api/crm/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ csvData }),
      })

      if (!response.ok) {
        throw new Error('Import failed')
      }

      const result = await response.json()

      toast.success(
        `Imported ${result.imported} leads, updated ${result.updated}, skipped ${result.skipped}`
      )
      onImported()
      onClose()
    } catch (error) {
      console.error('Import error:', error)
      toast.error('Failed to import leads')
    } finally {
      setImporting(false)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      setCsvData(text)
    }
    reader.readAsText(file)
  }

  const sampleCSV = `Name,Title,Company,LinkedIn URL,Category,Classification,Signal
Sarah Chen,VP of Sales,TechCorp,https://linkedin.com/in/sarahchen,VP,V-A,ONE_STAR
Michael Rodriguez,Sales Enablement Manager,SalesCo,https://linkedin.com/in/mrodriguez,Enablement,V-A,VIEWED`

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-bone-dark flex items-center justify-between">
          <div>
            <h2 className="font-bold text-xl text-espresso">Import Leads</h2>
            <p className="text-sm text-stone-light mt-1">
              Upload CSV or paste data below
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-stone hover:bg-bone-dark hover:text-espresso transition-colors"
          >
            <HiX className="text-xl" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* File upload */}
          <div className="mb-4">
            <label className="flex items-center justify-center w-full px-4 py-3 bg-bone rounded-xl border-2 border-dashed border-bone-dark hover:border-terracotta transition-colors cursor-pointer">
              <HiUpload className="text-terracotta text-xl mr-2" />
              <span className="text-sm font-medium text-espresso">
                Upload CSV file
              </span>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          <div className="text-center text-sm text-stone-light mb-4">or</div>

          {/* CSV textarea */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-espresso mb-2">
              Paste CSV Data
            </label>
            <textarea
              value={csvData}
              onChange={(e) => setCsvData(e.target.value)}
              placeholder="Name,Title,Company,LinkedIn URL..."
              rows={10}
              className="w-full px-3 py-2 bg-bone border border-bone-dark rounded-lg text-sm font-mono text-espresso focus:outline-none focus:border-terracotta resize-vertical"
            />
          </div>

          {/* Sample data */}
          <details className="mt-4">
            <summary className="text-sm font-medium text-terracotta cursor-pointer hover:text-terracotta-bright">
              <HiDocumentText className="inline mr-1" />
              Show CSV format example
            </summary>
            <div className="mt-2 p-3 bg-bone rounded-lg">
              <pre className="text-xs font-mono text-espresso overflow-x-auto">
                {sampleCSV}
              </pre>
              <button
                onClick={() => setCsvData(sampleCSV)}
                className="mt-2 text-xs text-terracotta hover:text-terracotta-bright"
              >
                Use this sample
              </button>
            </div>
          </details>

          {/* CSV format guide */}
          <div className="mt-4 p-3 bg-bone border border-bone-dark rounded-lg">
            <h3 className="text-sm font-semibold text-espresso mb-2">
              Supported Columns
            </h3>
            <div className="text-xs text-stone space-y-1">
              <p><strong>Name</strong> or <strong>First Name + Last Name</strong> (required)</p>
              <p><strong>Title, Company, LinkedIn URL, Email</strong> (optional)</p>
              <p><strong>Category:</strong> VP, Manager, Enablement, Sandler Franchisee, etc.</p>
              <p><strong>Classification:</strong> V-A or V-B (default: V-B)</p>
              <p><strong>Signal:</strong> ONE_STAR or VIEWED</p>
              <p><strong>Status:</strong> pending, request_sent, observability, etc.</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-bone-dark bg-bone/30 flex gap-3">
          <button
            onClick={handleImport}
            disabled={importing || !csvData.trim()}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${
              importing || !csvData.trim()
                ? 'bg-stone-light text-white cursor-not-allowed'
                : 'bg-gradient-to-r from-terracotta to-terracotta-bright text-white hover:shadow-lg'
            }`}
          >
            {importing ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <HiUpload />
                Import Leads
              </>
            )}
          </button>
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
