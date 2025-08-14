<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { authStore } from '$lib/stores/auth.js';
	import { authService } from '$lib/services/auth.js';
	import { languageStore, t } from '$lib/stores/language.js';
	import { themeStore } from '$lib/stores/theme.js';
	import { ordersService } from '$lib/services/orders.js';
	import OrderItemForm from '$lib/components/OrderItemForm.svelte'; // Import the new component
	
	let orderData = {
		priority: 'medium', 
		type: 'custom', 
		note: '',
		items: [] // Initialize as empty array
	};
	
	let isLoading = false;
	let error = '';
	let showItemModal = false; // Control modal visibility

	// Reactive statements
	$: currentLang = $languageStore;
	$: currentTheme = $themeStore;
	$: isAuthenticated = $authStore.isAuthenticated;
	$: user = $authStore.user;
	
	// Redirect if not authenticated
	$: if (!isAuthenticated) {
		goto('/login');
	}
	
	onMount(() => {
		// No pre-selected product logic needed here anymore as items are added via modal
	});
	
	async function handleCreateOrder() {
		// Validation: Ensure at least one item is added
		if (orderData.items.length === 0) {
			error = t('An order must have at least one item.');
			return;
		}
		
		isLoading = true;
		error = '';
		
		try {
			// Get user data to include address
			const userData = await authService.getMe();
			
			// Construct the order payload to match the API schema
			const payload = {
				priority: orderData.priority,
				type: orderData.type,
				note: orderData.note,
				address: userData.address || null,
				items: orderData.items.map(item => ({
					width: Number(item.width),
					height: Number(item.height),
					productId: item.productId || undefined, 
					materialId: item.materialId || undefined, 
					currentStage: item.currentStage, 
					currentStageId: item.currentStageId 
				}))
			};
			
			// Create the order
			const response = await ordersService.createOrder(payload);
			
			// Redirect to order management page with the new order ID
			const orderId = response.id || response.data?.id;
			if (orderId) {
				goto(`/client/orders/${orderId}/manage`);
			} else {
				throw new Error('Order ID not returned from API.');
			}
			
		} catch (err) {
			error = err.message || t('Failed to create order.');
		} finally {
			isLoading = false;
		}
	}
	
	function handleKeyPress(event) {
		if (event.key === 'Enter') {
			handleCreateOrder();
		}
	}

	// Function to open the add item modal
	function openAddItemModal() {
		showItemModal = true;
	}

	// Function to handle item added from modal
	function handleItemAdded(event) {
		const newItem = event.detail;
		orderData.items = [...orderData.items, newItem];
		showItemModal = false; // Close modal after adding
	}

	// Function to close the add item modal
	function handleCloseItemModal() {
		showItemModal = false;
	}
</script>

<svelte:head>
	<title>{t('createNewOrder')} - Patriot Glass Factory</title>
</svelte:head>

<div class="create-order-page" data-theme={currentTheme}>
	<div class="container">
		<div class="page-header">
			<h1 class="page-title">{t('createNewOrder')}</h1>
			<p class="page-description">
				{#if currentLang === 'ar'}
					أدخل معلومات الطلب لإنشاء طلب جديد
				{:else}
					Enter order information to create a new order
				{/if}
			</p>
		</div>
		
		<div class="order-form-container">
			<!-- Error Message -->
			{#if error}
				<div class="error-message">
					{error}
				</div>
			{/if}
			
			<!-- Order Form -->
			<form class="order-form" on:submit|preventDefault={handleCreateOrder}>
				<div class="form-grid">
					<!-- Notes -->
					<div class="form-group full-width">
						<label for="note">
							{#if currentLang === 'ar'}
								ملاحظات إضافية
							{:else}
								Additional Notes
							{/if}
						</label>
						<textarea
							id="note"
							bind:value={orderData.note}
							placeholder={currentLang === 'ar' ? 'ملاحظات إضافية' : 'Additional notes'}
							disabled={isLoading}
							class="form-textarea"
							rows="3"
						></textarea>
					</div>
				</div>
				
				<!-- Display Added Items (Optional - for user feedback) -->
				{#if orderData.items.length > 0}
					<h3 style="margin-top: 2rem; margin-bottom: 1rem; color: var(--text-primary);">
						{#if currentLang === 'ar'}
							عناصر الطلب
						{:else}
							Order Items
						{/if}
					</h3>
					<ul class="item-list">
						{#each orderData.items as item, index}
							<li>
								Item {index + 1}: {item.width}x{item.height} 
								({item.productId ? `Product ID: ${item.productId}` : 'Custom'}, 
								{item.materialId ? `Material ID: ${item.materialId}` : 'No Material'})
							</li>
						{/each}
					</ul>
				{/if}

				<!-- Add Item Button -->
				<div class="form-actions" style="justify-content: flex-start;">
					<button type="button" class="add-item-button" on:click={openAddItemModal} disabled={isLoading}>
						{t('addItem')}
					</button>
				</div>

				<!-- Form Actions -->
				<div class="form-actions">
					<button 
						type="button" 
						class="cancel-button"
						on:click={() => goto('/client/orders')}
						disabled={isLoading}
					>
						{t('cancel')}
					</button>
					
					<button 
						type="submit" 
						class="create-button"
						disabled={isLoading || orderData.items.length === 0} 
					>
						{#if isLoading}
							<div class="spinner"></div>
							{t('loading')}
						{:else}
							{t('createOrder')}
						{/if}
					</button>
				</div>
			</form>
		</div>
	</div>
</div>

<!-- Order Item Form Modal -->
<OrderItemForm 
	bind:showModal={showItemModal} 
	on:addItem={handleItemAdded} 
	on:close={handleCloseItemModal}
/>

<style>
	.create-order-page {
		min-height: 100vh;
		background: var(--bg-secondary, #f8fafc);
		padding: 2rem 0;
	}

	.container {
		max-width: 800px;
		margin: 0 auto;
		padding: 0 1rem;
	}

	/* Page Header */
	.page-header {
		text-align: center;
		margin-bottom: 3rem;
	}

	.page-title {
		font-size: 2.5rem;
		font-weight: 700;
		color: var(--text-primary, #1e293b);
		margin-bottom: 1rem;
	}

	.page-description {
		color: var(--text-secondary, #64748b);
		font-size: 1.125rem;
	}

	/* Form Container */
	.order-form-container {
		background: var(--bg-primary, white);
		padding: 2.5rem;
		border-radius: 16px;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
		border: 1px solid var(--border-color, #e2e8f0);
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

	/* Form */
	.order-form {
		width: 100%;
	}

	.form-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1.5rem;
		margin-bottom: 2rem;
	}

	.form-group {
		display: flex;
		flex-direction: column;
	}

	.form-group.full-width {
		grid-column: 1 / -1;
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
	.form-textarea {
		padding: 0.75rem 1rem;
		border: 2px solid var(--border-color, #e2e8f0);
		border-radius: 8px;
		font-size: 1rem;
		background: var(--bg-primary, white);
		color: var(--text-primary, #1e293b);
		transition: all 0.3s ease;
	}

	.form-input:focus,
	.form-textarea:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	.form-input:disabled,
	.form-textarea:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	[data-theme="dark"] .form-input,
	[data-theme="dark"] .form-textarea {
		background: var(--bg-secondary, #0f172a);
		color: #f1f5f9;
		border-color: var(--border-color, #334155);
	}

	.form-textarea {
		resize: vertical;
		min-height: 80px;
	}

	/* Item List */
	.item-list {
		list-style: none;
		padding: 0;
		margin-bottom: 2rem;
		border: 1px solid var(--border-color);
		border-radius: 8px;
		background: var(--bg-secondary);
	}

	.item-list li {
		padding: 0.75rem 1rem;
		border-bottom: 1px solid var(--border-color);
		color: var(--text-secondary);
	}

	.item-list li:last-child {
		border-bottom: none;
	}

	/* Form Actions */
	.form-actions {
		display: flex;
		gap: 1rem;
		justify-content: flex-end;
	}

	.cancel-button,
	.create-button,
	.add-item-button {
		padding: 0.75rem 2rem;
		border-radius: 8px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s ease;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 1rem;
	}

	.cancel-button {
		background: transparent;
		color: var(--text-secondary, #64748b);
		border: 2px solid var(--border-color, #e2e8f0);
	}

	.cancel-button:hover:not(:disabled) {
		background: var(--bg-secondary, #f8fafc);
		color: var(--text-primary, #1e293b);
	}

	.create-button {
		background: linear-gradient(135deg, #3b82f6, #2563eb);
		color: white;
		border: none;
		box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4);
	}

	.create-button:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 6px 20px rgba(59, 130, 246, 0.6);
	}

	.create-button:active:not(:disabled) {
		transform: translateY(0);
	}

	.add-item-button {
		background: #28a745;
		color: white;
		border: none;
		box-shadow: 0 4px 15px rgba(40, 167, 69, 0.4);
	}

	.add-item-button:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 6px 20px rgba(40, 167, 69, 0.6);
	}

	.add-item-button:active:not(:disabled) {
		transform: translateY(0);
	}

	.cancel-button:disabled,
	.create-button:disabled,
	.add-item-button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		transform: none;
	}

	/* Spinner */
	.spinner {
		width: 20px;
		height: 20px;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-top: 2px solid white;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}

	/* RTL Support */
	[dir="rtl"] .form-actions {
		justify-content: flex-start;
	}

	[dir="rtl"] .page-header {
		text-align: center;
	}

	/* Responsive */
	@media (max-width: 768px) {
		.form-grid {
			grid-template-columns: 1fr;
		}

		.form-actions {
			flex-direction: column;
		}

		.cancel-button,
		.create-button,
		.add-item-button {
			width: 100%;
			justify-content: center;
		}

		.order-form-container {
			padding: 1.5rem;
		}

		.page-title {
			font-size: 2rem;
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
