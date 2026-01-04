// Supabase Edge Function: Generate Team Coaching
// One-click AI coaching for managers

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': '*',
      }
    })
  }

  try {
    const { teamMemberId, managerId } = await req.json()

    if (!teamMemberId || !managerId) {
      return new Response(
        JSON.stringify({ error: 'teamMemberId and managerId required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Get team member info
    const { data: teamMember } = await supabase.auth.admin.getUserById(teamMemberId)
    const memberName = teamMember?.user?.user_metadata?.first_name || 'Team Member'

    // Get last 30 days of activities for this team member
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: activities } = await supabase
      .from('daily_activities')
      .select('*')
      .eq('user_id', teamMemberId)
      .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
      .order('date', { ascending: false })

    if (!activities || activities.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No activity data found for this team member' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Calculate team member's averages
    const memberAvg = {
      calls: Math.round(activities.reduce((sum, a) => sum + (a.calls_made || 0), 0) / activities.length),
      emails: Math.round(activities.reduce((sum, a) => sum + (a.emails_sent || 0), 0) / activities.length),
      meetings: Math.round(activities.reduce((sum, a) => sum + (a.meetings_booked || 0), 0) / activities.length),
      methodology: Math.round(activities.reduce((sum, a) => sum + (a.methodology_score || 0), 0) / activities.length)
    }

    // Get all team members' activities for comparison
    const { data: allTeamActivities } = await supabase
      .from('daily_activities')
      .select('*')
      .gte('date', thirtyDaysAgo.toISOString().split('T')[0])

    // Calculate team averages
    const teamAvg = {
      calls: Math.round(allTeamActivities.reduce((sum, a) => sum + (a.calls_made || 0), 0) / allTeamActivities.length),
      emails: Math.round(allTeamActivities.reduce((sum, a) => sum + (a.emails_sent || 0), 0) / allTeamActivities.length),
      meetings: Math.round(allTeamActivities.reduce((sum, a) => sum + (a.meetings_booked || 0), 0) / allTeamActivities.length),
      methodology: Math.round(allTeamActivities.reduce((sum, a) => sum + (a.methodology_score || 0), 0) / allTeamActivities.length)
    }

    // Get team member's active goals
    const { data: goals } = await supabase
      .from('user_goals')
      .select('*')
      .eq('user_id', teamMemberId)
      .eq('status', 'active')

    // Generate AI coaching using Claude
    const prompt = buildCoachingPrompt(memberName, memberAvg, teamAvg, goals)

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    })

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`)
    }

    const data = await response.json()
    const coachingText = data.content[0].text

    // Parse JSON response from Claude
    const jsonMatch = coachingText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Could not parse coaching response')
    }

    const coaching = JSON.parse(jsonMatch[0])

    // Save feedback to database
    const { data: feedbackRecord, error } = await supabase
      .from('manager_feedback')
      .insert({
        manager_id: managerId,
        team_member_id: teamMemberId,
        performance_vs_average: coaching.performance_summary,
        areas_of_improvement: coaching.areas_of_improvement,
        omissions: coaching.omissions,
        recommendations: coaching.recommendations,
        goals_set: coaching.suggested_goals,
        full_message: coaching.full_message
      })
      .select()
      .single()

    if (error) throw error

    return new Response(
      JSON.stringify({
        success: true,
        feedback: feedbackRecord,
        coaching: coaching
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    )
  }
})

function buildCoachingPrompt(name: string, memberAvg: any, teamAvg: any, goals: any[]): string {
  return `You are an expert sales coach providing personalized feedback to a team member.

TEAM MEMBER: ${name}

THEIR 30-DAY AVERAGES:
- Daily Calls: ${memberAvg.calls}
- Daily Emails: ${memberAvg.emails}
- Daily Meetings: ${memberAvg.meetings}
- Methodology Execution Score: ${memberAvg.methodology}/100

TEAM AVERAGES (for comparison):
- Daily Calls: ${teamAvg.calls}
- Daily Emails: ${teamAvg.emails}
- Daily Meetings: ${teamAvg.meetings}
- Methodology Execution Score: ${teamAvg.methodology}/100

CURRENT GOALS:
${goals && goals.length > 0 ? goals.map(g => `- ${g.goal_type}: ${g.target_value}`).join('\n') : 'No active goals set'}

TASK: Generate personalized coaching feedback that:
1. Compares their performance vs team average
2. Identifies what they're doing well
3. Identifies areas for improvement
4. Identifies critical omissions (things they're NOT doing at all or severely under-performing)
5. Provides specific, actionable recommendations
6. Suggests 2-3 SMART goals to work on

IMPORTANT - AUTHENTICITY:
- Write like a real coach, not a template
- Be specific and personal
- Vary your language - don't sound robotic
- Be encouraging but honest
- Use their actual numbers in context

Return JSON in this format:
{
  "performance_summary": "2-3 sentence summary comparing to team average",
  "strengths": ["Specific strength 1", "Specific strength 2"],
  "areas_of_improvement": ["Specific area 1 with actual numbers", "Specific area 2"],
  "omissions": ["Critical thing they're not doing", "Another omission"],
  "recommendations": ["Specific action 1", "Specific action 2", "Specific action 3"],
  "suggested_goals": ["SMART goal 1", "SMART goal 2"],
  "full_message": "Complete coaching message to send to ${name}, written in first person as their manager, warm and encouraging tone, 3-4 paragraphs"
}

Make it feel personal and specific to ${name}'s actual performance.`
}
