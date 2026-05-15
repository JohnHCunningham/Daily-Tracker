import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const { interactionId, helpful } = await request.json()

    if (!interactionId || typeof helpful !== 'boolean') {
      return NextResponse.json(
        { error: 'interactionId and helpful (boolean) are required' },
        { status: 400 }
      )
    }

    // Get user info
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { data: userData } = await supabase
      .from('Users')
      .select('id')
      .eq('auth_id', user.id)
      .single()

    if (!userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get the interaction to find the intent
    const { data: interaction } = await supabase
      .from('Copilot_Interactions')
      .select('intent_matched')
      .eq('id', interactionId)
      .single()

    // Log feedback
    await supabase
      .from('Copilot_Feedback')
      .insert({
        interaction_id: interactionId,
        user_id: userData.id,
        intent_name: interaction?.intent_matched || null,
        helpful
      })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Copilot feedback error:', error)
    return NextResponse.json(
      { error: 'Failed to save feedback' },
      { status: 500 }
    )
  }
}
