import { json } from '@sveltejs/kit';
import { myPoolFn } from '$lib/db/mysql.js';

export async function GET({ url }) {
  const boxID = url.searchParams.get('boxID')?.trim();

  if (!boxID) {
    return json(
      { error: 'boxID query parameter is required' },
      { status: 400 }
    );
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
      `
      SELECT 
        i.imageID,
        i.observationID,
        i.filePath,
        i.originalName,
        i.mimeType,
        i.fileSize,
        i.uploadedAt
      FROM ObservationImage i
      JOIN Observation o 
        ON i.observationID = o.observationID
      WHERE o.boxID = ?
      ORDER BY i.uploadedAt DESC
      `,
      [boxID]
    );

    return json(rows.map(row => ({
      ...row,
      src: `/api/dataApiRoutes/images/serve/${row.imageID}`
    })), { status: 200 });
  } catch (error) {
    console.error('Error fetching image information', error);
    return json({ error: 'database query failed' }, { status: 500 });
  }
}