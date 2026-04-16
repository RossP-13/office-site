<script>
  // Props: pass in the bird ID and confidence score
  export let birdId = "American Kestrel";
  export let confidence = 92;
  export let imageUrl = "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/Common_kestrel_falco_tinnunculus.jpg/1200px-Common_kestrel_falco_tinnunculus.jpg";
  export let open = true;

  // Internal state
  let isCorrect = null; // null | true | false
  let correctionText = "";

  function handleSubmit() {
    const result = {
      birdId,
      confidence,
      verified: isCorrect,
      correction: isCorrect === false ? correctionText : null,
    };
    console.log("Submitted:", result);
    // Dispatch custom event so parent can listen
    dispatch("submit", result);
    open = false;
  }

  function handleClose() {
    open = false;
  }

  import { createEventDispatcher } from "svelte";
  const dispatch = createEventDispatcher();
</script>

{#if open}
  <!-- Backdrop -->
  <div class="backdrop" on:click={handleClose} role="presentation">
    <!-- Modal -->
    <div
      class="modal"
      on:click|stopPropagation
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <!-- Header -->
      <div class="header">
        <h2 id="modal-title">Species Verification</h2>
        <button class="close-btn" on:click={handleClose} aria-label="Close">✕</button>
      </div>

      <!-- Bird Image -->
      <div class="image-wrapper">
        <img src={imageUrl} alt="Bird to identify" />
      </div>

      <!-- ID Info -->
      <div class="info-section">
        <h3>What We Think the Bird Is?</h3>

        <div class="info-row">
          <span class="field-key">Our ID:</span>
          <span class="value">{birdId}</span>
        </div>

        <div class="info-row">
          <span class="field-key">Confidence:</span>
          <span class="value">{confidence}%</span>
        </div>

        <!-- Verification -->
        <div class="field-group">
          <p class="field-heading">Is this correct?</p>
          <div class="radio-group">
            <label class="radio-label" class:selected={isCorrect === true}>
              <input type="radio" bind:group={isCorrect} value={true} />
              <span class="radio-custom"></span>
              Yes, that's correct
            </label>
            <label class="radio-label" class:selected={isCorrect === false}>
              <input type="radio" bind:group={isCorrect} value={false} />
              <span class="radio-custom"></span>
              No, it's something else
            </label>
          </div>
        </div>

        <!-- Correction textarea -->
        <div class="field-group" class:hidden={isCorrect !== false}>
          <p class="field-heading">If you choose "No":</p>
          <textarea
            bind:value={correctionText}
            placeholder="What species do you think this is?"
            rows="4"
            disabled={isCorrect !== false}
          ></textarea>
        </div>
      </div>

      <!-- Submit -->
      <div class="footer">
        <button
          class="submit-btn"
          on:click={handleSubmit}
          disabled={isCorrect === null}
        >
          Submit
        </button>
      </div>
    </div>
  </div>
{/if}

<style>

  :global(*) {
    box-sizing: border-box;
  }

  .backdrop {
    position: fixed;
    inset: 0;
    background: rgba(20, 20, 30, 0.55);
    backdrop-filter: blur(3px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    animation: fadeIn 0.2s ease;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }

  .modal {
    background: #fff;
    border-radius: 16px;
    width: min(480px, 94vw);
    max-height: 90vh;
    overflow-y: auto;
    text-align: left;
  }

  @keyframes slideUp {
    from { transform: translateY(24px) scale(0.97); opacity: 0; }
    to   { transform: translateY(0) scale(1); opacity: 1; }
  }

  /* Header */
  .header {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px 20px 12px;
    position: relative;
    text-align: left;
  }

  h2 {
    font-size: 1.5rem;
    font-weight: 700;
    color: #1a1a2e;
    margin: 0;
    letter-spacing: 0.01em;
  }

  .close-btn {
    position: absolute;
    right: 16px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    font-size: 1.1rem;
    cursor: pointer;
    color: #555;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: background 0.15s, color 0.15s;
  }

  .close-btn:hover {
    background: #f0eef8;
    color: #6b4fcf;
  }

  /* Image */
  .image-wrapper {
    width: 100%;
    height: 240px;
    overflow: hidden;
  }

  .image-wrapper img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  /* Info section */
  .info-section {
    padding: 20px 24px 4px;
  }

  h3 {
    font-size: 1.15rem;
    font-weight: 700;
    margin: 0 0 14px;
    color: #1a1a2e;
  }

  .info-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 10px;
    width: auto;
  }

  .field-key {
    font-weight: 600;
    color: #1a1a2e;
    white-space: nowrap;
    display: inline;
    width: auto;
  }

  .value {
    color: #333;
  }

  .confidence {
    font-weight: 400;
  }

  /* Fields */
  .field-group {
    margin-top: 16px;
    transition: opacity 0.2s;
  }

  .field-group.hidden {
    opacity: 0.4;
    pointer-events: none;
  }

  .field-heading {
    font-weight: 600;
    color: #1a1a2e;
    margin: 0 0 10px;
  }

  .radio-group {
    display: flex;
    gap: 20px;
    flex-wrap: wrap;
  }

  .radio-label {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    font-size: 0.95rem;
    color: #444;
    padding: 6px 12px 6px 8px;
    border-radius: 8px;
    border: 2px solid transparent;
    transition: border-color 0.15s, background 0.15s;
  }

  .radio-label.selected {
    border-color: #6b4fcf;
    background: #f5f2fd;
    color: #4a2fa0;
  }

  .radio-label input[type="radio"] {
    display: none;
  }

  .radio-custom {
    width: 18px;
    height: 18px;
    border: 2px solid #bbb;
    border-radius: 50%;
    flex-shrink: 0;
    position: relative;
    transition: border-color 0.15s;
  }

  .radio-label.selected .radio-custom {
    border-color: #6b4fcf;
  }

  .radio-label.selected .radio-custom::after {
    content: '';
    position: absolute;
    inset: 3px;
    background: #6b4fcf;
    border-radius: 50%;
  }

  textarea {
    width: 100%;
    padding: 12px;
    border: 2px solid #ddd;
    border-radius: 10px;
    font-size: 0.95rem;
    color: #333;
    resize: vertical;
    background: #f8f7fc;
    transition: border-color 0.15s;
    outline: none;
  }

  textarea:focus {
    border-color: #6b4fcf;
    background: #fff;
  }

  /* Footer */
  .footer {
    padding: 20px 24px 24px;
    display: flex;
    justify-content: center;
  }

  .submit-btn {
    background: #3a7d34;
    color: #fff;
    border: none;
    padding: 12px 56px;
    border-radius: 10px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    letter-spacing: 0.03em;
    transition: background 0.15s, transform 0.1s, opacity 0.15s;
  }

  .submit-btn:hover:not(:disabled) {
    background: #2e6328;
    transform: translateY(-1px);
  }

  .submit-btn:active:not(:disabled) {
    transform: translateY(0);
  }

  .submit-btn:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
</style>