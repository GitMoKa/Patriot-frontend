<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/auth.js';
	import { driverService } from '$lib/services/driver.js';
	import { languageStore, t } from '$lib/stores/language.js';
	import { themeStore } from '$lib/stores/theme.js';
	
	// Reactive statements
	$: isAuthenticated = $authStore.isAuthenticated;
	$: user = $authStore.user;
	$: currentLang = $languageStore;
	$: currentTheme = $themeStore;
	
	// Check if user is a driver based on permissions
	function isDriver(user) {
		return user?.permissions?.accessType === 'driver';
	}
	
	let statistics = {
		availableForDelivery: 0,
		outForDelivery: 0,
		delivered: 0
	};
	let isLoading = false;
	let error = null;
	
	async function loadDriverStatistics() {
		if (!isAuthenticated || !user?.id) {
			goto('/login');
			return;
		}
		
		// Check if user is a driver
		if (!isDriver(user)) {
			goto('/dashboard'); // Redirect to client dashboard
			return;
		}
		
		isLoading = true;
		error = null;
		
		try {
			statistics = await driverService.getDriverStatistics(user.id);
			console.log('Driver statistics loaded:', statistics);
		} catch (err) {
			console.error('Failed to load driver statistics:', err);
			error = err.message;
		} finally {
			isLoading = false;
		}
	}
	
	function handleAvailableForDeliveryClick() {
		goto('/driver/available-orders');
	}
	
	function handleOutForDeliveryClick() {
		goto('/driver/out-for-delivery');
	}
	
	function handleDeliveredClick() {
		goto('/driver/delivered');
	}
	
	onMount(() => {
		loadDriverStatistics();
	});
	
	// Redirect if not authenticated or not a driver
	$: if (!isAuthenticated && typeof window !== 'undefined') {
		goto('/login');
	}
	
	$: if (isAuthenticated && user && !isDriver(user) && typeof window !== 'undefined') {
		goto('/dashboard');
	}
</script>

<svelte:head>
	<title>{currentLang === 'ar' ? 'لوحة تحكم السائق - مصنع باتريوت للزجاج' : 'Driver Dashboard - Patriot Glass Factory'}</title>
</svelte:head>

<div class="driver-dashboard" data-theme={currentTheme}>
	<div class="container">
		<header class="dashboard-header">
			<h1 class="dashboard-title">
				{#if currentLang === 'ar'}
					لوحة تحكم السائق
				{:else}
					Driver Dashboard
				{/if}
			</h1>
			<p class="dashboard-subtitle">
				{#if currentLang === 'ar'}
					مرحباً {user?.name || 'السائق'}، إدارة طلبات التوصيل
				{:else}
					Welcome {user?.name || 'Driver'}, manage your delivery orders
				{/if}
			</p>
		</header>

		{#if isLoading}
			<div class="loading-state">
				<div class="spinner"></div>
				<p>
					{#if currentLang === 'ar'}
						جاري تحميل الإحصائيات...
					{:else}
						Loading statistics...
					{/if}
				</p>
			</div>
		{:else if error}
			<div class="error-state">
				<p class="error-message">
					{#if currentLang === 'ar'}
						خطأ في تحميل الإحصائيات: {error}
					{:else}
						Error loading statistics: {error}
					{/if}
				</p>
				<button class="btn btn-primary" on:click={loadDriverStatistics}>
					{#if currentLang === 'ar'}
						إعادة المحاولة
					{:else}
						Retry
					{/if}
				</button>
			</div>
		{:else}
			<div class="dashboard-content">
				<!-- Driver Statistics Cards -->
				<div class="stats-grid">
					<!-- Available for Delivery -->
					<div class="stat-card available-card" on:click={handleAvailableForDeliveryClick}>
						<div class="stat-icon" style="color: #f59e0b;">📦</div>
						<div class="stat-info">
							<h3 class="stat-title">
								{#if currentLang === 'ar'}
									متاح للتوصيل
								{:else}
									Available for Delivery
								{/if}
							</h3>
							<p class="stat-description">
								{#if currentLang === 'ar'}
									طلبات مكتملة وجاهزة للتوصيل
								{:else}
									Completed orders ready for delivery
								{/if}
							</p>
						</div>
					</div>

					<!-- Out for Delivery -->
					<div class="stat-card delivery-card" on:click={handleOutForDeliveryClick}>
						<div class="stat-icon" style="color: #3b82f6;">🚚</div>
						<div class="stat-info">
							<h3 class="stat-title">
								{#if currentLang === 'ar'}
									قيد التوصيل
								{:else}
									Out for Delivery
								{/if}
							</h3>
							<p class="stat-description">
								{#if currentLang === 'ar'}
									طلبات قيد التوصيل حالياً
								{:else}
									Orders currently being delivered
								{/if}
							</p>
						</div>
					</div>

					<!-- Delivered -->
					<div class="stat-card delivered-card" on:click={handleDeliveredClick}>
						<div class="stat-icon" style="color: #10b981;">✅</div>
						<div class="stat-info">
							<h3 class="stat-title">
								{#if currentLang === 'ar'}
									تم التسليم
								{:else}
									Delivered
								{/if}
							</h3>
							<p class="stat-description">
								{#if currentLang === 'ar'}
									طلبات تم تسليمها بنجاح
								{:else}
									Successfully delivered orders
								{/if}
							</p>
						</div>
					</div>
				</div>

			</div>
		{/if}
	</div>
</div>

<style>
	.driver-dashboard {
		min-height: 100vh;
		background: var(--bg-color);
		color: var(--text-color);
		padding: 2rem 0;
	}

	.container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 20px;
	}

	.dashboard-header {
		text-align: center;
		margin-bottom: 3rem;
	}

	.dashboard-title {
		font-size: 2.5rem;
		font-weight: bold;
		margin-bottom: 0.5rem;
		color: var(--primary-color);
	}

	.dashboard-subtitle {
		font-size: 1.1rem;
		color: var(--text-secondary);
	}

	.loading-state, .error-state {
		text-align: center;
		padding: 3rem;
	}

	.spinner {
		width: 40px;
		height: 40px;
		border: 4px solid var(--border-color);
		border-top: 4px solid var(--primary-color);
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin: 0 auto 1rem;
	}

	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}

	.error-message {
		color: var(--error-color);
		margin-bottom: 1rem;
	}

	.dashboard-content {
		display: flex;
		flex-direction: column;
		gap: 3rem;
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 2rem;
	}

	.stat-card {
		background: var(--card-bg);
		border: 1px solid var(--border-color);
		border-radius: 12px;
		padding: 2rem;
		cursor: pointer;
		transition: all 0.3s ease;
		text-align: center;
	}

	.stat-card:hover {
		transform: translateY(-4px);
		box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
		border-color: var(--primary-color);
	}

	.available-card {
		border-left: 4px solid #f59e0b;
		background: linear-gradient(135deg, rgba(245, 158, 11, 0.05), rgba(245, 158, 11, 0.02));
	}

	.delivery-card {
		border-left: 4px solid #3b82f6;
		background: linear-gradient(135deg, rgba(59, 130, 246, 0.05), rgba(59, 130, 246, 0.02));
	}

	.delivered-card {
		border-left: 4px solid #10b981;
		background: linear-gradient(135deg, rgba(16, 185, 129, 0.05), rgba(16, 185, 129, 0.02));
	}

	.stat-icon {
		font-size: 3rem;
		margin-bottom: 1rem;
	}

	.stat-title {
		font-size: 1rem;
		font-weight: 600;
		color: var(--text-secondary);
		margin-bottom: 0.5rem;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.stat-count {
		font-size: 3rem;
		font-weight: bold;
		color: var(--text-color);
		margin: 0.5rem 0;
	}

	.stat-description {
		font-size: 0.9rem;
		color: var(--text-secondary);
		margin: 0;
		line-height: 1.4;
	}

	.driver-info {
		background: var(--card-bg);
		border: 1px solid var(--border-color);
		border-radius: 12px;
		padding: 2rem;
	}

	.section-title {
		font-size: 1.5rem;
		font-weight: 600;
		margin-bottom: 1.5rem;
		color: var(--primary-color);
	}

	.info-card {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.info-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem;
		background: var(--surface-color);
		border-radius: 8px;
		border: 1px solid var(--border-color);
	}

	.info-label {
		font-weight: 600;
		color: var(--text-secondary);
	}

	.info-value {
		color: var(--text-color);
	}

	.role-badge {
		background: linear-gradient(135deg, #3b82f6, #1d4ed8);
		color: white;
		padding: 0.25rem 0.75rem;
		border-radius: 20px;
		font-size: 0.875rem;
		font-weight: 600;
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

	@media (max-width: 768px) {
		.dashboard-title {
			font-size: 2rem;
		}

		.stats-grid {
			grid-template-columns: 1fr;
		}

		.stat-card {
			padding: 1.5rem;
		}

		.stat-icon {
			font-size: 2.5rem;
		}

		.stat-count {
			font-size: 2.5rem;
		}

		.info-item {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.5rem;
		}
	}
</style>