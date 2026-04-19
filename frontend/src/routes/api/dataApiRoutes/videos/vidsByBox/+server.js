import { json } from '@sveltejs/kit';
import { myPoolFn } from '$lib/db/mysql.js';

/**
 * Gets videos by bird box ID.
 *
 * Example: GET /api/dataApiRoutes/videos/vidsByBox/?boxID=123
 */

export async function GET({ url }) {
  const boxID = url.searchParams.get('boxID')?.trim();
  if (!boxID) {
    return json({ error: 'boxID query parameter is required' }, { status: 400 });
  }

  let pool;
  try {
    pool = await myPoolFn();
  } catch (error) {
    console.error('Unable to get database pool', error);
    return json({ error: 'database unavailable' }, { status: 500 });
  }

  try {
    const [rows] = await pool.execute(
      'SELECT videoID, boxID, filePath, originalName, mimeType, fileSize, durationSeconds, capturedAt, uploadedAt FROM Video WHERE boxID = ?',
      [boxID]
    );

    return json(rows, { status: 200 });
  } catch (error) {
    console.error('Error fetching videos', error);
    return json({ error: 'database query failed' }, { status: 500 });
  }
}
