import { json } from '@sveltejs/kit';
import { myPoolFn } from '$lib/db/mysql.js';

/**
 * Gets daily observation counts for the entire dataset: Kestrel (including American Kestrel variants) and non-Kestrel.
 *
 * Example: GET /api/graphCalcRoutes/barChart/
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
    // Get daily counts grouped by date and species
    let rows;
    if (boxID) {
      [rows] = await pool.execute(
        'SELECT DATE(observationTime) as obsDate, observationSpecies, COUNT(*) as count FROM Observation WHERE boxID = ? GROUP BY obsDate, observationSpecies ORDER BY obsDate',
        [boxID]
      );
    } else {
      [rows] = await pool.execute(
        'SELECT DATE(observationTime) as obsDate, observationSpecies, COUNT(*) as count FROM Observation GROUP BY obsDate, observationSpecies ORDER BY obsDate'
      );
    }

    // Process into daily data
    const dailyData = {};
    rows.forEach(row => {
      const date = row.obsDate;
      if (!dailyData[date]) {
        dailyData[date] = { date, kestrel: 0, other: 0 };
      }
      const normalizedSpecies = String(row.observationSpecies || '').trim().toLowerCase();
      if (kestrelSpecies.has(normalizedSpecies)) {
        dailyData[date].kestrel = row.count;
      } else {
        dailyData[date].other += row.count;
      }
    });

    // Convert to array and sort by date
    const result = Object.values(dailyData).sort((a, b) => new Date(a.date) - new Date(b.date));

    return json(result);
  } catch (error) {
    console.error('Error fetching daily observation counts', error);
    return json({ error: 'database query failed' }, { status: 500 });
  }
}
