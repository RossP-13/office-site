import { json } from '@sveltejs/kit';
import { myPoolFn } from '$lib/db/mysql.js';

/**
 * Gets single bird box coordinates ID.
 *
 * Example: GET /api/dataApiRoutes/birdBox/getBox/?boxID=123
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
      'SELECT latCoord, longCoord FROM Birdbox WHERE boxID = ?',
      [boxID]
    );

    if (!Array.isArray(rows) || rows.length === 0) {
      return json({ error: 'box coords not found' }, { status: 404 });
    }

    return json(rows[0], { status: 200 });
  } catch (error) {
    console.error('Error fetching box coords', error);
    return json({ error: 'database query failed' }, { status: 500 });
  }
}
