import { sql } from 'drizzle-orm';
import { generateTextEmbedding } from '../embeddings';
import { getDrizzleDb } from '../storage/database';
import { canonicalize } from '../stages/03-ocr_postprocess.stage';

export interface SearchResult {
  jobId: string;
  uri: string;
  ocrText: string;
  keywords: string[];
  score: number;
  searchMethod: 'fts' | 'embedding' | 'hybrid';
}

/**
 * Query-Conditioned Scorer
 * Calculates how well a result "explains" the query tokens relative to the query context.
 * Importance is dynamic: a word is important ONLY if it matches the query.
 */
function calculateQueryScore(queryTokens: string[], docText: string, docKeywords: string[]): number {
  if (queryTokens.length === 0) return 0;
  
  let matches = 0;
  const canonDoc = canonicalize(docText);
  // Keywords already contains expanded and canonicalized tokens from Stage 5
  const canonKeywords = docKeywords.map(k => canonicalize(k));

  for (const token of queryTokens) {
    const canonToken = canonicalize(token);
    
    // Priority 1: Exact or Expanded Keyword Match (High Signal Identity)
    // This catches "Infy" in "ARGxInfyy" because Stage 5 expanded it.
    if (canonKeywords.includes(canonToken)) {
      matches += 1.0;
    } 
    // Priority 2: Substring Match in Raw Text (Lower Signal)
    else if (canonDoc.includes(canonToken)) {
      matches += 0.5;
    }
  }

  // Score is the ratio of query tokens "explained" by the document
  return matches / queryTokens.length;
}

export async function hybridSearch(
  query: string,
  limit: number = 20,
  useEmbeddings: boolean = true,
): Promise<SearchResult[]> {
  const db = await getDrizzleDb();
  const candidates = new Map<string, SearchResult>();

  const sanitizedQuery = query.trim();
  if (!sanitizedQuery) return [];

  const queryTokens = sanitizedQuery.split(/\s+/).filter(Boolean);
  const canonQuery = canonicalize(sanitizedQuery);

  // 1. Semantic Search (Vector)
  if (useEmbeddings) {
    try {
      console.log(`[hybridSearch] Attempting vector search for: "${sanitizedQuery}"`);
      const queryEmbedding = await generateTextEmbedding(sanitizedQuery);
      const embeddingJson = JSON.stringify(Array.from(queryEmbedding));

      const vectorResults = await db.all(sql`
        SELECT 
          v.job_id,
          vec_distance(v.embedding, ${embeddingJson}) as distance,
          j.image_uri as uri,
          o.text as ocrText
        FROM image_embedding_index v
        JOIN job_journal_jobs j ON j.id = v.job_id
        LEFT JOIN ocr_postprocess_stage_results o ON o.job_id = v.job_id
        WHERE vec_distance(v.embedding, ${embeddingJson}) < 0.7
        ORDER BY distance ASC
        LIMIT ${limit}
      `);

      vectorResults.forEach((row: any) => {
        candidates.set(row.job_id, {
          jobId: row.job_id,
          uri: row.uri,
          ocrText: row.ocrText || '',
          keywords: [], 
          score: 1 - row.distance,
          searchMethod: 'embedding',
        });
      });
    } catch (err) {
      console.warn('[hybridSearch] Vector search failed:', err instanceof Error ? err.message : String(err));
    }
  }

  // 2. Keyword/Text Search (FTS5) - BROAD RETRIEVAL + DYNAMIC RERANKING
  if (queryTokens.length > 0) {
    // Permissive broad retrieval: OR logic to get anything potentially related
    const ftsQuery = queryTokens.map(t => `${t}*`).join(' OR '); 
    const trigramQuery = canonQuery.replace(/[^\w]/g, ' ').trim();

    try {
      console.log(`[hybridSearch] Broad retrieval with FTS ("${ftsQuery}") and Trigram ("${trigramQuery}")`);
      
      const rawMatches = await db.all(sql`
        SELECT 
          idx.job_id,
          o.text as cleaned_ocr_text,
          idx.keywords,
          j.image_uri as uri
        FROM screenshot_search_index idx
        JOIN job_journal_jobs j ON j.id = idx.job_id
        LEFT JOIN ocr_postprocess_stage_results o ON o.job_id = idx.job_id
        WHERE screenshot_search_index MATCH ${ftsQuery}
        UNION
        SELECT 
          tri.job_id,
          o.text as cleaned_ocr_text,
          tri.keywords,
          j.image_uri as uri
        FROM screenshot_search_trigram tri
        JOIN job_journal_jobs j ON j.id = tri.job_id
        LEFT JOIN ocr_postprocess_stage_results o ON o.job_id = tri.job_id
        WHERE screenshot_search_trigram MATCH ${trigramQuery}
        LIMIT 100
      `);

      console.log(`[hybridSearch] Broad retrieval found ${rawMatches.length} raw candidates. Reranking...`);

      rawMatches.forEach((row: any) => {
        const docKeywords = row.keywords ? row.keywords.split(' ') : [];
        const relevanceScore = calculateQueryScore(queryTokens, row.cleaned_ocr_text || '', docKeywords);
        
        const existing = candidates.get(row.job_id);
        if (existing) {
          // If already found by vector, we boost it if FTS also confirms relevance
          existing.score = Math.max(existing.score, relevanceScore);
          existing.searchMethod = 'hybrid';
        } else if (relevanceScore > 0) {
          candidates.set(row.job_id, {
            jobId: row.job_id,
            uri: row.uri,
            ocrText: row.cleaned_ocr_text || '',
            keywords: docKeywords,
            score: relevanceScore,
            searchMethod: 'fts',
          });
        }
      });
    } catch (err) {
      console.warn('[hybridSearch] FTS broad retrieval/reranking failed:', err);
    }
  }

  const finalResults = Array.from(candidates.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
    
  if (finalResults.length === 0) {
    const countResult = await db.all(sql`SELECT count(*) as count FROM screenshot_search_index`) as { count: number }[];
    console.log(`[hybridSearch] No results found for query: "${sanitizedQuery}". Index contains ${countResult[0]?.count ?? 0} total documents.`);
  }

  return finalResults;
}
