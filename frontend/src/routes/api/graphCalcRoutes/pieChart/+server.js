import { json } from '@sveltejs/kit';
import { myPoolFn } from '$lib/db/mysql.js';

/**
 * Gets counts of observations: Kestrel (including American Kestrel variants) and non-Kestrel.
 *
 * Example: GET /api/graphCalcRoutes/peChart/
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
    // Count Kestrel observations
    let kestrelRows;
    if (boxID) {
      [kestrelRows] = await pool.execute(
        'SELECT COUNT(*) as count FROM Observation WHERE LOWER(TRIM(observationSpecies)) IN (?, ?) AND boxID = ?',
        ['kestrel', 'american kestrel', boxID]
      );
    } else {
      [kestrelRows] = await pool.execute(
        'SELECT COUNT(*) as count FROM Observation WHERE LOWER(TRIM(observationSpecies)) IN (?, ?)',
        ['kestrel', 'american kestrel']
      );
    }
    const kestrelCount = kestrelRows[0].count;

    // Count all observations
    let totalRows;
    if (boxID) {
      [totalRows] = await pool.execute(
        'SELECT COUNT(*) as count FROM Observation WHERE boxID = ?',
        [boxID]
      );
    } else {
      [totalRows] = await pool.execute('SELECT COUNT(*) as count FROM Observation');
    }
    const totalCount = totalRows[0].count;

    // Non-Kestrel count
    const otherCount = totalCount - kestrelCount;

    return json({
      kestrelCount,
      otherCount,
      totalCount
    });
  } catch (error) {
    console.error('Error fetching observation counts', error);
    return json({ error: 'database query failed' }, { status: 500 });
  }
}
