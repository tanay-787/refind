import { getPipelineDatabase } from '../storage/database';
import { generateTextEmbedding } from '../embeddings';

export interface SearchResult {
  screenshotId: string;
  uri: string;
  filename: string;
  ocrText: string;
  caption: string;
  summary: string;
  entities: string[];
  topics: string[];
  score: number;
  searchMethod: 'fts' | 'embedding' | 'metadata';
}

export async function hybridSearch(
  query: string,
  limit: number = 20,
  useEmbeddings: boolean = true,
): Promise<SearchResult[]> {
  const db = await getPipelineDatabase();
  const candidates = new Map<string, SearchResult>();

  if (useEmbeddings) {
    try {
      const queryEmbedding = await generateTextEmbedding(query);
      const embeddingJson = JSON.stringify(Array.from(queryEmbedding));

      const results = await db.getAllAsync<{
        screenshot_id: string;
        uri: string;
        filename: string;
        ocrText: string;
        caption: string;
        summary: string;
        entities_json: string;
        topics_json: string;
        distance: number;
      }>(`
        SELECT 
          s.id as screenshot_id,
          s.uri,
          s.filename,
          o.text as ocrText,
          en.caption,
          en.summary,
          en.entities_json,
          en.topics_json,
          vec_distance(v.embedding, ?) as distance
        FROM embeddings emb
        JOIN screenshots s ON s.id = emb.screenshot_id
        LEFT JOIN ocr_results o ON o.screenshot_id = s.id
        LEFT JOIN embeddings_vec v ON v.screenshot_id = s.id
        LEFT JOIN enrichment en ON en.screenshot_id = s.id
        WHERE v.embedding IS NOT NULL AND vec_distance(v.embedding, ?) < 0.7
        ORDER BY distance ASC
        LIMIT ?
      `, [embeddingJson, embeddingJson, limit]);

      results.forEach((row) => {
        if (!candidates.has(row.screenshot_id)) {
          candidates.set(row.screenshot_id, {
            screenshotId: row.screenshot_id,
            uri: row.uri,
            filename: row.filename,
            ocrText: row.ocrText || '',
            caption: row.caption || '',
            summary: row.summary || '',
            entities: row.entities_json ? JSON.parse(row.entities_json) : [],
            topics: row.topics_json ? JSON.parse(row.topics_json) : [],
            score: 1 - row.distance,
            searchMethod: 'embedding',
          });
        }
      });
    } catch {
      // Fall back to FTS if embeddings fail
    }
  }

  const ftsResults = await db.getAllAsync<{
    screenshot_id: string;
    uri: string;
    filename: string;
    ocrText: string;
    caption: string;
    summary: string;
    entities_json: string;
    topics_json: string;
  }>(`
    SELECT 
      s.id as screenshot_id,
      s.uri,
      s.filename,
      o.text as ocrText,
      e.caption,
      e.summary,
      e.entities_json,
      e.topics_json
    FROM search_index si
    JOIN screenshots s ON s.id = si.screenshot_id
    LEFT JOIN ocr_results o ON o.screenshot_id = s.id
    LEFT JOIN enrichment e ON e.screenshot_id = s.id
    WHERE si MATCH ?
    LIMIT ?
  `, [`"${query}"*`, limit]);

  ftsResults.forEach((row) => {
    if (!candidates.has(row.screenshot_id)) {
      candidates.set(row.screenshot_id, {
        screenshotId: row.screenshot_id,
        uri: row.uri,
        filename: row.filename,
        ocrText: row.ocrText || '',
        caption: row.caption || '',
        summary: row.summary || '',
        entities: row.entities_json ? JSON.parse(row.entities_json) : [],
        topics: row.topics_json ? JSON.parse(row.topics_json) : [],
        score: 0.8,
        searchMethod: 'fts',
      });
    }
  });

  const results = Array.from(candidates.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return results;
}

export async function metadataSearch(
  topic?: string,
  entity?: string,
  limit: number = 20,
): Promise<SearchResult[]> {
  const db = await getPipelineDatabase();

  let query = `
    SELECT 
      s.id as screenshot_id,
      s.uri,
      s.filename,
      o.text as ocrText,
      e.caption,
      e.summary,
      e.entities_json,
      e.topics_json
    FROM enrichment e
    JOIN screenshots s ON s.id = e.screenshot_id
    LEFT JOIN ocr_results o ON o.screenshot_id = s.id
    WHERE 1=1
  `;

  const params: any[] = [];

  if (topic) {
    query += ` AND e.topics_json LIKE ?`;
    params.push(`%"${topic}"%`);
  }

  if (entity) {
    query += ` AND e.entities_json LIKE ?`;
    params.push(`%"${entity}"%`);
  }

  query += ` LIMIT ?`;
  params.push(limit);

  const results = await db.getAllAsync<{
    screenshot_id: string;
    uri: string;
    filename: string;
    ocrText: string;
    caption: string;
    summary: string;
    entities_json: string;
    topics_json: string;
  }>(query, params);

  return results.map((row) => ({
    screenshotId: row.screenshot_id,
    uri: row.uri,
    filename: row.filename,
    ocrText: row.ocrText || '',
    caption: row.caption || '',
    summary: row.summary || '',
    entities: row.entities_json ? JSON.parse(row.entities_json) : [],
    topics: row.topics_json ? JSON.parse(row.topics_json) : [],
    score: 0.75,
    searchMethod: 'metadata',
  }));
}
