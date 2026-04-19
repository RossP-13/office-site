import { json } from '@sveltejs/kit';
import { myPoolFn } from '$lib/db/mysql.js';

/**
 * Gets hourly observation counts for the past 24 hours: Kestrel (including American Kestrel variants) and non-Kestrel.
 *
 * Example: GET /api/graphCalcRoutes/lineChart/
 */

export async function GET({ url }) {
  const boxID = url.searchParams.get('boxID')?.trim();
  const kestrelSpecies = new Set(['kestrel', 'american kestrel']);

  let pool;
  try {
    pool = await myPoolFn();
  } catch (error) {
    console.error('Unable to get database pool', error);
    return json({ error: 'database unavailable' }, { status: 500 });
  }

  try {
    // Get observations from the past 24 hours
    let rows;
    if (boxID) {
      [rows] = await pool.execute(
        'SELECT observationSpecies, observationTime FROM Observation WHERE observationTime >= DATE_SUB(NOW(), INTERVAL 24 HOUR) AND boxID = ?',
        [boxID]
      );
    } else {
      [rows] = await pool.execute(
        'SELECT observationSpecies, observationTime FROM Observation WHERE observationTime >= DATE_SUB(NOW(), INTERVAL 24 HOUR)'
      );
    }

    // Initialize counts arrays for 24 hours (index 0 = current hour, 23 = 23 hours ago)
    const kestrelCounts = new Array(24).fill(0);
    const otherCounts = new Array(24).fill(0);

    const now = new Date();
    const currentHour = now.getHours();

    rows.forEach(row => {
      const obsTime = new Date(row.observationTime);

      const hour = obsTime.getHours(); // 0–23

      const normalizedSpecies = String(row.observationSpecies || '').trim().toLowerCase();
      if (kestrelSpecies.has(normalizedSpecies)) {
        kestrelCounts[hour]++;
      } else {
        otherCounts[hour]++;
      }
    });

    return json({
      kestrelCounts,
      otherCounts
    });
  } catch (error) {
    console.error('Error fetching observation counts', error);
    return json({ error: 'database query failed' }, { status: 500 });
  }
}
