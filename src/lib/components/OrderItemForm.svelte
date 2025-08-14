<script>
	import { createEventDispatcher, onMount } from 'svelte';
	import { productsService } from '$lib/services/products.js';
	import { categoriesService } from '$lib/services/categories.js';
	import { materialsService } from '$lib/services/materials.js';
	import { stagesService } from '$lib/services/stages.js';
	import { t, languageStore } from '$lib/stores/language.js';

	export let showModal = false;

	const dispatch = createEventDispatcher();

	// Modal states
	let currentStep = 1; // 1 = category/product selection, 2 = custom item details
	
	// Data arrays
	let categories = [];
	let products = [];
	let materials = [];
	let stages = [];

	// Form data
	let selectedCategory = null;
	let selectedProduct = null;
	let customItem = {
		width: 1,
		height: 1,
		materialId: null,
		selectedStages: []
	};

	let isLoading = false;
	let error = '';
	
	// Get current language
	$: currentLang = $languageStore;
	
	// Helper function to get localized name
	function getLocalizedName(item) {
		if (!item || !item.name) return '';
		if (typeof item.name === 'string') return item.name;
		
		// Use current language preference, fallback to English, then Arabic
		return item.name[currentLang] || item.name.en || item.name.ar || '';
	}

	onMount(async () => {
		if (showModal) {
			await loadInitialData();
		}
	});

	// Watch for modal opening to load data
	$: if (showModal && categories.length === 0) {
		loadInitialData();
	}

	async function loadInitialData() {
		isLoading = true;
		error = '';
		try {
			const [categoriesResponse, materialsResponse, stagesResponse] = await Promise.all([
				categoriesService.getAllCategories(),
				materialsService.getAllMaterials(),
				stagesService.getAllStages()
			]);
			
			// Extract data from results
			categories = categoriesResponse.results || categoriesResponse.categories || categoriesResponse;
			materials = materialsResponse.results || materialsResponse.materials || materialsResponse;
			stages = stagesResponse.results || stagesResponse.stages || stagesResponse;
		} catch (err) {
			error = 'Failed to load data: ' + err.message;
		} finally {
			isLoading = false;
		}
	}

	// Load products when category changes
	$: if (selectedCategory) {
		loadProductsByCategory();
	} else {
		products = [];
		selectedProduct = null;
	}

	async function loadProductsByCategory() {
		try {
			if (selectedCategory === 'all-products') {
				// Load all products in the system
				const allProductsResponse = await productsService.getAllProducts();
				products = allProductsResponse.products || allProductsResponse.result || allProductsResponse || [];
			} else if (selectedCategory === 'no-category') {
				// Load products with null category
				const productsData = await productsService.getProductsByCategory(null);
				products = Array.isArray(productsData) ? productsData : [];
			} else {
				// Get the localized category name
				const categoryName = getLocalizedName(selectedCategory);
				if (categoryName) {
					const productsData = await productsService.getProductsByCategory(categoryName);
					products = Array.isArray(productsData) ? productsData : [];
				}
			}
		} catch (err) {
			error = 'Failed to load products: ' + err.message;
			products = [];
		}
	}

	// Validate and constrain width/height inputs
	function validateDimension(value, field) {
		let numValue = parseInt(value);
		if (isNaN(numValue) || numValue < 1) {
			numValue = 1;
		} else if (numValue > 250) {
			numValue = 250;
		}
		customItem[field] = numValue;
	}

	function handleNextStep() {
		if (!selectedProduct) {
			error = 'Please select a product.';
			return;
		}

		// Add product directly to order
		const productItem = {
			width: selectedProduct.width,
			height: selectedProduct.height,
			productId: selectedProduct.id,
			categoryId: selectedCategory === 'no-category' ? undefined : selectedCategory?.id,
			category: selectedCategory === 'no-category' ? undefined : selectedCategory,
			currentStage: { id: '8ad600bc-4a2b-4953-9dd5-a4a9ba1e1978' },
			currentStageId: '8ad600bc-4a2b-4953-9dd5-a4a9ba1e1978',
			type: 'product'
		};

		dispatch('addItem', productItem);
		closeModal();
	}

	function handleSkip() {
		currentStep = 2;
		error = '';
	}

	function handleConfirmCustomItem() {
		// Validation - only stages are required
		if (customItem.selectedStages.length === 0) {
			error = 'Please select at least one stage.';
			return;
		}

		// Add custom item to order
		const newCustomItem = {
			width: customItem.width,
			height: customItem.height,
			materialId: customItem.materialId || undefined,
			material: customItem.materialId ? materials.find(m => m.id === customItem.materialId) : undefined,
			stageIds: customItem.selectedStages.map(stage => stage.id),
			stages: customItem.selectedStages,
			currentStage: { id: '8ad600bc-4a2b-4953-9dd5-a4a9ba1e1978' },
			currentStageId: '8ad600bc-4a2b-4953-9dd5-a4a9ba1e1978',
			type: 'custom'
		};

		dispatch('addItem', newCustomItem);
		closeModal();
	}

	function closeModal() {
		showModal = false;
		currentStep = 1;
		error = '';
		
		// Reset form data
		selectedCategory = null;
		selectedProduct = null;
		products = [];
		customItem = {
			width: 1,
			height: 1,
			materialId: null,
			selectedStages: []
		};
		
		dispatch('close');
	}

	function toggleStage(stage) {
		const index = customItem.selectedStages.findIndex(s => s.id === stage.id);
		if (index > -1) {
			customItem.selectedStages = customItem.selectedStages.filter(s => s.id !== stage.id);
		} else {
			customItem.selectedStages = [...customItem.selectedStages, stage];
		}
	}
</script>

{#if showModal}
<div class="modal-overlay" on:click|self={closeModal}>
	<div class="modal-content" on:click|stopPropagation>
		<div class="modal-header">
			<h2>
				{#if currentStep === 1}
					Add Item - Select Product
				{:else}
					Add Item - Custom Details
				{/if}
			</h2>
			<button class="close-button" on:click={closeModal}>&times;</button>
		</div>
		<div class="modal-body">
			{#if isLoading}
				<p>Loading data...</p>
			{:else if error}
				<div class="error-message">{error}</div>
			{/if}

			{#if currentStep === 1}
				<!-- Step 1: Category and Product Selection -->
				<div class="step-content">
					<div class="form-group">
						<label for="category">Category *</label>
						<select id="category" bind:value={selectedCategory} required>
							<option value="">Select Category</option>
							<option value="all-products">All Products</option>
							<option value="no-category">No Category</option>
							{#each categories as category}
								<option value={category}>{getLocalizedName(category)}</option>
							{/each}
						</select>
					</div>

					<div class="form-group">
						<label for="product">Product *</label>
						<select id="product" bind:value={selectedProduct} required disabled={!selectedCategory}>
							<option value="">Select Product</option>
							{#each products as product}
								<option value={product}>{getLocalizedName(product)}</option>
							{/each}
						</select>
					</div>

					<div class="modal-actions">
						<button type="button" class="cancel-button" on:click={closeModal}>Cancel</button>
						<button type="button" class="skip-button" on:click={handleSkip}>Skip</button>
						<button type="button" class="next-button" on:click={handleNextStep} disabled={!selectedProduct}>Next Step</button>
					</div>
				</div>

			{:else if currentStep === 2}
				<!-- Step 2: Custom Item Details -->
				<div class="step-content">
					<div class="dimensions-row">
						<div class="form-group">
							<label for="width">Width *</label>
							<input 
								type="number" 
								id="width" 
								bind:value={customItem.width}
								on:input={(e) => validateDimension(e.target.value, 'width')}
								min="1" 
								max="250" 
								required
							>
						</div>
						<div class="form-group">
							<label for="height">Height *</label>
							<input 
								type="number" 
								id="height" 
								bind:value={customItem.height}
								on:input={(e) => validateDimension(e.target.value, 'height')}
								min="1" 
								max="250" 
								required
							>
						</div>
					</div>

					<div class="form-group">
						<label for="material">Material (Optional)</label>
						<select id="material" bind:value={customItem.materialId}>
							<option value="">No Material</option>
							{#each materials as material}
								<option value={material.id}>{getLocalizedName(material)}</option>
							{/each}
						</select>
					</div>

					<div class="form-group">
						<label>Stages * (Select multiple)</label>
						<div class="stages-container">
							{#each stages as stage}
								<div class="stage-item">
									<label class="stage-label">
										<input 
											type="checkbox" 
											checked={customItem.selectedStages.some(s => s.id === stage.id)}
											on:change={() => toggleStage(stage)}
										>
										<div class="stage-info">
											<span class="stage-name">{getLocalizedName(stage)}</span>
											{#if stage.description}
												<span class="stage-description">{getLocalizedName({name: stage.description})}</span>
											{/if}
										</div>
									</label>
								</div>
							{/each}
						</div>
					</div>

					<div class="modal-actions">
						<button type="button" class="cancel-button" on:click={closeModal}>Cancel</button>
						<button type="button" class="confirm-button" on:click={handleConfirmCustomItem}>Confirm</button>
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>
{/if}

<style>
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(0, 0, 0, 0.6);
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 1000;
	}

	.modal-content {
		background: var(--bg-primary);
		padding: 2rem;
		border-radius: 12px;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
		width: 90%;
		max-width: 500px;
		max-height: 90vh;
		overflow-y: auto;
		position: relative;
		transform: translateY(-20px);
		opacity: 0;
		animation: slideIn 0.3s forwards ease-out;
	}

	@keyframes slideIn {
		to {
			transform: translateY(0);
			opacity: 1;
		}
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
		padding-bottom: 1rem;
		border-bottom: 1px solid var(--border-color);
	}

	.modal-header h2 {
		margin: 0;
		font-size: 1.75rem;
		color: var(--text-primary);
	}

	.close-button {
		background: none;
		border: none;
		font-size: 2rem;
		color: var(--text-secondary);
		cursor: pointer;
		transition: color 0.2s;
	}

	.close-button:hover {
		color: var(--text-primary);
	}

	.modal-body {
		padding-top: 1rem;
	}

	.form-group {
		margin-bottom: 1rem;
	}

	.form-group label {
		display: block;
		margin-bottom: 0.5rem;
		font-weight: 500;
		color: var(--text-primary);
	}

	.form-group input[type="number"],
	.form-group select {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid var(--border-color);
		border-radius: 8px;
		background: var(--bg-secondary);
		color: var(--text-primary);
		font-size: 1rem;
		transition: border-color 0.2s, box-shadow 0.2s;
	}

	.form-group input[type="number"]:focus,
	.form-group select:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	.error-message {
		background: #fef2f2;
		border: 1px solid #fecaca;
		color: #dc2626;
		padding: 0.75rem;
		border-radius: 8px;
		margin-bottom: 1rem;
		font-size: 0.875rem;
	}

	[data-theme="dark"] .error-message {
		background: rgba(220, 38, 38, 0.1);
		border-color: rgba(220, 38, 38, 0.3);
		color: #fca5a5;
	}

	.step-content {
		padding: 1rem 0;
	}

	.dimensions-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.stages-container {
		max-height: 200px;
		overflow-y: auto;
		border: 1px solid var(--border-color);
		border-radius: 8px;
		padding: 0.5rem;
		background: var(--bg-secondary);
	}

	.stage-item {
		margin-bottom: 0.5rem;
	}

	.stage-label {
		display: flex;
		align-items: flex-start;
		gap: 0.5rem;
		cursor: pointer;
		padding: 0.5rem;
		border-radius: 6px;
		transition: background-color 0.2s;
	}

	.stage-label:hover {
		background: var(--bg-primary);
	}

	.stage-info {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.stage-name {
		font-weight: 500;
		color: var(--text-primary);
	}

	.stage-description {
		font-size: 0.875rem;
		color: var(--text-secondary);
		line-height: 1.3;
	}

	.modal-actions {
		display: flex;
		justify-content: flex-end;
		gap: 1rem;
		margin-top: 1.5rem;
	}

	.cancel-button,
	.next-button,
	.skip-button,
	.confirm-button {
		padding: 0.75rem 1.5rem;
		border-radius: 8px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
		font-size: 1rem;
		border: none;
	}

	.cancel-button {
		background: transparent;
		color: var(--text-secondary);
		border: 1px solid var(--border-color);
	}

	.cancel-button:hover {
		background: var(--bg-secondary);
		color: var(--text-primary);
	}

	.next-button,
	.confirm-button {
		background: linear-gradient(135deg, #3b82f6, #2563eb);
		color: white;
		box-shadow: 0 2px 10px rgba(59, 130, 246, 0.3);
	}

	.next-button:hover:not(:disabled),
	.confirm-button:hover:not(:disabled) {
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
	}

	.skip-button {
		background: linear-gradient(135deg, #f59e0b, #d97706);
		color: white;
		box-shadow: 0 2px 10px rgba(245, 158, 11, 0.3);
	}

	.skip-button:hover {
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
	}

	.next-button:disabled,
	.confirm-button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		transform: none;
	}

	/* Dark theme adjustments */
	[data-theme="dark"] .modal-content {
		background: var(--bg-primary);
	}

	[dir="rtl"] .modal-actions {
		justify-content: flex-start;
	}

	/* Responsive Design */
	@media (max-width: 768px) {
		.dimensions-row {
			grid-template-columns: 1fr;
		}

		.modal-actions {
			flex-direction: column;
			gap: 0.75rem;
		}

		.cancel-button,
		.next-button,
		.skip-button,
		.confirm-button {
			width: 100%;
			justify-content: center;
		}

		.modal-content {
			width: 95%;
			margin: 1rem;
			max-height: 85vh;
		}

		.stages-container {
			max-height: 150px;
		}
	}
</style>
