<script>
  import JSZip from 'jszip';
  import { loadJson, clearJson } from "$lib/assets/jsonStore.js";

  let message = '';
  let messageType = '';
  let jsonDisplay = '';
  let isUploading = false;
  const IMAGE_BATCH_SIZE = 1;

  function openAttachment() {
    document.getElementById('attachment').click();
  }

  async function fileSelected(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Reset state
    message = '';
    messageType = '';
    jsonDisplay = '';
    isUploading = true;
    clearJson();

    if (!file.name.endsWith('.zip')) {
      message = 'Please select a ZIP file';
      messageType = 'error';
      isUploading = false;
      return;
    }

    try {
      message = 'Reading ZIP file...';
      messageType = 'info';
      const zip = await JSZip.loadAsync(file);

      const jsonFile = zip.file('output.json');
      if (!jsonFile) {
        message = 'ZIP is missing output.json. Please check the file structure.';
        messageType = 'error';
        isUploading = false;
        return;
      }

      const jsonText = await jsonFile.async('string');
      let jsonContent;
      try {
        jsonContent = JSON.parse(jsonText);
      } catch {
        message = 'output.json contains invalid JSON. Please reupload or call IT support.';
        messageType = 'error';
        isUploading = false;
        return;
      }

      const imageFiles = Object.keys(zip.files).filter(
        name => name.startsWith('images/') && !zip.files[name].dir
      );

      message = 'Importing metadata...';
      messageType = 'info';

      // Phase 1: import all JSON metadata once.
      const metadataRes = await fetch('/api/dataApiRoutes/massImport', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: jsonText
      });

      const metadataResult = await metadataRes.json();
      if (!metadataRes.ok || !metadataResult?.success) {
        throw new Error(metadataResult?.error || 'Metadata import failed');
      }

      jsonDisplay = JSON.stringify(metadataResult, null, 2);

      if (imageFiles.length) {
        message = `Metadata imported. Uploading images... 0 / ${imageFiles.length}. Please stay on this page.`;
        messageType = 'info';
      }

      // Upload in batches to avoid oversized multipart requests that can reset the connection.
      for (let i = 0; i < imageFiles.length; i += IMAGE_BATCH_SIZE) {
        const batchPaths = imageFiles.slice(i, i + IMAGE_BATCH_SIZE);
        const formData = new FormData();

        for (const imagePath of batchPaths) {
          const blob = await zip.files[imagePath].async('blob');
          const filename = imagePath.split('/').pop();
          formData.append(imagePath, blob, filename);
        }

        const importRes = await fetch('/api/dataApiRoutes/massImport', {
          method: 'POST',
          body: formData
        });

        const importResult = await importRes.json();
        if (!importRes.ok || !importResult?.success) {
          throw new Error(importResult?.error || 'Database import failed');
        }

        message = `Uploading images... ${Math.min(i + IMAGE_BATCH_SIZE, imageFiles.length)} / ${imageFiles.length}. Please stay on this page.`;
        messageType = 'info';
        jsonDisplay = JSON.stringify(importResult, null, 2);
      }

      loadJson(jsonContent);

      message = `File imported successfully — ${imageFiles.length} image(s) found.`;
      messageType = 'success';

    } catch (err) {
      console.error(err);
      message = err?.message || 'Error reading ZIP file. Please reupload or call IT support for assistance.';
      messageType = 'error';
    } finally {
      isUploading = false;
    }

    event.target.value = '';
  }
</script>

<!-- HTML SECTION -->

<div class="drop-zone">
  <p class="drop-label font-sans!">Drop ZIP or click below!</p>

  <input type="file" id="attachment" accept=".zip" style="display:none" on:change={fileSelected}/>
  <button id="btnAttachment" on:click={openAttachment} class="rounded-sm! font-sans!" disabled={isUploading}>
    Upload Files <img src="/icons/upload.svg" alt="Upload Icon"/>
  </button>
</div>

{#if message}
  <div class="message {messageType}">{message}</div>
{/if}

{#if jsonDisplay}
  <pre id="jsonDisplay">{jsonDisplay}</pre>
{/if}

<!-- CSS SECTION -->

<style>

  .drop-zone {
    max-width: 100%;
    margin: 0 auto;
    padding: 10% 20%;
    background-color: #ebebeb;
    border: 2px dashed #aaa;
    border-radius: 4px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 24px;
  }

  .drop-label {
    font-family: Arial, sans-serif;
    font-size: 18px;
    font-weight: bold;
    color: #222;
    margin: 0;
  }

  #btnAttachment {
    display: flex;
    align-items: center;
    gap: 10px;
    background-color: #4a7c2f;
    color: white;
    border: none;
    border-radius: 999px;
    padding: 14px 28px;
    font-size: 16px;
    font-family: Arial, sans-serif;
    font-weight: bold;
    cursor: pointer;
    transition: background-color 0.2s ease;
  }

  #btnAttachment:hover {
    background-color: #3a6124;
  }

  .message {
    max-width: 800px;
    margin: 20px auto 0;
    padding: 10px;
    border-radius: 4px;
    font-family: Arial, sans-serif;
    font-weight: bold;
  }

  .message.success {
    background-color: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
  }

  .message.info {
    background-color: #d1ecf1;
    color: #0c5460;
    border: 1px solid #bee5eb;
  }

  .message.error {
    background-color: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
  }

  #btnAttachment:disabled {
    opacity: 0.65;
    cursor: not-allowed;
  }

  #jsonDisplay {
    max-width: 800px;
    margin: 20px auto 0;
    padding: 15px;
    color: black;
    background-color: #f5f5f5;
    border: 1px solid #ddd;
    border-radius: 4px;
    white-space: pre-wrap;
    font-family: 'Courier New', monospace;
    font-size: 14px;
    max-height: 400px;
    overflow-y: auto;
  }
</style>