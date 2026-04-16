import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const credentialsPath =
	process.env.CREDENTIALS_FILE ||
	path.resolve(__dirname, '..', '..', '..', '..', 'config', 'credentials.json');

export function loadCredentials() {
	const data = fs.readFileSync(credentialsPath, 'utf-8');
	return JSON.parse(data);
}

export function validateCredentials(username, password) {
	const credentials = loadCredentials();
	const account = credentials.accounts.find((acc) => acc.username === username);
	return !!(account && account.password === password);
}

export function getUserByUsername(username) {
	const credentials = loadCredentials();
	return credentials.accounts.find((acc) => acc.username === username);
}

export function saveCredentials(credentials) {
	fs.writeFileSync(credentialsPath, JSON.stringify(credentials, null, 2));
}

export function updateUsername(oldUsername, newUsername) {
	const credentials = loadCredentials();
	const accountIndex = credentials.accounts.findIndex((acc) => acc.username === oldUsername);

	if (accountIndex !== -1) {
		credentials.accounts[accountIndex].username = newUsername;
		saveCredentials(credentials);
		return true;
	}
	return false;
}

export function updatePassword(username, newPassword) {
	const credentials = loadCredentials();
	const accountIndex = credentials.accounts.findIndex((acc) => acc.username === username);

	if (accountIndex !== -1) {
		credentials.accounts[accountIndex].password = newPassword;
		saveCredentials(credentials);
		return true;
	}
	return false;
}