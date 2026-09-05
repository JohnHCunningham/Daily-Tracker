import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import * as fs from 'fs'
import * as path from 'path'
import * as crypto from 'crypto'

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const OPENAI_API_KEY = process.env.OPENAI_API_KEY!

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
const openai = new OpenAI({ apiKey: OPENAI_API_KEY })

// Files to exclude (internal development docs)
const EXCLUDE_PATTERNS = [
  'node_modules',
  '.git',
  'COMPROMISES-MADE',
  'DEPLOYMENT-GUIDE',
  'SETUP-GUIDE',
  'QUICK-START-GUIDE',
  'AUTH-SETUP',
  'FIREFLIES-SETUP',
  'NOTIFICATION-SETUP',
  'WEEK-1-PROGRESS',
  'WHERE-WE-ARE-NOW',
  'CURRENT-STATUS',
  'CELEBRATION-DEMO',
  'INTEGRATION-LAYER-PLAN',
  'INVITATION-TEST-PLAN',
  'MOBILE-SIDEBAR-FIX',
  'REP-ISOLATION-AUDIT',
  'REPO-STRUCTURE',
  'SECURITY-SETUP',
  'TEAM-INVITATIONS-STATUS',
  'BRAND-COLOR-MIGRATION',
]

interface Chunk {
  title: string
  content: string
  sourceFile: string
  index: number
  methodology: string
  contentType: string
}

function shouldIncludeFile(filePath: string): boolean {
  const fileName = path.basename(filePath, '.md')
  return !EXCLUDE_PATTERNS.some(pattern =>
    fileName.includes(pattern) || filePath.includes(pattern)
  )
}

function detectMethodology(content: string, fileName: string): string {
  const lower = content.toLowerCase() + fileName.toLowerCase()

  if (lower.includes('sandler')) return 'sandler'
  if (lower.includes('challenger')) return 'challenger'
  if (lower.includes('meddic') || lower.includes('meddpicc')) return 'meddic'
  if (lower.includes('gap selling')) return 'gap_selling'
  if (lower.includes('spin')) return 'spin'

  return 'general' // For methodology-agnostic content
}

function detectContentType(content: string, fileName: string): string {
  const lower = content.toLowerCase() + fileName.toLowerCase()

  if (lower.includes('objection')) return 'objection_handling'
  if (lower.includes('script')) return 'script'
  if (lower.includes('best practice')) return 'best_practice'
  if (fileName.includes('LANDING-PAGE-COPY') || fileName.includes('CLAUDE')) return 'marketing'

  return 'knowledge'
}

function chunkMarkdown(content: string, sourceFile: string): Chunk[] {
  const chunks: Chunk[] = []
  const fileName = path.basename(sourceFile, '.md')

  // Split by headers (## or #)
  const sections = content.split(/(?=^#{1,2}\s)/m)

  sections.forEach((section, index) => {
    const trimmed = section.trim()
    if (!trimmed || trimmed.length < 50) return // Skip very small sections

    // Extract title from header
    const titleMatch = trimmed.match(/^#{1,2}\s+(.+)$/m)
    const title = titleMatch ? titleMatch[1] : `${fileName} - Section ${index + 1}`

    const methodology = detectMethodology(trimmed, fileName)
    const contentType = detectContentType(trimmed, fileName)

    chunks.push({
      title,
      content: trimmed,
      sourceFile,
      index,
      methodology,
      contentType,
    })
  })

  return chunks
}

async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text.substring(0, 8000), // Limit text length
    })
    return response.data[0].embedding
  } catch (error) {
    console.error('Error generating embedding:', error)
    throw error
  }
}

async function findMarkdownFiles(dir: string): Promise<string[]> {
  const files: string[] = []

  function walk(currentPath: string) {
    const entries = fs.readdirSync(currentPath, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name)

      if (entry.isDirectory()) {
        // Skip excluded directories
        if (!EXCLUDE_PATTERNS.some(pattern => entry.name.includes(pattern))) {
          walk(fullPath)
        }
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        if (shouldIncludeFile(fullPath)) {
          files.push(fullPath)
        }
      }
    }
  }

  walk(dir)
  return files
}

async function populateKnowledgeBase() {
  console.log('🚀 Starting knowledge base population...')

  // Find all markdown files
  const rootDir = path.join(__dirname, '..')
  const markdownFiles = await findMarkdownFiles(rootDir)

  console.log(`📚 Found ${markdownFiles.length} markdown files to process`)

  let totalChunks = 0
  let successCount = 0
  let errorCount = 0

  for (const filePath of markdownFiles) {
    try {
      console.log(`\n📄 Processing: ${path.relative(rootDir, filePath)}`)

      const content = fs.readFileSync(filePath, 'utf-8')
      const chunks = chunkMarkdown(content, path.relative(rootDir, filePath))

      console.log(`   ✂️  Created ${chunks.length} chunks`)

      for (const chunk of chunks) {
        try {
          // Generate embedding
          const embedding = await generateEmbedding(chunk.content)

          // Generate hash for caching
          const textHash = crypto
            .createHash('sha256')
            .update(chunk.content)
            .digest('hex')

          // Insert into knowledge base
          const { error } = await supabase
            .from('Sandler_Knowledge_Base')
            .insert({
              content_type: chunk.contentType,
              chunk_title: chunk.title,
              chunk_text: chunk.content,
              source_file: chunk.sourceFile,
              chunk_index: chunk.index,
              methodology: chunk.methodology,
              embedding: JSON.stringify(embedding),
              is_active: true,
            })

          if (error) {
            console.error(`   ❌ Error inserting chunk: ${error.message}`)
            errorCount++
          } else {
            successCount++
          }

          totalChunks++

          // Rate limiting - wait 100ms between API calls
          await new Promise(resolve => setTimeout(resolve, 100))

        } catch (error) {
          console.error(`   ❌ Error processing chunk: ${error}`)
          errorCount++
        }
      }

    } catch (error) {
      console.error(`❌ Error processing file ${filePath}:`, error)
      errorCount++
    }
  }

  console.log('\n' + '='.repeat(50))
  console.log('📊 Summary:')
  console.log(`   Total chunks processed: ${totalChunks}`)
  console.log(`   ✅ Successful: ${successCount}`)
  console.log(`   ❌ Errors: ${errorCount}`)
  console.log('='.repeat(50))
  console.log('\n✨ Knowledge base population complete!')
}

// Run the script
populateKnowledgeBase().catch(console.error)
