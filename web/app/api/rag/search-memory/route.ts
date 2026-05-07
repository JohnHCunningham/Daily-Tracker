import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateEmbedding } from '@/lib/rag'

export async function POST(request: NextRequest) {
  try {
    const { query, sourceTypes, repEmail, matchThreshold = 0.65, matchCount = 5 } =
      await request.json()

    if (!query?.trim()) {
      return NextResponse.json({ error: 'query is required' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: currentUser } = await supabase
      .from('Users')
      .select('account_id, email, role')
      .eq('auth_id', user.id)
      .single()

    if (!currentUser) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    const { embedding } = await generateEmbedding(query.trim())

    if (!embedding) {
      return NextResponse.json({ error: 'Embedding generation unavailable' }, { status: 500 })
    }

    const { data, error } = await supabase.rpc('search_coaching_memory', {
      query_embedding: `[${embedding.join(',')}]`,
      match_threshold: matchThreshold,
      match_count: matchCount,
      filter_account_id: currentUser.account_id,
      filter_source_types: sourceTypes || null,
      filter_rep_email: repEmail || null,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      count: data?.length || 0,
      results: data || [],
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
