import { json } from '@sveltejs/kit';
import { myPoolFn } from '$lib/db/mysql.js';

/**
 * Get, POST, PUT, or DELETE a single video by ID.
 *
 * Example: GET /api/dataApiRoutes/videos/vidByID/?videoID=123
 */

export async function GET({ url }) {
  const videoID = url.searchParams.get('videoID')?.trim();
  if (!videoID) {
    return json({ error: 'videoID query parameter is required' }, { status: 400 });
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
      'SELECT videoID, boxID, filePath, originalName, mimeType, fileSize, durationSeconds, capturedAt, uploadedAt FROM Video WHERE videoID = ?',
      [videoID]
    );

    if (!Array.isArray(rows) || rows.length === 0) {
      return json({ error: 'video not found' }, { status: 404 });
    }

    return json(rows[0], { status: 200 });
  } catch (error) {
    console.error('Error fetching video', error);
    return json({ error: 'database query failed' }, { status: 500 });
  }
}

export async function POST({ request }) {
  let body;
  try {
    body = await request.json();
  } catch (error) {
    return json({ error: 'invalid JSON body' }, { status: 400 });
  }

  const { boxID, filePath, originalName, mimeType, fileSize, durationSeconds, capturedAt } = body;
  if (!boxID || !filePath || !originalName || !mimeType || !fileSize || !durationSeconds || !capturedAt) {
    return json({ error: 'boxID, filePath, originalName, mimeType, fileSize, durationSeconds, and capturedAt are required' }, { status: 400 });
  }

  let pool;
  try {
    pool = await myPoolFn();
  } catch (error) {
    console.error('Unable to get database pool', error);
    return json({ error: 'database unavailable' }, { status: 500 });
  }

  try {
    const [result] = await pool.execute(
      'INSERT INTO Video (boxID, filePath, originalName, mimeType, fileSize, durationSeconds, capturedAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [boxID, filePath, originalName, mimeType, fileSize, durationSeconds, capturedAt]
    );

    return json(
      {
        videoID: result.insertId,
        boxID,
        filePath,
        originalName,
        mimeType,
        fileSize,
        durationSeconds,
        capturedAt
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating video', error);
    return json({ error: 'database query failed' }, { status: 500 });
  }
}

export async function DELETE({ url }) {
  const videoID = url.searchParams.get('videoID')?.trim();
  if (!videoID) {
    return json({ error: 'videoID query parameter is required' }, { status: 400 });
  }

  let pool;
  try {
    pool = await myPoolFn();
  } catch (error) {
    console.error('Unable to get database pool', error);
    return json({ error: 'database unavailable' }, { status: 500 });
  }

  try {
    const [result] = await pool.execute('DELETE FROM Video WHERE videoID = ?', [videoID]);

    if (result.affectedRows === 0) {
      return json({ error: 'video not found' }, { status: 404 });
    }

    return json({ message: `Video '${videoID}' deleted successfully` }, { status: 200 });
  } catch (error) {
    console.error('Error deleting video', error);
    return json({ error: 'database query failed' }, { status: 500 });
  }
}
