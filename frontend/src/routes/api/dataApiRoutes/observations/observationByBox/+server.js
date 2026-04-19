import { json } from '@sveltejs/kit';
import { myPoolFn } from '$lib/db/mysql.js';

/**
 * Gets observations by boxID.
 *
 * Example: GET /api/dataApiRoutes/observations/observationByBox/?boxID=123
 * add authentication through session/tokens that user is logged in?
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
      'SELECT observationID, observationSpecies, observationTime, confidence, verification, boxID FROM Observation WHERE boxID = ?',
      [boxID]
    );

    return json(rows);
  } catch (error) {
    console.error('Error fetching observations', error);
    return json({ error: 'database query failed' }, { status: 500 });
  }
}