<script>
	import { languageStore, t } from '$lib/stores/language.js';
	import { themeStore } from '$lib/stores/theme.js';
	import { goto } from '$app/navigation';
	
	// Reactive statements
	$: currentLang = $languageStore;
	$: currentTheme = $themeStore;
	
	function handleBrowseProducts() {
		goto('/client/products');
	}
</script>

<svelte:head>
	<title>{t('aboutUs')} - Patriot Glass Factory</title>
</svelte:head>

<div class="about-page" data-theme={currentTheme}>
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
						Leading glass manufacturing excellence for decades, delivering innovative glass solutions for all your needs
					{/if}
				</p>
				<div class="hero-actions">
					<button class="btn btn-primary" on:click={handleBrowseProducts}>
						{t('browseProducts')}
					</button>
				</div>
			</div>
		</div>
	</section>

	<!-- About Section -->
	<section class="about-section">
		<div class="container">
			<div class="about-content">
				<div class="about-text">
					<h2>
						{#if currentLang === 'ar'}
							من نحن
						{:else}
							About Us
						{/if}
					</h2>
					<p>
						{#if currentLang === 'ar'}
							مصنع باتريوت للزجاج هو شركة رائدة في صناعة الزجاج عالي الجودة. نحن نخدم العملاء منذ عقود بتقديم منتجات زجاجية متميزة تلبي أعلى معايير الجودة والابتكار.
						{:else}
							Patriot Glass Factory is a leading manufacturer of high-quality glass products. We have been serving customers for decades, delivering exceptional glass solutions that meet the highest standards of quality and innovation.
						{/if}
					</p>
					<p>
						{#if currentLang === 'ar'}
							نحن متخصصون في إنتاج مجموعة واسعة من المنتجات الزجاجية للاستخدامات التجارية والسكنية، مع التركيز على الجودة والدقة في كل منتج نصنعه.
						{:else}
							We specialize in producing a wide range of glass products for commercial and residential use, with a focus on quality and precision in every product we manufacture.
						{/if}
					</p>
				</div>
				<div class="about-features">
					<div class="feature">
						<h3>
							{#if currentLang === 'ar'}
								جودة عالية
							{:else}
								High Quality
							{/if}
						</h3>
						<p>
							{#if currentLang === 'ar'}
								نستخدم أحدث التقنيات وأفضل المواد لضمان جودة منتجاتنا
							{:else}
								We use the latest technology and finest materials to ensure product quality
							{/if}
						</p>
					</div>
					<div class="feature">
						<h3>
							{#if currentLang === 'ar'}
								خبرة عريقة
							{:else}
								Decades of Experience
							{/if}
						</h3>
						<p>
							{#if currentLang === 'ar'}
								خبرة تمتد لعقود في صناعة الزجاج والخدمات المتخصصة
							{:else}
								Decades of experience in glass manufacturing and specialized services
							{/if}
						</p>
					</div>
					<div class="feature">
						<h3>
							{#if currentLang === 'ar'}
								حلول مخصصة
							{:else}
								Custom Solutions
							{/if}
						</h3>
						<p>
							{#if currentLang === 'ar'}
								نقدم حلول زجاجية مخصصة تلبي احتياجاتكم الخاصة
							{:else}
								We provide custom glass solutions tailored to your specific needs
							{/if}
						</p>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- Services Section -->
	<section class="services-section">
		<div class="container">
			<h2 class="section-title">
				{#if currentLang === 'ar'}
					خدماتنا
				{:else}
					Our Services
				{/if}
			</h2>
			<div class="services-grid">
				<div class="service-card">
					<h3>
						{#if currentLang === 'ar'}
							زجاج النوافذ
						{:else}
							Window Glass
						{/if}
					</h3>
					<p>
						{#if currentLang === 'ar'}
							زجاج عالي الجودة للنوافذ السكنية والتجارية
						{:else}
							High-quality glass for residential and commercial windows
						{/if}
					</p>
				</div>
				<div class="service-card">
					<h3>
						{#if currentLang === 'ar'}
							زجاج الأبواب
						{:else}
							Door Glass
						{/if}
					</h3>
					<p>
						{#if currentLang === 'ar'}
							حلول زجاجية متنوعة للأبواب والمداخل
						{:else}
							Diverse glass solutions for doors and entrances
						{/if}
					</p>
				</div>
				<div class="service-card">
					<h3>
						{#if currentLang === 'ar'}
							زجاج مخصص
						{:else}
							Custom Glass
						{/if}
					</h3>
					<p>
						{#if currentLang === 'ar'}
							تصميمات زجاجية مخصصة حسب المواصفات المطلوبة
						{:else}
							Custom glass designs according to required specifications
						{/if}
					</p>
				</div>
			</div>
		</div>
	</section>
</div>

<style>
	.about-page {
		min-height: 100vh;
		background: var(--bg-color);
		color: var(--text-color);
	}

	.hero {
		position: relative;
		height: 60vh;
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
		z-index: 1;
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
		background: rgba(0, 0, 0, 0.5);
	}

	.hero-content {
		position: relative;
		z-index: 2;
		text-align: center;
		color: white;
	}

	.container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 20px;
	}

	.hero-title {
		font-size: 3rem;
		font-weight: bold;
		margin-bottom: 1rem;
		text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
	}

	.hero-subtitle {
		font-size: 1.25rem;
		margin-bottom: 2rem;
		max-width: 600px;
		margin-left: auto;
		margin-right: auto;
		text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
	}

	.hero-actions {
		display: flex;
		gap: 1rem;
		justify-content: center;
		flex-wrap: wrap;
	}

	.btn {
		padding: 12px 24px;
		border: none;
		border-radius: 8px;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s ease;
		text-decoration: none;
		display: inline-block;
	}

	.btn-primary {
		background: linear-gradient(135deg, #3b82f6, #1d4ed8);
		color: white;
	}

	.btn-primary:hover {
		background: linear-gradient(135deg, #2563eb, #1e40af);
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
	}

	.about-section {
		padding: 4rem 0;
		background: var(--bg-color);
	}

	.about-content {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 3rem;
		align-items: start;
	}

	.about-text h2 {
		font-size: 2.5rem;
		margin-bottom: 1.5rem;
		color: var(--primary-color);
	}

	.about-text p {
		font-size: 1.1rem;
		line-height: 1.6;
		margin-bottom: 1rem;
		color: var(--text-color);
	}

	.about-features {
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.feature {
		padding: 1.5rem;
		background: var(--card-bg);
		border-radius: 12px;
		border: 1px solid var(--border-color);
	}

	.feature h3 {
		font-size: 1.25rem;
		margin-bottom: 0.5rem;
		color: var(--primary-color);
	}

	.feature p {
		color: var(--text-secondary);
		line-height: 1.5;
	}

	.services-section {
		padding: 4rem 0;
		background: var(--surface-color);
	}

	.section-title {
		text-align: center;
		font-size: 2.5rem;
		margin-bottom: 3rem;
		color: var(--primary-color);
	}

	.services-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 2rem;
	}

	.service-card {
		background: var(--card-bg);
		padding: 2rem;
		border-radius: 12px;
		border: 1px solid var(--border-color);
		text-align: center;
		transition: transform 0.3s ease, box-shadow 0.3s ease;
	}

	.service-card:hover {
		transform: translateY(-4px);
		box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
	}

	.service-card h3 {
		font-size: 1.5rem;
		margin-bottom: 1rem;
		color: var(--primary-color);
	}

	.service-card p {
		color: var(--text-secondary);
		line-height: 1.6;
	}

	@media (max-width: 768px) {
		.hero-title {
			font-size: 2rem;
		}

		.hero-subtitle {
			font-size: 1rem;
		}

		.about-content {
			grid-template-columns: 1fr;
			gap: 2rem;
		}

		.about-text h2 {
			font-size: 2rem;
		}

		.section-title {
			font-size: 2rem;
		}

		.services-grid {
			grid-template-columns: 1fr;
		}
	}
</style>