<script>

  console.log('SpeciesVerification component loaded');

  // Props: pass in array of observations to verify
  export let observations = [];
  export let open = true;

  // Internal state
  let currentIndex = 0;
  let isCorrect = null; // null | true | false
  let correctionText = "";

  // Debug logging
  $: console.log('SpeciesVerification state:', { currentIndex, isCorrect, observationsLength: observations.length, isSubmitting });
  $: if (isCorrect !== null) {
    console.log('isCorrect changed to:', isCorrect);
  }

  let isSubmitting = false;

  // Get current observation
  $: currentObservation = observations[currentIndex] || {};
  $: birdId = currentObservation.observationSpecies || "Unknown";
  $: confidence = currentObservation.confidence || 0;
  $: observationID = currentObservation.observationID;
  $: imageUrl = ""; // Placeholder

  async function fetchImage(observationID) {
  if (!observationID) return;

  try {
      const res = await fetch(
        `/api/dataApiRoutes/images/imageObservation/?observationID=${observationID}`
      );

      if (!res.ok) {
        throw new Error("Failed to fetch image");
      }

      const data = await res.json();

      // Your SQL returns an array → take first image
      const image = data?.[0];

      if (image?.src ?? image?.filePath) {
        imageUrl = image.src ?? image.filePath;
      } else {
        imageUrl = ""; // fallback if no image exists
      }
    } catch (err) {
      console.error("Error fetching image:", err);
      imageUrl = "";
    }
  }

$: if (observationID) {
    fetchImage(observationID);
} 


  function handleButtonClick() {
    console.log('Button clicked! isCorrect:', isCorrect, 'isSubmitting:', isSubmitting, 'disabled:', isCorrect === null || isSubmitting);

    if (isCorrect === null || isSubmitting) {
      console.log('Button is disabled, not proceeding with submit');
      return;
    }

    handleSubmit();
  }

  async function handleSubmit() {
    console.log('handleSubmit called, currentIndex:', currentIndex, 'observations.length:', observations.length);
    console.log('isCorrect:', isCorrect, 'observationID:', observationID);

    if (!observationID) {
      console.log('No observationID, returning');
      return;
    }

    isSubmitting = true;

    try {
      const result = {
        observationID,
        birdId,
        confidence,
        verified: isCorrect,
        correction: isCorrect === false ? correctionText : null,
      };

      console.log('About to submit result:', result);

      
        console.log('Making API call for observation:', observationID);
        // Call API to update verification
        const response = await fetch('/api/dataApiRoutes/observations/validateSpecies/updateVerification/', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            observationID,
            verification: isCorrect,
            verificationText: correctionText,
            // boxID could be added if needed
          }),
        });

        console.log('API response status:', response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.log('API error response:', errorText);
          throw new Error('Failed to update verification');
        }

        const responseData = await response.json();
        console.log('API success response:', responseData);

      console.log("Submitted:", result);

      // Move to next observation or close if done
      if (currentIndex < observations.length - 1) {
        console.log('Moving to next observation, currentIndex will be:', currentIndex + 1);
        currentIndex++;
        // Reset form state
        isCorrect = null;
        correctionText = "";
      } else {
        console.log('All observations done, closing modal');
        // All observations verified, close modal
        open = false;
        currentIndex = 0;
        // Dispatch custom event so parent can listen
        dispatch("allVerified", { verifiedCount: observations.length });
      }
    } catch (error) {
      console.error('Error updating verification:', error);
      // Could show error message to user
    } finally {
      console.log('Setting isSubmitting to false');
      isSubmitting = false;
    }
  }

  function handleClose() {
    open = false;
    currentIndex = 0;
    isCorrect = null;
    correctionText = "";
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
          on:click={handleButtonClick}
          disabled={isCorrect === null || isSubmitting}
        >
          {#if isSubmitting}
            Updating...
          {:else if currentIndex < observations.length - 1}
            Next ({currentIndex + 1}/{observations.length})
          {:else}
            Complete Verification
          {/if}
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

  .progress {
    position: absolute;
    left: 20px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 0.9rem;
    color: #666;
    font-weight: 500;
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