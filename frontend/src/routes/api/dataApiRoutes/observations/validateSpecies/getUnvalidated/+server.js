import { json } from '@sveltejs/kit';
import { myPoolFn } from '$lib/db/mysql.js';

/**
 * Gets all observations with confidence under 70 and unverified status.
 *
 * Example: GET /api/dataApiRoutes/observations/validateSpecies/getUnvalidated/?boxID=1
 * Returns all observations where confidence < 70 AND verification = false AND boxID = ?
 * If no boxID provided, returns for all boxes
 */

export async function GET({ url }) {
  const boxID = url.searchParams.get('boxID')?.trim();

  let pool;
  try {
    pool = await myPoolFn();
  } catch (error) {
    console.error('Unable to get database pool', error);
    return json({ error: 'database unavailable' }, { status: 500 });
  }

  try {
    let query = 'SELECT observationID, observationSpecies, observationTime, confidence, verification, boxID FROM Observation WHERE confidence < 70 AND verification IS NULL';
    let params = [];

    if (boxID) {
      query += ' AND boxID = ?';
      params.push(boxID);
    }

    const [rows] = await pool.execute(query, params);

    if (!Array.isArray(rows)) {
      return json({ error: 'unexpected database response' }, { status: 500 });
    }

    return json(rows);
  } catch (error) {
    console.error('Error fetching unvalidated observations', error);
    return json({ error: 'database query failed' }, { status: 500 });
  }
}
