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
	
	let orders = [];
	let isLoading = false;
	let error = null;
	let selectedOrder = null;
	let showOrderModal = false;
	
	async function loadDeliveredOrders() {
		if (!isAuthenticated || !user?.id || !isDriver(user)) {
			goto('/login');
			return;
		}
		
		isLoading = true;
		error = null;
		
		try {
			orders = await driverService.getDeliveredOrders(user.id);
			console.log('Delivered orders loaded:', orders);
		} catch (err) {
			console.error('Failed to load delivered orders:', err);
			error = err.message;
		} finally {
			isLoading = false;
		}
	}
	
	async function showOrderDetails(order) {
		try {
			selectedOrder = await driverService.getOrderDetails(order.id);
			showOrderModal = true;
		} catch (err) {
			console.error('Failed to load order details:', err);
			alert(currentLang === 'ar' ? 'فشل في تحميل تفاصيل الطلب' : 'Failed to load order details');
		}
	}
	
	function closeModal() {
		showOrderModal = false;
		selectedOrder = null;
	}
	
	function formatDate(dateString) {
		if (!dateString) return 'N/A';
		return new Date(dateString).toLocaleDateString(currentLang === 'ar' ? 'ar-SA' : 'en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
	
	function formatAddress(address) {
		if (!address) return currentLang === 'ar' ? 'لا يوجد عنوان' : 'No address provided';
		
		// Handle string addresses
		if (typeof address === 'string') return address;
		
		// Helper function to extract text from object or string
		function extractText(field) {
			if (!field) return null;
			if (typeof field === 'string') return field;
			if (typeof field === 'object') {
				// Handle localized objects like {en: "City Name", ar: "اسم المدينة"}
				// Also handle nested name objects
				let extracted = field[currentLang] || field.en || field.ar;
				
				// If not found, try the name property
				if (!extracted && field.name) {
					if (typeof field.name === 'string') {
						extracted = field.name;
					} else if (typeof field.name === 'object') {
						extracted = field.name[currentLang] || field.name.en || field.name.ar;
					}
				}
				
				// If still not found, try first available value
				if (!extracted) {
					const values = Object.values(field);
					extracted = values.find(val => typeof val === 'string') || values[0];
				}
				
				return extracted ? String(extracted) : null;
			}
			return field ? String(field) : null;
		}
		
		const parts = [];
		if (address.street1) parts.push(extractText(address.street1));
		if (address.street2) parts.push(extractText(address.street2));
		if (address.street) parts.push(extractText(address.street));
		if (address.apartment) parts.push(`${currentLang === 'ar' ? 'شقة' : 'Apt'} ${extractText(address.apartment)}`);
		if (address.complex) parts.push(extractText(address.complex));
		if (address.building) parts.push(extractText(address.building));
		if (address.city) parts.push(extractText(address.city));
		if (address.state) parts.push(extractText(address.state));
		if (address.area) parts.push(extractText(address.area));
		if (address.district) parts.push(extractText(address.district));
		if (address.postalCode || address.zipCode) parts.push(extractText(address.postalCode || address.zipCode));
		
		// Filter out null/undefined values and ensure they're strings
		const validParts = parts.filter(part => part && typeof part === 'string' && part.trim());
		
		return validParts.join(', ') || (currentLang === 'ar' ? 'عنوان غير مكتمل' : 'Address incomplete');
	}
	
	function formatCurrency(amount) {
		return new Intl.NumberFormat(currentLang === 'ar' ? 'ar-SA' : 'en-US', {
			style: 'currency',
			currency: 'USD'
		}).format(amount || 0);
	}
	
	onMount(() => {
		loadDeliveredOrders();
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
	<title>{currentLang === 'ar' ? 'الطلبات المسلمة - مصنع باتريوت للزجاج' : 'Delivered Orders - Patriot Glass Factory'}</title>
</svelte:head>

<div class="delivered-orders-page" data-theme={currentTheme}>
	<div class="container">
		<header class="page-header">
			<div class="header-content">
				<button class="back-btn" on:click={() => goto('/driver')}>
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
						<path d="M19 12H5M12 19L5 12L12 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
					</svg>
					{#if currentLang === 'ar'}
						العودة
					{:else}
						Back
					{/if}
				</button>
				<div class="header-text">
					<h1 class="page-title">
						{#if currentLang === 'ar'}
							الطلبات المسلمة
						{:else}
							Delivered Orders
						{/if}
					</h1>
					<p class="page-subtitle">
						{#if currentLang === 'ar'}
							طلبات تم تسليمها بنجاح
						{:else}
							Successfully delivered orders
						{/if}
					</p>
				</div>
			</div>
		</header>

		{#if isLoading}
			<div class="loading-state">
				<div class="spinner"></div>
				<p>
					{#if currentLang === 'ar'}
						جاري تحميل الطلبات...
					{:else}
						Loading orders...
					{/if}
				</p>
			</div>
		{:else if error}
			<div class="error-state">
				<p class="error-message">
					{#if currentLang === 'ar'}
						خطأ في تحميل الطلبات: {error}
					{:else}
						Error loading orders: {error}
					{/if}
				</p>
				<button class="btn btn-primary" on:click={loadDeliveredOrders}>
					{#if currentLang === 'ar'}
						إعادة المحاولة
					{:else}
						Retry
					{/if}
				</button>
			</div>
		{:else if orders.length === 0}
			<div class="empty-state">
				<div class="empty-icon">✅</div>
				<h3>
					{#if currentLang === 'ar'}
						لا توجد طلبات مسلمة
					{:else}
						No Delivered Orders
					{/if}
				</h3>
				<p>
					{#if currentLang === 'ar'}
						لم تقم بتسليم أي طلبات بعد
					{:else}
						You haven't delivered any orders yet
					{/if}
				</p>
			</div>
		{:else}
			<div class="orders-grid">
				{#each orders as order}
					<div class="order-card" on:click={() => showOrderDetails(order)}>
						<div class="order-header">
							<div class="order-id">
								{#if currentLang === 'ar'}
									طلب رقم: {order.id}
								{:else}
									Order #{order.id}
								{/if}
							</div>
							<div class="order-status delivered">
								{#if currentLang === 'ar'}
									تم التسليم
								{:else}
									Delivered
								{/if}
							</div>
						</div>
						
						<div class="order-details">
							<div class="detail-item">
								<span class="detail-label">
									{#if currentLang === 'ar'}
										العميل:
									{:else}
										Customer:
									{/if}
								</span>
								<span class="detail-value">{order.user?.name || 'N/A'}</span>
							</div>
							
							<div class="detail-item">
								<span class="detail-label">
									{#if currentLang === 'ar'}
										تاريخ التسليم:
									{:else}
										Delivered:
									{/if}
								</span>
								<span class="detail-value">{formatDate(order.updatedAt || order.deliveredAt)}</span>
							</div>
							
							<div class="detail-item">
								<span class="detail-label">
									{#if currentLang === 'ar'}
										العنوان:
									{:else}
										Address:
									{/if}
								</span>
								<span class="detail-value address">{formatAddress(order.deliveryAddress || order.address)}</span>
							</div>
							
							{#if order.totalAmount}
								<div class="detail-item">
									<span class="detail-label">
										{#if currentLang === 'ar'}
											المبلغ الإجمالي:
										{:else}
											Total Amount:
										{/if}
									</span>
									<span class="detail-value amount">{formatCurrency(order.totalAmount)}</span>
								</div>
							{/if}
						</div>
						
						<div class="order-actions">
							<button class="btn btn-primary view-btn">
								{#if currentLang === 'ar'}
									عرض التفاصيل
								{:else}
									View Details
								{/if}
							</button>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>

<!-- Order Details Modal -->
{#if showOrderModal && selectedOrder}
	<div class="modal-overlay" on:click={closeModal}>
		<div class="modal-content" on:click|stopPropagation>
			<div class="modal-header">
				<h2 class="modal-title">
					{#if currentLang === 'ar'}
						تفاصيل الطلب المسلم #{selectedOrder.id}
					{:else}
						Delivered Order Details #{selectedOrder.id}
					{/if}
				</h2>
				<button class="modal-close" on:click={closeModal}>×</button>
			</div>
			
			<div class="modal-body">
				<div class="order-info">
					<div class="info-section">
						<h3>
							{#if currentLang === 'ar'}
								معلومات العميل
							{:else}
								Customer Information
							{/if}
						</h3>
						<div class="info-grid">
							<div class="info-item">
								<span class="info-label">
									{#if currentLang === 'ar'}
										الاسم:
									{:else}
										Name:
									{/if}
								</span>
								<span class="info-value">{selectedOrder.user?.name || 'N/A'}</span>
							</div>
							<div class="info-item">
								<span class="info-label">
									{#if currentLang === 'ar'}
										البريد الإلكتروني:
									{:else}
										Email:
									{/if}
								</span>
								<span class="info-value">{selectedOrder.user?.email || 'N/A'}</span>
							</div>
							<div class="info-item">
								<span class="info-label">
									{#if currentLang === 'ar'}
										الهاتف:
									{:else}
										Phone:
									{/if}
								</span>
								<span class="info-value">{selectedOrder.user?.phone || 'N/A'}</span>
							</div>
						</div>
					</div>
					
					<div class="info-section">
						<h3>
							{#if currentLang === 'ar'}
								عنوان التوصيل
							{:else}
								Delivery Address
							{/if}
						</h3>
						<div class="address-details">
							{formatAddress(selectedOrder.deliveryAddress || selectedOrder.address)}
						</div>
					</div>
					
					<div class="info-section">
						<h3>
							{#if currentLang === 'ar'}
								تفاصيل الطلب
							{:else}
								Order Details
							{/if}
						</h3>
						<div class="info-grid">
							<div class="info-item">
								<span class="info-label">
									{#if currentLang === 'ar'}
										تاريخ الإنشاء:
									{:else}
										Created:
									{/if}
								</span>
								<span class="info-value">{formatDate(selectedOrder.createdAt)}</span>
							</div>
							<div class="info-item">
								<span class="info-label">
									{#if currentLang === 'ar'}
										تاريخ التسليم:
									{:else}
										Delivered:
									{/if}
								</span>
								<span class="info-value">{formatDate(selectedOrder.updatedAt || selectedOrder.deliveredAt)}</span>
							</div>
							<div class="info-item">
								<span class="info-label">
									{#if currentLang === 'ar'}
										الحالة:
									{:else}
										Status:
									{/if}
								</span>
								<span class="info-value status-delivered">
									{#if currentLang === 'ar'}
										تم التسليم
									{:else}
										Delivered
									{/if}
								</span>
							</div>
							{#if selectedOrder.totalAmount}
								<div class="info-item">
									<span class="info-label">
										{#if currentLang === 'ar'}
											المبلغ الإجمالي:
										{:else}
											Total Amount:
										{/if}
									</span>
									<span class="info-value amount">{formatCurrency(selectedOrder.totalAmount)}</span>
								</div>
							{/if}
						</div>
					</div>
					
					<div class="delivery-confirmation">
						<div class="confirmation-badge">
							<span class="confirmation-icon">✅</span>
							<span class="confirmation-text">
								{#if currentLang === 'ar'}
									تم تأكيد التسليم بنجاح
								{:else}
									Delivery Confirmed Successfully
								{/if}
							</span>
						</div>
					</div>
				</div>
			</div>
			
			<div class="modal-actions">
				<button class="btn btn-primary" on:click={closeModal}>
					{#if currentLang === 'ar'}
						إغلاق
					{:else}
						Close
					{/if}
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.delivered-orders-page {
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

	.page-header {
		margin-bottom: 2rem;
	}

	.header-content {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.back-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		background: var(--surface-color);
		border: 1px solid var(--border-color);
		color: var(--text-secondary);
		padding: 0.75rem 1rem;
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.3s ease;
		font-weight: 500;
	}

	.back-btn:hover {
		background: var(--border-color);
		color: var(--text-color);
	}

	.header-text {
		flex: 1;
	}

	.page-title {
		font-size: 2rem;
		font-weight: bold;
		margin-bottom: 0.25rem;
		color: var(--primary-color);
	}

	.page-subtitle {
		font-size: 1rem;
		color: var(--text-secondary);
		margin: 0;
	}

	.loading-state, .error-state, .empty-state {
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

	.empty-icon {
		font-size: 4rem;
		margin-bottom: 1rem;
		opacity: 0.5;
	}

	.empty-state h3 {
		font-size: 1.5rem;
		margin-bottom: 0.5rem;
		color: var(--text-color);
	}

	.empty-state p {
		color: var(--text-secondary);
		max-width: 400px;
		margin: 0 auto;
	}

	.orders-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
		gap: 1.5rem;
	}

	.order-card {
		background: var(--card-bg);
		border: 1px solid var(--border-color);
		border-radius: 12px;
		padding: 1.5rem;
		cursor: pointer;
		transition: all 0.3s ease;
	}

	.order-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
		border-color: var(--primary-color);
	}

	.order-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
		padding-bottom: 1rem;
		border-bottom: 1px solid var(--border-color);
	}

	.order-id {
		font-weight: 600;
		color: var(--text-color);
		font-size: 1.1rem;
	}

	.order-status {
		padding: 0.25rem 0.75rem;
		border-radius: 20px;
		font-size: 0.875rem;
		font-weight: 600;
	}

	.order-status.delivered {
		background: rgba(16, 185, 129, 0.1);
		color: #10b981;
		border: 1px solid rgba(16, 185, 129, 0.3);
	}

	.order-details {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		margin-bottom: 1.5rem;
	}

	.detail-item {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 1rem;
	}

	.detail-label {
		font-weight: 500;
		color: var(--text-secondary);
		min-width: 80px;
		flex-shrink: 0;
	}

	.detail-value {
		color: var(--text-color);
		text-align: right;
		flex: 1;
	}

	.detail-value.address {
		font-size: 0.9rem;
		line-height: 1.4;
	}

	.detail-value.amount {
		font-weight: 600;
		color: var(--primary-color);
	}

	.order-actions {
		display: flex;
		justify-content: center;
	}

	.view-btn {
		width: 100%;
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
		display: inline-flex;
		align-items: center;
		justify-content: center;
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

	/* Modal Styles */
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 1rem;
	}

	.modal-content {
		background: var(--bg-primary);
		border-radius: 12px;
		max-width: 600px;
		width: 100%;
		max-height: 90vh;
		overflow-y: auto;
		box-shadow: 0 20px 25px rgba(0, 0, 0, 0.1);
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.5rem;
		border-bottom: 1px solid var(--border-color);
	}

	.modal-title {
		font-size: 1.5rem;
		font-weight: 600;
		color: var(--text-primary);
		margin: 0;
	}

	.modal-close {
		background: none;
		border: none;
		font-size: 1.5rem;
		color: var(--text-secondary);
		cursor: pointer;
		padding: 0.25rem;
		border-radius: 4px;
		transition: all 0.3s ease;
	}

	.modal-close:hover {
		background: var(--bg-secondary);
		color: var(--text-primary);
	}

	.modal-body {
		padding: 1.5rem;
	}

	.order-info {
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.info-section h3 {
		font-size: 1.1rem;
		font-weight: 600;
		color: var(--primary-color);
		margin-bottom: 1rem;
	}

	.info-grid {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.info-item {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 1rem;
		padding: 0.75rem;
		background: var(--bg-secondary);
		border-radius: 8px;
	}

	.info-label {
		font-weight: 500;
		color: var(--text-secondary);
		min-width: 100px;
	}

	.info-value {
		color: var(--text-primary);
		text-align: right;
		flex: 1;
	}

	.info-value.amount {
		font-weight: 600;
		color: var(--primary-color);
	}

	.status-delivered {
		background: rgba(16, 185, 129, 0.1);
		color: #10b981;
		padding: 0.25rem 0.75rem;
		border-radius: 20px;
		font-size: 0.875rem;
		font-weight: 600;
	}

	.address-details {
		background: var(--bg-secondary);
		padding: 1rem;
		border-radius: 8px;
		border: 1px solid var(--border-color);
		line-height: 1.5;
		color: var(--text-primary);
	}

	.delivery-confirmation {
		text-align: center;
		padding: 1.5rem;
		background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.05));
		border-radius: 12px;
		border: 1px solid rgba(16, 185, 129, 0.2);
	}

	.confirmation-badge {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
	}

	.confirmation-icon {
		font-size: 1.5rem;
	}

	.confirmation-text {
		font-weight: 600;
		color: #10b981;
		font-size: 1.1rem;
	}

	.modal-actions {
		display: flex;
		justify-content: center;
		padding: 1.5rem;
		border-top: 1px solid var(--border-color);
	}

	@media (max-width: 768px) {
		.page-title {
			font-size: 1.5rem;
		}

		.orders-grid {
			grid-template-columns: 1fr;
		}

		.order-card {
			padding: 1rem;
		}

		.detail-item {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.25rem;
		}

		.detail-value {
			text-align: left;
		}

		.modal-content {
			margin: 1rem;
			max-height: calc(100vh - 2rem);
		}

		.info-item {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.25rem;
		}

		.info-value {
			text-align: left;
		}

		.confirmation-badge {
			flex-direction: column;
			gap: 0.5rem;
		}
	}
</style>