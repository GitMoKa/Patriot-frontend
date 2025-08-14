<script>
	import { createEventDispatcher } from 'svelte';
	import { languageStore, t } from '$lib/stores/language.js';
	import { themeStore } from '$lib/stores/theme.js';

	export let show = false;
	export let productId = '';

	const dispatch = createEventDispatcher();

	let rating = 0;
	let title = '';
	let comment = '';
	let isSubmitting = false;

	// Reactive statements
	$: currentLang = $languageStore;
	$: currentTheme = $themeStore;

	function setRating(stars) {
		rating = stars;
	}

	function handleSubmit() {
		if (rating === 0) {
			alert(currentLang === 'ar' ? 'يرجى اختيار تقييم' : 'Please select a rating');
			return;
		}

		isSubmitting = true;

		const reviewData = {
			rating,
			productId,
			...(title.trim() && { title: title.trim() }),
			...(comment.trim() && { comment: comment.trim() })
		};

		console.log('ReviewModal - dispatching submit with data:', reviewData);
		dispatch('submit', reviewData);
	}

	// Reset isSubmitting when show prop changes
	$: if (!show) {
		isSubmitting = false;
	}

	function handleClose() {
		// Reset form
		rating = 0;
		title = '';
		comment = '';
		isSubmitting = false;
		dispatch('close');
	}

	// Close modal when clicking outside
	function handleBackdropClick(event) {
		if (event.target === event.currentTarget) {
			handleClose();
		}
	}
</script>

{#if show}
	<div class="modal-backdrop" on:click={handleBackdropClick} data-theme={currentTheme}>
		<div class="modal-content">
			<div class="modal-header">
				<h3>{currentLang === 'ar' ? 'إضافة مراجعة' : 'Add Review'}</h3>
				<button class="close-button" on:click={handleClose}>×</button>
			</div>

			<div class="modal-body">
				<!-- Star Rating -->
				<div class="rating-section">
					<label>{currentLang === 'ar' ? 'التقييم' : 'Rating'} *</label>
					<div class="star-rating">
						{#each [1, 2, 3, 4, 5] as star}
							<button
								class="star {star <= rating ? 'filled' : ''}"
								on:click={() => setRating(star)}
								type="button"
							>
								★
							</button>
						{/each}
					</div>
				</div>

				<!-- Title -->
				<div class="form-group">
					<label for="review-title">
						{currentLang === 'ar' ? 'عنوان المراجعة (اختياري)' : 'Review Title (Optional)'}
					</label>
					<input
						id="review-title"
						type="text"
						bind:value={title}
						placeholder={currentLang === 'ar' ? 'أدخل عنوان المراجعة' : 'Enter review title'}
						maxlength="100"
					/>
				</div>

				<!-- Comment -->
				<div class="form-group">
					<label for="review-comment">
						{currentLang === 'ar' ? 'تفاصيل المراجعة (اختياري)' : 'Review Details (Optional)'}
					</label>
					<textarea
						id="review-comment"
						bind:value={comment}
						placeholder={currentLang === 'ar' ? 'أدخل تفاصيل المراجعة' : 'Enter review details'}
						rows="4"
						maxlength="500"
					></textarea>
				</div>
			</div>

			<div class="modal-footer">
				<button class="cancel-button" on:click={handleClose} disabled={isSubmitting}>
					{currentLang === 'ar' ? 'إلغاء' : 'Cancel'}
				</button>
				<button class="submit-button" on:click={handleSubmit} disabled={isSubmitting}>
					{isSubmitting ? 
						(currentLang === 'ar' ? 'جاري الإرسال...' : 'Submitting...') : 
						(currentLang === 'ar' ? 'إرسال المراجعة' : 'Submit Review')
					}
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.modal-backdrop {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 1000;
	}

	.modal-content {
		background: var(--bg-color, white);
		border-radius: 12px;
		width: 90%;
		max-width: 500px;
		max-height: 90vh;
		overflow-y: auto;
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 20px;
		border-bottom: 1px solid var(--border-color, #eee);
	}

	.modal-header h3 {
		margin: 0;
		color: var(--text-color, #333);
		font-size: 1.25rem;
		font-weight: 600;
	}

	.close-button {
		background: none;
		border: none;
		font-size: 24px;
		cursor: pointer;
		color: var(--text-color, #666);
		padding: 0;
		width: 30px;
		height: 30px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		transition: background-color 0.2s;
	}

	.close-button:hover {
		background-color: var(--hover-bg, #f5f5f5);
	}

	.modal-body {
		padding: 20px;
	}

	.rating-section {
		margin-bottom: 20px;
	}

	.rating-section label {
		display: block;
		margin-bottom: 8px;
		font-weight: 500;
		color: var(--text-color, #333);
	}

	.star-rating {
		display: flex;
		gap: 4px;
	}

	.star {
		background: none;
		border: none;
		font-size: 28px;
		cursor: pointer;
		color: #ddd;
		transition: color 0.2s;
		padding: 0;
	}

	.star.filled {
		color: #ffd700;
	}

	.star:hover {
		color: #ffd700;
	}

	.form-group {
		margin-bottom: 20px;
	}

	.form-group label {
		display: block;
		margin-bottom: 8px;
		font-weight: 500;
		color: var(--text-color, #333);
	}

	.form-group input,
	.form-group textarea {
		width: 100%;
		padding: 12px;
		border: 1px solid var(--border-color, #ddd);
		border-radius: 8px;
		font-size: 14px;
		background: var(--input-bg, white);
		color: var(--text-color, #333);
		box-sizing: border-box;
	}

	.form-group input:focus,
	.form-group textarea:focus {
		outline: none;
		border-color: var(--primary-color, #007bff);
		box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
	}

	.form-group textarea {
		resize: vertical;
		min-height: 80px;
	}

	.modal-footer {
		display: flex;
		justify-content: flex-end;
		gap: 12px;
		padding: 20px;
		border-top: 1px solid var(--border-color, #eee);
	}

	.cancel-button,
	.submit-button {
		padding: 10px 20px;
		border: none;
		border-radius: 6px;
		font-size: 14px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
	}

	.cancel-button {
		background: var(--secondary-bg, #f8f9fa);
		color: var(--text-color, #666);
		border: 1px solid var(--border-color, #ddd);
	}

	.cancel-button:hover:not(:disabled) {
		background: var(--hover-bg, #e9ecef);
	}

	.submit-button {
		background: var(--primary-color, #007bff);
		color: white;
	}

	.submit-button:hover:not(:disabled) {
		background: var(--primary-hover, #0056b3);
	}

	.submit-button:disabled,
	.cancel-button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	/* Dark theme support */
	[data-theme="dark"] .modal-content {
		--bg-color: #2d3748;
		--text-color: #e2e8f0;
		--border-color: #4a5568;
		--input-bg: #4a5568;
		--hover-bg: #4a5568;
		--secondary-bg: #4a5568;
	}

	/* RTL support */
	[dir="rtl"] .modal-header,
	[dir="rtl"] .modal-footer {
		direction: rtl;
	}

	[dir="rtl"] .star-rating {
		direction: ltr; /* Keep stars left-to-right */
	}
</style>