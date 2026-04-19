import { json } from '@sveltejs/kit';
import { myPoolFn } from '$lib/db/mysql.js';

/**
 * Gets observations by observationID.
 *
 * Example: GET /api/dataApiRoutes/observations/observationById/?observationID=123
 * add authentication through session/tokens that user is logged in?
 */

export async function GET({ url }) {
  const observationID = url.searchParams.get('observationID')?.trim();
  if (!observationID) {
    return json({ error: 'observationID query parameter is required' }, { status: 400 });
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
      'SELECT observationID, observationSpecies, observationTime, confidence, verification, boxID FROM Observation WHERE observationID = ?',
      [observationID]
    );

    if (!Array.isArray(rows) || rows.length === 0) {
      return json({ error: 'observation not found' }, { status: 404 });
    }

    return json(rows[0]);
  } catch (error) {
    console.error('Error fetching observations', error);
    return json({ error: 'database query failed' }, { status: 500 });
  }
}

export async function POST({ request }) {
  let pool;
  try {
    pool = await myPoolFn();
  } catch (error) {
    console.error('Unable to get database pool', error);
    return json({ error: 'database unavailable' }, { status: 500 });
  }

  let body;
  try {
    body = await request.json();
  } catch (error) {
    return json({ error: 'invalid JSON body' }, { status: 400 });
  }

  const { observationSpecies, observationTime, confidence, verification, boxID } = body;

  if (!observationSpecies || !observationTime || confidence === undefined || !verification || !boxID) {
    return json({ error: 'observationSpecies, observationTime, confidence, verification, and boxID are required' }, { status: 400 });
  }

  try {
    const [result] = await pool.execute(
      'INSERT INTO Observation (observationSpecies, observationTime, confidence, verification, boxID) VALUES (?, ?, ?, ?, ?)',
      [observationSpecies, observationTime, confidence, verification, boxID]
    );

    return json(
      {
        observationID: result.insertId,
        observationSpecies,
        observationTime,
        confidence,
        verification,
        boxID
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating observation', error);
    return json({ error: 'database query failed' }, { status: 500 });
  }
}

export async function DELETE({ url }) {
  const observationID = url.searchParams.get('observationID')?.trim();
  if (!observationID) {
    return json({ error: 'observationID query parameter is required' }, { status: 400 });
  }

  let pool;
  try {
    pool = await myPoolFn();
  } catch (error) {
    console.error('Unable to get database pool', error);
    return json({ error: 'database unavailable' }, { status: 500 });
  }

  try {
    const [result] = await pool.execute(
      'DELETE FROM Observation WHERE observationID = ?',
      [observationID]
    );

    if (result.affectedRows === 0) {
      return json({ error: 'observation not found' }, { status: 404 });
    }

    return json({ message: `Observation '${observationID}' deleted successfully` }, { status: 200 });
  } catch (error) {
    console.error('Error deleting observation', error);
    return json({ error: 'database query failed' }, { status: 500 });
  }
}