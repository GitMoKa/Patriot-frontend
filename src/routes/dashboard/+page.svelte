<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/auth.js';
	import { ordersService } from '$lib/services/orders.js';
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
	
	let statistics = null;
	let isLoading = false;
	let error = null;
	
	// Order status configurations
	const orderStatuses = [
		{ key: 'pending', icon: '⏳', color: '#f59e0b' },
		{ key: 'in-progress', icon: '🔄', color: '#3b82f6' },
		{ key: 'completed', icon: '✅', color: '#10b981' },
		{ key: 'cancelled', icon: '❌', color: '#ef4444' },
		{ key: 'delivered', icon: '📦', color: '#8b5cf6' },
		{ key: 'out-for-delivery', icon: '🚚', color: '#f97316' }
	];
	
	async function loadStatistics() {
		if (!isAuthenticated) {
			goto('/login');
			return;
		}
		
		isLoading = true;
		error = null;
		
		try {
			// Get user's orders and calculate statistics from them
			const ordersData = await ordersService.getAllOrders();
			const userOrders = ordersData.orders || [];
			
			// Calculate statistics by counting orders by status
			statistics = {
				pending: userOrders.filter(order => order.status === 'pending').length,
				'in-progress': userOrders.filter(order => order.status === 'in-progress').length,
				completed: userOrders.filter(order => order.status === 'completed').length,
				cancelled: userOrders.filter(order => order.status === 'cancelled').length,
				delivered: userOrders.filter(order => order.status === 'delivered').length,
				'out-for-delivery': userOrders.filter(order => order.status === 'out-for-delivery').length
			};
			
			console.log('Dashboard statistics calculated from user orders:', statistics);
			console.log('Total user orders:', userOrders.length);
		} catch (err) {
			console.error('Failed to load statistics:', err);
			error = err.message;
		} finally {
			isLoading = false;
		}
	}
	
	function handleStatusClick(status) {
		// Navigate to orders page with status filter
		goto(`/client/orders?status=${status}`);
	}
	
	function handleAllOrdersClick() {
		// Navigate to orders page without filter
		goto('/client/orders');
	}
	
	function getStatusLabel(status) {
		const labels = {
			'pending': currentLang === 'ar' ? 'قيد الانتظار' : 'Pending',
			'in-progress': currentLang === 'ar' ? 'قيد التنفيذ' : 'In Progress',
			'completed': currentLang === 'ar' ? 'مكتمل' : 'Completed',
			'cancelled': currentLang === 'ar' ? 'ملغي' : 'Cancelled',
			'delivered': currentLang === 'ar' ? 'تم التسليم' : 'Delivered',
			'out-for-delivery': currentLang === 'ar' ? 'قيد التوصيل' : 'Out for Delivery'
		};
		return labels[status] || status;
	}
	
	function getTotalOrders() {
		if (!statistics) return 0;
		return Object.values(statistics).reduce((total, count) => total + (count || 0), 0);
	}
	
	onMount(() => {
		loadStatistics();
	});
	
	// Redirect if not authenticated
	$: if (!isAuthenticated && typeof window !== 'undefined') {
		goto('/login');
	}
	
	// Redirect drivers to their proper dashboard
	$: if (isAuthenticated && user && isDriver(user) && typeof window !== 'undefined') {
		goto('/driver');
	}
</script>

<svelte:head>
	<title>{t('dashboard')} - Patriot Glass Factory</title>
</svelte:head>

<div class="dashboard-page" data-theme={currentTheme}>
	<div class="container">
		<header class="dashboard-header">
			<h1 class="dashboard-title">
				{#if currentLang === 'ar'}
					لوحة التحكم
				{:else}
					Dashboard
				{/if}
			</h1>
			<p class="dashboard-subtitle">
				{#if currentLang === 'ar'}
					مرحباً بك، تابع حالة طلباتك من هنا
				{:else}
					Welcome back, track your orders from here
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
				<button class="btn btn-primary" on:click={loadStatistics}>
					{#if currentLang === 'ar'}
						إعادة المحاولة
					{:else}
						Retry
					{/if}
				</button>
			</div>
		{:else}
			<div class="dashboard-content">
				<!-- Statistics Cards -->
				<div class="stats-grid">
					<!-- All Orders Card -->
					<div class="stat-card all-orders-card" on:click={handleAllOrdersClick}>
						<div class="stat-icon" style="color: #6366f1;">📊</div>
						<div class="stat-info">
							<h3 class="stat-title">
								{#if currentLang === 'ar'}
									جميع الطلبات
								{:else}
									All Orders
								{/if}
							</h3>
							<p class="stat-count">{getTotalOrders()}</p>
						</div>
					</div>

					<!-- Status-specific Cards -->
					{#each orderStatuses as status}
						<div 
							class="stat-card" 
							on:click={() => handleStatusClick(status.key)}
							style="border-left: 4px solid {status.color};"
						>
							<div class="stat-icon" style="color: {status.color};">
								{status.icon}
							</div>
							<div class="stat-info">
								<h3 class="stat-title">{getStatusLabel(status.key)}</h3>
								<p class="stat-count">{statistics?.[status.key] || 0}</p>
							</div>
						</div>
					{/each}
				</div>

				<!-- Quick Actions -->
				<div class="quick-actions">
					<h2 class="section-title">
						{#if currentLang === 'ar'}
							إجراءات سريعة
						{:else}
							Quick Actions
						{/if}
					</h2>
					<div class="actions-grid">
						<button class="action-btn" on:click={() => goto('/client/orders/create')}>
							<span class="action-icon">➕</span>
							<span class="action-text">
								{#if currentLang === 'ar'}
									طلب جديد
								{:else}
									New Order
								{/if}
							</span>
						</button>
						<button class="action-btn" on:click={() => goto('/client/products')}>
							<span class="action-icon">🔍</span>
							<span class="action-text">
								{#if currentLang === 'ar'}
									تصفح المنتجات
								{:else}
									Browse Products
								{/if}
							</span>
						</button>
						<button class="action-btn" on:click={() => goto('/client/profile')}>
							<span class="action-icon">👤</span>
							<span class="action-text">
								{#if currentLang === 'ar'}
									الملف الشخصي
								{:else}
									Profile
								{/if}
							</span>
						</button>
						<button class="action-btn" on:click={() => goto('/complaints')}>
							<span class="action-icon">📝</span>
							<span class="action-text">
								{#if currentLang === 'ar'}
									تقديم شكوى
								{:else}
									Submit Complaint
								{/if}
							</span>
						</button>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	.dashboard-page {
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
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: 1.5rem;
	}

	.stat-card {
		background: var(--card-bg);
		border: 1px solid var(--border-color);
		border-radius: 12px;
		padding: 1.5rem;
		display: flex;
		align-items: center;
		gap: 1rem;
		cursor: pointer;
		transition: all 0.3s ease;
	}

	.stat-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
		border-color: var(--primary-color);
	}

	.all-orders-card {
		border-left: 4px solid #6366f1;
		background: linear-gradient(135deg, rgba(99, 102, 241, 0.05), rgba(99, 102, 241, 0.02));
	}

	.stat-icon {
		font-size: 2rem;
		min-width: 60px;
		text-align: center;
	}

	.stat-info {
		flex: 1;
	}

	.stat-title {
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--text-secondary);
		margin-bottom: 0.25rem;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.stat-count {
		font-size: 2rem;
		font-weight: bold;
		color: var(--text-color);
		margin: 0;
	}

	.quick-actions {
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

	.actions-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
	}

	.action-btn {
		background: var(--surface-color);
		border: 1px solid var(--border-color);
		border-radius: 8px;
		padding: 1rem;
		display: flex;
		align-items: center;
		gap: 0.75rem;
		cursor: pointer;
		transition: all 0.3s ease;
		color: var(--text-color);
		text-decoration: none;
	}

	.action-btn:hover {
		background: var(--primary-color);
		color: white;
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
	}

	.action-icon {
		font-size: 1.25rem;
	}

	.action-text {
		font-weight: 500;
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

		.actions-grid {
			grid-template-columns: 1fr;
		}

		.stat-card {
			padding: 1rem;
		}

		.stat-icon {
			font-size: 1.5rem;
			min-width: 50px;
		}

		.stat-count {
			font-size: 1.5rem;
		}
	}
</style>