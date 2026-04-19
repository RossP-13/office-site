import { myPoolFn } from '$lib/db/mysql.js';

export async function GET({ params }) {
	const imageID = parseInt(params.imageID, 10);
	if (!imageID || imageID < 1) {
		return new Response('Invalid image ID', { status: 400 });
	}

	let pool;
	try {
		pool = await myPoolFn();
	} catch {
		return new Response('Database unavailable', { status: 503 });
	}

	let rows;
	try {
		[rows] = await pool.execute(
			'SELECT imageData, mimeType FROM ObservationImage WHERE imageID = ? LIMIT 1',
			[imageID]
		);
	} catch {
		return new Response('Database query failed', { status: 500 });
	}

	if (!rows?.length) {
		return new Response('Image not found', { status: 404 });
	}

	const { imageData, mimeType } = rows[0];

	// Serve from DB BLOB if present
	if (imageData && imageData.length > 0) {
		const contentType = mimeType || 'image/jpeg';
		return new Response(imageData, {
			headers: {
				'Content-Type': contentType,
				'Content-Length': String(imageData.length),
				'Cache-Control': 'public, max-age=31536000, immutable'
			}
		});
	}

	return new Response('Image data not available', { status: 404 });
}
