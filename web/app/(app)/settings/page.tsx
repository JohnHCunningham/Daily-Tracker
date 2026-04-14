'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import Link from 'next/link'

interface AccountInfo {
  id: string
  name: string
  admin_designation: string | null
  logo_url: string | null
  primary_color: string | null
  accent_color: string | null
  company_name: string | null
  email_from_name: string | null
}

export default function SettingsPage() {
  const [account, setAccount] = useState<AccountInfo | null>(null)
  const [form, setForm] = useState({
    name: '',
    company_name: '',
    logo_url: '',
    primary_color: '#0C1030',
    accent_color: '#10C3B0',
    email_from_name: 'One Click Coaching',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    loadSettings()
  }, [])

  async function loadSettings() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: currentUser } = await supabase
      .from('Users')
      .select('account_id')
      .eq('auth_id', user.id)
      .single()

    if (!currentUser) { setLoading(false); return }

    const { data: accountData } = await supabase
      .from('Accounts')
      .select('id, name, admin_designation, logo_url, primary_color, accent_color, company_name, email_from_name')
      .eq('id', currentUser.account_id)
      .single()

    if (accountData) {
      setAccount(accountData)
      setForm({
        name: accountData.name || '',
        company_name: accountData.company_name || '',
        logo_url: accountData.logo_url || '',
        primary_color: accountData.primary_color || '#0C1030',
        accent_color: accountData.accent_color || '#10C3B0',
        email_from_name: accountData.email_from_name || 'One Click Coaching',
      })
    }
    setLoading(false)
  }

  async function handleSave() {
    if (!account) return
    setSaving(true)

    const { error } = await supabase
      .from('Accounts')
      .update({
        name: form.name,
        company_name: form.company_name,
        logo_url: form.logo_url || null,
        primary_color: form.primary_color,
        accent_color: form.accent_color,
        email_from_name: form.email_from_name,
      })
      .eq('id', account.id)

    if (!error) {
      toast.success('Settings saved')
    } else {
      toast.error('Failed to save settings')
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-teal border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-light mb-8">Settings</h1>

      <div className="max-w-2xl space-y-6">
        {/* Account Settings */}
        <div className="bg-navy-light rounded-2xl border border-teal/10 p-6">
          <h2 className="text-lg font-bold text-light mb-4">Account</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-light-muted mb-1">Account Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 bg-navy border border-teal/20 rounded-lg text-light text-sm focus:outline-none focus:border-teal"
              />
            </div>
            <div>
              <label className="block text-sm text-light-muted mb-1">Company Name (displayed in app)</label>
              <input
                type="text"
                value={form.company_name}
                onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                className="w-full px-3 py-2 bg-navy border border-teal/20 rounded-lg text-light text-sm focus:outline-none focus:border-teal"
              />
            </div>
          </div>
        </div>

        {/* White-Label Branding */}
        <div className="bg-navy-light rounded-2xl border border-teal/10 p-6">
          <h2 className="text-lg font-bold text-light mb-4">Branding</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-light-muted mb-1">Logo URL</label>
              <input
                type="url"
                value={form.logo_url}
                onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
                placeholder="https://yourcompany.com/logo.png"
                className="w-full px-3 py-2 bg-navy border border-teal/20 rounded-lg text-light text-sm focus:outline-none focus:border-teal placeholder:text-light-muted/50"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-light-muted mb-1">Primary Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form.primary_color}
                    onChange={(e) => setForm({ ...form, primary_color: e.target.value })}
                    className="w-10 h-10 rounded border border-teal/20 cursor-pointer bg-transparent"
                  />
                  <input
                    type="text"
                    value={form.primary_color}
                    onChange={(e) => setForm({ ...form, primary_color: e.target.value })}
                    className="flex-1 px-3 py-2 bg-navy border border-teal/20 rounded-lg text-light text-sm focus:outline-none focus:border-teal"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-light-muted mb-1">Accent Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form.accent_color}
                    onChange={(e) => setForm({ ...form, accent_color: e.target.value })}
                    className="w-10 h-10 rounded border border-teal/20 cursor-pointer bg-transparent"
                  />
                  <input
                    type="text"
                    value={form.accent_color}
                    onChange={(e) => setForm({ ...form, accent_color: e.target.value })}
                    className="flex-1 px-3 py-2 bg-navy border border-teal/20 rounded-lg text-light text-sm focus:outline-none focus:border-teal"
                  />
                </div>
              </div>
            </div>
            {form.logo_url && (
              <div className="p-3 bg-navy rounded-lg border border-navy-light">
                <p className="text-xs text-light-muted mb-2">Preview:</p>
                <img src={form.logo_url} alt="Logo preview" className="h-8 object-contain" />
              </div>
            )}
          </div>
        </div>

        {/* Email Settings */}
        <div className="bg-navy-light rounded-2xl border border-teal/10 p-6">
          <h2 className="text-lg font-bold text-light mb-4">Email</h2>
          <div>
            <label className="block text-sm text-light-muted mb-1">Email "From" Name</label>
            <input
              type="text"
              value={form.email_from_name}
              onChange={(e) => setForm({ ...form, email_from_name: e.target.value })}
              className="w-full px-3 py-2 bg-navy border border-teal/20 rounded-lg text-light text-sm focus:outline-none focus:border-teal"
            />
            <p className="text-xs text-light-muted mt-1">This name appears in coaching emails sent to reps.</p>
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-navy-light rounded-2xl border border-teal/10 p-6">
          <h2 className="text-lg font-bold text-light mb-4">Quick Links</h2>
          <div className="space-y-2">
            <Link href="/integrations" className="block text-teal text-sm hover:text-aqua">Manage Integrations (HubSpot, Fathom, Aircall)</Link>
            <Link href="/team" className="block text-teal text-sm hover:text-aqua">Manage Team Members</Link>
            <Link href="/planning" className="block text-teal text-sm hover:text-aqua">Planning & Benchmarks</Link>
          </div>
        </div>

        {/* Methodology */}
        <div className="bg-navy-light rounded-2xl border border-teal/10 p-6">
          <h2 className="text-lg font-bold text-light mb-4">Methodology</h2>
          <div className="flex items-center gap-3 p-3 bg-teal/10 border border-teal/20 rounded-lg">
            <div className="w-10 h-10 bg-teal/20 rounded-full flex items-center justify-center text-teal font-bold">S</div>
            <div>
              <p className="font-semibold text-light text-sm">Sandler Selling System</p>
              <p className="text-xs text-light-muted">Active methodology for all coaching analysis</p>
            </div>
          </div>
        </div>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-gradient-to-r from-teal to-aqua text-navy font-bold py-3 px-8 rounded-lg hover:shadow-glow-teal transition-all disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save All Settings'}
        </button>

        {/* Danger Zone */}
        <div className="bg-navy-light rounded-2xl border border-pink/20 p-6">
          <h2 className="text-lg font-bold text-pink mb-2">Danger Zone</h2>
          <p className="text-light-muted text-sm mb-4">These actions are irreversible.</p>
          <button className="text-sm text-pink border border-pink/30 bg-pink/5 px-4 py-2 rounded-lg hover:bg-pink/10 transition-colors">
            Delete Account
          </button>
        </div>
      </div>
    </div>
  )
}
