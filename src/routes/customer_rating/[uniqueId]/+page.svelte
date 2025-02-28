<script>
  /** @type {import('./$types').PageData} */
  export let data;
  let rating = 0;
  let showFeedbackForm = false;
  let showThankYou = false;
  let feedbackText = '';
  let customerName = '';
  let company = null;
  let showToast = false;
  let isLoading = true;

  // Initialize company data once it's available
  $: {
    if (data.user) {
      company = data.user;
      isLoading = false;
    } else {
      isLoading = true;
    }
  }

  function handleRating(value) {
    if (isLoading) return;
    
    rating = value;
    showFeedbackForm = rating > 0 && rating <= 3;
    
    if (rating > 3) {
      showToast = true;
      const redirectUrl = company?.googleMapLink || "https://google.com";
      setTimeout(() => {
        window.location.href = redirectUrl;
      }, 700);
    }
  }

  async function handleSubmit() {
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uniqueId: company.uniqueId,
          customerName,
          rating,
          feedback: feedbackText,
          propertyName: company.propertyName
        })
      });

      if (!response.ok) throw new Error('Failed to submit feedback');
      showThankYou = true;
    } catch (err) {
      alert('Failed to submit feedback. Please try again.');
    }
  }
</script>

<main class="main-container">
  {#if showToast}
    <div class="toast">
      Thank you! Can you kindly put that rating on our Google Maps
    </div>
  {/if}

  {#if isLoading}
    <div class="card loading-card">
      <div class="loader-container">
        <div class="pulse-loader">
          <div class="pulse-dot"></div>
          <div class="pulse-dot"></div>
          <div class="pulse-dot"></div>
        </div>
        <p class="loader-text">Loading your feedback form...</p>
        <p class="loader-subtext">Please wait while we prepare everything</p>
      </div>
    </div>
  {:else if !data.user}
    <div class="error">
      <p>{data.error || 'Company not found'}</p>
      <p>Please check the QR code and try again.</p>
    </div>
  {:else if !showThankYou}
    <div class="card">
      <div class="welcome-section">
        <h1>Welcome to <span class="highlight">{company.propertyName}</span></h1>
        <div class="divider"></div>
        {#if company.customFeedbackMessage}
          <p class="custom-message">{company.customFeedbackMessage}</p>
        {/if}
        <p class="feedback-request">Can you please share your valuable feedback!</p>
      </div>
      
      <div class="content-section">
        <div class="rating-section">
          <h2>Overall Rating</h2>
          <div class="stars">
            {#each Array(5) as _, i}
              <button 
                class="star-btn" 
                on:click={() => handleRating(i + 1)}
                class:active={i < rating}
                class:disabled={isLoading}
                disabled={isLoading}
              >★</button>
            {/each}
          </div>
        </div>

        {#if showFeedbackForm}
          <div class="feedback-form">
            <div class="input-section">
              <input
                type="text"
                bind:value={customerName}
                placeholder="Your Name (Optional)"
                class="name-input"
              />
            </div>

            <div class="feedback-section">
              <textarea
                bind:value={feedbackText}
                placeholder="Please share your feedback to help us improve..."
              ></textarea>
            </div>
            
            <button class="submit-btn" on:click={handleSubmit}>
              Submit Feedback
            </button>
          </div>
        {/if}
      </div>
    </div>
  {:else}
    <div class="card thank-you">
      <div class="emoji">👍</div>
      <h2>Thank You!</h2>
      <p>We appreciate your valuable feedback</p>
      <p class="company-name">- {company.propertyName}</p>
    </div>
  {/if}
</main>

<style>
/* Loading styles */
.loading-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  min-height: 200px;
}

.loader-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
}

.pulse-loader {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-bottom: 12px;
}

.pulse-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: #8b5cf6;
  animation: pulse 1.5s infinite ease-in-out;
}

.pulse-dot:nth-child(2) {
  animation-delay: 0.2s;
}

.pulse-dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(0.8);
    opacity: 0.5;
  }
  50% {
    transform: scale(1.2);
    opacity: 1;
  }
}

.loader-text {
  font-size: 16px;
  color: #6b7280;
  font-weight: 500;
  text-align: center;
  margin: 0;
}

.loader-subtext {
  font-size: 14px;
  color: #888;
  text-align: center;
  margin: 4px 0 0 0;
}

/* Animations */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-15px); }
}

@keyframes starBounce {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.2); }
}

/* General styles */
:global(body) {
  margin: 0;
  padding: 0;
  min-height: 100vh;
  font-family: 'Segoe UI', sans-serif;
  background: #f0f4ff;
  background-image: 
    radial-gradient(at 40% 20%, rgba(139, 92, 246, 0.08) 0px, transparent 50%),
    radial-gradient(at 80% 0%, rgba(236, 72, 153, 0.05) 0px, transparent 50%);
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
}

.main-container {
  width: 100%;
  max-width: 450px;
  padding: 1rem;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card {
  background: white;
  border-radius: 24px;
  box-shadow: 0 10px 30px -12px rgba(0, 0, 0, 0.1);
  position: relative;
  border: 1px solid rgba(139, 92, 246, 0.1);
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.welcome-section {
  padding: 1.5rem 1.5rem 0.5rem;
  text-align: center;
  background: linear-gradient(to bottom, rgba(139, 92, 246, 0.05), transparent);
}

.welcome-section h1 {
  color: #4338ca;
  font-size: 1.4rem;
  font-weight: 700;
  margin: 0;
  letter-spacing: -0.5px;
}

.divider {
  height: 2px;
  background: linear-gradient(to right, transparent, #8b5cf6, transparent);
  margin: 0.5rem auto;
  width: 60%;
  opacity: 0.3;
}

.custom-message {
  color: #6366f1;
  font-size: 1rem;
  margin: 0.5rem 0;
  font-style: italic;
  line-height: 1.3;
}

.feedback-request {
  color: #6b7280;
  font-size: 0.9rem;
  margin: 0.5rem 0;
}

.content-section {
  padding: 0 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.rating-section {
  text-align: center;
  padding: 0.5rem 0;
  width: 100%;
}

.rating-section h2 {
  color: #4338ca;
  font-size: 1.1rem;
  margin-bottom: 0.5rem;
}

.stars {
  display: flex;
  justify-content: center;
  gap: 0.8rem;
  margin-bottom: 0.5rem;
}

.star-btn {
  background: none;
  border: none;
  font-size: 2.2rem;
  cursor: pointer;
  color: rgba(203, 213, 225, 0.8);
  transition: all 0.3s ease;
  padding: 0.2rem;
}

.star-btn:hover:not(:disabled) {
  transform: scale(1.1);
  color: #fbbf24;
}

.star-btn.active {
  color: #fbbf24;
  animation: starBounce 1s ease infinite;
}

.star-btn.disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.feedback-form {
  width: 100%;
  max-width: 300px;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin: 0 auto;
  padding: 0 1rem 1rem;
}

.input-section,
.feedback-section {
  width: 100%;
}

.name-input {
  width: 100%;
  padding: 0.6rem;
  background: #f8fafc;
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 12px;
  color: #1e293b;
  font-size: 0.9rem;
  transition: all 0.3s ease;
  box-sizing: border-box;
  height: 36px;
}

textarea {
  width: 100%;
  padding: 0.6rem;
  background: #f8fafc;
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 12px;
  color: #1e293b;
  font-size: 0.9rem;
  transition: all 0.3s ease;
  box-sizing: border-box;
  height: 60px;
  resize: none;
}

.name-input:focus,
textarea:focus {
  outline: none;
  border-color: #8b5cf6;
  background: white;
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
}

.submit-btn {
  width: 100%;
  background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
  color: white;
  border: none;
  padding: 0.6rem;
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(139, 92, 246, 0.2);
}

.submit-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(139, 92, 246, 0.3);
}

.toast {
  position: fixed;
  top: 24px;
  left: 50%;
  transform: translateX(-50%);
  background: white;
  color: #4338ca;
  padding: 1rem 2rem;
  border-radius: 100px;
  font-weight: 500;
  box-shadow: 0 8px 25px rgba(139, 92, 246, 0.2);
  animation: fadeIn 0.3s ease-out;
  z-index: 1000;
}

.thank-you {
  text-align: center;
  padding: 2rem 1.5rem;
  color: #4338ca;
}

.emoji {
  font-size: 4rem;
  margin-bottom: 0.5rem;
  animation: bounce 2s ease infinite;
}

.thank-you h2 {
  font-size: 1.8rem;
  margin: 0.5rem 0;
  background: linear-gradient(120deg, #8b5cf6 0%, #6366f1 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.thank-you p {
  color: #6b7280;
  font-size: 1rem;
  margin: 0.5rem 0;
}

.company-name {
  color: #4338ca;
  font-weight: 700;
  margin-top: 0.5rem;
  font-size: 1.1rem;
}

@media (max-width: 480px) {
  .main-container {
    padding: 0.5rem;
  }

  .welcome-section h1 {
    font-size: 1.3rem;
  }

  .star-btn {
    font-size: 2rem;
  }
}
</style>