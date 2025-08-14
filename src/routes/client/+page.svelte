<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/auth.js';
	import { languageStore, t } from '$lib/stores/language.js';
	import { themeStore } from '$lib/stores/theme.js';
	import { productsService } from '$lib/services/products.js';
	import { categoriesService } from '$lib/services/categories.js';
	import { reviewsService } from '$lib/services/reviews.js';
	import ReviewModal from '$lib/components/ReviewModal.svelte';
	import ReviewsList from '$lib/components/ReviewsList.svelte';
	
	let products = [];
	let categories = [];
	let filteredProducts = [];
	let selectedCategory = null;
	let isLoading = false;
	let searchQuery = '';
	let showProductModal = false;
	let selectedProduct = null;
	let showReviewModal = false;
	let productReviews = [];
	let reviewsLoading = false;
	
	// Reactive statements
	$: isAuthenticated = $authStore.isAuthenticated;
	$: currentLang = $languageStore;
	$: currentTheme = $themeStore;
	
	// Helper function to get localized name
	function getLocalizedName(item) {
		if (!item || !item.name) return '';
		if (typeof item.name === 'string') return item.name;
		
		// Use current language preference, fallback to English, then Arabic
		return item.name[currentLang] || item.name.en || item.name.ar || '';
	}

	// Filter products based on category and search
	$: {
		let filtered = products;
		
		// Filter by category
		if (selectedCategory) {
			filtered = filtered.filter(product => {
				// Handle both string and object category formats
				const productCategory = typeof product.category === 'string' 
					? product.category 
					: getLocalizedName(product.category);
				
				const selectedCategoryName = getLocalizedName(selectedCategory);
				return productCategory === selectedCategoryName;
			});
		}
		
		// Filter by search query
		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase();
			filtered = filtered.filter(product => {
				const name = getLocalizedName(product);
				const description = getLocalizedName({name: product.description});
				return name.toLowerCase().includes(query) || description.toLowerCase().includes(query);
			});
		}
		
		// Sort by localized name
		filtered.sort((a, b) => {
			const nameA = getLocalizedName(a);
			const nameB = getLocalizedName(b);
			return nameA.localeCompare(nameB);
		});
		
		filteredProducts = filtered;
	}
	
	onMount(async () => {
		await loadData();
	});
	
	async function loadData() {
		isLoading = true;
		try {
			// Load products and categories in parallel
			const [productsResponse, categoriesResponse] = await Promise.all([
				loadProducts(),
				loadCategories()
			]);
		} catch (error) {
			console.error('Failed to load data:', error);
		} finally {
			isLoading = false;
		}
	}
	
	async function loadProducts() {
		try {
			const response = await productsService.getAllProducts();
			products = response.products || response.results || [];
			console.log(`Loaded ${response.total || products.length} products from API`);
		} catch (error) {
			console.error('Failed to load products:', error);
		}
	}
	
	async function loadCategories() {
		try {
			const response = await categoriesService.getAllCategories();
			categories = response.results || response.categories || response;
		} catch (error) {
			console.error('Failed to load categories:', error);
		}
	}
	
	function handleCreateOrder() {
		if (!isAuthenticated) {
			goto('/login');
			return;
		}
		goto('/client/orders/create');
	}
	
	function handleProductOrder(product) {
		if (!isAuthenticated) {
			goto('/login');
			return;
		}
		// Navigate to order creation with pre-selected product
		goto(`/client/orders/create?productId=${product.id}`);
	}
	
	async function openProductModal(product) {
		selectedProduct = product;
		showProductModal = true;
		await loadProductReviews(product.id);
	}
	
	function closeProductModal() {
		selectedProduct = null;
		showProductModal = false;
		productReviews = [];
	}

	async function loadProductReviews(productId) {
		if (!productId) return;
		
		reviewsLoading = true;
		try {
			const response = await reviewsService.getProductReviews(productId);
			// Response is directly an array of review objects
			productReviews = Array.isArray(response) ? response : [];
		} catch (error) {
			console.error('Failed to load product reviews:', error);
			productReviews = [];
		} finally {
			reviewsLoading = false;
		}
	}

	function openReviewModal() {
		if (!isAuthenticated) {
			goto('/login');
			return;
		}
		showReviewModal = true;
	}

	function closeReviewModal() {
		showReviewModal = false;
	}

	async function handleReviewSubmit(event) {
		try {
			console.log('Submitting review data:', event.detail);
			const response = await reviewsService.createReview(event.detail);
			console.log('Review submission response:', response);
			closeReviewModal();
			// Reload reviews to show the new one
			await loadProductReviews(selectedProduct.id);
			alert($languageStore === 'ar' ? 'تم إرسال المراجعة بنجاح!' : 'Review submitted successfully!');
		} catch (error) {
			console.error('Failed to submit review - Full error:', error);
			console.error('Error message:', error.message);
			console.error('Error status:', error.response?.status);
			console.error('Error response:', error.response);
			
			// Show more specific error message based on status
			let errorMessage = $languageStore === 'ar' ? 'فشل في إرسال المراجعة' : 'Failed to submit review';
			if (error.message.includes('401')) {
				errorMessage = $languageStore === 'ar' ? 'يجب تسجيل الدخول أولاً' : 'Please login first';
			} else if (error.message.includes('400')) {
				errorMessage = $languageStore === 'ar' ? 'بيانات المراجعة غير صحيحة' : 'Invalid review data';
			} else if (error.message.includes('500')) {
				errorMessage = $languageStore === 'ar' ? 'خطأ في الخادم' : 'Server error';
			}
			
			alert(errorMessage);
			// Don't close modal on error so user can try again
		}
	}
	
	function selectCategory(category) {
		selectedCategory = selectedCategory?.id === category?.id ? null : category;
	}
</script>

<svelte:head>
	<title>{t('home')} - Patriot Glass Factory</title>
</svelte:head>

<div class="homepage" data-theme={currentTheme}>
	<!-- Hero Section -->
	<section class="hero">
		<div class="hero-background">
			<img src="/glass-factory-bg.jpg" alt="Glass Factory" />
			<div class="hero-overlay"></div>
		</div>
		<div class="hero-content">
			<div class="container">
				<h1 class="hero-title">{t('welcomeToPatriot')}</h1>
				<p class="hero-subtitle">
					{#if currentLang === 'ar'}
						نحن رواد في صناعة الزجاج عالي الجودة منذ عقود، نقدم حلول زجاجية مبتكرة لجميع احتياجاتكم
					{:else}
						Leading glass manufacturing excellence for decades, providing innovative glass solutions for all your needs
					{/if}
				</p>
				<button class="cta-button" on:click={handleCreateOrder}>
					{t('createOrder')}
				</button>
			</div>
		</div>
	</section>

	<!-- About Section -->
	<section class="about">
		<div class="container">
			<h2>{t('aboutUs')}</h2>
			<div class="about-content">
				<div class="about-text">
					{#if currentLang === 'ar'}
						<p>
							مصنع باتريوت للزجاج هو شركة رائدة في صناعة الزجاج عالي الجودة. نحن نفخر بتقديم منتجات زجاجية متميزة 
							تلبي أعلى معايير الجودة والسلامة. مع خبرة تمتد لعقود في هذا المجال، نحن نستخدم أحدث التقنيات والمعدات 
							لضمان تقديم أفضل المنتجات لعملائنا.
						</p>
						<p>
							نحن متخصصون في إنتاج جميع أنواع الزجاج بما في ذلك الزجاج الشفاف، والزجاج المقسى، والزجاج الديكوري، 
							والمرايا. فريقنا من الخبراء مستعد لتلبية جميع احتياجاتكم وتقديم حلول مخصصة تناسب مشاريعكم.
						</p>
					{:else}
						<p>
							Patriot Glass Factory is a leading manufacturer of high-quality glass products. We pride ourselves on 
							delivering exceptional glass solutions that meet the highest standards of quality and safety. With decades 
							of experience in the industry, we utilize state-of-the-art technology and equipment to ensure the best 
							products for our customers.
						</p>
						<p>
							We specialize in producing all types of glass including clear glass, tempered glass, decorative glass, 
							and mirrors. Our team of experts is ready to meet all your needs and provide customized solutions that 
							fit your projects perfectly.
						</p>
					{/if}
				</div>
			</div>
		</div>
	</section>

	<!-- Products Section -->
	<section class="products">
		<div class="container">
			<h2>{t('ourProducts')}</h2>
			
			<!-- Search and Filter -->
			<div class="products-controls">
				<div class="search-box">
					<input 
						type="text" 
						bind:value={searchQuery}
						placeholder={t('search')}
						class="search-input"
					/>
				</div>
				
				<div class="category-filters">
					<button 
						class="category-btn {selectedCategory === null ? 'active' : ''}"
						on:click={() => selectCategory(null)}
					>
						{t('allCategories')}
					</button>
{#each categories as category}
<button 
class="category-btn {selectedCategory?.id === category.id ? 'active' : ''}"
on:click={() => selectCategory(category)}
>
{getLocalizedName(category)}
</button>
{/each}
				</div>
			</div>

			<!-- Products Grid -->
			{#if isLoading}
				<div class="loading">
					<div class="spinner"></div>
					<p>{t('loading')}</p>
				</div>
			{:else if filteredProducts.length === 0}
				<div class="no-products">
					<p>
						{#if currentLang === 'ar'}
							لا توجد منتجات متاحة
						{:else}
							No products available
						{/if}
					</p>
				</div>
			{:else}
				<div class="products-grid">
					{#each filteredProducts as product}
						<div class="product-card" on:click={() => openProductModal(product)}>
							<div class="product-image">
								<img src={product.imageUrl} alt={getLocalizedName(product)} />
								<div class="product-overlay">
									<button class="view-btn">{t('viewProduct')}</button>
								</div>
							</div>
							<div class="product-info">
								<h3 class="product-name">{getLocalizedName(product)}</h3>
								<p class="product-category">{getLocalizedName(product.category) || 'No Category'}</p>
								{#if product.ratingsAverage}
									<div class="product-rating">
										<span class="rating-stars">{'★'.repeat(Math.round(product.ratingsAverage))}</span>
										<span class="rating-text">({product.ratingsQuantity || 0})</span>
									</div>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</section>
</div>

<!-- Product Modal -->
{#if showProductModal && selectedProduct}
	<div class="modal-overlay" on:click={closeProductModal}>
		<div class="modal-content" on:click|stopPropagation>
			<div class="modal-header">
				<h3>{t('productDetails')}</h3>
				<button class="close-btn" on:click={closeProductModal}>×</button>
			</div>
			
			<div class="modal-body">
				<div class="product-detail-image">
					<img src={selectedProduct.imageUrl} alt={getLocalizedName(selectedProduct)} />
				</div>
				
				<div class="product-details">
					<h4>{getLocalizedName(selectedProduct)}</h4>
					<p class="product-description">{getLocalizedName({name: selectedProduct.description})}</p>
					
					{#if selectedProduct.ratingsAverage}
						<div class="product-rating-detail">
							<span class="rating-stars">{'★'.repeat(Math.round(selectedProduct.ratingsAverage))}</span>
							<span class="rating-average">{selectedProduct.ratingsAverage.toFixed(1)}</span>
							<span class="rating-count">({selectedProduct.ratingsQuantity || 0} {t('reviews')})</span>
						</div>
					{/if}
					
					<div class="product-specs">
						<div class="spec-item">
							<label>{t('width')}:</label>
							<span>{selectedProduct.width} cm</span>
						</div>
						<div class="spec-item">
							<label>{t('height')}:</label>
							<span>{selectedProduct.height} cm</span>
						</div>
						<div class="spec-item">
							<label>{t('type')}:</label>
							<span>{getLocalizedName(selectedProduct.category) || 'No Category'}</span>
						</div>
					</div>
					
					<div class="product-actions">
						<button class="order-btn" on:click={() => handleProductOrder(selectedProduct)}>
							{t('orderNow')}
						</button>
						<button class="review-btn" on:click={openReviewModal}>
							{currentLang === 'ar' ? 'إضافة مراجعة' : 'Add Review'}
						</button>
					</div>

					<!-- Reviews Section -->
					<ReviewsList reviews={productReviews} isLoading={reviewsLoading} />
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
	on:close={closeReviewModal}
/>

<style>
	.homepage {
		min-height: 100vh;
	}

	/* Hero Section */
	.hero {
		position: relative;
		height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
	}

	.hero-background {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		z-index: -2;
	}

	.hero-background img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.hero-overlay {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: linear-gradient(135deg, rgba(59, 130, 246, 0.8), rgba(37, 99, 235, 0.6));
		z-index: -1;
	}

	.hero-content {
		text-align: center;
		color: white;
		z-index: 1;
	}

	.hero-title {
		font-size: 3.5rem;
		font-weight: 700;
		margin-bottom: 1rem;
		text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
	}

	.hero-subtitle {
		font-size: 1.25rem;
		margin-bottom: 2rem;
		max-width: 600px;
		margin-left: auto;
		margin-right: auto;
		text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
	}

	.cta-button {
		background: linear-gradient(135deg, #f59e0b, #d97706);
		color: white;
		border: none;
		padding: 1rem 2rem;
		font-size: 1.125rem;
		font-weight: 600;
		border-radius: 50px;
		cursor: pointer;
		transition: all 0.3s ease;
		box-shadow: 0 4px 15px rgba(245, 158, 11, 0.4);
	}

	.cta-button:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 20px rgba(245, 158, 11, 0.6);
	}

	/* Container */
	.container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 1rem;
	}

	/* About Section */
	.about {
		padding: 5rem 0;
		background: var(--bg-secondary, #f8fafc);
	}

	.about h2 {
		text-align: center;
		font-size: 2.5rem;
		font-weight: 700;
		margin-bottom: 3rem;
		color: var(--text-primary, #1e293b);
	}

	.about-text {
		max-width: 800px;
		margin: 0 auto;
		font-size: 1.125rem;
		line-height: 1.8;
		color: var(--text-secondary, #64748b);
	}

	.about-text p {
		margin-bottom: 1.5rem;
	}

	/* Products Section */
	.products {
		padding: 5rem 0;
		background: var(--bg-primary, white);
	}

	.products h2 {
		text-align: center;
		font-size: 2.5rem;
		font-weight: 700;
		margin-bottom: 3rem;
		color: var(--text-primary, #1e293b);
	}

	.products-controls {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		margin-bottom: 3rem;
	}

	.search-box {
		display: flex;
		justify-content: center;
	}

	.search-input {
		width: 100%;
		max-width: 400px;
		padding: 0.75rem 1rem;
		border: 2px solid var(--border-color, #e2e8f0);
		border-radius: 25px;
		font-size: 1rem;
		background: var(--bg-primary, white);
		color: var(--text-primary, #1e293b);
	}

	.search-input:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	.category-filters {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 0.75rem;
	}

	.category-btn {
		padding: 0.5rem 1.5rem;
		border: 2px solid var(--border-color, #e2e8f0);
		background: var(--bg-primary, white);
		color: var(--text-secondary, #64748b);
		border-radius: 25px;
		cursor: pointer;
		transition: all 0.3s ease;
		font-weight: 500;
	}

	.category-btn:hover {
		border-color: #3b82f6;
		color: #3b82f6;
	}

	.category-btn.active {
		background: #3b82f6;
		border-color: #3b82f6;
		color: white;
	}

	.products-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 2rem;
	}

	.product-card {
		background: var(--bg-primary, white);
		border-radius: 12px;
		overflow: hidden;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		transition: all 0.3s ease;
		cursor: pointer;
		border: 1px solid var(--border-color, #e2e8f0);
	}

	.product-card:hover {
		transform: translateY(-4px);
		box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
	}

	.product-image {
		position: relative;
		height: 200px;
		overflow: hidden;
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

	.product-overlay {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(59, 130, 246, 0.8);
		display: flex;
		align-items: center;
		justify-content: center;
		opacity: 0;
		transition: opacity 0.3s ease;
	}

	.product-card:hover .product-overlay {
		opacity: 1;
	}

	.view-btn {
		background: white;
		color: #3b82f6;
		border: none;
		padding: 0.75rem 1.5rem;
		border-radius: 25px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s ease;
	}

	.view-btn:hover {
		transform: scale(1.05);
	}

	.product-info {
		padding: 1.5rem;
	}

	.product-name {
		font-size: 1.25rem;
		font-weight: 600;
		margin-bottom: 0.5rem;
		color: var(--text-primary, #1e293b);
	}

	.product-category {
		color: var(--text-secondary, #64748b);
		font-size: 0.875rem;
		margin-bottom: 0.5rem;
	}

	.product-rating {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
	}

	.rating-stars {
		color: #fbbf24;
	}

	.rating-text {
		color: var(--text-secondary, #64748b);
	}

	.product-rating-detail {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 1.5rem;
		padding: 0.75rem;
		background: var(--bg-secondary, #f8fafc);
		border-radius: 8px;
	}

	.rating-average {
		font-weight: 600;
		color: var(--text-primary, #1e293b);
	}

	.rating-count {
		color: var(--text-secondary, #64748b);
		font-size: 0.875rem;
	}

	/* Loading */
	.loading {
		text-align: center;
		padding: 3rem;
	}

	.spinner {
		width: 40px;
		height: 40px;
		border: 4px solid var(--border-color, #f3f4f6);
		border-top: 4px solid #3b82f6;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin: 0 auto 1rem;
	}

	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}

	.no-products {
		text-align: center;
		padding: 3rem;
		color: var(--text-secondary, #64748b);
	}

	/* Modal */
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 1rem;
	}

	.modal-content {
		background: var(--bg-primary, white);
		border-radius: 12px;
		max-width: 800px;
		width: 100%;
		max-height: 90vh;
		overflow-y: auto;
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.5rem;
		border-bottom: 1px solid var(--border-color, #e2e8f0);
	}

	.modal-header h3 {
		margin: 0;
		font-size: 1.5rem;
		font-weight: 600;
		color: var(--text-primary, #1e293b);
	}

	.close-btn {
		background: none;
		border: none;
		font-size: 1.5rem;
		cursor: pointer;
		color: var(--text-secondary, #64748b);
		padding: 0.25rem;
	}

	.modal-body {
		padding: 1.5rem;
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 2rem;
	}

	.product-detail-image {
		border-radius: 8px;
		overflow: hidden;
	}

	.product-detail-image img {
		width: 100%;
		height: 300px;
		object-fit: cover;
	}

	.product-details h4 {
		font-size: 1.5rem;
		font-weight: 600;
		margin-bottom: 1rem;
		color: var(--text-primary, #1e293b);
	}

	.product-description {
		color: var(--text-secondary, #64748b);
		margin-bottom: 1.5rem;
		line-height: 1.6;
	}

	.product-specs {
		margin-bottom: 2rem;
	}

	.spec-item {
		display: flex;
		justify-content: space-between;
		padding: 0.5rem 0;
		border-bottom: 1px solid var(--border-color, #f1f5f9);
	}

	.spec-item label {
		font-weight: 500;
		color: var(--text-primary, #1e293b);
	}

	.spec-item span {
		color: var(--text-secondary, #64748b);
	}

	.product-actions {
		display: flex;
		gap: 12px;
		margin-bottom: 2rem;
	}

	.order-btn,
	.review-btn {
		flex: 1;
		border: none;
		padding: 0.75rem 1.5rem;
		border-radius: 8px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s ease;
		font-size: 0.9rem;
	}

	.order-btn {
		background: linear-gradient(135deg, #3b82f6, #2563eb);
		color: white;
	}

	.order-btn:hover {
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
	}

	.review-btn {
		background: var(--review-btn-bg, #f8f9fa);
		color: var(--review-btn-color, #495057);
		border: 1px solid var(--border-color, #dee2e6);
	}

	.review-btn:hover {
		background: var(--review-btn-hover, #e9ecef);
		transform: translateY(-1px);
	}

	/* Dark mode styles */
	[data-theme="dark"] {
		--bg-primary: #1e293b;
		--bg-secondary: #0f172a;
		--text-primary: #f1f5f9;
		--text-secondary: #94a3b8;
		--border-color: #334155;
		--review-btn-bg: #374151;
		--review-btn-color: #d1d5db;
		--review-btn-hover: #4b5563;
	}

	/* RTL support */
	[dir="rtl"] .hero-title,
	[dir="rtl"] .hero-subtitle {
		text-align: center;
	}

	[dir="rtl"] .about-text {
		text-align: right;
	}

	/* Responsive */
	@media (max-width: 768px) {
		.hero-title {
			font-size: 2.5rem;
		}

		.hero-subtitle {
			font-size: 1rem;
		}

		.products-controls {
			align-items: stretch;
		}

		.category-filters {
			justify-content: flex-start;
		}

		.products-grid {
			grid-template-columns: 1fr;
		}

		.modal-body {
			grid-template-columns: 1fr;
		}

		.product-detail-image img {
			height: 200px;
		}

		.product-actions {
			flex-direction: column;
		}

		.order-btn,
		.review-btn {
			width: 100%;
		}
	}
</style>

