<script>
	import { createEventDispatcher, onMount } from 'svelte';
	import { productsService } from '$lib/services/products.js';
	import { categoriesService } from '$lib/services/categories.js';
	import { materialsService } from '$lib/services/materials.js';
	import { t } from '$lib/stores/language.js';

	export let showModal = false;

	const dispatch = createEventDispatcher();

	let item = {
		width: null,
		height: null,
		productId: null,
		materialId: null,
		currentStage: { id: 'initial', name: 'Initial Stage' }, // Placeholder
		currentStageId: 'initial' // Placeholder
	};

	let categories = [];
	let products = [];
	let materials = [];
	let materialTypes = []; // Assuming material types are part of material data or a separate endpoint

	let selectedCategory = null;
	let selectedMaterialType = null;

	let isLoading = false;
	let error = '';

	onMount(async () => {
		isLoading = true;
		error = '';
		try {
			categories = await categoriesService.getAllCategories();
			materials = await materialsService.getAllMaterials();
			// Assuming material types can be extracted from materials or fetched separately
			materialTypes = [...new Set(materials.map(m => m.type))]; // Example: if materials have a 'type' property
		} catch (err) {
			error = t('Failed to load data: ' + err.message);
		} finally {
			isLoading = false;
		}
	});

	// Reactive statement to filter products by selected category
	$: if (selectedCategory) {
		// Assuming getProductsByCategory exists and filters on the backend
		// If not, you'd fetch all products and filter client-side: products.filter(p => p.categoryId === selectedCategory.id)
		productsService.getProductsByCategory(selectedCategory.id)
			.then(data => products = data)
			.catch(err => error = t('Failed to load products: ' + err.message));
	} else {
		products = [];
	}

	// Reactive statement to filter materials by selected type
	$: filteredMaterials = selectedMaterialType 
		? materials.filter(m => m.type === selectedMaterialType) 
		: materials;

	function handleAddItem() {
		// Basic validation
		if (!item.width || !item.height || !item.productId || !item.materialId) {
			error = t('Please fill all required fields.');
			return;
		}

		dispatch('addItem', item);
		closeModal();
	}

	function closeModal() {
		showModal = false;
		error = '';
		// Reset form fields
		item = {
			width: null,
			height: null,
			productId: null,
			materialId: null,
			currentStage: { id: 'initial', name: 'Initial Stage' },
			currentStageId: 'initial'
		};
		selectedCategory = null;
		selectedMaterialType = null;
		dispatch('close');
	}
</script>

{#if showModal}
<div class="modal-overlay" on:click|self={closeModal}>
	<div class="modal-content" on:click|stopPropagation>
		<div class="modal-header">
			<h2>{t('addItem')}</h2>
			<button class="close-button" on:click={closeModal}>&times;</button>
		</div>
		<div class="modal-body">
			{#if isLoading}
				<p>{t('loadingData')}...</p>
			{:else if error}
				<div class="error-message">{error}</div>
			{:else}
				<form on:submit|preventDefault={handleAddItem}>
					<div class="form-group">
						<label for="width">{t('width')} *</label>
						<input type="number" id="width" bind:value={item.width} required min="1">
					</div>
					<div class="form-group">
						<label for="height">{t('height')} *</label>
						<input type="number" id="height" bind:value={item.height} required min="1">
					</div>

					<div class="form-group">
						<label for="materialType">{t('materialType')} *</label>
						<select id="materialType" bind:value={selectedMaterialType} required>
							<option value="">{t('selectMaterialType')}</option>
							{#each materialTypes as type}
								<option value={type}>{type}</option>
							{/each}
						</select>
					</div>

					<div class="form-group">
						<label for="material">{t('material')} *</label>
						<select id="material" bind:value={item.materialId} required disabled={!selectedMaterialType}>
							<option value="">{t('selectMaterial')}</option>
							{#each filteredMaterials as material}
								<option value={material.id}>
									{material.name.en || material.name}
								</option>
							{/each}
						</select>
					</div>

					<div class="form-group">
						<label for="category">{t('category')} *</label>
						<select id="category" bind:value={selectedCategory} required>
							<option value="">{t('selectCategory')}</option>
							{#each categories as category}
								<option value={category}>{category.name.en || category.name}</option>
							{/each}
						</select>
					</div>

					<div class="form-group">
						<label for="product">{t('product')} *</label>
						<select id="product" bind:value={item.productId} required disabled={!selectedCategory}>
							<option value="">{t('selectProduct')}</option>
							{#each products as product}
								<option value={product.id}>{product.name.en || product.name}</option>
							{/each}
						</select>
					</div>

					<div class="modal-actions">
						<button type="button" class="cancel-button" on:click={closeModal}>{t('cancel')}</button>
						<button type="submit" class="add-button">{t('add')}</button>
					</div>
				</form>
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

	.modal-actions {
		display: flex;
		justify-content: flex-end;
		gap: 1rem;
		margin-top: 1.5rem;
	}

	.cancel-button,
	.add-button {
		padding: 0.75rem 1.5rem;
		border-radius: 8px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
		font-size: 1rem;
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

	.add-button {
		background: linear-gradient(135deg, #3b82f6, #2563eb);
		color: white;
		border: none;
		box-shadow: 0 2px 10px rgba(59, 130, 246, 0.3);
	}

	.add-button:hover {
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
	}

	/* Dark theme adjustments */
	[data-theme="dark"] .modal-content {
		background: var(--bg-primary);
	}

	[dir="rtl"] .modal-actions {
		justify-content: flex-start;
	}
</style>
