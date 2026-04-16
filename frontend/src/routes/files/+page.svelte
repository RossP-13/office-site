<script>
  import JSZip from 'jszip';
  import { loadJson, loadImages, clearJson, clearImages } from "$lib/assets/jsonStore.js";

  let message = '';
  let messageType = '';
  let jsonDisplay = '';
  let imageDisplay = '';

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
    clearJson();
    clearImages();

    if (!file.name.endsWith('.zip')) {
      message = 'Please select a ZIP file';
      messageType = 'error';
      return;
    }

    try {
      const zip = await JSZip.loadAsync(file);

      const jsonFile = zip.file('output.json');
      if (!jsonFile) {
        message = 'ZIP is missing output.json. Please check the file structure.';
        messageType = 'error';
        return;
      }

      const jsonText = await jsonFile.async('string');
      let jsonContent;
      try {
        jsonContent = JSON.parse(jsonText);
      } catch {
        message = 'output.json contains invalid JSON. Please reupload or call IT support.';
        messageType = 'error';
        return;
      }

      const imageMap = {};
      const imageFiles = Object.keys(zip.files).filter(
        name => name.startsWith('images/') && !zip.files[name].dir
      );

      await Promise.all(
        imageFiles.map(async (imagePath) => {
          const blob = await zip.files[imagePath].async('blob');
          const objectUrl = URL.createObjectURL(blob);
          imageMap[imagePath] = objectUrl;
        })
      );

      loadJson(jsonContent);
      loadImages(imageMap);

      message = `File loaded successfully — ${imageFiles.length} image(s) found.`;
      messageType = 'success';
      jsonDisplay = JSON.stringify(jsonContent, null, 2);

    } catch (err) {
      console.error(err);
      message = 'Error reading ZIP file. Please reupload or call IT support for assistance.';
      messageType = 'error';
    }

    event.target.value = '';
  }
</script>

<!-- HTML SECTION -->

<div class="drop-zone">
  <p class="drop-label font-sans!">Drop ZIP or click below!</p>

  <input type="file" id="attachment" accept=".zip" style="display:none" on:change={fileSelected}/>
  <button id="btnAttachment" on:click={openAttachment} class="rounded-sm! font-sans!">
    Upload Files <img src="/icons/upload.svg" alt="Upload Icon"/>
  </button>
</div>

{#if message}
  <div class="message {messageType}">{message}</div>
{/if}

{#if jsonDisplay}
  <pre id="jsonDisplay">{jsonDisplay}</pre>
{/if}

{#if imageDisplay}
  <pre id="imageDisplay">{imageDisplay}</pre>
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

  .message.error {
    background-color: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
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