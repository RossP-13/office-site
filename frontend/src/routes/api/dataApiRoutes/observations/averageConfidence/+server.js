import { json } from '@sveltejs/kit';
import { myPoolFn } from '$lib/db/mysql.js';

/**
 * Gets the average confidence percentage of all observations for a specific box.
 *
 * Example: GET /api/dataApiRoutes/observations/averageConfidence?boxID=1
 */
export async function GET({ url }) {
  console.log('averageConfidence API called');
  const boxID = url.searchParams.get('boxID');

  if (!boxID) {
    return json({ error: 'boxID parameter is required' }, { status: 400 });
  }

  let pool;
  try {
    pool = await myPoolFn();
    console.log('Database pool created successfully');
  } catch (error) {
    console.error('Unable to get database pool', error);
    return json({ error: 'database unavailable' }, { status: 500 });
  }

  try {
    console.log(`Executing query: SELECT AVG(confidence) as avgConfidence FROM Observation WHERE boxID = ${boxID}`);
    const [rows] = await pool.execute(
      'SELECT AVG(confidence) as avgConfidence FROM Observation WHERE boxID = ?',
      [boxID]
    );
    console.log('Query executed successfully, rows:', rows);

    if (rows.length === 0 || rows[0].avgConfidence === null) {
      return json({ averageConfidence: 0 });
    }

    const averageConfidence = Math.round(rows[0].avgConfidence);
    console.log('Calculated average confidence:', averageConfidence);

    return json({ averageConfidence });
  } catch (error) {
    console.error('Error calculating average confidence', error);
    return json({ error: 'database query failed', details: error.message }, { status: 500 });
  }
}