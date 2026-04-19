import { json } from '@sveltejs/kit';
import { myPoolFn } from '$lib/db/mysql.js';
import { basename } from 'node:path';

/**
 * Mass-import endpoint for raw dictionary payloads from output.json.
 *
 * Accepts flexible payload shapes, including:
 * - { raw: {...} }
 * - { dictionary: {...} }
 * - { data: {...} }
 * - direct dictionary object
 */
export async function POST({ request }) {
	let payload;
	let uploadFormData = null;

	const contentType = request.headers.get('content-type') || '';

	if (contentType.includes('multipart/form-data')) {
		try {
			uploadFormData = await request.formData();
		} catch {
			return json({ success: false, error: 'Invalid form data' }, { status: 400 });
		}

		const jsonStr = uploadFormData.get('json');
		if (jsonStr && typeof jsonStr === 'string') {
			try {
				payload = JSON.parse(jsonStr);
			} catch {
				return json({ success: false, error: 'Invalid JSON in form data' }, { status: 400 });
			}
		} else {
			payload = {};
		}
	} else {
		let body;
		try {
			body = await request.json();
		} catch {
			return json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
		}
		payload = extractPayload(body);
	}

	const parsed = normalizeImportPayload(payload);
	const isImageOnlyUpload =
		contentType.includes('multipart/form-data') &&
		!parsed.birdboxes.length &&
		!parsed.observations.length &&
		!parsed.videos.length &&
		!parsed.images.length;

	if (
		!isImageOnlyUpload &&
		!parsed.birdboxes.length &&
		!parsed.observations.length &&
		!parsed.videos.length &&
		!parsed.images.length
	) {
		return json(
			{
				success: false,
				error: 'No importable records found. Expected arrays for birdboxes/observations/videos/images.'
			},
			{ status: 400 }
		);
	}

	let pool;
	try {
		pool = await myPoolFn();
	} catch (error) {
		console.error('Unable to get database pool', error);
		return json({ success: false, error: 'Database unavailable' }, { status: 500 });
	}

	const connection = await pool.getConnection();
	const summary = {
		birdboxes: { inserted: 0, updated: 0, skipped: 0, errors: [] },
		observations: { inserted: 0, updated: 0, skipped: 0, errors: [] },
		videos: { inserted: 0, updated: 0, skipped: 0, errors: [] },
		images: { inserted: 0, updated: 0, skipped: 0, errors: [] }
	};

	try {
		await ensureImageDataColumn(connection);

		await connection.beginTransaction();

		if (isImageOnlyUpload) {
			const imageOnlyResult = await upsertImageDataOnly(connection, summary.images, uploadFormData);
			await connection.commit();
			return json({
				success: true,
				totals: { birdboxes: 0, observations: 0, videos: 0, images: summary.images.inserted + summary.images.updated },
				summary,
				mode: 'image-only',
				retry: imageOnlyResult
			});
		}

		const boxNameToId = new Map();
		const observationRefToId = new Map();

		await upsertBirdboxes(connection, parsed.birdboxes, summary.birdboxes, boxNameToId);
		await upsertObservations(connection, parsed.observations, summary.observations, boxNameToId, observationRefToId);
		await upsertVideos(connection, parsed.videos, summary.videos, boxNameToId);
		await upsertImages(connection, parsed.images, summary.images, observationRefToId, uploadFormData);

		await connection.commit();

		return json({
			success: true,
			totals: {
				birdboxes: parsed.birdboxes.length,
				observations: parsed.observations.length,
				videos: parsed.videos.length,
				images: parsed.images.length
			},
			summary
		});
	} catch (error) {
		try {
			await connection.rollback();
		} catch {
			// Ignore rollback errors when transaction did not start or connection already failed.
		}
		console.error('Mass import failed', error);
		return json({ success: false, error: error?.message || 'Import failed' }, { status: 500 });
	} finally {
		connection.release();
	}
}

async function upsertImageDataOnly(connection, summary, formData) {
	const imageFileLookup = buildImageFileLookup(formData);
	const allFilenames = [...imageFileLookup.keys()];

	const firstPassUnresolved = await applyImageDataByFilename(connection, summary, imageFileLookup, allFilenames);
	const secondPassUnresolved = firstPassUnresolved.length
		? await applyImageDataByFilename(connection, summary, imageFileLookup, firstPassUnresolved)
		: [];

	for (const filename of secondPassUnresolved) {
		summary.skipped += 1;
		summary.errors.push({ reason: `No ObservationImage row found for filename ${filename}` });
	}

	return {
		firstPassUnresolved: firstPassUnresolved.length,
		secondPassUnresolved: secondPassUnresolved.length
	};
}

async function applyImageDataByFilename(connection, summary, imageFileLookup, filenames) {
	const unresolved = [];

	for (const filename of filenames) {
		const uploadedFile = imageFileLookup.get(filename);
		if (!uploadedFile) {
			unresolved.push(filename);
			continue;
		}

		let imageData;
		try {
			imageData = Buffer.from(await uploadedFile.arrayBuffer());
		} catch (error) {
			summary.skipped += 1;
			summary.errors.push({ reason: `Failed to read uploaded image ${filename}: ${error?.message || 'unknown error'}` });
			continue;
		}

		const mimeType = uploadedFile?.type || null;
		const fileSize = imageData.byteLength;
		const [result] = await connection.execute(
			`UPDATE ObservationImage
			 SET imageData = ?,
			     mimeType = COALESCE(?, mimeType),
			     fileSize = ?,
			     originalName = COALESCE(originalName, ?)
			 WHERE filePath LIKE ? OR originalName = ?`,
			[imageData, mimeType, fileSize, filename, `%/${filename}`, filename]
		);

		if (result?.affectedRows > 0) {
			summary.updated += result.affectedRows;
		} else {
			unresolved.push(filename);
		}
	}

	return unresolved;
}

function buildImageFileLookup(formData) {
	const imageMap = new Map();
	if (!formData) {
		return imageMap;
	}

	for (const [fieldName, value] of formData.entries()) {
		if (fieldName === 'json') continue;
		if (!(value instanceof File)) continue;

		const filename = basename(fieldName.replace(/\\/g, '/'));
		if (!filename || filename.includes('..')) continue;

		if (!imageMap.has(filename)) {
			imageMap.set(filename, value);
		}
	}
	return imageMap;
}

async function ensureImageDataColumn(connection) {
	try {
		await connection.execute('ALTER TABLE ObservationImage ADD COLUMN IF NOT EXISTS imageData LONGBLOB NULL');
		return;
	} catch {
		// Fallback for MySQL variants without IF NOT EXISTS support on ADD COLUMN
	}

	const [rows] = await connection.execute(
		"SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ObservationImage' AND COLUMN_NAME = 'imageData' LIMIT 1"
	);

	if (rows?.length) {
		return;
	}

	await connection.execute('ALTER TABLE ObservationImage ADD COLUMN imageData LONGBLOB NULL');
}

function normalizeToUploadPath(rawPath) {
	if (!rawPath) return null;
	const normalized = String(rawPath).replace(/\\/g, '/');
	const filename = normalized.split('/').pop();
	if (!filename) return null;
	// This is retained as a stable legacy identifier for matching rows by filename.
	// Images are served from DB BLOBs via /api/dataApiRoutes/images/serve/:imageID.
	return `/uploads/images/${filename}`;
}

function extractPayload(body) {
	if (!body || typeof body !== 'object') {
		return {};
	}
	return body.raw || body.dictionary || body.data || body;
}

function normalizeImportPayload(payload) {
	const birdboxes = getArray(payload, ['birdboxes', 'birdBoxes', 'boxes', 'Birdbox']) || [];
	const observations = getArray(payload, ['observations', 'observationRecords', 'Observation']) || [];
	const videos = getArray(payload, ['videos', 'videoRecords', 'Video']) || [];
	const images = getArray(payload, ['images', 'observationImages', 'ObservationImage']) || [];

	const legacy = normalizeLegacyBoxPayload(payload);

	return {
		birdboxes: [...birdboxes, ...legacy.birdboxes],
		observations: [...observations, ...legacy.observations],
		videos: [...videos, ...legacy.videos],
		images: [...images, ...legacy.images]
	};
}

function normalizeLegacyBoxPayload(payload) {
	if (!payload || typeof payload !== 'object') {
		return { birdboxes: [], observations: [], videos: [], images: [] };
	}

	const birdboxes = [];
	const observations = [];
	const videos = [];
	const images = [];

	for (const key of Object.keys(payload)) {
		const match = key.match(/^box(\d+)Values$/i);
		if (!match) continue;

		const boxNum = Number.parseInt(match[1], 10);
		if (Number.isNaN(boxNum)) continue;

		const values = Array.isArray(payload[key]) ? payload[key] : [];
		const boxName = payload[`box${boxNum}Name`] || `Box ${boxNum}`;
		const boxContains = payload[`box${boxNum}Contains`] ?? values.length;

		birdboxes.push({
			boxID: null,
			boxName,
			boxLocation: payload[`box${boxNum}Location`] || 'Unknown',
			isOnline: 1,
			lastOnline: payload[`box${boxNum}LastOnline`] || null,
			contains: boxContains
		});

		for (const raw of values) {
			const observation = normalizeLegacyObservation(raw, boxNum, boxName);
			if (!observation) continue;
			observations.push(observation);

			const possibleImagePath =
				raw?.filePath || raw?.imagePath || raw?.image || raw?.img || raw?.photoPath || raw?.path || null;
			if (possibleImagePath) {
				images.push({
				filePath: normalizeToUploadPath(possibleImagePath),
					originalName: raw?.originalName || null,
					mimeType: raw?.mimeType || null,
					fileSize: raw?.fileSize ?? null,
					observation
				});
			}

			const possibleVideoPath = raw?.videoPath || raw?.clipPath || null;
			if (possibleVideoPath) {
				videos.push({
					boxID: boxNum,
					boxName,
					filePath: possibleVideoPath,
					capturedAt: raw?.capturedAt || raw?.observationTime || null,
					durationSeconds: raw?.durationSeconds ?? null,
					mimeType: raw?.videoMimeType || null
				});
			}
		}
	}

	return { birdboxes, observations, videos, images };
}

function normalizeLegacyObservation(raw, boxID, boxName) {
	if (!raw || typeof raw !== 'object') return null;

	const observationSpecies =
		raw.observationSpecies || raw.species || raw.birdId || raw.bird || raw.prediction || null;

	const combinedDateTime =
		raw.date && (raw.time || raw.timeString)
			? `${raw.date} ${raw.time || raw.timeString}`
			: raw.date || null;

	const observationTime =
		raw.observationTime ||
		raw.timeCaptured ||
		raw.timestamp ||
		combinedDateTime ||
		raw.time ||
		null;

	if (!observationSpecies || !observationTime) {
		return null;
	}

	return {
		observationID: raw.observationID || null,
		observationSpecies,
		observationTime,
		confidence: raw.confidence ?? raw.score ?? raw.accuracy ?? null,
		verification: raw.verification ?? null,
		verificationText: raw.verificationText ?? null,
		boxID,
		boxName
	};
}

function getArray(source, keys) {
	if (!source || typeof source !== 'object') {
		return null;
	}

	for (const key of keys) {
		if (Array.isArray(source[key])) {
			return source[key];
		}
	}

	return null;
}

function toInt(value, fallback = null) {
	if (value === undefined || value === null || value === '') return fallback;
	const n = Number.parseInt(String(value), 10);
	return Number.isNaN(n) ? fallback : n;
}

function toFloat(value, fallback = null) {
	if (value === undefined || value === null || value === '') return fallback;
	const n = Number.parseFloat(String(value));
	return Number.isNaN(n) ? fallback : n;
}

function toBool(value, fallback = 0) {
	if (value === undefined || value === null || value === '') return fallback;
	if (value === true || value === 1 || value === '1' || value === 'true') return 1;
	if (value === false || value === 0 || value === '0' || value === 'false') return 0;
	return fallback;
}

function toTimestamp(value) {
	if (value === undefined || value === null || value === '') return null;
	const raw = String(value).trim();

	// Compact date+time format: YYYYMMDD HHmm or YYYYMMDD HHmmss
	const compactDateTime = raw.match(/^(\d{8})\s+(\d{4}|\d{6})$/);
	if (compactDateTime) {
		const datePart = compactDateTime[1];
		const timePart = compactDateTime[2];

		const year = Number(datePart.slice(0, 4));
		const month = Number(datePart.slice(4, 6));
		const day = Number(datePart.slice(6, 8));
		const hour = Number(timePart.slice(0, 2));
		const minute = Number(timePart.slice(2, 4));
		const second = timePart.length === 6 ? Number(timePart.slice(4, 6)) : 0;

		const parsed = new Date(year, month - 1, day, hour, minute, second);
		if (!Number.isNaN(parsed.valueOf())) {
			return parsed.toISOString().slice(0, 19).replace('T', ' ');
		}
	}

	// Compact date-only format: YYYYMMDD
	const compactDate = raw.match(/^(\d{8})$/);
	if (compactDate) {
		const datePart = compactDate[1];
		const year = Number(datePart.slice(0, 4));
		const month = Number(datePart.slice(4, 6));
		const day = Number(datePart.slice(6, 8));

		const parsed = new Date(year, month - 1, day, 0, 0, 0);
		if (!Number.isNaN(parsed.valueOf())) {
			return parsed.toISOString().slice(0, 19).replace('T', ' ');
		}
	}

	// Reject time-only values (e.g. "0736") to avoid accidental year parsing.
	if (/^\d{3,4}$/.test(raw)) {
		return null;
	}

	const date = new Date(raw);
	if (!Number.isNaN(date.valueOf())) {
		return date.toISOString().slice(0, 19).replace('T', ' ');
	}

	const parts = raw.split('/').map((part) => part.trim());
	if (parts.length === 3) {
		const month = Number(parts[0]);
		const day = Number(parts[1]);
		const year = Number(parts[2].slice(0, 4));

		if (!Number.isNaN(month) && !Number.isNaN(day) && !Number.isNaN(year)) {
			const timeMatch = raw.match(/(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?\s*(AM|PM)?/i);
			let hour = 0;
			let minute = 0;
			let second = 0;
			let meridiem = null;

			if (timeMatch) {
				hour = Number(timeMatch[1]) || 0;
				minute = Number(timeMatch[2]) || 0;
				second = Number(timeMatch[3]) || 0;
				meridiem = timeMatch[4] ? timeMatch[4].toUpperCase() : null;
			}

			if (meridiem === 'PM' && hour < 12) {
				hour += 12;
			} else if (meridiem === 'AM' && hour === 12) {
				hour = 0;
			}

			const fallback = new Date(year, month - 1, day, hour, minute, second);
			if (!Number.isNaN(fallback.valueOf())) {
				return fallback.toISOString().slice(0, 19).replace('T', ' ');
			}
		}
	}

	return null;
}

function getBoxName(item) {
	return item?.boxName || item?.name || item?.box || null;
}

function getBoxId(item) {
	return toInt(item?.boxID ?? item?.boxId ?? item?.box_id);
}

async function resolveBoxId(connection, item, boxNameToId) {
	// Prefer name-based lookup — boxNameToId is populated by upsertBirdboxes with the real DB IDs
	const boxName = getBoxName(item);
	if (boxName && boxNameToId.has(boxName)) {
		return boxNameToId.get(boxName);
	}

	const explicit = getBoxId(item);
	if (explicit) return explicit;

	if (boxName) {
		const [rows] = await connection.execute('SELECT boxID FROM Birdbox WHERE boxName = ? LIMIT 1', [boxName]);
		const id = rows?.[0]?.boxID ?? null;
		if (id) boxNameToId.set(boxName, id);
		return id;
	}

	return null;
}

function pushError(summary, item, reason) {
	summary.errors.push({
		reason,
		item
	});
}

async function upsertBirdboxes(connection, items, summary, boxNameToId) {
	for (const item of items) {
		const boxID = getBoxId(item);
		const boxName = getBoxName(item);

		if (!boxID && !boxName) {
			summary.skipped += 1;
			pushError(summary, item, 'Missing boxID/boxName');
			continue;
		}

		let existing = null;
		if (boxID) {
			const [rows] = await connection.execute('SELECT boxID FROM Birdbox WHERE boxID = ? LIMIT 1', [boxID]);
			existing = rows?.[0] || null;
		}

		if (!existing && boxName) {
			const [rows] = await connection.execute('SELECT boxID FROM Birdbox WHERE boxName = ? LIMIT 1', [boxName]);
			existing = rows?.[0] || null;
		}

		const finalName = boxName || `Box ${boxID}`;
		const finalLocation = item?.boxLocation ?? item?.location ?? 'Unknown';
		const isOnline = toBool(item?.isOnline, 0);
		const lastOnline = toTimestamp(item?.lastOnline);
		const latCoord = toFloat(item?.latCoord ?? item?.lat);
		const longCoord = toFloat(item?.longCoord ?? item?.lng ?? item?.lon);

		if (existing) {
			await connection.execute(
				'UPDATE Birdbox SET boxName = ?, boxLocation = ?, isOnline = ?, lastOnline = ?, latCoord = ?, longCoord = ? WHERE boxID = ?',
				[finalName, finalLocation, isOnline, lastOnline, latCoord, longCoord, existing.boxID]
			);
			summary.updated += 1;
			boxNameToId.set(finalName, existing.boxID);
			continue;
		}

		let insertId = boxID;
		if (!insertId) {
			const [rows] = await connection.execute('SELECT COALESCE(MAX(boxID), 0) + 1 AS nextID FROM Birdbox');
			insertId = rows?.[0]?.nextID;
		}

		await connection.execute(
			'INSERT INTO Birdbox (boxID, boxName, boxLocation, isOnline, lastOnline, latCoord, longCoord) VALUES (?, ?, ?, ?, ?, ?, ?)',
			[insertId, finalName, finalLocation, isOnline, lastOnline, latCoord, longCoord]
		);

		summary.inserted += 1;
		boxNameToId.set(finalName, insertId);
	}
}

async function upsertObservations(connection, items, summary, boxNameToId, observationRefToId) {
	for (const item of items) {
		const boxID = await resolveBoxId(connection, item, boxNameToId);
		const observationSpecies = item?.observationSpecies || item?.species || null;
		const observationTime = toTimestamp(item?.observationTime || item?.timeCaptured || item?.timestamp);
		const confidence = toInt(item?.confidence ?? item?.score, null);
		const verification = item?.verification ?? null;
		const verificationText = item?.verificationText ?? null;

		if (!boxID || !observationSpecies || !observationTime) {
			summary.skipped += 1;
			pushError(summary, item, 'Missing boxID, observationSpecies, or observationTime');
			continue;
		}

		const observationID = toInt(item?.observationID);
		let existing = null;

		if (observationID) {
			const [rows] = await connection.execute(
				'SELECT observationID FROM Observation WHERE observationID = ? LIMIT 1',
				[observationID]
			);
			existing = rows?.[0] || null;
		}

		if (!existing) {
			const [rows] = await connection.execute(
				'SELECT observationID FROM Observation WHERE boxID = ? AND observationSpecies = ? AND observationTime = ? LIMIT 1',
				[boxID, observationSpecies, observationTime]
			);
			existing = rows?.[0] || null;
		}

		if (existing) {
			await connection.execute(
				'UPDATE Observation SET observationSpecies = ?, observationTime = ?, confidence = ?, verification = ?, verificationText = ?, boxID = ? WHERE observationID = ?',
				[observationSpecies, observationTime, confidence, verification, verificationText, boxID, existing.observationID]
			);
			summary.updated += 1;
			observationRefToId.set(makeObservationRef(item), existing.observationID);
			continue;
		}

		const [insertResult] = await connection.execute(
			'INSERT INTO Observation (observationSpecies, observationTime, confidence, verification, verificationText, boxID) VALUES (?, ?, ?, ?, ?, ?)',
			[observationSpecies, observationTime, confidence, verification, verificationText, boxID]
		);

		summary.inserted += 1;
		const newID = insertResult.insertId;
		observationRefToId.set(makeObservationRef(item), newID);
	}
}

function makeObservationRef(item) {
	if (!item || typeof item !== 'object') return '';
	if (item.observationID) return `id:${item.observationID}`;

	const a = item.observationSpecies || item.species || '';
	const b = item.observationTime || item.timeCaptured || item.timestamp || '';
	const c = item.boxID || item.boxId || item.boxName || '';
	return `${a}|${b}|${c}`;
}

async function upsertVideos(connection, items, summary, boxNameToId) {
	for (const item of items) {
		const boxID = await resolveBoxId(connection, item, boxNameToId);
		const filePath = item?.filePath || item?.path || null;

		if (!boxID || !filePath) {
			summary.skipped += 1;
			pushError(summary, item, 'Missing boxID or filePath');
			continue;
		}

		const videoID = toInt(item?.videoID);
		let existing = null;

		if (videoID) {
			const [rows] = await connection.execute('SELECT videoID FROM Video WHERE videoID = ? LIMIT 1', [videoID]);
			existing = rows?.[0] || null;
		}

		if (!existing) {
			const [rows] = await connection.execute(
				'SELECT videoID FROM Video WHERE boxID = ? AND filePath = ? LIMIT 1',
				[boxID, filePath]
			);
			existing = rows?.[0] || null;
		}

		const values = [
			boxID,
			filePath,
			item?.originalName || null,
			item?.mimeType || null,
			toInt(item?.fileSize, null),
			toFloat(item?.durationSeconds, null),
			toTimestamp(item?.capturedAt)
		];

		if (existing) {
			await connection.execute(
				'UPDATE Video SET boxID = ?, filePath = ?, originalName = ?, mimeType = ?, fileSize = ?, durationSeconds = ?, capturedAt = ? WHERE videoID = ?',
				[...values, existing.videoID]
			);
			summary.updated += 1;
			continue;
		}

		await connection.execute(
			'INSERT INTO Video (boxID, filePath, originalName, mimeType, fileSize, durationSeconds, capturedAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
			values
		);
		summary.inserted += 1;
	}
}

async function upsertImages(connection, items, summary, observationRefToId, formData) {
	const imageFileLookup = buildImageFileLookup(formData);

	for (const item of items) {
		let observationID = toInt(item?.observationID, null);
		if (!observationID) {
			const ref = makeObservationRef(item?.observation || item);
			observationID = observationRefToId.get(ref) || null;
		}

		const filePath = item?.filePath || item?.path || null;

		if (!observationID || !filePath) {
			summary.skipped += 1;
			pushError(summary, item, 'Missing observationID or filePath');
			continue;
		}

		// Look up the uploaded image binary by filename
		const filename = filePath.split('/').pop();
		const uploadedFile = filename ? imageFileLookup.get(filename) : null;
		let imageData = null;
		if (uploadedFile) {
			try {
				imageData = Buffer.from(await uploadedFile.arrayBuffer());
			} catch (error) {
				summary.skipped += 1;
				pushError(summary, item, `Failed to read uploaded image data: ${error?.message || 'unknown error'}`);
				continue;
			}
		}

		const imageID = toInt(item?.imageID);
		let existing = null;
		if (imageID) {
			const [rows] = await connection.execute('SELECT imageID FROM ObservationImage WHERE imageID = ? LIMIT 1', [imageID]);
			existing = rows?.[0] || null;
		}

		if (!existing) {
			const [rows] = await connection.execute(
				'SELECT imageID FROM ObservationImage WHERE observationID = ? AND filePath = ? LIMIT 1',
				[observationID, filePath]
			);
			existing = rows?.[0] || null;
		}

		const originalName = item?.originalName || filename || null;
		const mimeType = item?.mimeType || uploadedFile?.type || null;
		const fileSize = imageData ? imageData.byteLength : toInt(item?.fileSize, null);

		if (existing) {
			if (imageData) {
				await connection.execute(
					'UPDATE ObservationImage SET observationID = ?, filePath = ?, originalName = ?, mimeType = ?, fileSize = ?, imageData = ? WHERE imageID = ?',
					[observationID, filePath, originalName, mimeType, fileSize, imageData, existing.imageID]
				);
			} else {
				await connection.execute(
					'UPDATE ObservationImage SET observationID = ?, filePath = ?, originalName = ?, mimeType = ?, fileSize = ? WHERE imageID = ?',
					[observationID, filePath, originalName, mimeType, fileSize, existing.imageID]
				);
			}
			summary.updated += 1;
			continue;
		}

		if (imageData) {
			await connection.execute(
				'INSERT INTO ObservationImage (observationID, filePath, originalName, mimeType, fileSize, imageData) VALUES (?, ?, ?, ?, ?, ?)',
				[observationID, filePath, originalName, mimeType, fileSize, imageData]
			);
		} else {
			await connection.execute(
				'INSERT INTO ObservationImage (observationID, filePath, originalName, mimeType, fileSize) VALUES (?, ?, ?, ?, ?)',
				[observationID, filePath, originalName, mimeType, fileSize]
			);
		}
		summary.inserted += 1;
	}
}
