import { myPoolFn } from '../db/mysql.js';
import bcrypt from 'bcryptjs';

const BCRYPT_ROUNDS = 12;

function isBcryptHash(value) {
	if (typeof value !== 'string') return false;
	return value.startsWith('$2a$') || value.startsWith('$2b$') || value.startsWith('$2y$');
}

export async function validateCredentials(username, password) {
	if (typeof username !== 'string' || typeof password !== 'string') {
		return false;
	}

	let pool;
	try {
		pool = await myPoolFn();
	} catch (error) {
		console.error('Unable to get database pool', error);
		return false;
	}

	try {
		const [rows] = await pool.execute(
			'SELECT userID, pass FROM AppUser WHERE username = ? LIMIT 1',
			[username]
		);

		if (rows.length === 0) {
			return false;
		}

		const user = rows[0];
		const storedPass = String(user.pass || '');

		if (isBcryptHash(storedPass)) {
			return await bcrypt.compare(password, storedPass);
		}

		// Backward-compatible fallback for legacy plaintext rows.
		if (storedPass === password) {
			try {
				const hashed = await bcrypt.hash(password, BCRYPT_ROUNDS);
				await pool.execute('UPDATE AppUser SET pass = ? WHERE userID = ?', [hashed, user.userID]);
			} catch (rehashError) {
				console.error('Password rehash migration failed', rehashError);
			}
			return true;
		}

		return false;
	} catch (error) {
		console.error('Error validating credentials', error);
		return false;
	}
}

export async function getUserByUsername(username) {
	let pool;
	try {
		pool = await myPoolFn();
	} catch (error) {
		console.error('Unable to get database pool', error);
		return null;
	}

	try {
		const [rows] = await pool.execute(
			'SELECT userID, username, email, firstName, lastName FROM AppUser WHERE username = ?',
			[username]
		);
		return rows.length > 0 ? rows[0] : null;
	} catch (error) {
		console.error('Error fetching user', error);
		return null;
	}
}

export async function updateUsername(oldUsername, newUsername) {
	let pool;
	try {
		pool = await myPoolFn();
	} catch (error) {
		console.error('Unable to get database pool', error);
		return false;
	}

	try {
		const [result] = await pool.execute(
			'UPDATE AppUser SET username = ? WHERE username = ?',
			[newUsername, oldUsername]
		);
		return result.affectedRows > 0;
	} catch (error) {
		console.error('Error updating username', error);
		return false;
	}
}

export async function updatePassword(username, newPassword) {
	if (typeof username !== 'string' || typeof newPassword !== 'string') {
		return false;
	}

	let pool;
	try {
		pool = await myPoolFn();
	} catch (error) {
		console.error('Unable to get database pool', error);
		return false;
	}

	try {
		const hashed = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
		const [result] = await pool.execute(
			'UPDATE AppUser SET pass = ? WHERE username = ?',
			[hashed, username]
		);
		return result.affectedRows > 0;
	} catch (error) {
		console.error('Error updating password', error);
		return false;
	}
}