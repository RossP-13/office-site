import { json } from '@sveltejs/kit';

/**
 * Validates if file buffer is a valid MP4 by checking magic bytes
 * MP4 signature: 'ftyp' at bytes 4-7
 */
function isValidMP4(buffer) {
  if (buffer.length < 8) return false;
  
  const ftypSignature = buffer.toString('utf-8', 4, 8);
  return ftypSignature === 'ftyp';
}

export async function POST({ request }) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    // Check if file exists
    if (!file) {
      return json({ error: 'No file provided' }, { status: 400 });
    }

    // Check file extension
    if (!file.name.endsWith('.mp4')) {
      return json({ 
        error: 'Invalid file extension. Only MP4 files are allowed.' 
      }, { status: 400 });
    }

    // Check MIME type
    if (file.type !== 'video/mp4') {
      return json({ 
        error: 'Invalid MIME type. File must be video/mp4.' 
      }, { status: 400 });
    }

    // Convert File to Buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Check magic bytes (most reliable validation)
    if (!isValidMP4(buffer)) {
      return json({ 
        error: 'File is not a valid MP4. File header does not match MP4 signature.' 
      }, { status: 400 });
    }

    // File is valid
    return json({ 
      success: true,
      message: 'File is a valid MP4',
      filename: file.name,
      size: file.size
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('File validation error:', errorMessage);
    return json({ 
      error: 'Error validating file',
      message: errorMessage 
    }, { status: 500 });
  }
}
