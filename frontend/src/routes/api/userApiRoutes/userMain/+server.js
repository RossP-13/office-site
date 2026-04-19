import { json } from '@sveltejs/kit';
import { myPoolFn } from '$lib/db/mysql.js';

/**
 * Get a user by username.
 *
 * Example: GET /api/dataApiRoutes/user/getUser/?username=exampleUsr
 * add authentication through session/tokens that user is logged in?
 */
export async function GET({ url }) {
  const username = url.searchParams.get('username')?.trim();
  if (!username) {
    return json({ error: 'username query parameter is required' }, { status: 400 });
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
      'SELECT userID, username, email, firstName, lastName FROM AppUser WHERE username = ?',
      [username]
    );

    if (!Array.isArray(rows) || rows.length === 0) {
      return json({ error: 'user not found' }, { status: 404 });
    }

    return json(rows[0]);
  } catch (error) {
    console.error('Error fetching user', error);
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

  const { username, pass, email, firstName, lastName } = body;

  if (!username || !pass || !email) {
    return json({ error: 'username, pass, and email are required' }, { status: 400 });
  }

  try {
    const [result] = await pool.execute(
      'INSERT INTO AppUser (username, pass, email, firstName, lastName) VALUES (?, ?, ?, ?, ?)',
      [username, pass, email, firstName || null, lastName || null]
    );

    return json(
      {
        userID: result.insertId,
        username,
        email,
        firstName: firstName || null,
        lastName: lastName || null
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating user', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return json({ error: 'username or email already exists' }, { status: 409 });
    }
    return json({ error: 'database query failed' }, { status: 500 });
  }
}   

export async function DELETE({ url }) {
  const username = url.searchParams.get('username')?.trim();
  if (!username) {
    return json({ error: 'username query parameter is required' }, { status: 400 });
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
      'DELETE FROM AppUser WHERE username = ?',
      [username]
    );

    if (result.affectedRows === 0) {
      return json({ error: 'user not found' }, { status: 404 });
    }

    return json({ message: `User '${username}' deleted successfully` }, { status: 200 });
  } catch (error) {
    console.error('Error deleting user', error);
    return json({ error: 'database query failed' }, { status: 500 });
  }
}