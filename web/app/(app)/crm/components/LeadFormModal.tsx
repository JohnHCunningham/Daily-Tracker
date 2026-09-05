'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { HiX } from 'react-icons/hi'
import toast from 'react-hot-toast'
import type { CRMLead } from '../page'

interface LeadFormModalProps {
  accountId: string
  lead?: CRMLead
  onClose: () => void
  onSaved: () => void
}

const CATEGORIES = [
  'VP',
  'Enablement',
  'Manager',
  'Sandler Franchisee',
  'Sandler User',
  'Sales Trainers',
  'Other',
]

const STATUSES = [
  { key: 'pending', label: 'Pending' },
  { key: 'request_sent', label: 'Request Sent' },
  { key: 'observability', label: 'Observability' },
  { key: 'free_analysis', label: 'Free Analysis' },
  { key: 'mirror', label: 'Mirror' },
  { key: 'breakup', label: 'Breakup' },
  { key: 'call', label: 'Call' },
]

export default function LeadFormModal({ accountId, lead, onClose, onSaved }: LeadFormModalProps) {
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    first_name: lead?.first_name || '',
    last_name: lead?.last_name || '',
    title: lead?.title || '',
    company: lead?.company || '',
    email: lead?.email || '',
    linkedin_url: lead?.linkedin_url || '',
    classification: lead?.classification || 'V-B',
    category: lead?.category || '',
    profile_signal: lead?.profile_signal || '',
    status: lead?.status || 'pending',
    notes: lead?.notes || '',
  })

  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.first_name.trim() || !formData.last_name.trim()) {
      toast.error('First and last name are required')
      return
    }

    setSaving(true)

    const data = {
      account_id: accountId,
      first_name: formData.first_name.trim(),
      last_name: formData.last_name.trim(),
      title: formData.title.trim() || null,
      company: formData.company.trim() || null,
      email: formData.email.trim() || null,
      linkedin_url: formData.linkedin_url.trim() || null,
      classification: formData.classification as 'V-A' | 'V-B',
      category: formData.category || null,
      profile_signal: formData.profile_signal || null,
      status: formData.status,
      notes: formData.notes.trim() || null,
      pipeline_stage_order: STATUSES.findIndex((s) => s.key === formData.status),
    }

    if (lead) {
      // Update
      const { error } = await supabase
        .from('crm_leads')
        .update(data)
        .eq('id', lead.id)

      if (error) {
        toast.error('Failed to update lead')
        console.error(error)
      } else {
        toast.success('Lead updated')
        onSaved()
      }
    } else {
      // Insert
      const { error } = await supabase.from('crm_leads').insert(data)

      if (error) {
        if (error.code === '23505') {
          toast.error('A lead with this name and company already exists')
        } else {
          toast.error('Failed to create lead')
          console.error(error)
        }
      } else {
        toast.success('Lead created')
        onSaved()
      }
    }

    setSaving(false)
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-bone border border-terracotta/20 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-bone-dark">
          <h2 className="text-xl font-bold text-espresso">
            {lead ? 'Edit Lead' : 'Add New Lead'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-bone-dark/20 rounded-lg transition-colors"
          >
            <HiX className="text-xl text-stone" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Name Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-espresso mb-1">
                First Name *
              </label>
              <input
                type="text"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                className="w-full px-4 py-2.5 bg-white border border-bone-dark rounded-lg text-espresso focus:outline-none focus:border-terracotta"
                placeholder="John"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-espresso mb-1">
                Last Name *
              </label>
              <input
                type="text"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                className="w-full px-4 py-2.5 bg-white border border-bone-dark rounded-lg text-espresso focus:outline-none focus:border-terracotta"
                placeholder="Doe"
              />
            </div>
          </div>

          {/* Title & Company */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-espresso mb-1">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2.5 bg-white border border-bone-dark rounded-lg text-espresso focus:outline-none focus:border-terracotta"
                placeholder="VP of Sales"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-espresso mb-1">Company</label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                className="w-full px-4 py-2.5 bg-white border border-bone-dark rounded-lg text-espresso focus:outline-none focus:border-terracotta"
                placeholder="Acme Corp"
              />
            </div>
          </div>

          {/* Email & LinkedIn */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-espresso mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2.5 bg-white border border-bone-dark rounded-lg text-espresso focus:outline-none focus:border-terracotta"
                placeholder="john@acme.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-espresso mb-1">LinkedIn URL</label>
              <input
                type="url"
                value={formData.linkedin_url}
                onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                className="w-full px-4 py-2.5 bg-white border border-bone-dark rounded-lg text-espresso focus:outline-none focus:border-terracotta"
                placeholder="https://linkedin.com/in/..."
              />
            </div>
          </div>

          {/* Classification & Category */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-espresso mb-1">Classification</label>
              <select
                value={formData.classification}
                onChange={(e) => setFormData({ ...formData, classification: e.target.value as 'V-A' | 'V-B' })}
                className="w-full px-4 py-2.5 bg-white border border-bone-dark rounded-lg text-espresso focus:outline-none focus:border-terracotta"
              >
                <option value="V-A">V-A (High Value)</option>
                <option value="V-B">V-B</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-espresso mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2.5 bg-white border border-bone-dark rounded-lg text-espresso focus:outline-none focus:border-terracotta"
              >
                <option value="">Select category</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Status & Profile Signal */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-espresso mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-4 py-2.5 bg-white border border-bone-dark rounded-lg text-espresso focus:outline-none focus:border-terracotta"
              >
                {STATUSES.map((status) => (
                  <option key={status.key} value={status.key}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-espresso mb-1">Profile Signal</label>
              <select
                value={formData.profile_signal}
                onChange={(e) => setFormData({ ...formData, profile_signal: e.target.value })}
                className="w-full px-4 py-2.5 bg-white border border-bone-dark rounded-lg text-espresso focus:outline-none focus:border-terracotta"
              >
                <option value="">None</option>
                <option value="ONE_STAR">ONE_STAR (Profile Viewer)</option>
                <option value="VIEWED">VIEWED</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-espresso mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-4 py-2.5 bg-white border border-bone-dark rounded-lg text-espresso focus:outline-none focus:border-terracotta resize-none"
              placeholder="Additional notes..."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-white text-stone border border-bone-dark rounded-lg hover:border-terracotta/50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-gradient-to-r from-terracotta to-terracotta-bright text-white font-semibold rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
            >
              {saving ? 'Saving...' : lead ? 'Update Lead' : 'Create Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
