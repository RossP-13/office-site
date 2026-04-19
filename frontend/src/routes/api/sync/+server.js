import { json } from '@sveltejs/kit';
import { myPoolFn } from '$lib/db/mysql.js';

export async function POST({ request }) {
  return syncDictionary(request);
}

export async function PUT({ request }) {
  return syncDictionary(request);
}

async function syncDictionary(request) {
  let body;
  try {
    body = await request.json();
  } catch (error) {
    return json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const payload = typeof body === 'object' && body !== null ? (body.dictionary || body.data || body) : {};
  const birdboxes = getArray(payload, ['birdboxes', 'birdBoxes', 'boxes']);
  const videos = getArray(payload, ['videos', 'videoRecords']);
  const observations = getArray(payload, ['observations', 'observationRecords']);
  const images = getArray(payload, ['images', 'observationImages', 'observationImages']);
  const users = getArray(payload, ['users', 'appUsers']);

  let pool;
  try {
    pool = await myPoolFn();
  } catch (error) {
    console.error('Unable to get database pool', error);
    return json({ success: false, error: 'Database unavailable' }, { status: 500 });
  }

  const summary = {};

  if (birdboxes.length) {
    summary.birdboxes = await syncBirdboxes(pool, birdboxes);
  }
  if (videos.length) {
    summary.videos = await syncVideos(pool, videos);
  }
  if (observations.length) {
    summary.observations = await syncObservations(pool, observations);
  }
  if (images.length) {
    summary.images = await syncImages(pool, images);
  }
  if (users.length) {
    summary.users = await syncUsers(pool, users);
  }

  if (!birdboxes.length && !videos.length && !observations.length && !images.length && !users.length) {
    return json({ success: false, error: 'No sync data found in payload' }, { status: 400 });
  }

  return json({ success: true, summary });
}

function getArray(payload, names) {
  for (const name of names) {
    if (Array.isArray(payload[name])) {
      return payload[name];
    }
  }
  return [];
}

function normalizeBoolean(value) {
  return value === true || value === 'true' || value === 1 || value === '1' ? 1 : 0;
}

function formatTimestamp(date) {
  const iso = date.toISOString();
  return iso.slice(0, 19).replace('T', ' ');
}

function parseTimestamp(value) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  if (value instanceof Date) {
    return formatTimestamp(value);
  }

  const raw = String(value).trim();
  if (!raw) {
    return null;
  }

  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.valueOf())) {
    return formatTimestamp(parsed);
  }

  const parts = raw.split('/').map((part) => part.trim());
  if (parts.length === 3) {
    const month = Number(parts[0]);
    const day = Number(parts[1]);
    const year = Number(parts[2].slice(0, 4));
    if (!Number.isNaN(month) && !Number.isNaN(day) && !Number.isNaN(year)) {
      const timeMatch = raw.match(/\d{1,2}:\d{1,2}:?\d{0,2}\s*(AM|PM)?/i);
      let hour = 0;
      let minute = 0;
      let second = 0;
      let ampm = '';
      if (timeMatch) {
        const timeParts = timeMatch[0].replace(/\s+/g, ' ').trim().split(/[: ]/);
        hour = Number(timeParts[0]) || 0;
        minute = Number(timeParts[1]) || 0;
        second = Number(timeParts[2]) || 0;
        ampm = timeParts[3] || timeParts[2] || '';
      }
      if (ampm) {
        const normalized = ampm.toUpperCase();
        if (normalized === 'PM' && hour < 12) {
          hour += 12;
        } else if (normalized === 'AM' && hour === 12) {
          hour = 0;
        }
      }
      minute = Math.min(59, Math.max(0, minute));
      second = Math.min(59, Math.max(0, second));
      const candidate = new Date(year, month - 1, day, hour, minute, second);
      if (!Number.isNaN(candidate.valueOf())) {
        return formatTimestamp(candidate);
      }
    }
  }

  return null;
}

async function syncBirdboxes(pool, items) {
  const result = { inserted: 0, updated: 0, skipped: 0, errors: [] };

  for (const item of items) {
    const boxName = item.boxName || item.name;
    if (!boxName) {
      result.skipped += 1;
      result.errors.push({ item, reason: 'Missing boxName' });
      continue;
    }

    try {
      let boxID = item.boxID;
      let existingRows = [];
      if (boxID) {
        [existingRows] = await pool.execute('SELECT boxID FROM Birdbox WHERE boxID = ?', [boxID]);
      }
      if ((!existingRows || existingRows.length === 0) && boxName) {
        [existingRows] = await pool.execute('SELECT boxID FROM Birdbox WHERE boxName = ?', [boxName]);
      }

      const row = existingRows && existingRows[0];
      const values = [boxName, item.boxLocation || null, normalizeBoolean(item.isOnline), parseTimestamp(item.lastOnline), item.latCoord ?? null, item.longCoord ?? null];

      if (row) {
        await pool.execute(
          'UPDATE Birdbox SET boxName = ?, boxLocation = ?, isOnline = ?, lastOnline = ?, latCoord = ?, longCoord = ? WHERE boxID = ?',
          [...values, row.boxID]
        );
        result.updated += 1;
      } else {
        if (!boxID) {
          const [rows] = await pool.execute('SELECT MAX(boxID) AS maxID FROM Birdbox');
          boxID = (rows?.[0]?.maxID ?? 0) + 1;
        }
        await pool.execute(
          'INSERT INTO Birdbox (boxID, boxName, boxLocation, isOnline, lastOnline, latCoord, longCoord) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [boxID, ...values]
        );
        result.inserted += 1;
      }
    } catch (error) {
      console.error('Birdbox sync error', error, item);
      result.errors.push({ item, reason: error?.message || 'Unknown error' });
    }
  }

  return result;
}

async function syncVideos(pool, items) {
  const result = { inserted: 0, updated: 0, skipped: 0, errors: [] };

  for (const item of items) {
    const filePath = item.filePath;
    if (!filePath) {
      result.skipped += 1;
      result.errors.push({ item, reason: 'Missing filePath' });
      continue;
    }

    try {
      const boxID = await resolveBoxID(pool, item);
      let existingRows = [];
      if (item.videoID) {
        [existingRows] = await pool.execute('SELECT videoID FROM Video WHERE videoID = ?', [item.videoID]);
      }
      if ((!existingRows || existingRows.length === 0) && filePath) {
        [existingRows] = await pool.execute('SELECT videoID FROM Video WHERE filePath = ?', [filePath]);
      }

      const values = [boxID, filePath, item.originalName || null, item.mimeType || null, item.fileSize ?? null, item.durationSeconds ?? null, parseTimestamp(item.capturedAt)];
      if (existingRows && existingRows.length) {
        await pool.execute(
          'UPDATE Video SET boxID = ?, filePath = ?, originalName = ?, mimeType = ?, fileSize = ?, durationSeconds = ?, capturedAt = ? WHERE videoID = ?',
          [...values, existingRows[0].videoID]
        );
        result.updated += 1;
      } else {
        const [insertResult] = await pool.execute(
          'INSERT INTO Video (boxID, filePath, originalName, mimeType, fileSize, durationSeconds, capturedAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
          values
        );
        result.inserted += 1;
        item.videoID = insertResult.insertId;
      }
    } catch (error) {
      console.error('Video sync error', error, item);
      result.errors.push({ item, reason: error?.message || 'Unknown error' });
    }
  }

  return result;
}

async function syncObservations(pool, items) {
  const result = { inserted: 0, updated: 0, skipped: 0, errors: [] };

  for (const item of items) {
    try {
      const observationTime = parseTimestamp(item.observationTime || `${item.date || ''} ${item.time || ''}`);
      const species = item.observationSpecies || item.species;
      const confidence = item.confidence ?? item.accuracy ?? null;
      const verification = item.verification || null;
      const boxID = await resolveBoxID(pool, item);

      if (!species || !observationTime || !boxID) {
        result.skipped += 1;
        result.errors.push({ item, reason: 'Missing observationSpecies, observationTime, or boxID' });
        continue;
      }

      let existingRows = [];
      if (item.observationID) {
        [existingRows] = await pool.execute('SELECT observationID FROM Observation WHERE observationID = ?', [item.observationID]);
      }
      if ((!existingRows || existingRows.length === 0) && observationTime) {
        [existingRows] = await pool.execute(
          'SELECT observationID FROM Observation WHERE observationSpecies = ? AND observationTime = ? AND boxID = ? LIMIT 1',
          [species, observationTime, boxID]
        );
      }

      const values = [species, observationTime, confidence, verification, boxID];
      if (existingRows && existingRows.length) {
        await pool.execute(
          'UPDATE Observation SET observationSpecies = ?, observationTime = ?, confidence = ?, verification = ?, boxID = ? WHERE observationID = ?',
          [...values, existingRows[0].observationID]
        );
        result.updated += 1;
      } else {
        const [insertResult] = await pool.execute(
          'INSERT INTO Observation (observationSpecies, observationTime, confidence, verification, boxID) VALUES (?, ?, ?, ?, ?)',
          values
        );
        result.inserted += 1;
        item.observationID = insertResult.insertId;
      }
    } catch (error) {
      console.error('Observation sync error', error, item);
      result.errors.push({ item, reason: error?.message || 'Unknown error' });
    }
  }

  return result;
}

async function syncImages(pool, items) {
  const result = { inserted: 0, updated: 0, skipped: 0, errors: [] };

  for (const item of items) {
    const filePath = item.filePath;
    const observationID = item.observationID ?? null;
    if (!filePath || !observationID) {
      result.skipped += 1;
      result.errors.push({ item, reason: 'Missing observationID or filePath' });
      continue;
    }

    try {
      let existingRows = [];
      if (item.imageID) {
        [existingRows] = await pool.execute('SELECT imageID FROM ObservationImage WHERE imageID = ?', [item.imageID]);
      }
      if ((!existingRows || existingRows.length === 0) && filePath) {
        [existingRows] = await pool.execute(
          'SELECT imageID FROM ObservationImage WHERE observationID = ? AND filePath = ? LIMIT 1',
          [observationID, filePath]
        );
      }

      const values = [observationID, filePath, item.originalName || null, item.mimeType || null, item.fileSize ?? null, parseTimestamp(item.uploadedAt)];
      if (existingRows && existingRows.length) {
        await pool.execute(
          'UPDATE ObservationImage SET observationID = ?, filePath = ?, originalName = ?, mimeType = ?, fileSize = ?, uploadedAt = ? WHERE imageID = ?',
          [...values, existingRows[0].imageID]
        );
        result.updated += 1;
      } else {
        await pool.execute(
          'INSERT INTO ObservationImage (observationID, filePath, originalName, mimeType, fileSize, uploadedAt) VALUES (?, ?, ?, ?, ?, ?)',
          values
        );
        result.inserted += 1;
      }
    } catch (error) {
      console.error('ObservationImage sync error', error, item);
      result.errors.push({ item, reason: error?.message || 'Unknown error' });
    }
  }

  return result;
}

async function syncUsers(pool, items) {
  const result = { inserted: 0, updated: 0, skipped: 0, errors: [] };

  for (const item of items) {
    const username = item.username;
    const pass = item.pass || item.password;
    const email = item.email;
    if (!username || !pass || !email) {
      result.skipped += 1;
      result.errors.push({ item, reason: 'Missing username, pass, or email' });
      continue;
    }

    try {
      let existingRows = [];
      [existingRows] = await pool.execute('SELECT userID FROM AppUser WHERE username = ? OR email = ?', [username, email]);
      const values = [username, pass, email, item.firstName || null, item.lastName || null];
      if (existingRows && existingRows.length) {
        await pool.execute(
          'UPDATE AppUser SET pass = ?, email = ?, firstName = ?, lastName = ? WHERE username = ? OR email = ?',
          [pass, email, item.firstName || null, item.lastName || null, username, email]
        );
        result.updated += 1;
      } else {
        if (item.userID) {
          await pool.execute('INSERT INTO AppUser (userID, username, pass, email, firstName, lastName) VALUES (?, ?, ?, ?, ?, ?)', [item.userID, ...values]);
        } else {
          await pool.execute('INSERT INTO AppUser (username, pass, email, firstName, lastName) VALUES (?, ?, ?, ?, ?)', values);
        }
        result.inserted += 1;
      }
    } catch (error) {
      console.error('AppUser sync error', error, item);
      result.errors.push({ item, reason: error?.message || 'Unknown error' });
    }
  }

  return result;
}

async function resolveBoxID(pool, item) {
  if (item.boxID) {
    return parseInt(item.boxID, 10);
  }
  if (item.boxName) {
    const [rows] = await pool.execute('SELECT boxID FROM Birdbox WHERE boxName = ?', [item.boxName]);
    return rows?.[0]?.boxID ?? null;
  }
  return null;
}


