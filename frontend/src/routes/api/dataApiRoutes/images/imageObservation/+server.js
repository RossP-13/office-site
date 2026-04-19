import { json } from '@sveltejs/kit';
import { myPoolFn } from '$lib/db/mysql.js';

/**
 * Gets image information by observationID.
 *
 * Example: GET /api/dataApiRoutes/images/imageObservation/?observationID=123
 */

export async function GET({ url }) {
  const observationID = url.searchParams.get('observationID')?.trim();
  if (!observationID) {
    return json({ error: 'observationID query parameter is required' }, { status: 400 });
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
      'SELECT imageID, observationID, filePath, originalName, mimeType, fileSize, uploadedAt FROM ObservationImage WHERE observationID = ?',
      [observationID]
    );

    return json(rows.map(row => ({
      ...row,
      src: `/api/dataApiRoutes/images/serve/${row.imageID}`
    })));
  } catch (error) {
    console.error('Error fetching image information', error);
    return json({ error: 'database query failed' }, { status: 500 });
  }
}
