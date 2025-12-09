# Analyze Conversation Edge Function

This Supabase Edge Function securely analyzes sales conversations using Claude AI and the Sandler Sales System methodology.

## Purpose

- Keeps your Anthropic API key secure on the server (never exposed to clients)
- Provides Sandler coaching analysis with evidence-based quotes
- Checks script adherence to your proven cold call script
- Returns structured JSON with scores and recommendations

## Environment Variables Required

Set these using `supabase secrets set`:

- `ANTHROPIC_API_KEY` - Your Anthropic API key
- `SUPABASE_URL` - Auto-set by Supabase
- `SUPABASE_SERVICE_ROLE_KEY` - Auto-set by Supabase

## Deployment

```bash
supabase functions deploy analyze-conversation
```

## Testing Locally

```bash
supabase functions serve analyze-conversation
```

Then in another terminal:

```bash
curl -i --location --request POST \
  'http://localhost:54321/functions/v1/analyze-conversation' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "transcript": "Your call transcript here...",
    "callType": "cold_call"
  }'
```

## Request Format

```json
{
  "transcript": "Full conversation transcript...",
  "callType": "cold_call" // or "discovery", "demo", "close", "follow_up"
}
```

## Response Format

```json
{
  "overall_score": 7.5,
  "upfront_contract_score": 6.0,
  "pain_funnel_score": 8.0,
  "budget_discussion_score": 5.0,
  "decision_process_score": 7.0,
  "bonding_rapport_score": 9.0,
  "talk_ratio_score": 6.5,
  "talk_percentage": 45,
  "question_count": 12,
  "pain_identified": true,
  "budget_discussed": false,
  "decision_makers_identified": true,
  "upfront_contract_set": false,
  "negative_reverse_used": true,
  "what_went_well": [
    "Excellent bonding at start",
    "Strong pain discovery"
  ],
  "areas_to_improve": [
    "No up-front contract set",
    "Budget not discussed"
  ],
  "recommendations": [
    "Start with: 'Would it make sense to spend 15 minutes...'",
    "Ask: 'How much is this costing you per month?'"
  ]
}
```

## Cost

Each analysis costs approximately $0.10-0.30 depending on transcript length (using Claude Sonnet 4.5).

## Error Handling

The function returns proper HTTP status codes:
- `200` - Success
- `400` - Bad request (missing transcript)
- `500` - Server error (Claude API failure, etc.)

All errors are logged to Supabase function logs.
