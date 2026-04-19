import { json } from '@sveltejs/kit';
import JSZip from 'jszip';
import { myPoolFn } from '$lib/db/mysql.js';

const ALLOWED_OPTIONS = new Set(['species', 'occupancy', 'visits', 'verified', 'images']);

export async function POST({ request }) {
	let body;
	try {
		body = await request.json();
	} catch {
		return json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
	}

	const boxData = body?.boxData;
	const selectedOptions = Array.isArray(body?.selectedOptions) ? body.selectedOptions : [];

	if (!boxData || typeof boxData !== 'object') {
		return json({ success: false, error: 'boxData is required' }, { status: 400 });
	}

	if (!Array.isArray(boxData.values)) {
		return json({ success: false, error: 'boxData.values must be an array' }, { status: 400 });
	}

	const selected = [...new Set(selectedOptions)]
		.filter((option) => typeof option === 'string')
		.filter((option) => ALLOWED_OPTIONS.has(option));

	if (selected.length === 0) {
		return json({ success: false, error: 'Please select at least one valid export option' }, { status: 400 });
	}

	const reportName = sanitizeFileName(boxData.name || 'box_report');
	const zip = new JSZip();

	for (const optionId of selected) {
		const rows =
			optionId === 'images'
				? await buildImageExportRowsAndFiles(zip, boxData)
				: buildRowsForOption(optionId, boxData);
		zip.file(`${optionId}.json`, JSON.stringify(rows, null, 2));
		zip.file(`${optionId}.csv`, rowsToCsv(rows));
	}

	zip.file(
		'manifest.json',
		JSON.stringify(
			{
				reportName,
				generatedAt: new Date().toISOString(),
				selectedOptions: selected,
				recordCount: boxData.values.length
			},
			null,
			2
		)
	);

	try {
		const zipBytes = await zip.generateAsync({
			type: 'uint8array',
			compression: 'DEFLATE',
			compressionOptions: { level: 6 }
		});

		return new Response(zipBytes, {
			status: 200,
			headers: {
				'Content-Type': 'application/zip',
				'Content-Disposition': `attachment; filename="${reportName}_report.zip"`,
				'Content-Length': String(zipBytes.byteLength),
				'Cache-Control': 'no-store'
			}
		});
	} catch (error) {
		console.error('Export zip generation failed', error);
		return json({ success: false, error: 'Failed to generate export archive' }, { status: 500 });
	}
}

function buildRowsForOption(optionId, boxData) {
	if (optionId === 'species') {
		const counts = {};
		for (const row of boxData.values) {
			const speciesName = row?.species?.trim() || 'Unknown';
			counts[speciesName] = (counts[speciesName] ?? 0) + 1;
		}

		return Object.entries(counts)
			.sort((a, b) => b[1] - a[1])
			.map(([species, sightings]) => ({ species, sightings }));
	}

	if (optionId === 'occupancy') {
		return [
			{ field: 'Box Name', value: boxData.name || 'Unknown' },
			{ field: 'Total Visits', value: boxData.contains ?? boxData.values.length }
		];
	}

	if (optionId === 'visits') {
		return boxData.values.map((row) => ({
			box: row?.box ?? boxData.name ?? 'Unknown',
			species: row?.species?.trim() || 'Unknown',
			date: row?.date ?? '',
			time: row?.time ?? '',
			accuracyPercent: Number(row?.accuracy) || 0
		}));
	}

	if (optionId === 'verified') {
		return boxData.values
			.filter((row) => Number(row?.accuracy) >= 80)
			.map((row) => ({
				species: row?.species?.trim() || 'Unknown',
				date: row?.date ?? '',
				time: row?.time ?? '',
				accuracyPercent: Number(row?.accuracy) || 0
			}));
	}

	return [];
}

async function buildImageExportRowsAndFiles(zip, boxData) {
	const pool = await myPoolFn();
	const observationIds = getObservationIds(boxData);
	let rows = [];

	if (observationIds.length > 0) {
		const placeholders = observationIds.map(() => '?').join(',');
		const [dbRows] = await pool.execute(
			`SELECT imageID, observationID, originalName, mimeType, fileSize, uploadedAt, imageData
			 FROM ObservationImage
			 WHERE observationID IN (${placeholders})
			 ORDER BY uploadedAt DESC, imageID DESC`,
			observationIds
		);
		rows = dbRows;
	}

	if (!rows.length) {
		const fallbackBoxId = getBoxId(boxData);
		if (fallbackBoxId) {
			const [dbRows] = await pool.execute(
				`SELECT i.imageID, i.observationID, i.originalName, i.mimeType, i.fileSize, i.uploadedAt, i.imageData
				 FROM ObservationImage i
				 JOIN Observation o ON o.observationID = i.observationID
				 WHERE o.boxID = ?
				 ORDER BY i.uploadedAt DESC, i.imageID DESC`,
				[fallbackBoxId]
			);
			rows = dbRows;
		}
	}

	if (!rows.length) {
		return [{ note: 'No images were found in the database for this export selection.' }];
	}

	const imagesFolder = zip.folder('images');
	const usedNames = new Set();
	const metadata = [];

	for (const row of rows) {
		const byteLength = row?.imageData?.length ?? 0;
		if (!row?.imageData || byteLength === 0) {
			continue;
		}

		const extension = inferExtension(row?.mimeType, row?.originalName);
		const rawBaseName = row?.originalName ? removeExtension(String(row.originalName)) : `image_${row.imageID}`;
		const safeBaseName = sanitizeFileName(rawBaseName || `image_${row.imageID}`) || `image_${row.imageID}`;
		const uniqueName = makeUniqueFileName(`${safeBaseName}.${extension}`, usedNames);
		const zipPath = `images/${uniqueName}`;

		imagesFolder.file(uniqueName, row.imageData);
		metadata.push({
			imageID: row.imageID,
			observationID: row.observationID,
			originalName: row.originalName || null,
			mimeType: row.mimeType || null,
			fileSize: row.fileSize ?? byteLength,
			uploadedAt: row.uploadedAt || null,
			zipPath
		});
	}

	return metadata.length
		? metadata
		: [{ note: 'Image rows were found, but none had image binary data to export.' }];
}

function getObservationIds(boxData) {
	const ids = new Set();
	for (const row of boxData?.values || []) {
		const n = Number.parseInt(String(row?.observationID ?? ''), 10);
		if (!Number.isNaN(n) && n > 0) {
			ids.add(n);
		}
	}
	return [...ids];
}

function getBoxId(boxData) {
	const direct = Number.parseInt(String(boxData?.boxID ?? ''), 10);
	if (!Number.isNaN(direct) && direct > 0) {
		return direct;
	}

	const fromName = String(boxData?.name ?? '').match(/\d+/)?.[0];
	if (!fromName) {
		return null;
	}

	const parsed = Number.parseInt(fromName, 10);
	return Number.isNaN(parsed) ? null : parsed;
}

function inferExtension(mimeType, originalName) {
	const lowerMime = String(mimeType || '').toLowerCase();
	if (lowerMime.includes('png')) return 'png';
	if (lowerMime.includes('webp')) return 'webp';
	if (lowerMime.includes('gif')) return 'gif';
	if (lowerMime.includes('bmp')) return 'bmp';
	if (lowerMime.includes('svg')) return 'svg';
	if (lowerMime.includes('jpeg') || lowerMime.includes('jpg')) return 'jpg';

	const inferredFromName = String(originalName || '').split('.').pop()?.toLowerCase();
	if (inferredFromName && inferredFromName.length <= 5) {
		return inferredFromName;
	}

	return 'jpg';
}

function removeExtension(fileName) {
	const idx = fileName.lastIndexOf('.');
	return idx > 0 ? fileName.slice(0, idx) : fileName;
}

function makeUniqueFileName(baseName, usedNames) {
	if (!usedNames.has(baseName)) {
		usedNames.add(baseName);
		return baseName;
	}

	const dot = baseName.lastIndexOf('.');
	const name = dot > 0 ? baseName.slice(0, dot) : baseName;
	const ext = dot > 0 ? baseName.slice(dot) : '';

	let counter = 2;
	while (true) {
		const candidate = `${name}_${counter}${ext}`;
		if (!usedNames.has(candidate)) {
			usedNames.add(candidate);
			return candidate;
		}
		counter += 1;
	}
}

function rowsToCsv(rows) {
	if (!Array.isArray(rows) || rows.length === 0) {
		return 'message\nNo data available for this category\n';
	}

	const headers = Object.keys(rows[0]);
	const lines = [headers.join(',')];

	for (const row of rows) {
		const line = headers
			.map((header) => {
				const value = row?.[header];
				const text = value == null ? '' : String(value);
				if (text.includes('"') || text.includes(',') || text.includes('\n')) {
					return `"${text.replace(/"/g, '""')}"`;
				}
				return text;
			})
			.join(',');
		lines.push(line);
	}

	return `${lines.join('\n')}\n`;
}

function sanitizeFileName(name) {
	return String(name)
		.trim()
		.replace(/[\\/:*?"<>|]+/g, '_')
		.replace(/\s+/g, '_')
		.replace(/_+/g, '_')
		.replace(/^_|_$/g, '') || 'report';
}
