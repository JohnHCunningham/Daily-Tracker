# AI Chatbot Setup Guide

## Overview

Your AI-powered chatbot is now installed on your landing page! It uses:
- **RAG (Retrieval Augmented Generation)** - Searches your knowledge base to answer questions accurately
- **Claude 3.5 Sonnet** - For natural, insightful conversations
- **OpenAI Embeddings** - For semantic search across your documentation
- **Supabase Vector Database** - To store and search knowledge

## What's Been Created

### 1. Chatbot API Endpoints
- `web/app/api/chatbot/route.ts` - Main chatbot endpoint (for app.oneclickcoaching.com)
- `landing-page/app/api/chatbot/route.ts` - Landing page chatbot endpoint (for www.oneclickcoaching.com)

### 2. Chat Widget Component
- `web/components/ChatWidget.tsx` - React component for the main app
- `landing-page/components/ChatWidget.tsx` - React component for landing page

### 3. Database Tables
- `chatbot_leads` - Stores captured leads from conversations
- `Sandler_Knowledge_Base` - Vector database for RAG (already existed, now being used)

### 4. Knowledge Base Loader
- `scripts/populate-knowledge-base.ts` - Script to index all your .md files into the vector database

## Setup Instructions

### Step 1: Get an OpenAI API Key

1. Go to https://platform.openai.com/api-keys
2. Sign in or create an account
3. Click "Create new secret key"
4. Copy the key (starts with `sk-...`)

### Step 2: Add API Keys to Environment

Add this to both `.env.local` files (root and landing-page):

```bash
OPENAI_API_KEY=sk-your-key-here
```

The landing-page/.env.local already has ANTHROPIC_API_KEY added from the main env file.

### Step 3: Install Dependencies

```bash
# In the web directory
cd web
npm install

# In the landing-page directory
cd ../landing-page
npm install
```

### Step 4: Run the Database Migration

```bash
# Apply the chatbot_leads table migration
cd ../supabase
# Run migration 100_chatbot_leads.sql in your Supabase dashboard
```

Or use the Supabase CLI:
```bash
supabase db push
```

### Step 5: Populate the Knowledge Base

This script will:
- Find all your .md files (excluding internal dev docs)
- Split them into chunks
- Generate embeddings
- Store them in the vector database

```bash
cd ../scripts
npx tsx populate-knowledge-base.ts
```

**Note:** This will make API calls to OpenAI for embeddings. Expect:
- ~300-500 API calls depending on how many docs you have
- ~$0.50-$2.00 in costs (embeddings are cheap)
- ~5-10 minutes to complete

### Step 6: Test the Chatbot

1. Start your dev servers:
```bash
# Terminal 1 - Main app
cd web
npm run dev

# Terminal 2 - Landing page
cd landing-page
npm run dev
```

2. Visit http://localhost:3000 (landing page)
3. Click the chat button in bottom-right corner
4. Test it with questions like:
   - "What is One Click Coaching?"
   - "Do you support MEDDIC methodology?"
   - "How much does it cost?"
   - "I'm interested, my name is John from Acme Corp"

## Features

### Lead Capture
When visitors share their information, the chatbot:
1. Automatically detects name, email, company, team size, methodology
2. Stores it in the `chatbot_leads` table
3. Sends email notifications to:
   - john@aiadvantagesolutions.ca
   - john@oneclickcoaching.com

### Knowledge Base
The chatbot can answer questions about:
- All your sales methodologies (Sandler, Challenger, MEDDIC, Gap Selling, SPIN)
- Product features and pricing
- Objection handling techniques
- Best practices from your documentation

### Methodology-Agnostic
The chatbot clearly communicates that you support multiple methodologies, not just Sandler.

## Configuration

### System Prompt
Edit the `SYSTEM_PROMPT` in the chatbot route files to change how the chatbot behaves.

### Styling
The ChatWidget component uses Tailwind CSS and your brand colors:
- Teal (#14b8a6)
- Blue (#1e40af)
- Navy (#1e3a8a)

Edit `components/ChatWidget.tsx` to customize the appearance.

### Knowledge Base Content
To exclude certain files from the knowledge base, edit `EXCLUDE_PATTERNS` in `scripts/populate-knowledge-base.ts`.

## Deployment

### Landing Page Deployment
Your landing page is already on Vercel. Add these environment variables in Vercel:

1. Go to your Vercel dashboard
2. Select your landing-page project
3. Go to Settings → Environment Variables
4. Add:
   - `OPENAI_API_KEY` = your OpenAI key
   - `ANTHROPIC_API_KEY` = (already set from main app)

### Re-populate Knowledge Base
After adding new documentation:

```bash
cd scripts
npx tsx populate-knowledge-base.ts
```

## Monitoring

### View Captured Leads
Query the database:
```sql
SELECT * FROM chatbot_leads ORDER BY created_at DESC;
```

### View Knowledge Base
```sql
SELECT chunk_title, methodology, content_type
FROM "Sandler_Knowledge_Base"
WHERE is_active = TRUE;
```

## Troubleshooting

### Chatbot Returns Generic Answers
- Check if knowledge base is populated: `SELECT COUNT(*) FROM "Sandler_Knowledge_Base"`
- Re-run the populate script
- Check OpenAI API key is set correctly

### Lead Emails Not Sending
- Verify RESEND_API_KEY is set in web/.env.local
- Check Resend dashboard for delivery status
- The landing page currently doesn't send emails directly (calls main app API)

### Vector Search Not Working
- Ensure pgvector extension is enabled in Supabase
- Check embeddings are stored as valid vectors
- Verify the search function exists: `SELECT * FROM pg_proc WHERE proname = 'search_sandler_content'`

## Costs

### OpenAI Costs (Approximate)
- Embeddings: $0.00002 per 1k tokens
  - Initial knowledge base population: ~$1-2 one-time
  - Per chat query: ~$0.0001 per message
- Expected monthly: ~$5-10 for moderate traffic

### Anthropic Costs
- Claude 3.5 Sonnet: $3 per million input tokens, $15 per million output tokens
- Expected per conversation: ~$0.01-0.03
- Expected monthly: ~$20-50 for moderate traffic

## Next Steps

1. ✅ Get OpenAI API key
2. ✅ Add to .env.local files
3. ✅ Install dependencies
4. ✅ Run migration
5. ✅ Populate knowledge base
6. ✅ Test locally
7. ✅ Deploy to Vercel with environment variables

## Support

Questions? Issues?
- Check the chatbot logs in Vercel
- Query the database to verify data
- Email: john@oneclickcoaching.com
