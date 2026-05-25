import { getPipelineDatabase } from './storage/database';

export interface EnrichmentResult {
  caption: string;
  summary: string;
  entities: string[];
  topics: string[];
  language: string;
}

let modelInstance: any = null;

export function setEnrichmentModel(model: any) {
  modelInstance = model;
}

export async function enrichScreenshot(
  screenshotUri: string,
  ocrText: string,
  screenshotId: string,
): Promise<EnrichmentResult> {
  if (!modelInstance) {
    throw new Error('Enrichment model not initialized. Call setEnrichmentModel first.');
  }

  const messages = [
    {
      role: 'user' as const,
      content: `Analyze this screenshot. OCR text found: "${ocrText}"\n\nProvide a structured response with:
1. A one-line caption
2. A brief 2-3 sentence summary
3. Key entities (comma-separated)
4. Topics or categories (comma-separated)

Format:
CAPTION: [caption]
SUMMARY: [summary]
ENTITIES: [entities]
TOPICS: [topics]`,
    },
  ];

  const response = await modelInstance.sendMessageWithImage(messages, screenshotUri);
  const responseText = response.content || '';

  const caption = parseField(responseText, 'CAPTION') || 'Unknown';
  const summary = parseField(responseText, 'SUMMARY') || '';
  const entities = parseField(responseText, 'ENTITIES')
    ?.split(',')
    .map((e) => e.trim())
    .filter(Boolean) || [];
  const topics = parseField(responseText, 'TOPICS')
    ?.split(',')
    .map((t) => t.trim())
    .filter(Boolean) || [];

  const result: EnrichmentResult = {
    caption,
    summary,
    entities,
    topics,
    language: 'en',
  };

  const db = await getPipelineDatabase();

  await db.runAsync(
    `INSERT OR REPLACE INTO enrichment (screenshot_id, caption, summary, entities_json, topics_json, model_name, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      screenshotId,
      result.caption,
      result.summary,
      JSON.stringify(result.entities),
      JSON.stringify(result.topics),
      'gemma-3n-e2b-it-int4',
      Date.now(),
    ],
  );

  await db.runAsync(`DELETE FROM search_index WHERE screenshot_id = ?`, [screenshotId]);
  await db.runAsync(
    `INSERT INTO search_index (screenshot_id, ocr_text, caption, summary, topics, entities)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      screenshotId,
      ocrText,
      result.caption,
      result.summary,
      JSON.stringify(result.topics),
      JSON.stringify(result.entities),
    ],
  );

  await db.runAsync(
    `UPDATE ingestion_queue SET stage = 'done', state = 'completed', updated_at = ?
     WHERE screenshot_id = ?`,
    [Date.now(), screenshotId],
  );

  return result;
}

export async function getEnrichmentResult(screenshotId: string): Promise<EnrichmentResult | null> {
  const db = await getPipelineDatabase();

  const row = await db.getFirstAsync<{
    caption: string;
    summary: string;
    entities_json: string;
    topics_json: string;
  }>(`SELECT caption, summary, entities_json, topics_json FROM enrichment WHERE screenshot_id = ?`, [
    screenshotId,
  ]);

  if (!row) return null;

  return {
    caption: row.caption,
    summary: row.summary,
    entities: row.entities_json ? JSON.parse(row.entities_json) : [],
    topics: row.topics_json ? JSON.parse(row.topics_json) : [],
    language: 'en',
  };
}

function parseField(text: string, fieldName: string): string | undefined {
  const regex = new RegExp(`${fieldName}:\\s*(.+?)(?=\\n[A-Z]+:|$)`, 's');
  const match = text.match(regex);
  return match?.[1]?.trim();
}
