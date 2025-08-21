<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/auth.js';
	import { languageStore, t } from '$lib/stores/language.js';
	import { themeStore } from '$lib/stores/theme.js';
	// Simplified home page - no product/review functionality needed
	
	// Reactive statements
	$: isAuthenticated = $authStore.isAuthenticated;
	$: currentLang = $languageStore;
	$: currentTheme = $themeStore;
	
	// Simplified home page with basic navigation functions
	
	// No need to load data on mount for the simplified home page
	
	function handleCreateOrder() {
		if (!isAuthenticated) {
			goto('/login');
			return;
		}
		goto('/client/orders/create');
	}
	
	function handleBrowseProducts() {
		goto('/client/products');
	}

	// Simplified home page - review functionality moved to products page
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
				<div class="hero-actions">
					<button class="cta-button primary" on:click={handleCreateOrder}>
						{t('createOrder')}
					</button>
					<button class="cta-button primary" on:click={handleBrowseProducts}>
						{#if currentLang === 'ar'}
							تصفح المنتجات
						{:else}
							Browse Products
						{/if}
					</button>
				</div>
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

	<!-- Features Section -->
	<section class="features">
		<div class="container">
			<h2>
				{#if currentLang === 'ar'}
					لماذا تختار باتريوت؟
				{:else}
					Why Choose Patriot?
				{/if}
			</h2>
			<div class="features-grid">
				<div class="feature-card">
					<div class="feature-icon">🏭</div>
					<h3>
						{#if currentLang === 'ar'}
							جودة عالية
						{:else}
							High Quality
						{/if}
					</h3>
					<p>
						{#if currentLang === 'ar'}
							نستخدم أحدث التقنيات لضمان أعلى معايير الجودة في منتجاتنا
						{:else}
							We use the latest technology to ensure the highest quality standards in our products
						{/if}
					</p>
				</div>
				
				<div class="feature-card">
					<div class="feature-icon">⚡</div>
					<h3>
						{#if currentLang === 'ar'}
							تسليم سريع
						{:else}
							Fast Delivery
						{/if}
					</h3>
					<p>
						{#if currentLang === 'ar'}
							نلتزم بمواعيد التسليم ونضمن وصول منتجاتكم في الوقت المحدد
						{:else}
							We commit to delivery schedules and ensure your products arrive on time
						{/if}
					</p>
				</div>
				
				<div class="feature-card">
					<div class="feature-icon">🎯</div>
					<h3>
						{#if currentLang === 'ar'}
							حلول مخصصة
						{:else}
							Custom Solutions
						{/if}
					</h3>
					<p>
						{#if currentLang === 'ar'}
							نقدم حلول زجاجية مخصصة تناسب احتياجاتكم الخاصة
						{:else}
							We provide custom glass solutions tailored to your specific needs
						{/if}
					</p>
				</div>
			</div>
			
			<div class="features-cta">
				<button class="cta-button primary" on:click={handleBrowseProducts}>
					{#if currentLang === 'ar'}
						استكشف منتجاتنا
					{:else}
						Explore Our Products
					{/if}
				</button>
			</div>
		</div>
	</section>
</div>


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

	.hero-actions {
		display: flex;
		gap: 1rem;
		justify-content: center;
		flex-wrap: wrap;
	}

	.cta-button {
		border: none;
		padding: 1rem 2rem;
		font-size: 1.125rem;
		font-weight: 600;
		border-radius: 50px;
		cursor: pointer;
		transition: all 0.3s ease;
		text-decoration: none;
		display: inline-flex;
		align-items: center;
		justify-content: center;
	}

	.cta-button.primary {
		background: linear-gradient(135deg, #f59e0b, #d97706);
		color: white;
		box-shadow: 0 4px 15px rgba(245, 158, 11, 0.4);
	}

	.cta-button.primary:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 20px rgba(245, 158, 11, 0.6);
	}

	.cta-button.secondary {
		background: transparent;
		color: white;
		border: 2px solid white;
		box-shadow: 0 4px 15px rgba(255, 255, 255, 0.2);
	}

	.cta-button.secondary:hover {
		background: white;
		color: #1e293b;
		transform: translateY(-2px);
		box-shadow: 0 6px 20px rgba(255, 255, 255, 0.4);
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

	/* Features Section */
	.features {
		padding: 4rem 0;
		background: var(--bg-secondary, #f8fafc);
	}

	.features h2 {
		text-align: center;
		margin-bottom: 3rem;
		font-size: 2.5rem;
		font-weight: 700;
		color: var(--text-primary, #1e293b);
	}

	.features-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 2rem;
		margin-bottom: 3rem;
	}

	.feature-card {
		background: var(--bg-primary, white);
		padding: 2rem;
		border-radius: 16px;
		text-align: center;
		box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
		transition: all 0.3s ease;
		border: 1px solid var(--border-color, #e2e8f0);
	}

	.feature-card:hover {
		transform: translateY(-4px);
		box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
	}

	.feature-icon {
		font-size: 3rem;
		margin-bottom: 1rem;
		display: block;
	}

	.feature-card h3 {
		font-size: 1.5rem;
		font-weight: 600;
		color: var(--text-primary, #1e293b);
		margin: 0 0 1rem 0;
	}

	.feature-card p {
		color: var(--text-secondary, #64748b);
		line-height: 1.6;
		margin: 0;
	}

	.features-cta {
		text-align: center;
		margin-top: 2rem;
	}
</style>

