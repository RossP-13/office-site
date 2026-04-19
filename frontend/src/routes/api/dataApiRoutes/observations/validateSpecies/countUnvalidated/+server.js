import { json } from '@sveltejs/kit';
import { myPoolFn } from '$lib/db/mysql.js';

/**
 * Gets the count of observations with confidence under 70 and unverified status.
 *
 * Example: GET /api/dataApiRoutes/observations/validateSpecies/countUnvalidated/?boxID=1
 * Returns the count of observations where confidence < 70 AND verification = false AND boxID = ?
 * If no boxID provided, returns count for all boxes
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
    let query = 'SELECT COUNT(*) as count FROM Observation WHERE confidence < 70 AND verification IS NULL';
    let params = [];

    if (boxID) {
      query += ' AND boxID = ?';
      params.push(boxID);
    }

    const [rows] = await pool.execute(query, params);

    if (!Array.isArray(rows) || rows.length === 0) {
      return json({ error: 'unexpected database response' }, { status: 500 });
    }

    return json({ count: rows[0].count });
  } catch (error) {
    console.error('Error counting unvalidated observations', error);
    return json({ error: 'database query failed' }, { status: 500 });
  }
}
