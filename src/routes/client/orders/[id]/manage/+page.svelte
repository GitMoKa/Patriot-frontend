<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { authStore } from '$lib/stores/auth.js';
	import { languageStore, t } from '$lib/stores/language.js';
	import { themeStore } from '$lib/stores/theme.js';
	import { ordersService } from '$lib/services/orders.js';
	import { productsService } from '$lib/services/products.js';
	import { categoriesService } from '$lib/services/categories.js';
	import { materialsService } from '$lib/services/materials.js';
	
	let orderId = '';
	let order = null;
	let orderItems = [];
	let isLoading = false;
	let error = '';
	
	// Add Item Modal
	let showAddItemModal = false;
	let addItemForm = {
		chooseItemType: false,
		chooseExistingProduct: false,
		categoryId: '',
		productId: '',
		width: '',
		height: '',
		materialId: '',
		wantPaint: false,
		wantDrilled: false
	};
	
	// Data for dropdowns
	let categories = [];
	let products = [];
	let filteredProducts = [];
	let materials = [];
	let isAddingItem = false;
	let addItemError = '';
	
	// Reactive statements
	$: currentLang = $languageStore;
	$: currentTheme = $themeStore;
	$: isAuthenticated = $authStore.isAuthenticated;
	$: orderId = $page.params.id;
	
	// Filter products based on selected category
	$: {
		if (addItemForm.chooseItemType && addItemForm.categoryId) {
			filteredProducts = products.filter(product => product.categoryId === parseInt(addItemForm.categoryId));
		} else {
			filteredProducts = products;
		}
	}
	
	// Redirect if not authenticated
	$: if (!isAuthenticated) {
		goto('/login');
	}
	
	onMount(async () => {
		await loadOrderData();
		await loadDropdownData();
		
		// Check if there's a pre-selected product from URL params
		const urlParams = new URLSearchParams(window.location.search);
		const preSelectedProductId = urlParams.get('productId');
		if (preSelectedProductId) {
			openAddItemModal();
			addItemForm.chooseExistingProduct = true;
			addItemForm.productId = preSelectedProductId;
		}
	});
	
	async function loadOrderData() {
		isLoading = true;
		try {
			// Load order details and items
			const [orderResponse, itemsResponse] = await Promise.all([
				loadOrder(),
				loadOrderItems()
			]);
		} catch (err) {
			error = err.message || 'Failed to load order data';
		} finally {
			isLoading = false;
		}
	}
	
	async function loadOrder() {
		try {
			// Mock data for now - replace with actual API call
			order = {
				id: orderId,
				customerName: 'John Doe',
				customerEmail: 'john@example.com',
				customerPhone: '+1234567890',
				shippingAddress: '123 Main St, City, Country',
				status: 'pending',
				createdAt: new Date().toISOString(),
				notes: 'Sample order notes'
			};
			
			// Uncomment when backend is ready
			// const response = await ordersService.getOrderById(orderId);
			// order = response.data || response;
		} catch (error) {
			console.error('Failed to load order:', error);
		}
	}
	
	async function loadOrderItems() {
		try {
			// Mock data for now - replace with actual API call
			orderItems = [];
			
			// Uncomment when backend is ready
			// const response = await ordersService.getOrderItems(orderId);
			// orderItems = response.items || response;
		} catch (error) {
			console.error('Failed to load order items:', error);
		}
	}
	
	async function loadDropdownData() {
		try {
			// Load categories, products, and materials in parallel
			await Promise.all([
				loadCategories(),
				loadProducts(),
				loadMaterials()
			]);
		} catch (error) {
			console.error('Failed to load dropdown data:', error);
		}
	}
	
	async function loadCategories() {
		try {
			// Mock data for now - replace with actual API call
			categories = [
				{ id: 1, name: 'Windows' },
				{ id: 2, name: 'Decorative' },
				{ id: 3, name: 'Safety' },
				{ id: 4, name: 'Mirrors' }
			];
			
			// Uncomment when backend is ready
			// const response = await categoriesService.getAllCategories();
			// categories = response.categories || response;
		} catch (error) {
			console.error('Failed to load categories:', error);
		}
	}
	
	async function loadProducts() {
		try {
			// Mock data for now - replace with actual API call
			products = [
				{
					id: 1,
					name: 'Clear Glass Panel',
					description: 'High-quality clear glass panel',
					categoryId: 1,
					width: 100,
					height: 150
				},
				{
					id: 2,
					name: 'Frosted Glass',
					description: 'Elegant frosted glass',
					categoryId: 2,
					width: 80,
					height: 120
				},
				{
					id: 3,
					name: 'Tempered Safety Glass',
					description: 'Strong tempered glass',
					categoryId: 3,
					width: 120,
					height: 180
				}
			];
			
			// Uncomment when backend is ready
			// const response = await productsService.getAllProducts();
			// products = response.products || response;
		} catch (error) {
			console.error('Failed to load products:', error);
		}
	}
	
	async function loadMaterials() {
		try {
			// Mock data for now - replace with actual API call
			materials = [
				{ id: 1, name: 'Standard Glass' },
				{ id: 2, name: 'Tempered Glass' },
				{ id: 3, name: 'Laminated Glass' },
				{ id: 4, name: 'Low-E Glass' }
			];
			
			// Uncomment when backend is ready
			// const response = await materialsService.getAllMaterials();
			// materials = response.materials || response;
		} catch (error) {
			console.error('Failed to load materials:', error);
		}
	}
	
	function openAddItemModal() {
		showAddItemModal = true;
		resetAddItemForm();
	}
	
	function closeAddItemModal() {
		showAddItemModal = false;
		resetAddItemForm();
	}
	
	function resetAddItemForm() {
		addItemForm = {
			chooseItemType: false,
			chooseExistingProduct: false,
			categoryId: '',
			productId: '',
			width: '',
			height: '',
			materialId: '',
			wantPaint: false,
			wantDrilled: false
		};
		addItemError = '';
	}
	
	async function handleAddItem() {
		// Validation
		if (!addItemForm.width || !addItemForm.height || !addItemForm.materialId) {
			addItemError = t('requiredField');
			return;
		}
		
		if (addItemForm.chooseExistingProduct && !addItemForm.productId) {
			addItemError = currentLang === 'ar' ? 'يرجى اختيار منتج' : 'Please select a product';
			return;
		}
		
		if (addItemForm.chooseItemType && !addItemForm.categoryId) {
			addItemError = currentLang === 'ar' ? 'يرجى اختيار فئة' : 'Please select a category';
			return;
		}
		
		isAddingItem = true;
		addItemError = '';
		
		try {
			const itemData = {
				orderId: orderId,
				categoryId: addItemForm.chooseItemType ? addItemForm.categoryId : null,
				productId: addItemForm.chooseExistingProduct ? addItemForm.productId : null,
				width: parseFloat(addItemForm.width),
				height: parseFloat(addItemForm.height),
				materialId: addItemForm.materialId,
				wantPaint: addItemForm.wantPaint,
				wantDrilled: addItemForm.wantDrilled
			};
			
			// Add item to order
			await ordersService.addOrderItem(orderId, itemData);
			
			// Reload order items
			await loadOrderItems();
			
			// Close modal
			closeAddItemModal();
			
		} catch (err) {
			addItemError = err.message || (currentLang === 'ar' ? 'فشل في إضافة العنصر' : 'Failed to add item');
		} finally {
			isAddingItem = false;
		}
	}
	
	async function handleRemoveItem(itemId) {
		if (!confirm(currentLang === 'ar' ? 'هل أنت متأكد من حذف هذا العنصر؟' : 'Are you sure you want to remove this item?')) {
			return;
		}
		
		try {
			await ordersService.deleteOrderItem(orderId, itemId);
			await loadOrderItems();
		} catch (err) {
			error = err.message || (currentLang === 'ar' ? 'فشل في حذف العنصر' : 'Failed to remove item');
		}
	}
	
	function handleFinishOrder() {
		if (orderItems.length === 0) {
			error = currentLang === 'ar' ? 'لا يمكن إنهاء طلب فارغ' : 'Cannot finish an empty order';
			return;
		}
		
		goto(`/client/orders/${orderId}`);
	}
</script>

<svelte:head>
	<title>{t('orderDetails')} - Patriot Glass Factory</title>
</svelte:head>

<div class="order-manage-page" data-theme={currentTheme}>
	<div class="container">
		<!-- Page Header -->
		<div class="page-header">
			<h1 class="page-title">
				{#if currentLang === 'ar'}
					إدارة الطلب #{orderId}
				{:else}
					Manage Order #{orderId}
				{/if}
			</h1>
			
			{#if order}
				<div class="order-info">
					<div class="info-item">
						<span class="label">{t('name')}:</span>
						<span class="value">{order.customerName}</span>
					</div>
					<div class="info-item">
						<span class="label">{t('status')}:</span>
						<span class="value status-{order.status}">{t(order.status)}</span>
					</div>
				</div>
			{/if}
		</div>
		
		<!-- Error Message -->
		{#if error}
			<div class="error-message">
				{error}
			</div>
		{/if}
		
		<!-- Order Items Section -->
		<div class="order-items-section">
			<div class="section-header">
				<h2>{t('orderItems')}</h2>
				<button class="add-item-btn" on:click={openAddItemModal}>
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
						<path d="M12 5V19M5 12H19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
					</svg>
					{t('addItem')}
				</button>
			</div>
			
			{#if isLoading}
				<div class="loading">
					<div class="spinner"></div>
					<p>{t('loading')}</p>
				</div>
			{:else if orderItems.length === 0}
				<div class="empty-state">
					<div class="empty-icon">
						<svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
							<path d="M9 11H15M9 15H15M17 21H7C5.89543 21 5 20.1046 5 19V5C5 3.89543 5.89543 3 7 3H12.5858C12.851 3 13.1054 3.10536 13.2929 3.29289L19.7071 9.70711C19.8946 9.89464 20 10.149 20 10.4142V19C20 20.1046 19.1046 21 18 21H17Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
						</svg>
					</div>
					<h3>
						{#if currentLang === 'ar'}
							لا توجد عناصر في الطلب
						{:else}
							No items in this order
						{/if}
					</h3>
					<p>
						{#if currentLang === 'ar'}
							ابدأ بإضافة عناصر إلى طلبك
						{:else}
							Start by adding items to your order
						{/if}
					</p>
					<button class="add-first-item-btn" on:click={openAddItemModal}>
						{t('addItem')}
					</button>
				</div>
			{:else}
				<div class="items-list">
					{#each orderItems as item, index}
						<div class="item-card">
							<div class="item-info">
								<h4>
									{#if currentLang === 'ar'}
										عنصر #{index + 1}
									{:else}
										Item #{index + 1}
									{/if}
								</h4>
								<div class="item-details">
									<div class="detail">
										<span class="label">{t('width')}:</span>
										<span class="value">{item.width} cm</span>
									</div>
									<div class="detail">
										<span class="label">{t('height')}:</span>
										<span class="value">{item.height} cm</span>
									</div>
									<div class="detail">
										<span class="label">{t('materials')}:</span>
										<span class="value">{item.material?.name || 'N/A'}</span>
									</div>
									{#if item.wantPaint}
										<div class="detail">
											<span class="feature">
												{#if currentLang === 'ar'}
													مع طلاء
												{:else}
													With Paint
												{/if}
											</span>
										</div>
									{/if}
									{#if item.wantDrilled}
										<div class="detail">
											<span class="feature">
												{#if currentLang === 'ar'}
													مع ثقب
												{:else}
													With Drilling
												{/if}
											</span>
										</div>
									{/if}
								</div>
							</div>
							<div class="item-actions">
								<button class="remove-btn" on:click={() => handleRemoveItem(item.id)}>
									<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
										<path d="M3 6H5H21M8 6V4C8 3.44772 8.44772 3 9 3H15C15.5523 3 16 3.44772 16 4V6M19 6V20C19 20.5523 18.5523 21 18 21H6C5.44772 21 5 20.5523 5 20V6H19Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
									</svg>
									{t('delete')}
								</button>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
		
		<!-- Order Actions -->
		{#if orderItems.length > 0}
			<div class="order-actions">
				<button class="finish-order-btn" on:click={handleFinishOrder}>
					{#if currentLang === 'ar'}
						إنهاء الطلب
					{:else}
						Finish Order
					{/if}
				</button>
			</div>
		{/if}
	</div>
</div>

<!-- Add Item Modal -->
{#if showAddItemModal}
	<div class="modal-overlay" on:click={closeAddItemModal}>
		<div class="modal-content" on:click|stopPropagation>
			<div class="modal-header">
				<h3>{t('addOrderItem')}</h3>
				<button class="close-btn" on:click={closeAddItemModal}>×</button>
			</div>
			
			<div class="modal-body">
				<!-- Error Message -->
				{#if addItemError}
					<div class="error-message">
						{addItemError}
					</div>
				{/if}
				
				<form class="add-item-form" on:submit|preventDefault={handleAddItem}>
					<!-- Choose Item Type Checkbox -->
					<div class="form-group">
						<label class="checkbox-label">
							<input 
								type="checkbox" 
								bind:checked={addItemForm.chooseItemType}
								disabled={isAddingItem}
							/>
							<span class="checkmark"></span>
							{t('chooseItemType')}
						</label>
					</div>
					
					<!-- Category Dropdown -->
					{#if addItemForm.chooseItemType}
						<div class="form-group">
							<label for="categoryId">{t('category')}</label>
							<select 
								id="categoryId"
								bind:value={addItemForm.categoryId}
								disabled={isAddingItem}
								class="form-select"
							>
								<option value="">
									{#if currentLang === 'ar'}
										اختر فئة
									{:else}
										Select Category
									{/if}
								</option>
								{#each categories as category}
									<option value={category.id}>{category.name}</option>
								{/each}
							</select>
						</div>
					{/if}
					
					<!-- Choose Existing Product Checkbox -->
					<div class="form-group">
						<label class="checkbox-label">
							<input 
								type="checkbox" 
								bind:checked={addItemForm.chooseExistingProduct}
								disabled={isAddingItem}
							/>
							<span class="checkmark"></span>
							{t('chooseExistingProduct')}
						</label>
					</div>
					
					<!-- Product Dropdown -->
					{#if addItemForm.chooseExistingProduct}
						<div class="form-group">
							<label for="productId">
								{#if currentLang === 'ar'}
									المنتج
								{:else}
									Product
								{/if}
							</label>
							<select 
								id="productId"
								bind:value={addItemForm.productId}
								disabled={isAddingItem}
								class="form-select"
							>
								<option value="">
									{#if currentLang === 'ar'}
										اختر منتج
									{:else}
										Select Product
									{/if}
								</option>
								{#each filteredProducts as product}
									<option value={product.id}>{product.name}</option>
								{/each}
							</select>
						</div>
					{/if}
					
					<!-- Width and Height -->
					<div class="form-row">
						<div class="form-group">
							<label for="width">{t('width')} (cm) *</label>
							<input 
								id="width"
								type="number"
								bind:value={addItemForm.width}
								placeholder="0"
								required
								disabled={isAddingItem}
								class="form-input"
								min="1"
								step="0.1"
							/>
						</div>
						
						<div class="form-group">
							<label for="height">{t('height')} (cm) *</label>
							<input 
								id="height"
								type="number"
								bind:value={addItemForm.height}
								placeholder="0"
								required
								disabled={isAddingItem}
								class="form-input"
								min="1"
								step="0.1"
							/>
						</div>
					</div>
					
					<!-- Material Dropdown -->
					<div class="form-group">
						<label for="materialId">{t('materials')} *</label>
						<select 
							id="materialId"
							bind:value={addItemForm.materialId}
							required
							disabled={isAddingItem}
							class="form-select"
						>
							<option value="">
								{#if currentLang === 'ar'}
									اختر مادة
								{:else}
									Select Material
								{/if}
							</option>
							{#each materials as material}
								<option value={material.id}>{material.name}</option>
							{/each}
						</select>
					</div>
					
					<!-- Paint Checkbox -->
					<div class="form-group">
						<label class="checkbox-label">
							<input 
								type="checkbox" 
								bind:checked={addItemForm.wantPaint}
								disabled={isAddingItem}
							/>
							<span class="checkmark"></span>
							{t('wantPaint')}
						</label>
					</div>
					
					<!-- Drilled Checkbox -->
					<div class="form-group">
						<label class="checkbox-label">
							<input 
								type="checkbox" 
								bind:checked={addItemForm.wantDrilled}
								disabled={isAddingItem}
							/>
							<span class="checkmark"></span>
							{t('wantDrilled')}
						</label>
					</div>
					
					<!-- Form Actions -->
					<div class="form-actions">
						<button 
							type="button" 
							class="cancel-btn"
							on:click={closeAddItemModal}
							disabled={isAddingItem}
						>
							{t('cancel')}
						</button>
						
						<button 
							type="submit" 
							class="add-btn"
							disabled={isAddingItem}
						>
							{#if isAddingItem}
								<div class="spinner"></div>
								{t('loading')}
							{:else}
								{t('addItem')}
							{/if}
						</button>
					</div>
				</form>
			</div>
		</div>
	</div>
{/if}

<style>
	.order-manage-page {
		min-height: 100vh;
		background: var(--bg-secondary, #f8fafc);
		padding: 2rem 0;
	}

	.container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 1rem;
	}

	/* Page Header */
	.page-header {
		margin-bottom: 2rem;
	}

	.page-title {
		font-size: 2.5rem;
		font-weight: 700;
		color: var(--text-primary, #1e293b);
		margin-bottom: 1rem;
	}

	.order-info {
		display: flex;
		gap: 2rem;
		flex-wrap: wrap;
	}

	.info-item {
		display: flex;
		gap: 0.5rem;
	}

	.info-item .label {
		font-weight: 500;
		color: var(--text-secondary, #64748b);
	}

	.info-item .value {
		color: var(--text-primary, #1e293b);
	}

	.status-pending {
		color: #f59e0b;
	}

	.status-completed {
		color: #10b981;
	}

	.status-shipped {
		color: #3b82f6;
	}

	.status-cancelled {
		color: #ef4444;
	}

	/* Error Message */
	.error-message {
		background: #fef2f2;
		border: 1px solid #fecaca;
		color: #dc2626;
		padding: 1rem;
		border-radius: 8px;
		margin-bottom: 2rem;
		font-size: 0.875rem;
	}

	[data-theme="dark"] .error-message {
		background: rgba(220, 38, 38, 0.1);
		border-color: rgba(220, 38, 38, 0.3);
		color: #fca5a5;
	}

	/* Order Items Section */
	.order-items-section {
		background: var(--bg-primary, white);
		border-radius: 16px;
		padding: 2rem;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
		border: 1px solid var(--border-color, #e2e8f0);
		margin-bottom: 2rem;
	}

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
	}

	.section-header h2 {
		font-size: 1.5rem;
		font-weight: 600;
		color: var(--text-primary, #1e293b);
		margin: 0;
	}

	.add-item-btn {
		background: linear-gradient(135deg, #3b82f6, #2563eb);
		color: white;
		border: none;
		padding: 0.75rem 1.5rem;
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.3s ease;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-weight: 500;
	}

	.add-item-btn:hover {
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
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

	/* Empty State */
	.empty-state {
		text-align: center;
		padding: 4rem 2rem;
	}

	.empty-icon {
		margin-bottom: 1.5rem;
		color: var(--text-secondary, #94a3b8);
	}

	.empty-state h3 {
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--text-primary, #1e293b);
		margin-bottom: 0.5rem;
	}

	.empty-state p {
		color: var(--text-secondary, #64748b);
		margin-bottom: 2rem;
	}

	.add-first-item-btn {
		background: linear-gradient(135deg, #3b82f6, #2563eb);
		color: white;
		border: none;
		padding: 1rem 2rem;
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.3s ease;
		font-weight: 600;
	}

	.add-first-item-btn:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
	}

	/* Items List */
	.items-list {
		display: grid;
		gap: 1rem;
	}

	.item-card {
		background: var(--bg-secondary, #f8fafc);
		border: 1px solid var(--border-color, #e2e8f0);
		border-radius: 12px;
		padding: 1.5rem;
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
	}

	.item-info h4 {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--text-primary, #1e293b);
		margin-bottom: 1rem;
	}

	.item-details {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
		gap: 0.75rem;
	}

	.detail {
		display: flex;
		gap: 0.5rem;
	}

	.detail .label {
		font-weight: 500;
		color: var(--text-secondary, #64748b);
	}

	.detail .value {
		color: var(--text-primary, #1e293b);
	}

	.detail .feature {
		background: #dbeafe;
		color: #1e40af;
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		font-size: 0.75rem;
		font-weight: 500;
	}

	[data-theme="dark"] .detail .feature {
		background: rgba(59, 130, 246, 0.2);
		color: #93c5fd;
	}

	.item-actions {
		display: flex;
		gap: 0.5rem;
	}

	.remove-btn {
		background: #fef2f2;
		color: #dc2626;
		border: 1px solid #fecaca;
		padding: 0.5rem 1rem;
		border-radius: 6px;
		cursor: pointer;
		transition: all 0.3s ease;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
	}

	.remove-btn:hover {
		background: #fee2e2;
		border-color: #fca5a5;
	}

	[data-theme="dark"] .remove-btn {
		background: rgba(220, 38, 38, 0.1);
		border-color: rgba(220, 38, 38, 0.3);
		color: #fca5a5;
	}

	/* Order Actions */
	.order-actions {
		text-align: center;
	}

	.finish-order-btn {
		background: linear-gradient(135deg, #16a34a, #22c55e);
		color: white;
		border: none;
		padding: 1rem 3rem;
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.3s ease;
		font-weight: 600;
		font-size: 1.125rem;
	}

	.finish-order-btn:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 20px rgba(34, 197, 94, 0.4);
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
		border-radius: 16px;
		max-width: 600px;
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
	}

	/* Add Item Form */
	.add-item-form {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.form-group {
		display: flex;
		flex-direction: column;
	}

	.form-group label {
		font-weight: 500;
		color: var(--text-primary, #374151);
		margin-bottom: 0.5rem;
		font-size: 0.875rem;
	}

	[data-theme="dark"] .form-group label {
		color: #d1d5db;
	}

	.form-input,
	.form-select {
		padding: 0.75rem 1rem;
		border: 2px solid var(--border-color, #e2e8f0);
		border-radius: 8px;
		font-size: 1rem;
		background: var(--bg-primary, white);
		color: var(--text-primary, #1e293b);
		transition: all 0.3s ease;
	}

	.form-input:focus,
	.form-select:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	.form-input:disabled,
	.form-select:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	[data-theme="dark"] .form-input,
	[data-theme="dark"] .form-select {
		background: var(--bg-secondary, #0f172a);
		color: #f1f5f9;
		border-color: var(--border-color, #334155);
	}

	.form-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
	}

	/* Checkbox */
	.checkbox-label {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		cursor: pointer;
		font-weight: 500;
		color: var(--text-primary, #374151);
	}

	.checkbox-label input[type="checkbox"] {
		display: none;
	}

	.checkmark {
		width: 20px;
		height: 20px;
		border: 2px solid var(--border-color, #d1d5db);
		border-radius: 4px;
		position: relative;
		transition: all 0.3s ease;
	}

	.checkbox-label input[type="checkbox"]:checked + .checkmark {
		background: #3b82f6;
		border-color: #3b82f6;
	}

	.checkbox-label input[type="checkbox"]:checked + .checkmark::after {
		content: '';
		position: absolute;
		left: 6px;
		top: 2px;
		width: 6px;
		height: 10px;
		border: solid white;
		border-width: 0 2px 2px 0;
		transform: rotate(45deg);
	}

	/* Form Actions */
	.form-actions {
		display: flex;
		gap: 1rem;
		justify-content: flex-end;
		margin-top: 1rem;
	}

	.cancel-btn,
	.add-btn {
		padding: 0.75rem 1.5rem;
		border-radius: 8px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s ease;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.cancel-btn {
		background: transparent;
		color: var(--text-secondary, #64748b);
		border: 2px solid var(--border-color, #e2e8f0);
	}

	.cancel-btn:hover:not(:disabled) {
		background: var(--bg-secondary, #f8fafc);
		color: var(--text-primary, #1e293b);
	}

	.add-btn {
		background: linear-gradient(135deg, #3b82f6, #2563eb);
		color: white;
		border: none;
	}

	.add-btn:hover:not(:disabled) {
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
	}

	.cancel-btn:disabled,
	.add-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		transform: none;
	}

	/* RTL Support */
	[dir="rtl"] .section-header {
		flex-direction: row-reverse;
	}

	[dir="rtl"] .item-card {
		flex-direction: row-reverse;
	}

	[dir="rtl"] .form-actions {
		justify-content: flex-start;
	}

	/* Responsive */
	@media (max-width: 768px) {
		.page-title {
			font-size: 2rem;
		}

		.order-info {
			flex-direction: column;
			gap: 0.5rem;
		}

		.section-header {
			flex-direction: column;
			align-items: stretch;
			gap: 1rem;
		}

		.item-card {
			flex-direction: column;
			gap: 1rem;
		}

		.item-actions {
			justify-content: flex-end;
		}

		.form-row {
			grid-template-columns: 1fr;
		}

		.form-actions {
			flex-direction: column;
		}

		.cancel-btn,
		.add-btn {
			width: 100%;
			justify-content: center;
		}
	}

	/* CSS Variables for theming */
	:root {
		--text-primary: #1e293b;
		--text-secondary: #64748b;
		--bg-primary: #ffffff;
		--bg-secondary: #f8fafc;
		--border-color: #e2e8f0;
	}

	[data-theme="dark"] {
		--text-primary: #f1f5f9;
		--text-secondary: #94a3b8;
		--bg-primary: #1e293b;
		--bg-secondary: #0f172a;
		--border-color: #334155;
	}
</style>

