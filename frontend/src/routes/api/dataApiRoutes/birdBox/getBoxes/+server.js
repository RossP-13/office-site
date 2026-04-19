import { json } from '@sveltejs/kit';
import { myPoolFn } from '$lib/db/mysql.js';

/**
 * Gets all bird boxes.
 *
 * Example: GET /api/dataApiRoutes/birdBox/getBoxes
 */
export async function GET() {
  console.log('getBoxes API called');
  let pool;
  try {
    pool = await myPoolFn();
    console.log('Database pool created successfully');
  } catch (error) {
    console.error('Unable to get database pool', error);
    return json({ error: 'database unavailable' }, { status: 500 });
  }

  try {
    console.log('Executing query: SELECT boxID, boxName, boxLocation, isOnline, lastOnline, latCoord, longCoord FROM Birdbox');
    const [rows] = await pool.execute(
      'SELECT boxID, boxName, boxLocation, isOnline, lastOnline, latCoord, longCoord FROM Birdbox'
    );
    console.log('Query executed successfully, rows:', rows);

    return json(rows);
  } catch (error) {
    console.error('Error fetching bird boxes', error);
    return json({ error: 'database query failed', details: error.message }, { status: 500 });
  }
}
