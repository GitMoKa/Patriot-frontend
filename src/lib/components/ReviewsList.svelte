<script>
	import { languageStore } from '$lib/stores/language.js';
	import { themeStore } from '$lib/stores/theme.js';

	export let reviews = [];
	export let isLoading = false;

	// Reactive statements
	$: currentLang = $languageStore;
	$: currentTheme = $themeStore;

	function formatDate(dateString) {
		if (!dateString) return '';
		const date = new Date(dateString);
		return date.toLocaleDateString(currentLang === 'ar' ? 'ar-SA' : 'en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	function renderStars(rating) {
		return '★'.repeat(rating) + '☆'.repeat(5 - rating);
	}

	function getUserDisplayName(user) {
		if (!user) return currentLang === 'ar' ? 'مستخدم مجهول' : 'Anonymous User';
		return user.name || user.username || user.email || (currentLang === 'ar' ? 'مستخدم مجهول' : 'Anonymous User');
	}
</script>

<div class="reviews-container" data-theme={currentTheme}>
	<div class="reviews-header">
		<h4>{currentLang === 'ar' ? 'المراجعات' : 'Reviews'}</h4>
		{#if reviews.length > 0}
			<span class="reviews-count">
				({reviews.length} {currentLang === 'ar' ? 'مراجعة' : reviews.length === 1 ? 'review' : 'reviews'})
			</span>
		{/if}
	</div>

	{#if isLoading}
		<div class="loading">
			<div class="loading-spinner"></div>
			<p>{currentLang === 'ar' ? 'جاري تحميل المراجعات...' : 'Loading reviews...'}</p>
		</div>
	{:else if reviews.length === 0}
		<div class="no-reviews">
			<p>{currentLang === 'ar' ? 'لا توجد مراجعات بعد' : 'No reviews yet'}</p>
			<p class="no-reviews-subtitle">
				{currentLang === 'ar' ? 'كن أول من يراجع هذا المنتج' : 'Be the first to review this product'}
			</p>
		</div>
	{:else}
		<div class="reviews-list">
			{#each reviews as review}
				<div class="review-item">
					<div class="review-header">
						<div class="review-user">
							<span class="user-name">{getUserDisplayName(review.user)}</span>
							<span class="review-date">{formatDate(review.createdAt)}</span>
						</div>
						<div class="review-rating">
							<span class="stars">{renderStars(review.rating)}</span>
							<span class="rating-number">({review.rating}/5)</span>
						</div>
					</div>
					
					{#if review.title && review.title.trim()}
						<h5 class="review-title">{review.title}</h5>
					{/if}
					
					{#if review.comment && review.comment.trim()}
						<p class="review-comment">{review.comment}</p>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.reviews-container {
		margin-top: 20px;
	}

	.reviews-header {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-bottom: 16px;
		padding-bottom: 8px;
		border-bottom: 1px solid var(--border-color, #eee);
	}

	.reviews-header h4 {
		margin: 0;
		color: var(--text-color, #333);
		font-size: 1.1rem;
		font-weight: 600;
	}

	.reviews-count {
		color: var(--text-secondary, #666);
		font-size: 0.9rem;
	}

	.loading {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 40px 20px;
		color: var(--text-secondary, #666);
	}

	.loading-spinner {
		width: 24px;
		height: 24px;
		border: 2px solid var(--border-color, #eee);
		border-top: 2px solid var(--primary-color, #007bff);
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin-bottom: 12px;
	}

	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}

	.no-reviews {
		text-align: center;
		padding: 40px 20px;
		color: var(--text-secondary, #666);
	}

	.no-reviews p {
		margin: 0 0 8px 0;
	}

	.no-reviews-subtitle {
		font-size: 0.9rem;
		opacity: 0.8;
	}

	.reviews-list {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.review-item {
		padding: 16px;
		border: 1px solid var(--border-color, #eee);
		border-radius: 8px;
		background: var(--review-bg, #fafafa);
	}

	.review-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 8px;
		gap: 12px;
	}

	.review-user {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.user-name {
		font-weight: 500;
		color: var(--text-color, #333);
		font-size: 0.9rem;
	}

	.review-date {
		font-size: 0.8rem;
		color: var(--text-secondary, #666);
	}

	.review-rating {
		display: flex;
		align-items: center;
		gap: 4px;
		flex-shrink: 0;
	}

	.stars {
		color: #ffd700;
		font-size: 0.9rem;
	}

	.rating-number {
		font-size: 0.8rem;
		color: var(--text-secondary, #666);
	}

	.review-title {
		margin: 0 0 8px 0;
		font-size: 1rem;
		font-weight: 500;
		color: var(--text-color, #333);
	}

	.review-comment {
		margin: 0;
		line-height: 1.5;
		color: var(--text-color, #333);
		font-size: 0.9rem;
	}

	/* Dark theme support */
	[data-theme="dark"] .reviews-container {
		--text-color: #e2e8f0;
		--text-secondary: #a0aec0;
		--border-color: #4a5568;
		--review-bg: #2d3748;
	}

	/* Responsive design */
	@media (max-width: 768px) {
		.review-header {
			flex-direction: column;
			align-items: flex-start;
			gap: 8px;
		}

		.review-rating {
			align-self: flex-start;
		}
	}

	/* RTL support */
	[dir="rtl"] .reviews-header,
	[dir="rtl"] .review-header {
		direction: rtl;
	}

	[dir="rtl"] .stars {
		direction: ltr; /* Keep stars left-to-right */
	}
</style>