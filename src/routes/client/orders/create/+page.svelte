<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { authStore } from '$lib/stores/auth.js';
	import { authService } from '$lib/services/auth.js';
	import { languageStore, t } from '$lib/stores/language.js';
	import { themeStore } from '$lib/stores/theme.js';
	import { ordersService } from '$lib/services/orders.js';
	import { statesService } from '$lib/services/states.js';
	import { citiesService } from '$lib/services/cities.js';
	import OrderItemForm from '$lib/components/OrderItemForm.svelte'; // Import the new component
	
	let orderData = {
		priority: 'medium', 
		type: 'custom', 
		note: '',
		items: [], // Initialize as empty array
		address: {
			stateId: null,
			state: null,
			cityId: null,
			city: null,
			street1: '',
			street2: '',
			postalCode: '',
			apartment: '',
			complex: ''
		}
	};
	
	let isLoading = false;
	let error = '';
	let showItemModal = false; // Control modal visibility
	
	// Address-related data
	let states = [];
	let cities = [];
	let selectedState = null;
	let selectedCity = null;
	let addressErrors = {};
	let useCustomAddress = false; // Checkbox state for custom address

	// Reactive statements
	$: currentLang = $languageStore;
	$: currentTheme = $themeStore;
	$: isAuthenticated = $authStore.isAuthenticated;
	$: user = $authStore.user;
	
	// Redirect if not authenticated
	$: if (!isAuthenticated) {
		goto('/login');
	}
	
	// Helper function to get localized name
	function getLocalizedName(item) {
		if (!item || !item.name) return '';
		if (typeof item.name === 'string') return item.name;
		
		// Use current language preference, fallback to English, then Arabic
		return item.name[currentLang] || item.name.en || item.name.ar || '';
	}
	
	// Load cities when state changes
	$: if (selectedState) {
		loadCitiesForState(selectedState.id);
		selectedCity = null; // Reset city selection when state changes
		orderData.address.stateId = selectedState.id;
		orderData.address.state = selectedState;
	} else {
		cities = [];
		selectedCity = null;
		orderData.address.stateId = null;
		orderData.address.state = null;
	}
	
	// Update city in orderData when selectedCity changes
	$: if (selectedCity) {
		orderData.address.cityId = selectedCity.id;
		orderData.address.city = selectedCity;
	} else {
		orderData.address.cityId = null;
		orderData.address.city = null;
	}
	
	async function loadStates() {
		try {
			const statesResponse = await statesService.getAllStates();
			states = statesResponse.results || statesResponse.states || statesResponse;
		} catch (err) {
			console.error('Failed to load states:', err);
		}
	}
	
	async function loadCitiesForState(stateId) {
		try {
			const citiesData = await citiesService.getCitiesByState(stateId);
			cities = Array.isArray(citiesData) ? citiesData : [];
		} catch (err) {
			console.error('Failed to load cities:', err);
			cities = [];
		}
	}
	
	onMount(() => {
		loadStates();
	});
	
	async function handleCreateOrder() {
		// Validation: Ensure at least one item is added
		if (orderData.items.length === 0) {
			error = t('An order must have at least one item.');
			return;
		}
		
		// Validate address if custom address is enabled
		addressErrors = {};
		if (useCustomAddress) {
			const addressFields = orderData.address;
			const hasAnyAddressField = addressFields.street1 || addressFields.street2 || 
				addressFields.postalCode || addressFields.apartment || addressFields.complex || 
				selectedState || selectedCity;

			if (hasAnyAddressField) {
				if (!selectedState) {
					addressErrors.state = 'State is required when providing address information';
				}
				if (!addressFields.street1?.trim()) {
					addressErrors.street1 = 'Street address is required when providing address information';
				}
				if (!addressFields.postalCode?.trim()) {
					addressErrors.postalCode = 'Postal code is required when providing address information';
				}
			}

			// If there are address errors, don't submit
			if (Object.keys(addressErrors).length > 0) {
				error = 'Please fix the address errors below.';
				return;
			}
		}
		
		isLoading = true;
		error = '';
		
		try {
			// Construct the order payload to match the API schema
			const payload = {
				priority: orderData.priority,
				type: orderData.type,
				note: orderData.note,
				items: orderData.items.map(item => ({
					width: Number(item.width),
					height: Number(item.height),
					productId: item.productId || undefined, 
					materialId: item.materialId || undefined, 
					categoryId: item.categoryId || undefined,
					currentStage: item.currentStage, 
					currentStageId: item.currentStageId,
					stageIds: item.stageIds || undefined,
					stagePatternId: item.stagePatternId || undefined,
					patternImageUrl: item.patternImageUrl || undefined,
					note: item.note || undefined
				}))
			};

			// Add address based on user choice
			if (useCustomAddress) {
				// Use custom address if provided
				const addressFields = orderData.address;
				const hasAnyAddressField = addressFields.street1 || addressFields.street2 || 
					addressFields.postalCode || addressFields.apartment || addressFields.complex || 
					selectedState || selectedCity;

				if (hasAnyAddressField && selectedState) {
					payload.address = {
						stateId: selectedState.id,
						state: selectedState,
						street1: addressFields.street1?.trim(),
						postalCode: addressFields.postalCode?.trim()
					};
					
					if (selectedCity) {
						payload.address.cityId = selectedCity.id;
						payload.address.city = selectedCity;
					}
					if (addressFields.street2?.trim()) {
						payload.address.street2 = addressFields.street2.trim();
					}
					if (addressFields.apartment?.trim()) {
						payload.address.apartment = addressFields.apartment.trim();
					}
					if (addressFields.complex?.trim()) {
						payload.address.complex = addressFields.complex.trim();
					}
				}
			} else {
				// Use user's profile address
				const userData = await authService.getMe();
				payload.address = userData.address || null;
			}
			
			// Create the order
			const response = await ordersService.createOrder(payload);
			
			// Redirect to orders list page after successful creation
			goto('/client/orders');
			
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
				<!-- Address Section -->
				<div class="address-section">
					<div class="address-header">
						<h3>
							{#if currentLang === 'ar'}
								معلومات العنوان
							{:else}
								Address Information
							{/if}
						</h3>
						<div class="address-choice">
							<label class="checkbox-label">
								<input 
									type="checkbox" 
									bind:checked={useCustomAddress}
									disabled={isLoading}
								>
								<span class="checkbox-text">
									{#if currentLang === 'ar'}
										استخدام عنوان مخصص للطلب
									{:else}
										Use custom address for this order
									{/if}
								</span>
							</label>
							{#if !useCustomAddress}
								<p class="address-note">
									{#if currentLang === 'ar'}
										سيتم استخدام العنوان من ملفك الشخصي
									{:else}
										Your profile address will be used
									{/if}
								</p>
							{/if}
						</div>
					</div>
					{#if useCustomAddress}
						<div class="address-form">
							<div class="form-grid">
								<!-- State -->
								<div class="form-group">
								<label for="state">
									{#if currentLang === 'ar'}
										الولاية *
									{:else}
										State *
									{/if}
								</label>
								<select 
									id="state" 
									bind:value={selectedState}
									disabled={isLoading}
									class:error={addressErrors.state}
								>
									<option value={null}>Select State</option>
									{#each states as state}
										<option value={state}>{getLocalizedName(state)}</option>
									{/each}
								</select>
								{#if addressErrors.state}
									<span class="error-message">{addressErrors.state}</span>
								{/if}
							</div>

							<!-- City -->
							<div class="form-group">
								<label for="city">
									{#if currentLang === 'ar'}
										المدينة (اختياري)
									{:else}
										City (Optional)
									{/if}
								</label>
								<select 
									id="city" 
									bind:value={selectedCity}
									disabled={isLoading || !selectedState}
								>
									<option value={null}>Select City</option>
									{#each cities as city}
										<option value={city}>{getLocalizedName(city)}</option>
									{/each}
								</select>
							</div>

							<!-- Street Address -->
							<div class="form-group">
								<label for="street1">
									{#if currentLang === 'ar'}
										عنوان الشارع *
									{:else}
										Street Address *
									{/if}
								</label>
								<input 
									type="text" 
									id="street1"
									bind:value={orderData.address.street1}
									class:error={addressErrors.street1}
									disabled={isLoading}
									placeholder={currentLang === 'ar' ? 'عنوان الشارع' : 'Street Address'}
								/>
								{#if addressErrors.street1}
									<span class="error-message">{addressErrors.street1}</span>
								{/if}
							</div>

							<!-- Street Address 2 -->
							<div class="form-group">
								<label for="street2">
									{#if currentLang === 'ar'}
										عنوان الشارع 2 (اختياري)
									{:else}
										Street Address 2 (Optional)
									{/if}
								</label>
								<input 
									type="text" 
									id="street2"
									bind:value={orderData.address.street2}
									disabled={isLoading}
									placeholder={currentLang === 'ar' ? 'عنوان الشارع 2' : 'Apartment, suite, etc.'}
								/>
							</div>

							<!-- Postal Code -->
							<div class="form-group">
								<label for="postalCode">
									{#if currentLang === 'ar'}
										الرمز البريدي *
									{:else}
										Postal Code *
									{/if}
								</label>
								<input 
									type="text" 
									id="postalCode"
									bind:value={orderData.address.postalCode}
									class:error={addressErrors.postalCode}
									disabled={isLoading}
									placeholder={currentLang === 'ar' ? 'الرمز البريدي' : 'Postal Code'}
								/>
								{#if addressErrors.postalCode}
									<span class="error-message">{addressErrors.postalCode}</span>
								{/if}
							</div>

							<!-- Apartment -->
							<div class="form-group">
								<label for="apartment">
									{#if currentLang === 'ar'}
										الشقة (اختياري)
									{:else}
										Apartment (Optional)
									{/if}
								</label>
								<input 
									type="text" 
									id="apartment"
									bind:value={orderData.address.apartment}
									disabled={isLoading}
									placeholder={currentLang === 'ar' ? 'رقم الشقة' : 'Apartment Number'}
								/>
							</div>

							<!-- Complex -->
							<div class="form-group">
								<label for="complex">
									{#if currentLang === 'ar'}
										المجمع (اختياري)
									{:else}
										Complex (Optional)
									{/if}
								</label>
								<input 
									type="text" 
									id="complex"
									bind:value={orderData.address.complex}
									disabled={isLoading}
									placeholder={currentLang === 'ar' ? 'اسم المجمع أو المبنى' : 'Building or Complex Name'}
								/>
							</div>
						</div>
					</div>
					{/if}
				</div>

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

	/* Address Section Styles */
	.address-section {
		margin-bottom: 2rem;
		padding: 1.5rem;
		background: var(--bg-secondary, #f8fafc);
		border-radius: 12px;
		border: 1px solid var(--border-color, #e2e8f0);
	}

	.address-section h3 {
		margin: 0 0 1.5rem 0;
		color: var(--text-primary, #1e293b);
		font-size: 1.25rem;
		font-weight: 600;
	}

	.address-form {
		background: var(--bg-primary, white);
		padding: 1.5rem;
		border-radius: 8px;
		border: 1px solid var(--border-color, #e2e8f0);
	}

	.error-message {
		color: var(--error-color, #ef4444);
		font-size: 0.875rem;
		margin-top: 0.25rem;
		display: block;
	}

	input.error,
	select.error {
		border-color: var(--error-color, #ef4444);
		box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
	}

	.address-header {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		margin-bottom: 1.5rem;
	}

	.address-choice {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.checkbox-label {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		cursor: pointer;
		font-weight: 500;
	}

	.checkbox-label input[type="checkbox"] {
		width: 1.25rem;
		height: 1.25rem;
		cursor: pointer;
	}

	.checkbox-text {
		color: var(--text-primary);
		font-size: 1rem;
	}

	.address-note {
		margin: 0;
		padding: 0.75rem 1rem;
		background: var(--bg-primary);
		border: 1px solid var(--border-color);
		border-radius: 8px;
		color: var(--text-secondary);
		font-size: 0.875rem;
		font-style: italic;
	}

	@media (max-width: 768px) {
		.address-header {
			margin-bottom: 1rem;
		}
		
		.checkbox-label {
			gap: 0.5rem;
		}
		
		.checkbox-text {
			font-size: 0.875rem;
		}
	}
</style>
