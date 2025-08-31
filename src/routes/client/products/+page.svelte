<script>
	import { onMount } from 'svelte';
	import { categoriesService } from '$lib/services/categories.js';
	import { productsService } from '$lib/services/products.js';
	import { languageStore } from '$lib/stores/language.js';
	import { authStore } from '$lib/stores/auth.js';
	import { apiService } from '$lib/services/api.js';
	import { reviewsService } from '$lib/services/reviews.js';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import ReviewModal from '$lib/components/ReviewModal.svelte';
	import ReviewsList from '$lib/components/ReviewsList.svelte';
	import Pagination from '$lib/components/Pagination.svelte';

	let categories = [];
	let products = [];
	let filteredProducts = [];
	let selectedCategory = null;
	let selectedCategoryId = 'All Categories'; // Track selected category for filtering
	let sortBy = 'name'; // 'name', 'rating'
	let isLoading = true;
	let error = null;
	let viewMode = 'both'; // Show both categories and products
	let showSortDropdown = false; // Control sort dropdown visibility
	
	// Pagination state
	let currentPage = 0; // 0-based for API
	let totalPages = 1;
	let totalItems = 0;
	let itemsPerPage = 12; // Good number for product grid
	
	// Product popup state
	let showProductPopup = false;
	let selectedProduct = null;
	let isAddingToFavorites = false;
	let favoriteMessage = '';
	let isProductInFavorites = false;
	
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

	// Reactive statement to filter and sort products
	$: {
		let filtered = [...products];
		
		// Filter out specific product ID
		filtered = filtered.filter(product => product.id !== 'f505f98a-c68f-48ae-a49a-72bc66986745');
		
		// Filter by category based on selectedCategoryId
		if (selectedCategoryId === 'No Category') {
			// Filter products with no category
			filtered = filtered.filter(product => {
				return !product.category || product.category === null || product.category === undefined;
			});
		} else if (selectedCategoryId !== 'All Categories') {
			// Filter by specific category ID
			filtered = filtered.filter(product => {
				const productCategoryId = product.category?.id;
				return productCategoryId === selectedCategoryId;
			});
		}
		// If 'All Categories' is selected, show all products (no filtering)
		
		// Sort products
		filtered.sort((a, b) => {
			if (sortBy === 'rating') {
				const ratingA = a.ratingsAverage || 0;
				const ratingB = b.ratingsAverage || 0;
				return ratingB - ratingA; // Descending order
			} else {
				// Sort by name
				const nameA = getLocalizedText(a.name);
				const nameB = getLocalizedText(b.name);
				return nameA.localeCompare(nameB);
			}
		});
		
		filteredProducts = filtered;
	}

	async function loadCategories() {
		try {
			const response = await categoriesService.getAllCategories();
			categories = response.results || [];
		} catch (err) {
			console.error('Failed to load categories:', err);
			throw err;
		}
	}

	async function loadProducts() {
		try {
			const response = await productsService.getAllProducts(currentPage, itemsPerPage);
			products = response.results || response.products || [];
			totalItems = response.total || 0;
			// Calculate total pages based on total items and items per page
			totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
		} catch (err) {
			console.error('Failed to load products:', err);
			throw err;
		}
	}

	async function loadData() {
		isLoading = true;
		error = null;
		try {
			await Promise.all([loadCategories(), loadProducts()]);
		} catch (err) {
			console.error('Failed to load data:', err);
			error = 'Failed to load data. Please try again.';
		} finally {
			isLoading = false;
		}
	}

	function handleCategoryClick(category) {
		// Navigate to create order page with selected category
		goto(`/client/orders/create?categoryId=${category.id}`);
	}

	async function checkIfProductInFavorites(productId) {
		if (!$authStore.isAuthenticated) {
			isProductInFavorites = false;
			return;
		}
		
		try {
			const response = await apiService.get('/favorites');
			const favorites = response.results || [];
			isProductInFavorites = favorites.some(fav => fav.product.id === productId);
		} catch (err) {
			console.error('Failed to check favorites:', err);
			isProductInFavorites = false;
		}
	}

	async function handleProductClick(product) {
		selectedProduct = product;
		showProductPopup = true;
		favoriteMessage = ''; // Clear any previous favorite message
		await checkIfProductInFavorites(product.id); // Check if product is in favorites
		loadProductReviews(product.id); // Load reviews when popup opens
	}
	
	// Function to open product popup by ID (for notifications)
	async function openProductPopupById(productId) {
		try {
			// First try to find the product in the current products list
			let product = products.find(p => p.id === productId);
			
			// If not found in current list, fetch the specific product
			if (!product) {
				const response = await productsService.getProductById(productId);
				product = response;
			}
			
			if (product) {
				await handleProductClick(product);
				// Remove the productId parameter from URL after opening popup
				const url = new URL($page.url);
				url.searchParams.delete('productId');
				goto(url.toString(), { replaceState: true });
			} else {
				console.warn('Product not found:', productId);
			}
		} catch (error) {
			console.error('Failed to load product for popup:', error);
		}
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

	async function handleAddToFavorites() {
		if (!$authStore.isAuthenticated) {
			favoriteMessage = currentLang === 'ar' ? 'يجب تسجيل الدخول أولاً' : 'Please login first';
			return;
		}

		isAddingToFavorites = true;
		favoriteMessage = '';

		try {
			if (isProductInFavorites) {
				// Remove from favorites
				await apiService.delete(`/favorites/${selectedProduct.id}`);
				isProductInFavorites = false;
				favoriteMessage = currentLang === 'ar' ? 'تم إزالة المنتج من المفضلة' : 'Product removed from favorites';
			} else {
				// Add to favorites
				await apiService.post('/favorites', {
					productId: selectedProduct.id
				});
				isProductInFavorites = true;
				favoriteMessage = currentLang === 'ar' ? 'تمت إضافة المنتج إلى المفضلة' : 'Product added to favorites';
			}
		} catch (err) {
			console.error('Failed to update favorites:', err);
			if (isProductInFavorites) {
				favoriteMessage = currentLang === 'ar' ? 'فشل في إزالة المنتج من المفضلة' : 'Failed to remove from favorites';
			} else {
				favoriteMessage = currentLang === 'ar' ? 'فشل في إضافة المنتج إلى المفضلة' : 'Failed to add to favorites';
			}
		} finally {
			isAddingToFavorites = false;
		}
	}


	// New function to handle category selection from the horizontal scroll
	async function selectCategoryFilter(categoryId) {
		selectedCategoryId = categoryId;
		currentPage = 0; // Reset to first page when category changes
		
		// Update URL with new category and reset page
		const url = new URL($page.url);
		url.searchParams.set('page', '0');
		if (categoryId !== 'All Categories') {
			url.searchParams.set('category', categoryId);
		} else {
			url.searchParams.delete('category');
		}
		goto(url.toString(), { replaceState: true });
		
		// If a specific category is selected, load products for that category
		if (categoryId !== 'All Categories' && categoryId !== 'No Category') {
			try {
				const response = await productsService.getProductsByCategory(categoryId, currentPage, itemsPerPage);
				products = response.results || response.products || [];
				totalItems = response.total || 0;
				// Calculate total pages based on total items and items per page
				totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
				// Update the filtered products directly for better performance
				filteredProducts = products;
			} catch (err) {
				console.error('Failed to load products for category:', err);
				// Fallback to loading all products
				await loadProducts();
			}
		} else {
			// Load all products
			await loadProducts();
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
		
		// Load products for current category and page
		if (selectedCategoryId !== 'All Categories' && selectedCategoryId !== 'No Category') {
			selectCategoryFilter(selectedCategoryId);
		} else {
			loadProducts();
		}
	}

	function toggleSortDropdown() {
		showSortDropdown = !showSortDropdown;
	}

	function selectSort(value) {
		sortBy = value;
		showSortDropdown = false;
	}

	// Close dropdown when clicking outside
	function handleClickOutside(event) {
		if (!event.target.closest('.sort-dropdown-container')) {
			showSortDropdown = false;
		}
	}

	// Get URL parameters on mount and when they change
	$: if ($page.url.searchParams.has('page')) {
		const urlPage = parseInt($page.url.searchParams.get('page') || '0');
		if (urlPage !== currentPage) {
			currentPage = urlPage;
		}
	}
	
	$: if ($page.url.searchParams.has('category')) {
		const urlCategory = $page.url.searchParams.get('category') || 'All Categories';
		if (urlCategory !== selectedCategoryId) {
			selectedCategoryId = urlCategory;
		}
	}
	
	// Handle productId URL parameter for opening product popup (from notifications)
	$: if ($page.url.searchParams.has('productId')) {
		const productId = $page.url.searchParams.get('productId');
		if (productId && products.length > 0) {
			openProductPopupById(productId);
		}
	}

	onMount(async () => {
		await loadData();
		
		// Check if there's a productId in URL parameters after loading data
		const productId = $page.url.searchParams.get('productId');
		if (productId) {
			await openProductPopupById(productId);
		}
		
		// Add click outside listener
		document.addEventListener('click', handleClickOutside);
		return () => {
			document.removeEventListener('click', handleClickOutside);
		};
	});
</script>

<svelte:head>
	<title>Products - Patriot Glass Factory</title>
	<meta name="description" content="Browse our glass products and categories" />
</svelte:head>

<div class="products-page">
	<div class="container">
		<!-- Header -->
		<div class="page-header">
			<h1 class="page-title">
				{#if currentLang === 'ar'}
					منتجاتنا
				{:else}
					Our Products
				{/if}
			</h1>
			<p class="page-description">
				{#if currentLang === 'ar'}
					اكتشف مجموعتنا الواسعة من منتجات الزجاج عالية الجودة
				{:else}
					Discover our wide range of high-quality glass products
				{/if}
			</p>
			
		</div>


		<!-- Loading State -->
		{#if isLoading}
			<div class="loading-container">
				<div class="spinner"></div>
				<p class="loading-text">
					{#if currentLang === 'ar'}
						جاري تحميل المنتجات...
					{:else}
						Loading products...
					{/if}
				</p>
			</div>
		{/if}

		<!-- Error State -->
		{#if error}
			<div class="error-container">
				<div class="error-icon">⚠️</div>
				<p class="error-message">{error}</p>
				<button class="retry-btn" on:click={loadCategories}>
					{#if currentLang === 'ar'}
						إعادة المحاولة
					{:else}
						Try Again
					{/if}
				</button>
			</div>
		{/if}


		<!-- Category Filter Section (Horizontal Scroll) -->
		{#if !isLoading && !error}
			<div class="category-filter-section">
				<div class="category-filter-scroll">
					<!-- All Categories Button -->
					<button 
						class="category-filter-btn" 
						class:active={selectedCategoryId === 'All Categories'}
						on:click={() => selectCategoryFilter('All Categories')}
					>
						{#if currentLang === 'ar'}
							جميع الفئات
						{:else}
							All Categories
						{/if}
					</button>

					<!-- No Category Button -->
					<button 
						class="category-filter-btn" 
						class:active={selectedCategoryId === 'No Category'}
						on:click={() => selectCategoryFilter('No Category')}
					>
						{#if currentLang === 'ar'}
							بدون فئة
						{:else}
							No Category
						{/if}
					</button>

					<!-- Dynamic Category Buttons -->
					{#each categories as category}
						<button 
							class="category-filter-btn" 
							class:active={selectedCategoryId === category.id}
							on:click={() => selectCategoryFilter(category.id)}
						>
							{getLocalizedText(category.name)}
						</button>
					{/each}
				</div>
			</div>

			<!-- Sort Controls -->
			<div class="products-controls">
				<div class="sort-section">
					<label class="sort-label">
						{#if currentLang === 'ar'}
							ترتيب حسب:
						{:else}
							Sort by:
						{/if}
					</label>
					<div class="sort-dropdown-container">
						<button class="sort-button" on:click={toggleSortDropdown}>
							<img src="/sort.png" alt="Sort" class="sort-icon" />
							<span class="sort-text">
								{#if sortBy === 'name'}
									{#if currentLang === 'ar'}
										الاسم
									{:else}
										Name
									{/if}
								{:else}
									{#if currentLang === 'ar'}
										التقييم
									{:else}
										Rating
									{/if}
								{/if}
							</span>
							<svg class="dropdown-arrow {showSortDropdown ? 'rotated' : ''}" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
								<path d="M6 9L12 15L18 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
							</svg>
						</button>
						{#if showSortDropdown}
							<div class="sort-dropdown">
								<button 
									class="sort-option {sortBy === 'name' ? 'active' : ''}" 
									on:click={() => selectSort('name')}
								>
									{#if currentLang === 'ar'}
										الاسم
									{:else}
										Name
									{/if}
								</button>
								<button 
									class="sort-option {sortBy === 'rating' ? 'active' : ''}" 
									on:click={() => selectSort('rating')}
								>
									{#if currentLang === 'ar'}
										التقييم
									{:else}
										Rating
									{/if}
								</button>
							</div>
						{/if}
					</div>
				</div>
			</div>
		{/if}

		<!-- Products Section -->
		{#if !isLoading && !error}
			<div class="products-section">
				<h2 class="section-title">
					{#if currentLang === 'ar'}
						المنتجات
					{:else}
						Products
					{/if}
				</h2>
				
				<!-- Products Grid -->
				{#if filteredProducts.length > 0}
					<div class="products-grid">
						{#each filteredProducts as product}
							<div class="product-card" on:click={() => handleProductClick(product)}>
								<div class="product-image">
									{#if product.imageUrl}
										<img 
											src={product.imageUrl} 
											alt={getLocalizedText(product.name)}
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
									<h3 class="product-name">{getLocalizedText(product.name)}</h3>
									{#if product.description}
										<p class="product-description">{getLocalizedText(product.description)}</p>
									{/if}
									
									<div class="product-meta">
										{#if product.category}
											<span class="product-category">
												{getLocalizedText(product.category.name)}
											</span>
										{/if}
										
										{#if product.ratingsAverage}
											<div class="product-rating">
												<span class="rating-stars">{'★'.repeat(Math.round(product.ratingsAverage))}</span>
												<span class="rating-text">({product.ratingsQuantity || 0})</span>
											</div>
										{/if}
									</div>
									
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
						{/each}
					</div>
				{:else}
					<div class="empty-container">
						<div class="empty-icon">📦</div>
						<h3 class="empty-title">
							{#if currentLang === 'ar'}
								لا توجد منتجات متاحة
							{:else}
								No Products Available
							{/if}
						</h3>
						<p class="empty-message">
							{#if selectedCategoryName !== 'All Categories'}
								{#if currentLang === 'ar'}
									لم نتمكن من العثور على منتجات في هذه الفئة
								{:else}
									No products found in this category
								{/if}
							{:else}
								{#if currentLang === 'ar'}
									لم نتمكن من العثور على أي منتجات في الوقت الحالي
								{:else}
									We couldn't find any products at the moment
								{/if}
							{/if}
						</p>
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

		<!-- Empty State -->
		{#if !isLoading && !error && categories.length === 0}
			<div class="empty-container">
				<div class="empty-icon">📦</div>
				<h3 class="empty-title">
					{#if currentLang === 'ar'}
						لا توجد منتجات متاحة
					{:else}
						No Products Available
					{/if}
				</h3>
				<p class="empty-message">
					{#if currentLang === 'ar'}
						لم نتمكن من العثور على أي منتجات في الوقت الحالي
					{:else}
						We couldn't find any products at the moment
					{/if}
				</p>
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
					
					<!-- Favorite Star Button -->
					<button 
						class="favorite-btn" 
						class:loading={isAddingToFavorites}
						class:favorited={isProductInFavorites}
						on:click={handleAddToFavorites}
						disabled={isAddingToFavorites}
					>
						{#if isAddingToFavorites}
							<div class="favorite-spinner"></div>
						{:else}
							<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
								<path d="M11.049 2.927C11.3483 2.00556 12.6517 2.00556 12.951 2.927L14.4697 7.60081C14.6035 8.01284 14.9875 8.29266 15.4207 8.29266H20.4329C21.4016 8.29266 21.8044 9.54493 21.0207 10.1008L17.0205 12.9894C16.6758 13.2441 16.5359 13.6954 16.6697 14.1074L18.1884 18.7812C18.4877 19.7027 17.4209 20.4686 16.6372 19.9127L12.637 17.0242C12.2923 16.7695 11.7077 16.7695 11.363 17.0242L7.36283 19.9127C6.57909 20.4686 5.51234 19.7027 5.81162 18.7812L7.33033 14.1074C7.46411 13.6954 7.32418 13.2441 6.97949 12.9894L2.97933 10.1008C2.19559 9.54493 2.59838 8.29266 3.56708 8.29266H8.57929C9.01252 8.29266 9.39647 8.01284 9.53025 7.60081L11.049 2.927Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill={isProductInFavorites ? 'currentColor' : 'none'}/>
							</svg>
						{/if}
					</button>
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

				<!-- Favorite Message -->
				{#if favoriteMessage}
					<div class="favorite-message" class:success={favoriteMessage.includes('added') || favoriteMessage.includes('تمت')}>
						{favoriteMessage}
					</div>
				{/if}

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
	.products-page {
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

	/* View Toggle */
	.view-toggle {
		display: flex;
		gap: 0.5rem;
		justify-content: center;
		margin-top: 2rem;
	}

	.toggle-btn {
		padding: 0.75rem 1.5rem;
		border: 2px solid var(--color-primary, #3b82f6);
		background: transparent;
		color: var(--color-primary, #3b82f6);
		border-radius: 8px;
		cursor: pointer;
		font-weight: 500;
		transition: all 0.3s ease;
	}

	.toggle-btn:hover {
		background: var(--color-primary, #3b82f6);
		color: white;
	}

	.toggle-btn.active {
		background: var(--color-primary, #3b82f6);
		color: white;
	}

	/* Category Filter Section */
	.category-filter-section {
		margin-bottom: 2rem;
		padding: 1rem 0;
	}

	.category-filter-scroll {
		display: flex;
		gap: 1rem;
		overflow-x: auto;
		padding: 0.5rem 0;
		scrollbar-width: thin;
		scrollbar-color: var(--color-primary, #3b82f6) transparent;
	}

	.category-filter-scroll::-webkit-scrollbar {
		height: 6px;
	}

	.category-filter-scroll::-webkit-scrollbar-track {
		background: transparent;
	}

	.category-filter-scroll::-webkit-scrollbar-thumb {
		background: var(--color-primary, #3b82f6);
		border-radius: 3px;
	}

	.category-filter-scroll::-webkit-scrollbar-thumb:hover {
		background: var(--color-primary-hover, #2563eb);
	}

	.category-filter-btn {
		flex-shrink: 0;
		padding: 0.75rem 1.5rem;
		background: var(--bg-primary);
		border: 2px solid var(--border-color, #e5e7eb);
		border-radius: 25px;
		color: var(--text-secondary);
		font-size: 0.9rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.3s ease;
		white-space: nowrap;
		min-width: fit-content;
	}

	.category-filter-btn:hover {
		border-color: var(--color-primary, #3b82f6);
		color: var(--color-primary, #3b82f6);
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
	}

	.category-filter-btn.active {
		background: var(--color-primary, #3b82f6);
		border-color: var(--color-primary, #3b82f6);
		color: white;
		box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
	}

	.category-filter-btn.active:hover {
		background: var(--color-primary-hover, #2563eb);
		border-color: var(--color-primary-hover, #2563eb);
		color: white;
		transform: translateY(-2px);
	}

	/* Products Controls */
	.products-controls {
		display: flex;
		flex-direction: column;
		gap: 2rem;
		margin-bottom: 3rem;
		padding: 2rem;
		background: var(--bg-primary);
		border-radius: 12px;
		border: 1px solid var(--border-color, #e5e7eb);
	}

	.filter-section,
	.sort-section {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.filter-label,
	.sort-label {
		font-weight: 600;
		color: var(--text-primary);
		font-size: 1rem;
	}

	.category-filters {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.filter-btn {
		padding: 0.5rem 1rem;
		border: 1px solid var(--border-color, #e5e7eb);
		background: var(--bg-primary);
		color: var(--text-secondary);
		border-radius: 20px;
		cursor: pointer;
		font-size: 0.875rem;
		transition: all 0.3s ease;
	}

	.filter-btn:hover {
		border-color: var(--color-primary, #3b82f6);
		color: var(--color-primary, #3b82f6);
	}

	.filter-btn.active {
		background: var(--color-primary, #3b82f6);
		color: white;
		border-color: var(--color-primary, #3b82f6);
	}

	.sort-dropdown-container {
		position: relative;
		display: inline-block;
	}

	.sort-button {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		border: 2px solid var(--border-color, #e5e7eb);
		border-radius: 8px;
		background: var(--bg-primary, white);
		color: var(--text-primary, #1e293b);
		font-size: 1rem;
		cursor: pointer;
		transition: all 0.3s ease;
		min-width: 150px;
	}

	.sort-button:hover {
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	.sort-icon {
		width: 16px;
		height: 16px;
		opacity: 0.7;
	}

	.sort-text {
		flex: 1;
		text-align: left;
	}

	.dropdown-arrow {
		transition: transform 0.3s ease;
		opacity: 0.7;
	}

	.dropdown-arrow.rotated {
		transform: rotate(180deg);
	}

	.sort-dropdown {
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		background: var(--bg-primary, white);
		border: 2px solid var(--border-color, #e5e7eb);
		border-radius: 8px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
		z-index: 10;
		margin-top: 4px;
		overflow: hidden;
	}

	.sort-option {
		display: block;
		width: 100%;
		padding: 0.75rem 1rem;
		border: none;
		background: transparent;
		color: var(--text-primary, #1e293b);
		font-size: 1rem;
		cursor: pointer;
		text-align: left;
		transition: all 0.3s ease;
	}

	.sort-option:hover {
		background: var(--bg-secondary, #f8fafc);
	}

	.sort-option.active {
		background: #3b82f6;
		color: white;
	}

	.sort-option.active:hover {
		background: #2563eb;
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
		border-top: 4px solid #3b82f6;
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
		background: linear-gradient(135deg, #3b82f6, #2563eb);
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
		box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
	}

	/* Categories Grid */
	.categories-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 2rem;
		margin-bottom: 2rem;
	}

	/* Products Grid */
	.products-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: 1.5rem;
		margin-bottom: 2rem;
	}

	.category-card,
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

	.category-card:hover,
	.product-card:hover {
		transform: translateY(-4px);
		box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
		border-color: #3b82f6;
	}

	.product-card::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: linear-gradient(135deg, rgba(59, 130, 246, 0.05), rgba(37, 99, 235, 0.05));
		opacity: 0;
		transition: opacity 0.3s ease;
		pointer-events: none;
		z-index: 1;
	}

	.product-card:hover::before {
		opacity: 1;
	}

	.category-image,
	.product-image {
		position: relative;
		width: 100%;
		height: 200px;
		overflow: hidden;
		background: var(--bg-secondary);
	}

	.category-image img,
	.product-image img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: transform 0.3s ease;
	}

	.category-card:hover .category-image img,
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

	.category-content,
	.product-content {
		padding: 1.5rem;
		position: relative;
		z-index: 2;
		transition: all 0.3s ease;
	}

	.product-card:hover .product-content {
		transform: translateY(-2px);
	}

	.category-name,
	.product-name {
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--text-primary);
		margin: 0 0 0.5rem 0;
		line-height: 1.4;
		transition: color 0.3s ease;
	}

	.product-card:hover .product-name {
		color: #3b82f6;
	}

	.category-description,
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
		background: rgba(59, 130, 246, 0.1);
		color: #3b82f6;
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

	.category-action,
	.product-action {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: #3b82f6;
		font-weight: 500;
		font-size: 0.875rem;
		transition: all 0.3s ease;
	}

	.category-card:hover .category-action,
	.product-card:hover .product-action {
		color: #2563eb;
		transform: translateX(4px);
	}

	:global([dir="rtl"]) .category-card:hover .category-action,
	:global([dir="rtl"]) .product-card:hover .product-action {
		transform: translateX(-4px);
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
		opacity: 0.5;
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
		margin: 0;
		max-width: 400px;
	}

	/* Responsive */
	@media (max-width: 768px) {
		.products-page {
			padding: 1rem 0;
		}

		.page-title {
			font-size: 2rem;
		}

		.page-description {
			font-size: 1rem;
		}

		.view-toggle {
			flex-direction: column;
			align-items: center;
			gap: 0.75rem;
		}

		.toggle-btn {
			width: 100%;
			max-width: 200px;
		}

		.category-filter-section {
			padding: 0.5rem 0;
		}

		.category-filter-scroll {
			gap: 0.75rem;
			padding: 0.25rem 0;
		}

		.category-filter-btn {
			padding: 0.6rem 1.2rem;
			font-size: 0.85rem;
		}

		.products-controls {
			padding: 1.5rem;
			gap: 1.5rem;
		}

		.filter-section,
		.sort-section {
			gap: 0.75rem;
		}

		.category-filters {
			gap: 0.5rem;
		}

		.filter-btn {
			font-size: 0.8rem;
			padding: 0.4rem 0.8rem;
		}

		.sort-button {
			min-width: 120px;
		}

		.categories-grid,
		.products-grid {
			grid-template-columns: 1fr;
			gap: 1.5rem;
		}

		.category-image,
		.product-image {
			height: 180px;
		}

		.category-content,
		.product-content {
			padding: 1rem;
		}
	}

	/* Dark theme support */
	:global([data-theme="dark"]) .category-card {
		background: var(--bg-secondary);
		border-color: var(--border-color);
	}

	:global([data-theme="dark"]) .category-card:hover {
		border-color: #60a5fa;
	}

	:global([data-theme="dark"]) .image-placeholder {
		background: var(--bg-primary);
	}

	:global([data-theme="dark"]) .category-action {
		color: #60a5fa;
	}

	:global([data-theme="dark"]) .category-card:hover .category-action {
		color: #93c5fd;
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

	[data-theme="dark"] .popup-close {
		background: rgba(30, 41, 59, 0.9);
		color: var(--text-primary);
	}

	[data-theme="dark"] .popup-close:hover {
		background: rgba(30, 41, 59, 1);
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

	.favorite-btn {
		background: transparent;
		border: 2px solid #fbbf24;
		border-radius: 50%;
		width: 48px;
		height: 48px;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: all 0.3s ease;
		color: #fbbf24;
		flex-shrink: 0;
	}

	/* Default state (not favorited) */
	.favorite-btn:hover:not(:disabled):not(.favorited) {
		background: #fbbf24;
		color: white;
		transform: scale(1.1);
	}

	/* Favorited state */
	.favorite-btn.favorited {
		background: #fbbf24;
		color: white;
		border-color: #fbbf24;
	}

	/* Favorited state hover (shows unfilled star) */
	.favorite-btn.favorited:hover:not(:disabled) {
		background: transparent;
		color: #fbbf24;
		border-color: #fbbf24;
		transform: scale(1.1);
	}

	.favorite-btn.favorited:hover:not(:disabled) svg path {
		fill: none !important;
	}

	.favorite-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.favorite-btn.loading {
		animation: pulse 1.5s ease-in-out infinite;
	}

	.favorite-spinner {
		width: 20px;
		height: 20px;
		border: 2px solid rgba(251, 191, 36, 0.3);
		border-top: 2px solid #fbbf24;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes pulse {
		0%, 100% { transform: scale(1); }
		50% { transform: scale(1.05); }
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

	.favorite-message {
		padding: 0.75rem 1rem;
		border-radius: 8px;
		margin-bottom: 1.5rem;
		font-size: 0.875rem;
		text-align: center;
		border: 1px solid #fecaca;
		background: #fef2f2;
		color: #dc2626;
	}

	.favorite-message.success {
		border-color: #bbf7d0;
		background: #f0fdf4;
		color: #16a34a;
	}

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

	[data-theme="dark"] .reviews-error p {
		color: #fca5a5;
	}

	/* Responsive popup styles */
	@media (max-width: 768px) {
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

		.favorite-btn {
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
</style>