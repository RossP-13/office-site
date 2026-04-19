import { json } from '@sveltejs/kit';
import { myPoolFn } from '$lib/db/mysql.js';

/**
 * Updates the verification status of an observation.
 *
 * Example: PUT /api/dataApiRoutes/observations/validateSpecies/updateVerification/
 * Body: { "observationID": "123", "verification": true, "boxID": "1" }
 * If boxID is provided, ensures the observation belongs to that box
 * add authentication through session/tokens that user is logged in?
 */

export async function PUT({ request }) {
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

  const { observationID, verification, boxID, verificationText } = body;

  if (!observationID) {
    return json({ error: 'observationID is required' }, { status: 400 });
  }

  if (verification === undefined) {
    return json({ error: 'verification is required' }, { status: 400 });
  }

  try {
    let query = 'UPDATE Observation SET verification = ?, verificationText = ? WHERE observationID = ?';
    let params = [verification, verificationText, observationID];

    if (boxID) {
      query += ' AND boxID = ?';
      params.push(boxID);
    }

    const [result] = await pool.execute(query, params);

    if (result.affectedRows === 0) {
      return json({ error: 'observation not found or does not belong to specified box' }, { status: 404 });
    }

    return json(
      {
        message: `Observation '${observationID}' verification updated to '${verification}'`,
        observationID,
        verification
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating observation verification', error);
    return json({ error: 'database query failed' }, { status: 500 });
  }
}
