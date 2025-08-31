<script>
	import { createEventDispatcher, onMount } from 'svelte';
	import { productsService } from '$lib/services/products.js';
	import { categoriesService } from '$lib/services/categories.js';
	import { materialsService } from '$lib/services/materials.js';
	import { stagesService } from '$lib/services/stages.js';
	import { imageUploadService } from '$lib/services/imageUpload.js';
	import { authService } from '$lib/services/auth.js';
	import { t, languageStore } from '$lib/stores/language.js';

	export let showModal = false;

	const dispatch = createEventDispatcher();

	// Modal states
	let currentStep = 1; // 1 = category/product selection, 2 = product dimensions, 3 = painting choosing (special product), 4 = custom item details
	
	// Data arrays
	let categories = [];
	let products = [];
	let materials = [];
	let stages = [];
	let stagePatterns = [];

	// Form data
	let selectedCategory = null;
	let selectedProduct = null;
	let productDimensions = {
		width: 1,
		height: 1
	};
	let productAdditionalStages = []; // For special product stage selection
	let selectedMaterialId = null; // For special product material selection
	let itemNote = ''; // Optional note for the order item
	let customItem = {
		width: 1,
		height: 1,
		materialId: null,
		selectedStages: []
	};

	// Painting choosing logic for special product
	let useCustomPattern = false; // Checkbox state
	let selectedStagePattern = null; // Selected pattern from cards
	let uploadedPatternImage = null; // Uploaded image file
	let uploadedPatternImageUrl = ''; // Final uploaded image URL
	let isUploadingImage = false;
	let hasPaintingData = false; // Track if user has completed painting step

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
			
			// Debug logging
			console.log('Materials response:', materialsResponse);
			console.log('Extracted materials:', materials);
			console.log('Materials length:', materials?.length);
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
				products = allProductsResponse.products || allProductsResponse.results || allProductsResponse || [];
			} else if (selectedCategory === 'no-category') {
				// Load products with null category - use special parameter for no category
				const productsResponse = await productsService.getProductsByCategory('no-category');
				products = productsResponse.products || productsResponse.results || [];
			} else {
				// Use category ID for filtering
				const categoryId = selectedCategory.id;
				if (categoryId) {
					const productsResponse = await productsService.getProductsByCategory(categoryId);
					products = productsResponse.products || productsResponse.results || [];
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
		} else if (numValue > 350) {
			numValue = 350;
		}
		customItem[field] = numValue;
	}

	// Validate and constrain product dimensions
	function validateProductDimension(value, field) {
		let numValue = parseInt(value);
		if (isNaN(numValue) || numValue < 1) {
			numValue = 1;
		} else if (numValue > 250) {
			numValue = 250;
		}
		productDimensions[field] = numValue;
	}

	// Initialize product dimensions when a product is selected
	$: if (selectedProduct) {
		productDimensions.width = selectedProduct.width || 1;
		productDimensions.height = selectedProduct.height || 1;
		// Reset additional stages when product changes
		productAdditionalStages = [];
	}

	// Check if current product is the special product that needs stage selection
	$: isSpecialProduct = selectedProduct?.id === "f505f98a-c68f-48ae-a49a-72bc66986745";
	
	// Check if the product has the special painting stages (either in product's default stages or user-selected additional stages)
	$: hasSpecialPaintingStage = (() => {
		const paintingStageIds = ["7c07ca35-9441-42fc-b416-810568d69ca3", "f6dad32d-d844-4120-8e29-779b19cab163"];
		
		// Check if any painting stage is in the product's default stages
		const productHasPaintingStage = selectedProduct?.stages?.some(stage => 
			paintingStageIds.includes(stage.id)
		) || false;
		
		// Check if any painting stage is in user-selected additional stages
		const userSelectedPaintingStage = productAdditionalStages.some(stage => 
			paintingStageIds.includes(stage.id)
		);
		
		return productHasPaintingStage || userSelectedPaintingStage;
	})();
	
	// Show painting step if the product has any of the special painting stages
	$: showPaintingStep = hasSpecialPaintingStage;

	// Get available stages for the special product (exclude stages the product already has)
	$: availableStagesForProduct = isSpecialProduct 
		? stages.filter(stage => {
			// If product has no stages array or it's empty, all stages are available
			if (!selectedProduct?.stages || !Array.isArray(selectedProduct.stages) || selectedProduct.stages.length === 0) {
				return true;
			}
			// Otherwise, exclude stages that the product already has
			return !selectedProduct.stages.some(productStage => productStage.id === stage.id);
		})
		: [];

	function handleNextStep() {
		if (!selectedProduct) {
			error = 'Please select a product.';
			return;
		}

		// Go to product dimensions step
		currentStep = 2;
		error = '';
	}

	async function handleNextStepFromDimensions() {
		// If this is the special product AND the painting stage is selected, go to painting choosing step
		if (showPaintingStep) {
			currentStep = 3;
			// Load stage patterns if not already loaded
			if (stagePatterns.length === 0) {
				await loadStagePatterns();
			}
		} else {
			// For regular products or special product without painting stage, complete the order
			handleConfirmProduct();
		}
		error = '';
	}

	async function loadStagePatterns() {
		try {
			isLoading = true;
			const patternsResponse = await stagesService.getStagePatterns();
			console.log('Stage patterns response:', patternsResponse);
			
			// Handle different response structures
			let allPatterns = [];
			if (patternsResponse.results && Array.isArray(patternsResponse.results)) {
				allPatterns = patternsResponse.results;
			} else if (patternsResponse.patterns && Array.isArray(patternsResponse.patterns)) {
				allPatterns = patternsResponse.patterns;
			} else if (Array.isArray(patternsResponse)) {
				allPatterns = patternsResponse;
			}
			
			// Filter patterns to show only those connected to painting stages that the product has
			const paintingStageIds = ["7c07ca35-9441-42fc-b416-810568d69ca3", "f6dad32d-d844-4120-8e29-779b19cab163"];
			
			// Get the painting stage IDs that this product actually has (either default or user-selected)
			const productPaintingStageIds = [];
			
			// Check product's default stages
			if (selectedProduct?.stages) {
				selectedProduct.stages.forEach(stage => {
					if (paintingStageIds.includes(stage.id)) {
						productPaintingStageIds.push(stage.id);
					}
				});
			}
			
			// Check user-selected additional stages
			productAdditionalStages.forEach(stage => {
				if (paintingStageIds.includes(stage.id)) {
					productPaintingStageIds.push(stage.id);
				}
			});
			
			// Remove duplicates
			const uniqueProductPaintingStageIds = [...new Set(productPaintingStageIds)];
			
			// Filter stage patterns to show only those connected to the product's painting stages
			console.log('=== STAGE PATTERN FILTERING DEBUG ===');
			console.log('All patterns loaded:', allPatterns);
			console.log('All patterns count:', allPatterns.length);
			console.log('Product painting stage IDs:', uniqueProductPaintingStageIds);
			
			// Debug each pattern
			allPatterns.forEach((pattern, index) => {
				console.log(`Pattern ${index}:`, {
					id: pattern.id,
					title: pattern.title,
					stageId: pattern.stage?.id,
					stageName: pattern.stage?.name,
					matchesFilter: pattern.stage && uniqueProductPaintingStageIds.includes(pattern.stage.id)
				});
			});
			
			stagePatterns = allPatterns.filter(pattern => {
				const hasStage = pattern.stage && uniqueProductPaintingStageIds.includes(pattern.stage.id);
				console.log(`Pattern ${pattern.id} - has matching stage: ${hasStage}`);
				return hasStage;
			});
			
			console.log('Filtered stage patterns:', stagePatterns);
			console.log('Filtered patterns count:', stagePatterns.length);
			console.log('=== END STAGE PATTERN FILTERING DEBUG ===');
		} catch (err) {
			error = 'Failed to load stage patterns: ' + err.message;
			console.error('Stage patterns error:', err);
		} finally {
			isLoading = false;
		}
	}

	function handleConfirmProduct() {
		// Add product with modified dimensions to order
		const productItem = {
			width: Number(productDimensions.width)+2,
			height: Number(productDimensions.height)+2,
			productId: selectedProduct.id,
			stageIds: []
		};

		// Add optional category if selected (and not 'no-category')
		if (selectedCategory && selectedCategory !== 'no-category') {
			productItem.categoryId = selectedCategory.id;
		}

		// Add note if provided
		if (itemNote.trim()) {
			productItem.note = itemNote.trim();
		}

		// For special product, combine product's existing stages with user-selected additional stages
		if (isSpecialProduct) {
			const productStageIds = [];
			
			// Add product's existing/default stages
			if (selectedProduct.stages && Array.isArray(selectedProduct.stages)) {
				productStageIds.push(...selectedProduct.stages.map(stage => stage.id));
			}
			
			// Add user-selected additional stages
			if (productAdditionalStages.length > 0) {
				productStageIds.push(...productAdditionalStages.map(stage => stage.id));
			}
			
			// Remove duplicates and assign to productItem
			productItem.stageIds = [...new Set(productStageIds)];
		}

		// Add material for special product if selected
		if (isSpecialProduct && selectedMaterialId) {
			productItem.materialId = selectedMaterialId;
		}

		// Add painting data if user completed painting step
		if (hasPaintingData) {
			// Handle stage pattern data
			if (selectedStagePattern) {
				// Ensure stagePatternId is a string
				const stagePatternId = String(selectedStagePattern.id);
				productItem.stagePatternId = stagePatternId;
				//productItem.patternImageUrl = selectedStagePattern.imageUrl;
				console.log('Adding selected stage pattern:', {
					stagePatternId: stagePatternId,
					stagePatternIdType: typeof stagePatternId,
					patternImageUrl: selectedStagePattern.imageUrl,
					originalSelectedStagePattern: selectedStagePattern
				});
			} else if (uploadedPatternImageUrl) {
				// Use uploaded custom pattern if no stage pattern selected
				productItem.stagePatternId = null;
				productItem.patternImageUrl = uploadedPatternImageUrl;
				console.log('Adding uploaded pattern:', uploadedPatternImageUrl);
			} else {
				// No pattern selected
				productItem.stagePatternId = null;
				productItem.patternImageUrl = null;
				console.warn('No stage pattern or uploaded pattern selected');
			}
		}

		console.log('Sending product item to server:', productItem);
		console.log('Product default stages:', selectedProduct.stages?.map(s => s.id) || []);
		console.log('User selected additional stages:', productAdditionalStages.map(s => s.id));
		console.log('Combined productItem stages:', productItem.stageIds);
		dispatch('addItem', productItem);
		resetModalAfterSuccess();
	}

	async function handleImageUpload(event) {
		const file = event.target.files[0];
		if (!file) return;

		try {
			// Validate the image file
			imageUploadService.validateImageFile(file);
			
			isUploadingImage = true;
			error = '';
			
			// Get current user info
			const currentUser = await authService.getMe();
			if (!currentUser?.id) {
				throw new Error('User not authenticated');
			}
			
			// Upload the image
			uploadedPatternImageUrl = await imageUploadService.uploadImage(file, currentUser.id);
			uploadedPatternImage = file;
			
			// Clear selected pattern since we're using custom image
			selectedStagePattern = null;
			
		} catch (err) {
			error = 'Image upload failed: ' + err.message;
			uploadedPatternImageUrl = '';
			uploadedPatternImage = null;
		} finally {
			isUploadingImage = false;
		}
	}

	function selectStagePattern(pattern) {
		console.log('Selecting stage pattern:', pattern);
		selectedStagePattern = pattern;
		console.log('selectedStagePattern is now:', selectedStagePattern);
		// Clear uploaded image since we're using a pattern
		uploadedPatternImageUrl = '';
		uploadedPatternImage = null;
	}

	function handleConfirmPainting() {
		// Validate that either a pattern is selected or an image is uploaded
		if (!selectedStagePattern && !uploadedPatternImageUrl) {
			error = 'Please select a stage pattern or upload a custom image.';
			return;
		}

		// Mark that user has completed painting step
		hasPaintingData = true;
		
		// Complete the order
		handleConfirmProduct();
	}

	function toggleProductStage(stage) {
		const index = productAdditionalStages.findIndex(s => s.id === stage.id);
		if (index > -1) {
			productAdditionalStages = productAdditionalStages.filter(s => s.id !== stage.id);
		} else {
			productAdditionalStages = [...productAdditionalStages, stage];
		}
	}


	function handleConfirmCustomItem() {
		// Validation - only stages are required
		if (customItem.selectedStages.length === 0) {
			error = 'Please select at least one stage.';
			return;
		}

		// Add custom item to order
		const newCustomItem = {
			width: customItem.width+2,
			height: customItem.height+2,
			stageIds: customItem.selectedStages.map(stage => stage.id)
		};

		// Add optional material if selected
		if (customItem.materialId) {
			newCustomItem.materialId = customItem.materialId;
		}

		// Add note if provided
		if (itemNote.trim()) {
			newCustomItem.note = itemNote.trim();
		}

		console.log('Sending custom item to server:', newCustomItem);
		dispatch('addItem', newCustomItem);
		resetModalAfterSuccess();
	}

	function closeModal() {
		showModal = false;
		currentStep = 1;
		error = '';
		
		// Reset form data
		selectedCategory = null;
		selectedProduct = null;
		products = [];
		productDimensions = {
			width: 1,
			height: 1
		};
		productAdditionalStages = [];
		selectedMaterialId = null;
		itemNote = '';
		customItem = {
			width: 1,
			height: 1,
			materialId: null,
			selectedStages: []
		};

		// Reset painting choosing data
		useCustomPattern = false;
		selectedStagePattern = null;
		uploadedPatternImage = null;
		uploadedPatternImageUrl = '';
		isUploadingImage = false;
		hasPaintingData = false;
		stagePatterns = [];
		
		dispatch('close');
	}
	
	function resetModalAfterSuccess() {
		// This function is called after successfully adding an item
		// It's separate from closeModal to ensure data isn't cleared prematurely
		console.log('Resetting modal after successful item addition');
		closeModal();
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
				{:else if currentStep === 2}
					Add Item - Product Dimensions
				{:else if currentStep === 3}
					Add Item - Choose Painting
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
						{#if selectedProduct}
							<div class="selected-product-display">
								<strong>Selected:</strong> {getLocalizedName(selectedProduct)}
								{#if selectedProduct.description}
									<br><small>{selectedProduct.description}</small>
								{/if}
							</div>
						{/if}
					</div>

					<div class="modal-actions">
						<button type="button" class="cancel-button" on:click={closeModal}>Cancel</button>
						<button type="button" class="next-button" on:click={handleNextStep} disabled={!selectedProduct}>Next Step</button>
					</div>
				</div>

			{:else if currentStep === 2}
				<!-- Step 2: Product Dimensions -->
				<div class="step-content">
					{#if selectedProduct}
						<div class="product-info">
							<h3>Selected Product: {getLocalizedName(selectedProduct)}</h3>
							<p>Original dimensions: {selectedProduct.width || 1} × {selectedProduct.height || 1}</p>
						</div>
					{/if}

					<div class="dimensions-row">
						<div class="form-group">
							<label for="product-width">Width *</label>
							<input 
								type="number" 
								id="product-width" 
								bind:value={productDimensions.width}
								on:input={(e) => validateProductDimension(e.target.value, 'width')}
								min="1" 
								max="350" 
								required
							>
						</div>
						<div class="form-group">
							<label for="product-height">Height *</label>
							<input 
								type="number" 
								id="product-height" 
								bind:value={productDimensions.height}
								on:input={(e) => validateProductDimension(e.target.value, 'height')}
								min="1" 
								max="350" 
								required
							>
						</div>
					</div>

					{#if isSpecialProduct}
						<div class="form-group">
							<label>Additional Stages (Optional)</label>
							<p class="stage-info-text">Select additional stages for this product. Default stages cannot be removed.</p>
							{#if availableStagesForProduct.length > 0}
								<div class="stages-container">
									{#each availableStagesForProduct as stage}
										<div class="stage-item">
											<label class="stage-label">
												<input 
													type="checkbox" 
													checked={productAdditionalStages.some(s => s.id === stage.id)}
													on:change={() => toggleProductStage(stage)}
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
							{:else}
								<p class="no-stages-text">No additional stages available for this product.</p>
							{/if}
						</div>

						<div class="form-group">
							<label for="material">Material (Optional)</label>
							<select id="material" bind:value={selectedMaterialId}>
								<option value="">No Material</option>
								{#each materials as material}
									<option value={material.id}>
										{getLocalizedName(material)}
										{#if material.description && getLocalizedName({name: material.description})}
											- {getLocalizedName({name: material.description})}
										{/if}
									</option>
								{/each}
							</select>
							<!-- Debug info -->
							{#if materials.length === 0}
								<p style="color: red; font-size: 0.8rem;">Debug: No materials loaded (length: {materials.length})</p>
							{:else}
								<p style="color: green; font-size: 0.8rem;">Debug: {materials.length} materials loaded</p>
							{/if}
						</div>
					{/if}

					<div class="form-group">
						<label for="item-note">Note (Optional)</label>
						<textarea 
							id="item-note" 
							bind:value={itemNote}
							placeholder="Add any additional notes for this item..."
							rows="3"
						></textarea>
					</div>

					<div class="modal-actions">
						<button type="button" class="cancel-button" on:click={closeModal}>Cancel</button>
						<button type="button" class="back-button" on:click={() => currentStep = 1}>Back</button>
						{#if showPaintingStep}
							<button type="button" class="next-button" on:click={handleNextStepFromDimensions}>Next Step</button>
						{:else}
							<button type="button" class="confirm-button" on:click={handleConfirmProduct}>Add to Order</button>
						{/if}
					</div>
				</div>

			{:else if currentStep === 3}
				<!-- Step 3: Painting Choosing (Special Product Only) -->
				<div class="step-content">
					<div class="product-info">
						<h3>Choose Painting Pattern</h3>
						<p>Select a predefined pattern or upload your own custom image.</p>
					</div>

					<div class="form-group">
						<label class="checkbox-label">
							<input 
								type="checkbox" 
								bind:checked={useCustomPattern}
								on:change={() => {
									// Reset selections when toggling
									console.log('Toggling custom pattern, clearing selections');
									selectedStagePattern = null;
									uploadedPatternImageUrl = '';
									uploadedPatternImage = null;
								}}
							>
							Use custom pattern (upload image)
						</label>
						<div class="debug-info">
							<small>Debug: selectedStagePattern = {selectedStagePattern ? selectedStagePattern.id : 'null'}</small>
						</div>
					</div>

					{#if !useCustomPattern}
						<!-- Show stage patterns as cards -->
						<div class="form-group">
							<label>Select a Pattern</label>
							{#if isLoading}
								<p>Loading patterns...</p>
							{:else if stagePatterns.length > 0}
								<div class="patterns-container">
									{#each stagePatterns as pattern}
										<div 
											class="pattern-card {selectedStagePattern?.id === pattern.id ? 'selected' : ''}"
											on:click={() => selectStagePattern(pattern)}
											on:keydown={(e) => e.key === 'Enter' && selectStagePattern(pattern)}
											role="button"
											tabindex="0"
										>
											{#if pattern.imageUrl}
												<img src={pattern.imageUrl} alt={getLocalizedName({name: pattern.title}) || pattern.title?.en || pattern.title?.ar || 'Pattern'} />
											{/if}
											<div class="pattern-title">{getLocalizedName({name: pattern.title}) || pattern.title?.en || pattern.title?.ar || 'Untitled Pattern'}</div>
											<div class="pattern-debug">ID: {pattern.id}</div>
										</div>
									{/each}
								</div>
							{:else}
								<p class="no-patterns-text">No patterns available.</p>
							{/if}
						</div>
					{:else}
						<!-- Show image upload field -->
						<div class="form-group">
							<label for="pattern-image">Upload Custom Pattern Image</label>
							<input 
								type="file" 
								id="pattern-image"
								accept="image/*"
								on:change={handleImageUpload}
								disabled={isUploadingImage}
							>
							{#if isUploadingImage}
								<p class="upload-status">Uploading image...</p>
							{:else if uploadedPatternImageUrl}
								<div class="uploaded-image-preview">
									<img src={uploadedPatternImageUrl} alt="Uploaded pattern" />
									<p class="upload-success">Image uploaded successfully!</p>
								</div>
							{/if}
						</div>
					{/if}

					<div class="modal-actions">
						<button type="button" class="cancel-button" on:click={closeModal}>Cancel</button>
						<button type="button" class="back-button" on:click={() => currentStep = 2}>Back</button>
						<button type="button" class="confirm-button" on:click={handleConfirmPainting}>Confirm</button>
					</div>
				</div>

			{:else if currentStep === 4}
				<!-- Step 4: Custom Item Details -->
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

					<div class="form-group">
						<label for="custom-item-note">Note (Optional)</label>
						<textarea 
							id="custom-item-note" 
							bind:value={itemNote}
							placeholder="Add any additional notes for this item..."
							rows="3"
						></textarea>
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

	.product-info {
		background: var(--bg-secondary);
		padding: 1rem;
		border-radius: 8px;
		margin-bottom: 1.5rem;
		border: 1px solid var(--border-color);
	}

	.product-info h3 {
		margin: 0 0 0.5rem 0;
		color: var(--text-primary);
		font-size: 1.1rem;
	}

	.product-info p {
		margin: 0;
		color: var(--text-secondary);
		font-size: 0.9rem;
	}

	.cancel-button,
	.next-button,
	.skip-button,
	.confirm-button,
	.back-button {
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

		.back-button {
			width: 100%;
			justify-content: center;
		}
	}

	.back-button {
		background: var(--bg-secondary);
		color: var(--text-primary);
		border: 1px solid var(--border-color);
	}

	.back-button:hover {
		background: var(--bg-tertiary);
		border-color: var(--border-hover);
	}

	.stage-info-text {
		font-size: 0.875rem;
		color: var(--text-secondary);
		margin: 0.5rem 0 1rem 0;
		font-style: italic;
	}

	.no-stages-text {
		font-size: 0.875rem;
		color: var(--text-secondary);
		margin: 0.5rem 0;
		text-align: center;
		font-style: italic;
	}

	textarea {
		width: 100%;
		padding: 0.75rem;
		border: 2px solid var(--border-color);
		border-radius: 8px;
		font-size: 1rem;
		font-family: inherit;
		background: var(--bg-primary);
		color: var(--text-primary);
		transition: border-color 0.3s ease;
		resize: vertical;
		min-height: 80px;
	}

	textarea:focus {
		outline: none;
		border-color: var(--primary-color);
	}

	textarea::placeholder {
		color: var(--text-secondary);
		opacity: 0.7;
	}

	/* Painting choosing styles */
	.checkbox-label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
		font-weight: 500;
		color: var(--text-primary);
		margin-bottom: 1rem;
	}

	.checkbox-label input[type="checkbox"] {
		width: auto;
		margin: 0;
	}

	.patterns-container {
		display: flex;
		gap: 1rem;
		overflow-x: auto;
		padding: 1rem 0;
		border: 1px solid var(--border-color);
		border-radius: 8px;
		background: var(--bg-secondary);
		max-height: 300px;
	}

	.pattern-card {
		flex: 0 0 auto;
		width: 150px;
		border: 2px solid var(--border-color);
		border-radius: 8px;
		padding: 0.5rem;
		cursor: pointer;
		transition: all 0.2s ease;
		background: var(--bg-primary);
	}

	.pattern-card:hover {
		border-color: var(--primary-color);
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	.pattern-card.selected {
		border-color: #3b82f6;
		background: rgba(59, 130, 246, 0.1);
	}

	.pattern-card img {
		width: 100%;
		height: 100px;
		object-fit: cover;
		border-radius: 4px;
		margin-bottom: 0.5rem;
	}

	.pattern-title {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--text-primary);
		text-align: center;
		line-height: 1.2;
	}

	.no-patterns-text {
		text-align: center;
		color: var(--text-secondary);
		font-style: italic;
		padding: 2rem;
	}

	.upload-status {
		color: var(--primary-color);
		font-size: 0.875rem;
		margin-top: 0.5rem;
		font-style: italic;
	}

	.uploaded-image-preview {
		margin-top: 1rem;
		border: 1px solid var(--border-color);
		border-radius: 8px;
		padding: 1rem;
		background: var(--bg-secondary);
	}

	.uploaded-image-preview img {
		width: 100%;
		max-width: 200px;
		height: auto;
		border-radius: 4px;
		margin-bottom: 0.5rem;
	}

	.upload-success {
		color: #10b981;
		font-size: 0.875rem;
		margin: 0;
		font-weight: 500;
	}

	input[type="file"] {
		width: 100%;
		padding: 0.75rem;
		border: 2px dashed var(--border-color);
		border-radius: 8px;
		background: var(--bg-secondary);
		color: var(--text-primary);
		font-size: 1rem;
		cursor: pointer;
		transition: border-color 0.2s;
	}

	input[type="file"]:hover {
		border-color: var(--primary-color);
	}

	input[type="file"]:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.selected-product-display {
		margin-top: 0.5rem;
		padding: 0.75rem;
		background: var(--bg-secondary);
		border: 1px solid var(--border-color);
		border-radius: 6px;
		color: var(--text-primary);
		font-size: 0.875rem;
	}

	.selected-product-display strong {
		color: #3b82f6;
	}

	.selected-product-display small {
		color: var(--text-secondary);
		font-style: italic;
	}

	.pattern-debug {
		font-size: 0.75rem;
		color: #666;
		margin-top: 0.25rem;
		font-family: monospace;
	}

	.debug-info {
		margin-top: 0.5rem;
		padding: 0.5rem;
		background: #f0f0f0;
		border-radius: 4px;
		font-family: monospace;
	}

	.debug-info small {
		color: #666;
	}
</style>
