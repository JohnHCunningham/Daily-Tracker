'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface BrandConfig {
  logoUrl: string | null
  primaryColor: string
  accentColor: string
  companyName: string
}

const defaultBrand: BrandConfig = {
  logoUrl: null,
  primaryColor: '#0C1030',
  accentColor: '#10C3B0',
  companyName: 'One Click Coaching',
}

const BrandContext = createContext<BrandConfig>(defaultBrand)

export function useBrand() {
  return useContext(BrandContext)
}

export default function BrandProvider({ children }: { children: React.ReactNode }) {
  const [brand, setBrand] = useState<BrandConfig>(defaultBrand)

  useEffect(() => {
    loadBrand()
  }, [])

  async function loadBrand() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: userData } = await supabase
      .from('Users')
      .select('account_id')
      .eq('auth_id', user.id)
      .single()

    if (!userData?.account_id) return

    const { data: account } = await supabase
      .from('Accounts')
      .select('logo_url, primary_color, accent_color, company_name')
      .eq('id', userData.account_id)
      .single()

    if (account) {
      setBrand({
        logoUrl: account.logo_url || null,
        primaryColor: account.primary_color || defaultBrand.primaryColor,
        accentColor: account.accent_color || defaultBrand.accentColor,
        companyName: account.company_name || defaultBrand.companyName,
      })
    }
  }

  useEffect(() => {
    document.documentElement.style.setProperty('--brand-primary', brand.primaryColor)
    document.documentElement.style.setProperty('--brand-accent', brand.accentColor)
  }, [brand])

  return (
    <BrandContext.Provider value={brand}>
      {children}
    </BrandContext.Provider>
  )
}
