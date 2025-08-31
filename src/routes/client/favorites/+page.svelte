<script>
	import { onMount } from 'svelte';
	import { languageStore } from '$lib/stores/language.js';
	import { authStore } from '$lib/stores/auth.js';
	import { favoritesService } from '$lib/services/favorites.js';
	import { reviewsService } from '$lib/services/reviews.js';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import ReviewModal from '$lib/components/ReviewModal.svelte';
	import ReviewsList from '$lib/components/ReviewsList.svelte';
	import Pagination from '$lib/components/Pagination.svelte';

	let favoriteProducts = [];
	let isLoading = true;
	let error = null;
	
	// Pagination state
	let currentPage = 0; // 0-based for API
	let totalPages = 1;
	let totalItems = 0;
	let itemsPerPage = 12;
	
	// Product popup state
	let showProductPopup = false;
	let selectedProduct = null;
	let isRemovingFromFavorites = false;
	let favoriteMessage = '';
	
	// Review state
	let showReviewModal = false;
	let productReviews = [];
	let isLoadingReviews = false;
	let reviewsError = null;

	// Get current language
	$: currentLang = $languageStore;

	// Helper function to get localized text
	function getLocalizedText(textObj) {
		if (!textObj) return '';
		if (typeof textObj === 'string') return textObj;
		return textObj[currentLang] || textObj.en || textObj.ar || '';
	}

	async function loadFavoriteProducts() {
		isLoading = true;
		error = null;
		try {
			const response = await favoritesService.getAllFavorites(currentPage, itemsPerPage);
			favoriteProducts = response.favorites || response.results || [];
			totalPages = response.totalPages || 1;
			totalItems = response.total || 0;
		} catch (err) {
			console.error('Failed to load favorite products:', err);
			error = 'Failed to load favorite products. Please try again.';
		} finally {
			isLoading = false;
		}
	}
	
	function handlePageChange(event) {
		const newPage = event.detail.page;
		currentPage = newPage;
		
		// Update URL with new page parameter
		const url = new URL($page.url);
		url.searchParams.set('page', newPage.toString());
		url.searchParams.set('limit', itemsPerPage.toString());
		goto(url.toString(), { replaceState: true });
		
		loadFavoriteProducts();
	}

	function handleProductClick(favoriteItem) {
		selectedProduct = favoriteItem.product;
		showProductPopup = true;
		favoriteMessage = ''; // Clear any previous favorite message
		loadProductReviews(favoriteItem.product.id); // Load reviews when popup opens
	}

	function closeProductPopup() {
		showProductPopup = false;
		selectedProduct = null;
		favoriteMessage = '';
		productReviews = [];
		reviewsError = null;
	}

	function handleAddReview() {
		if (!$authStore.isAuthenticated) {
			favoriteMessage = currentLang === 'ar' ? 'يجب تسجيل الدخول أولاً لإضافة مراجعة' : 'Please login first to add a review';
			return;
		}
		showReviewModal = true;
	}

	async function loadProductReviews(productId) {
		isLoadingReviews = true;
		reviewsError = null;
		
		try {
			const response = await reviewsService.getProductReviews(productId);
			// Handle direct array response or wrapped response
			productReviews = Array.isArray(response) ? response : (response.results || response.reviews || []);
		} catch (err) {
			console.error('Failed to load reviews:', err);
			reviewsError = currentLang === 'ar' ? 'فشل في تحميل المراجعات' : 'Failed to load reviews';
			productReviews = [];
		} finally {
			isLoadingReviews = false;
		}
	}

	async function handleReviewSubmit(event) {
		const reviewData = event.detail;
		
		try {
			await reviewsService.createReview(reviewData);
			
			// Show success message
			favoriteMessage = currentLang === 'ar' ? 'تم إرسال المراجعة بنجاح' : 'Review submitted successfully';
			
			// Close review modal
			showReviewModal = false;
			
			// Reload reviews to show the new one
			await loadProductReviews(selectedProduct.id);
			
		} catch (err) {
			console.error('Failed to submit review:', err);
			favoriteMessage = currentLang === 'ar' ? 'فشل في إرسال المراجعة' : 'Failed to submit review';
		}
	}

	function handleReviewModalClose() {
		showReviewModal = false;
	}

	function handleOrderNow() {
		// Navigate to create order page with selected product
		goto(`/client/orders/create?productId=${selectedProduct.id}`);
	}

	async function handleRemoveFromFavorites(productId, event) {
		// Stop event propagation to prevent opening the popup
		event.stopPropagation();
		
		if (!$authStore.isAuthenticated) {
			favoriteMessage = currentLang === 'ar' ? 'يجب تسجيل الدخول أولاً' : 'Please login first';
			return;
		}

		isRemovingFromFavorites = true;
		favoriteMessage = '';

		try {
			await favoritesService.removeFromFavorites(productId);
			
			favoriteMessage = currentLang === 'ar' ? 'تم إزالة المنتج من المفضلة' : 'Product removed from favorites';
			
			// Refresh the favorites list
			await loadFavoriteProducts();
			
		} catch (err) {
			console.error('Failed to remove from favorites:', err);
			favoriteMessage = currentLang === 'ar' ? 'فشل في إزالة المنتج من المفضلة' : 'Failed to remove from favorites';
		} finally {
			isRemovingFromFavorites = false;
		}
	}

	function goToProductsPage() {
		goto('/client/products');
	}

	// Get URL parameters on mount and when they change
	$: if ($page.url.searchParams.has('page')) {
		const urlPage = parseInt($page.url.searchParams.get('page') || '0');
		if (urlPage !== currentPage) {
			currentPage = urlPage;
			loadFavoriteProducts();
		}
	}

	onMount(() => {
		loadFavoriteProducts();
	});
</script>

<svelte:head>
	<title>My Favorites - Patriot Glass Factory</title>
	<meta name="description" content="View your favorite glass products" />
</svelte:head>

<div class="favorites-page">
	<div class="container">
		<!-- Header -->
		<div class="page-header">
			<h1 class="page-title">
				{#if currentLang === 'ar'}
					منتجاتي المفضلة
				{:else}
					My Favorites
				{/if}
			</h1>
			<p class="page-description">
				{#if currentLang === 'ar'}
					منتجاتك المفضلة من الزجاج عالي الجودة
				{:else}
					Your favorite high-quality glass products
				{/if}
			</p>
		</div>

		<!-- Loading State -->
		{#if isLoading}
			<div class="loading-container">
				<div class="spinner"></div>
				<p class="loading-text">
					{#if currentLang === 'ar'}
						جاري تحميل المنتجات المفضلة...
					{:else}
						Loading favorite products...
					{/if}
				</p>
			</div>
		{/if}

		<!-- Error State -->
		{#if error}
			<div class="error-container">
				<div class="error-icon">⚠️</div>
				<p class="error-message">{error}</p>
				<button class="retry-btn" on:click={loadFavoriteProducts}>
					{#if currentLang === 'ar'}
						إعادة المحاولة
					{:else}
						Try Again
					{/if}
				</button>
			</div>
		{/if}

		<!-- Favorite Message -->
		{#if favoriteMessage}
			<div class="favorite-message" class:success={favoriteMessage.includes('added') || favoriteMessage.includes('تمت') || favoriteMessage.includes('removed') || favoriteMessage.includes('إزالة')}>
				{favoriteMessage}
			</div>
		{/if}

		<!-- Products Section -->
		{#if !isLoading && !error}
			<div class="products-section">
				{#if favoriteProducts.length > 0}
					<h2 class="section-title">
						{#if currentLang === 'ar'}
							منتجاتك المفضلة ({favoriteProducts.length})
						{:else}
							Your Favorite Products ({favoriteProducts.length})
						{/if}
					</h2>
					
					<!-- Products Grid -->
					<div class="products-grid">
						{#each favoriteProducts as favoriteItem}
							<div class="product-card" on:click={() => handleProductClick(favoriteItem)}>
								<div class="product-image">
									{#if favoriteItem.product.imageUrl}
										<img 
											src={favoriteItem.product.imageUrl} 
											alt={getLocalizedText(favoriteItem.product.name)}
											loading="lazy"
											on:error={(e) => {
												e.target.style.display = 'none';
												e.target.nextElementSibling?.style.setProperty('display', 'flex');
											}}
										/>
										<div class="image-placeholder" style="display: none;">
											<svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
												<path d="M21 19V5C21 3.9 20.1 3 19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19ZM8.5 13.5L11 16.51L14.5 12L19 18H5L8.5 13.5Z" fill="currentColor"/>
											</svg>
										</div>
									{:else}
										<div class="image-placeholder">
											<svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
												<path d="M21 19V5C21 3.9 20.1 3 19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19ZM8.5 13.5L11 16.51L14.5 12L19 18H5L8.5 13.5Z" fill="currentColor"/>
											</svg>
										</div>
									{/if}
								</div>
								
								<div class="product-content">
									<h3 class="product-name">{getLocalizedText(favoriteItem.product.name)}</h3>
									{#if favoriteItem.product.description}
										<p class="product-description">{getLocalizedText(favoriteItem.product.description)}</p>
									{/if}
									
									<div class="product-meta">
										{#if favoriteItem.product.category}
											<span class="product-category">
												{getLocalizedText(favoriteItem.product.category.name)}
											</span>
										{/if}
										
										{#if favoriteItem.product.ratingsAverage && favoriteItem.product.ratingsAverage > 0}
											<div class="product-rating">
												<span class="rating-stars">{'★'.repeat(Math.round(favoriteItem.product.ratingsAverage))}</span>
												<span class="rating-text">({favoriteItem.product.ratingsQuantity || 0})</span>
											</div>
										{/if}
									</div>
									
									<div class="product-actions">
										<button 
											class="remove-favorite-btn" 
											on:click={(e) => handleRemoveFromFavorites(favoriteItem.product.id, e)}
											disabled={isRemovingFromFavorites}
										>
											{#if isRemovingFromFavorites}
												<div class="remove-spinner"></div>
											{:else}
												<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
													<path d="M19 7L18.1327 19.1425C18.0579 20.1891 17.187 21 16.1378 21H7.86224C6.81296 21 5.94208 20.1891 5.86732 19.1425L5 7M10 11V17M14 11V17M15 7V4C15 3.44772 14.5523 3 14 3H10C9.44772 3 9 3.44772 9 4V7M4 7H20" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
												</svg>
											{/if}
											{#if currentLang === 'ar'}
												إزالة من المفضلة
											{:else}
												Remove from Favorites
											{/if}
										</button>
										
										<div class="product-action">
											<span class="action-text">
												{#if currentLang === 'ar'}
													اطلب الآن
												{:else}
													Order Now
												{/if}
											</span>
											<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
												<path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
											</svg>
										</div>
									</div>
								</div>
							</div>
						{/each}
					</div>
				{:else}
					<!-- Empty State -->
					<div class="empty-container">
						<div class="empty-icon">💙</div>
						<h3 class="empty-title">
							{#if currentLang === 'ar'}
								لا توجد منتجات مفضلة
							{:else}
								No Favorite Products
							{/if}
						</h3>
						<p class="empty-message">
							{#if currentLang === 'ar'}
								لم تقم بإضافة أي منتجات إلى المفضلة بعد
							{:else}
								You haven't added any products to your favorites yet
							{/if}
						</p>
						<button class="add-favorite-btn" on:click={goToProductsPage}>
							{#if currentLang === 'ar'}
								إضافة منتج إلى المفضلة
							{:else}
								Add a Product to Favorites
							{/if}
						</button>
					</div>
				{/if}
				
				<!-- Pagination Component -->
				<Pagination 
					{currentPage}
					{totalPages}
					{totalItems}
					{itemsPerPage}
					on:pageChange={handlePageChange}
				/>
			</div>
		{/if}
	</div>
</div>

<!-- Product Popup -->
{#if showProductPopup && selectedProduct}
	<div class="popup-overlay" on:click={closeProductPopup}>
		<div class="popup-content" on:click|stopPropagation>
			<!-- Close Button -->
			<button class="popup-close" on:click={closeProductPopup}>
				<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
				</svg>
			</button>

			<!-- Product Image -->
			<div class="popup-image">
				{#if selectedProduct.imageUrl}
					<img 
						src={selectedProduct.imageUrl} 
						alt={getLocalizedText(selectedProduct.name)}
						on:error={(e) => {
							e.target.style.display = 'none';
							e.target.nextElementSibling?.style.setProperty('display', 'flex');
						}}
					/>
					<div class="image-placeholder" style="display: none;">
						<svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
							<path d="M21 19V5C21 3.9 20.1 3 19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19ZM8.5 13.5L11 16.51L14.5 12L19 18H5L8.5 13.5Z" fill="currentColor"/>
						</svg>
					</div>
				{:else}
					<div class="image-placeholder">
						<svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
							<path d="M21 19V5C21 3.9 20.1 3 19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19ZM8.5 13.5L11 16.51L14.5 12L19 18H5L8.5 13.5Z" fill="currentColor"/>
						</svg>
					</div>
				{/if}
			</div>

			<!-- Product Info -->
			<div class="popup-info">
				<div class="popup-header">
					<h2 class="popup-title">{getLocalizedText(selectedProduct.name)}</h2>
					
					<!-- Favorite Heart Icon (already in favorites) -->
					<div class="favorite-indicator">
						<svg width="24" height="24" viewBox="0 0 24 24" fill="#e74c3c" xmlns="http://www.w3.org/2000/svg">
							<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
						</svg>
					</div>
				</div>

				{#if selectedProduct.description}
					<p class="popup-description">{getLocalizedText(selectedProduct.description)}</p>
				{/if}

				<!-- Product Meta -->
				<div class="popup-meta">
					{#if selectedProduct.category}
						<div class="meta-item">
							<span class="meta-label">
								{#if currentLang === 'ar'}
									الفئة:
								{:else}
									Category:
								{/if}
							</span>
							<span class="meta-value">{getLocalizedText(selectedProduct.category.name)}</span>
						</div>
					{/if}
					
					{#if selectedProduct.height && selectedProduct.width}
						<div class="meta-item">
							<span class="meta-label">
								{#if currentLang === 'ar'}
									الأبعاد:
								{:else}
									Dimensions:
								{/if}
							</span>
							<span class="meta-value">{selectedProduct.width} × {selectedProduct.height}</span>
						</div>
					{/if}
					
					{#if selectedProduct.ratingsAverage && selectedProduct.ratingsAverage > 0}
						<div class="meta-item">
							<span class="meta-label">
								{#if currentLang === 'ar'}
									التقييم:
								{:else}
									Rating:
								{/if}
							</span>
							<div class="rating-display">
								<span class="rating-stars">{'★'.repeat(Math.round(selectedProduct.ratingsAverage))}</span>
								<span class="rating-text">({selectedProduct.ratingsQuantity || 0})</span>
							</div>
						</div>
					{/if}
				</div>

				<!-- Action Buttons -->
				<div class="popup-actions">
					<button class="action-btn secondary" on:click={handleAddReview}>
						{#if currentLang === 'ar'}
							إضافة تقييم
						{:else}
							Add Review
						{/if}
					</button>
					
					<button class="action-btn primary" on:click={handleOrderNow}>
						{#if currentLang === 'ar'}
							اطلب الآن
						{:else}
							Order Now
						{/if}
					</button>
				</div>

				<!-- Reviews Section -->
				<div class="popup-reviews">
					{#if reviewsError}
						<div class="reviews-error">
							<p>{reviewsError}</p>
							<button class="retry-reviews-btn" on:click={() => loadProductReviews(selectedProduct.id)}>
								{#if currentLang === 'ar'}
									إعادة المحاولة
								{:else}
									Try Again
								{/if}
							</button>
						</div>
					{:else}
						<ReviewsList 
							reviews={productReviews} 
							isLoading={isLoadingReviews}
						/>
					{/if}
				</div>
			</div>
		</div>
	</div>
{/if}

<!-- Review Modal -->
<ReviewModal 
	show={showReviewModal}
	productId={selectedProduct?.id || ''}
	on:submit={handleReviewSubmit}
	on:close={handleReviewModalClose}
/>

<style>
	.favorites-page {
		min-height: calc(100vh - 140px);
		background: var(--bg-primary);
		padding: 2rem 0;
	}

	.container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 1rem;
	}

	/* Header */
	.page-header {
		text-align: center;
		margin-bottom: 3rem;
	}

	.page-title {
		font-size: 2.5rem;
		font-weight: 700;
		color: var(--text-primary);
		margin: 0 0 1rem 0;
		background: linear-gradient(135deg, #3b82f6, #2563eb);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.page-description {
		font-size: 1.125rem;
		color: var(--text-secondary);
		margin: 0 0 2rem 0;
		max-width: 600px;
		margin-left: auto;
		margin-right: auto;
		line-height: 1.6;
	}

	/* Loading State */
	.loading-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 4rem 2rem;
		text-align: center;
	}

	.spinner {
		width: 40px;
		height: 40px;
		border: 4px solid var(--border-color);
		border-top: 4px solid #e74c3c;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin-bottom: 1rem;
	}

	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}

	.loading-text {
		color: var(--text-secondary);
		font-size: 1rem;
		margin: 0;
	}

	/* Error State */
	.error-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 4rem 2rem;
		text-align: center;
	}

	.error-icon {
		font-size: 3rem;
		margin-bottom: 1rem;
	}

	.error-message {
		color: #dc2626;
		font-size: 1rem;
		margin: 0 0 1.5rem 0;
	}

	.retry-btn {
		background: linear-gradient(135deg, #e74c3c, #c0392b);
		color: white;
		border: none;
		padding: 0.75rem 1.5rem;
		border-radius: 8px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.3s ease;
	}

	.retry-btn:hover {
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(231, 76, 60, 0.4);
	}

	/* Favorite Message */
	.favorite-message {
		padding: 0.75rem 1rem;
		border-radius: 8px;
		margin-bottom: 1.5rem;
		font-size: 0.875rem;
		text-align: center;
		border: 1px solid #fecaca;
		background: #fef2f2;
		color: #dc2626;
		max-width: 600px;
		margin-left: auto;
		margin-right: auto;
	}

	.favorite-message.success {
		border-color: #bbf7d0;
		background: #f0fdf4;
		color: #16a34a;
	}

	/* Products Section */
	.products-section {
		margin-bottom: 2rem;
	}

	.section-title {
		font-size: 1.75rem;
		font-weight: 600;
		color: var(--text-primary);
		margin: 0 0 2rem 0;
		text-align: center;
	}

	/* Products Grid */
	.products-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: 1.5rem;
		margin-bottom: 2rem;
	}

	.product-card {
		background: var(--bg-primary);
		border: 1px solid var(--border-color);
		border-radius: 12px;
		overflow: hidden;
		transition: all 0.3s ease;
		cursor: pointer;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		position: relative;
	}

	.product-card:hover {
		transform: translateY(-4px);
		box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
		border-color: #e74c3c;
	}

	.product-card::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: linear-gradient(135deg, rgba(231, 76, 60, 0.05), rgba(192, 57, 43, 0.05));
		opacity: 0;
		transition: opacity 0.3s ease;
		pointer-events: none;
		z-index: 1;
	}

	.product-card:hover::before {
		opacity: 1;
	}

	.product-image {
		position: relative;
		width: 100%;
		height: 200px;
		overflow: hidden;
		background: var(--bg-secondary);
	}

	.product-image img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: transform 0.3s ease;
	}

	.product-card:hover .product-image img {
		transform: scale(1.05);
	}

	.image-placeholder {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--text-tertiary);
		background: var(--bg-secondary);
	}

	.product-content {
		padding: 1.5rem;
		position: relative;
		z-index: 2;
		transition: all 0.3s ease;
	}

	.product-card:hover .product-content {
		transform: translateY(-2px);
	}

	.product-name {
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--text-primary);
		margin: 0 0 0.5rem 0;
		line-height: 1.4;
		transition: color 0.3s ease;
	}

	.product-card:hover .product-name {
		color: #e74c3c;
	}

	.product-description {
		color: var(--text-secondary);
		font-size: 0.875rem;
		line-height: 1.5;
		margin: 0 0 1rem 0;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.product-meta {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-bottom: 1rem;
		transition: all 0.3s ease;
	}

	.product-card:hover .product-meta {
		transform: scale(1.02);
	}

	.product-category {
		font-size: 0.75rem;
		color: var(--text-tertiary);
		background: var(--bg-secondary);
		padding: 0.25rem 0.5rem;
		border-radius: 12px;
		display: inline-block;
		width: fit-content;
		transition: all 0.3s ease;
	}

	.product-card:hover .product-category {
		background: rgba(231, 76, 60, 0.1);
		color: #e74c3c;
		transform: translateX(2px);
	}

	.product-rating {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		transition: all 0.3s ease;
	}

	.product-card:hover .product-rating {
		transform: scale(1.05);
	}

	.rating-stars {
		color: #fbbf24;
		font-size: 0.875rem;
	}

	.rating-text {
		color: var(--text-secondary);
		font-size: 0.75rem;
	}

	.product-actions {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.remove-favorite-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		background: transparent;
		border: 2px solid #e74c3c;
		color: #e74c3c;
		border-radius: 8px;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.3s ease;
	}

	.remove-favorite-btn:hover:not(:disabled) {
		background: #e74c3c;
		color: white;
		transform: translateY(-1px);
	}

	.remove-favorite-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.remove-spinner {
		width: 16px;
		height: 16px;
		border: 2px solid rgba(231, 76, 60, 0.3);
		border-top: 2px solid #e74c3c;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	.product-action {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		color: #3b82f6;
		font-weight: 500;
		font-size: 0.875rem;
		transition: all 0.3s ease;
		padding: 0.5rem;
		border-radius: 6px;
	}

	.product-card:hover .product-action {
		color: #2563eb;
		background: rgba(59, 130, 246, 0.1);
		transform: translateX(4px);
	}

	.action-text {
		transition: all 0.3s ease;
	}

	/* Empty State */
	.empty-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 4rem 2rem;
		text-align: center;
	}

	.empty-icon {
		font-size: 4rem;
		margin-bottom: 1rem;
		opacity: 0.7;
	}

	.empty-title {
		font-size: 1.5rem;
		font-weight: 600;
		color: var(--text-primary);
		margin: 0 0 0.5rem 0;
	}

	.empty-message {
		color: var(--text-secondary);
		font-size: 1rem;
		margin: 0 0 2rem 0;
		max-width: 400px;
	}

	.add-favorite-btn {
		background: linear-gradient(135deg, #e74c3c, #c0392b);
		color: white;
		border: none;
		padding: 1rem 2rem;
		border-radius: 12px;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s ease;
		box-shadow: 0 4px 15px rgba(231, 76, 60, 0.4);
	}

	.add-favorite-btn:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 20px rgba(231, 76, 60, 0.6);
	}

	/* Product Popup Styles */
	.popup-overlay {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(0, 0, 0, 0.6);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 1rem;
		backdrop-filter: blur(4px);
	}

	.popup-content {
		background: var(--bg-primary);
		border-radius: 20px;
		max-width: 600px;
		width: 100%;
		max-height: 90vh;
		overflow-y: auto;
		position: relative;
		box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
		border: 1px solid var(--border-color);
	}

	.popup-close {
		position: absolute;
		top: 1rem;
		right: 1rem;
		background: rgba(255, 255, 255, 0.9);
		border: none;
		border-radius: 50%;
		width: 40px;
		height: 40px;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		z-index: 10;
		transition: all 0.3s ease;
		color: var(--text-primary);
	}

	.popup-close:hover {
		background: rgba(255, 255, 255, 1);
		transform: scale(1.1);
	}

	.popup-image {
		width: 100%;
		height: 300px;
		overflow: hidden;
		border-radius: 20px 20px 0 0;
		background: var(--bg-secondary);
	}

	.popup-image img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.popup-image .image-placeholder {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--text-tertiary);
		background: var(--bg-secondary);
	}

	.popup-info {
		padding: 2rem;
	}

	.popup-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.popup-title {
		font-size: 1.75rem;
		font-weight: 700;
		color: var(--text-primary);
		margin: 0;
		line-height: 1.3;
		flex: 1;
	}

	.favorite-indicator {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 48px;
		height: 48px;
		border-radius: 50%;
		background: rgba(231, 76, 60, 0.1);
		flex-shrink: 0;
	}

	.popup-description {
		color: var(--text-secondary);
		font-size: 1rem;
		line-height: 1.6;
		margin: 0 0 1.5rem 0;
	}

	.popup-meta {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		margin-bottom: 1.5rem;
		padding: 1.5rem;
		background: var(--bg-secondary);
		border-radius: 12px;
		border: 1px solid var(--border-color);
	}

	.meta-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
	}

	.meta-label {
		font-weight: 600;
		color: var(--text-primary);
		font-size: 0.9rem;
	}

	.meta-value {
		color: var(--text-secondary);
		font-size: 0.9rem;
		background: var(--bg-primary);
		padding: 0.25rem 0.75rem;
		border-radius: 20px;
		border: 1px solid var(--border-color);
	}

	.rating-display {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.rating-display .rating-stars {
		color: #fbbf24;
		font-size: 1rem;
	}

	.rating-display .rating-text {
		color: var(--text-secondary);
		font-size: 0.875rem;
	}

	.popup-actions {
		display: flex;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.action-btn {
		flex: 1;
		min-width: 140px;
		padding: 1rem 1.5rem;
		border: none;
		border-radius: 12px;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s ease;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
	}

	.action-btn.primary {
		background: linear-gradient(135deg, #3b82f6, #2563eb);
		color: white;
		box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4);
	}

	.action-btn.primary:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 20px rgba(59, 130, 246, 0.6);
	}

	.action-btn.secondary {
		background: transparent;
		color: var(--text-primary);
		border: 2px solid var(--border-color);
	}

	.action-btn.secondary:hover {
		background: var(--bg-secondary);
		border-color: #3b82f6;
		color: #3b82f6;
		transform: translateY(-2px);
	}

	/* Reviews section in popup */
	.popup-reviews {
		margin-top: 2rem;
		padding-top: 1.5rem;
		border-top: 1px solid var(--border-color);
	}

	.reviews-error {
		text-align: center;
		padding: 2rem;
		color: var(--text-secondary);
	}

	.reviews-error p {
		margin: 0 0 1rem 0;
		color: #dc2626;
	}

	.retry-reviews-btn {
		background: transparent;
		border: 2px solid var(--border-color);
		color: var(--text-primary);
		padding: 0.5rem 1rem;
		border-radius: 8px;
		cursor: pointer;
		font-size: 0.875rem;
		transition: all 0.3s ease;
	}

	.retry-reviews-btn:hover {
		border-color: #3b82f6;
		color: #3b82f6;
		transform: translateY(-1px);
	}

	/* Dark theme support */
	[data-theme="dark"] .favorite-message {
		background: rgba(220, 38, 38, 0.1);
		border-color: rgba(220, 38, 38, 0.3);
		color: #fca5a5;
	}

	[data-theme="dark"] .favorite-message.success {
		background: rgba(22, 163, 74, 0.1);
		border-color: rgba(22, 163, 74, 0.3);
		color: #86efac;
	}

	[data-theme="dark"] .popup-close {
		background: rgba(30, 41, 59, 0.9);
		color: var(--text-primary);
	}

	[data-theme="dark"] .popup-close:hover {
		background: rgba(30, 41, 59, 1);
	}

	[data-theme="dark"] .reviews-error p {
		color: #fca5a5;
	}

	/* Responsive */
	@media (max-width: 768px) {
		.favorites-page {
			padding: 1rem 0;
		}

		.page-title {
			font-size: 2rem;
		}

		.page-description {
			font-size: 1rem;
		}

		.products-grid {
			grid-template-columns: 1fr;
			gap: 1.5rem;
		}

		.product-image {
			height: 180px;
		}

		.product-content {
			padding: 1rem;
		}

		.popup-overlay {
			padding: 0.5rem;
		}

		.popup-content {
			max-height: 95vh;
		}

		.popup-image {
			height: 250px;
		}

		.popup-info {
			padding: 1.5rem;
		}

		.popup-title {
			font-size: 1.5rem;
		}

		.popup-header {
			flex-direction: column;
			align-items: flex-start;
			gap: 1rem;
		}

		.favorite-indicator {
			align-self: flex-end;
		}

		.popup-actions {
			flex-direction: column;
		}

		.action-btn {
			min-width: auto;
		}

		.popup-meta {
			padding: 1rem;
		}

		.meta-item {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.5rem;
		}
	}

	/* RTL support */
	:global([dir="rtl"]) .product-card:hover .product-action {
		transform: translateX(-4px);
	}

	:global([dir="rtl"]) .product-card:hover .product-category {
		transform: translateX(-2px);
	}
</style>