<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/auth.js';
	import { languageStore, t } from '$lib/stores/language.js';
	import { themeStore } from '$lib/stores/theme.js';
	import { authService } from '$lib/services/auth.js';
	import { apiService } from '$lib/services/api.js';
	import { statesService } from '$lib/services/states.js';
	import { citiesService } from '$lib/services/cities.js';
	
	let formData = {
		address: {
			street1: '',
			street2: '',
			postalCode: '',
			apartment: '',
			complex: ''
		}
	};
	let isLoading = false;
	let error = '';
	
	// Address-related data
	let states = [];
	let cities = [];
	let selectedState = null;
	let selectedCity = null;
	
	// Reactive statements
	$: currentLang = $languageStore;
	$: currentTheme = $themeStore;
	$: isAuthenticated = $authStore.isAuthenticated;
	
	// Helper function to get localized name
	function getLocalizedName(item) {
		if (!item || !item.name) return '';
		if (typeof item.name === 'string') return item.name;
		
		// Use current language preference, fallback to English, then Arabic
		return item.name[currentLang] || item.name.en || item.name.ar || '';
	}
	
	onMount(async () => {
		// Check if user has access token (came from step 1)
		if (!apiService.getAuthToken()) {
			// No token found, redirect to step 1
			goto('/client/signup/step1');
			return;
		}
		
		// Load states
		try {
			const statesResponse = await statesService.getAllStates();
			states = statesResponse.results || statesResponse.states || statesResponse;
		} catch (err) {
			console.error('Failed to load states:', err);
		}
	});
	
	async function loadCitiesForState(stateId) {
		try {
			const citiesData = await citiesService.getCitiesByState(stateId);
			cities = Array.isArray(citiesData) ? citiesData : [];
		} catch (error) {
			console.error('Failed to load cities:', error);
			cities = [];
		}
	}

	// Handle state selection
	async function handleStateChange() {
		if (selectedState) {
			await loadCitiesForState(selectedState.id);
			selectedCity = null; // Reset city selection when state changes
		} else {
			cities = [];
			selectedCity = null;
		}
	}
	
	async function handleAddressStep() {
		// Address is optional, but if any field is filled, validate required fields
		const addressFields = formData.address;
		const hasAnyAddressField = addressFields.street1 || addressFields.street2 || 
			addressFields.postalCode || addressFields.apartment || addressFields.complex || 
			selectedState || selectedCity;
		
		if (hasAnyAddressField) {
			// Validation for required fields when address is provided
			if (!selectedState) {
				error = currentLang === 'ar' ? 'المحافظة مطلوبة عند تقديم معلومات العنوان' : 'State is required when providing address information';
				return;
			}
			if (!addressFields.street1?.trim()) {
				error = currentLang === 'ar' ? 'عنوان الشارع مطلوب عند تقديم معلومات العنوان' : 'Street address is required when providing address information';
				return;
			}
			if (!addressFields.postalCode?.trim()) {
				error = currentLang === 'ar' ? 'الرمز البريدي مطلوب عند تقديم معلومات العنوان' : 'Postal code is required when providing address information';
				return;
			}
		}
		
		isLoading = true;
		error = '';
		
		try {
			// If address information is provided, update the user profile
			if (hasAnyAddressField && selectedState) {
				const updateData = {
					address: {
						stateId: selectedState.id,
						state: selectedState,
						street1: addressFields.street1?.trim(),
						postalCode: addressFields.postalCode?.trim()
					}
				};
				
				// Add optional fields only if they have values
				if (selectedCity) {
					updateData.address.cityId = selectedCity.id;
					updateData.address.city = selectedCity;
				}
				if (addressFields.street2?.trim()) {
					updateData.address.street2 = addressFields.street2.trim();
				}
				if (addressFields.apartment?.trim()) {
					updateData.address.apartment = addressFields.apartment.trim();
				}
				if (addressFields.complex?.trim()) {
					updateData.address.complex = addressFields.complex.trim();
				}
				
				console.log('Updating address with data:', updateData);
				await authService.updateMe(updateData);
			}
			
			// Proceed to step 3 (final step)
			goto('/client/signup/step3');
			
		} catch (err) {
			error = err.message || (currentLang === 'ar' ? 'فشل في حفظ العنوان' : 'Failed to save address');
		} finally {
			isLoading = false;
		}
	}
	
	function handleKeyPress(event) {
		if (event.key === 'Enter') {
			handleAddressStep();
		}
	}
	
	function goBack() {
		goto('/client/signup/step1');
	}
	
	function skipStep() {
		// Skip address step and go directly to step 3
		goto('/client/signup/step3');
	}
</script>

<svelte:head>
	<title>{currentLang === 'ar' ? 'إنشاء حساب - الخطوة 2' : 'Sign Up - Step 2'} - Patriot Glass Factory</title>
</svelte:head>

<div class="auth-page" data-theme={currentTheme}>
	<div class="auth-background">
		<img src="/glass-factory-bg.jpg" alt="Glass Factory Background" />
		<div class="auth-overlay"></div>
	</div>
	
	<div class="auth-container">
		<div class="auth-card">
			<!-- Logo -->
			<div class="logo">
				<div class="logo-icon">
					<img src="/patriot-logo.jpg" alt="Patriot Glass Factory" class="logo-image" />
				</div>
			</div>
			
			<!-- Progress indicator -->
			<div class="progress-indicator">
				<div class="step completed">✓</div>
				<div class="step-line completed"></div>
				<div class="step active">2</div>
				<div class="step-line"></div>
				<div class="step">3</div>
			</div>
			
			<!-- Title -->
			<h1 class="page-title">
				{currentLang === 'ar' ? 'إنشاء حساب - الخطوة 2' : 'Create Account - Step 2'}
			</h1>
			<p class="page-subtitle">
				{currentLang === 'ar' ? 'أضف معلومات العنوان (اختياري)' : 'Add address information (optional)'}
			</p>
			
			<!-- Error Message -->
			{#if error}
				<div class="message message-error">
					{error}
				</div>
			{/if}
			
			<!-- Address Form -->
			<form class="form" on:submit|preventDefault={handleAddressStep}>
				<div class="address-section">
					<div class="form-grid">
						<!-- State Selection -->
						<div class="form-group">
							<label for="state" class="form-label">
								{currentLang === 'ar' ? 'المحافظة' : 'State'}
							</label>
							<select 
								id="state" 
								bind:value={selectedState} 
								on:change={handleStateChange}
								class="form-input"
								disabled={isLoading}
							>
								<option value={null}>{currentLang === 'ar' ? 'اختر المحافظة' : 'Select State'}</option>
								{#each states as state}
									<option value={state}>{getLocalizedName(state)}</option>
								{/each}
							</select>
						</div>
						
						<!-- City Selection -->
						<div class="form-group">
							<label for="city" class="form-label">
								{currentLang === 'ar' ? 'المدينة (اختياري)' : 'City (Optional)'}
							</label>
							<select 
								id="city" 
								bind:value={selectedCity}
								class="form-input"
								disabled={isLoading || !selectedState}
							>
								<option value={null}>{currentLang === 'ar' ? 'اختر المدينة' : 'Select City'}</option>
								{#each cities as city}
									<option value={city}>{getLocalizedName(city)}</option>
								{/each}
							</select>
						</div>
						
						<!-- Street 1 -->
						<div class="form-group">
							<label for="street1" class="form-label">
								{currentLang === 'ar' ? 'عنوان الشارع' : 'Street Address'}
							</label>
							<input
								type="text"
								id="street1"
								bind:value={formData.address.street1}
								class="form-input"
								placeholder={currentLang === 'ar' ? 'شارع الملك فيصل 123' : '123 Main Street'}
								disabled={isLoading}
								on:keypress={handleKeyPress}
							/>
						</div>
						
						<!-- Street 2 -->
						<div class="form-group">
							<label for="street2" class="form-label">
								{currentLang === 'ar' ? 'عنوان الشارع 2 (اختياري)' : 'Street Address 2 (Optional)'}
							</label>
							<input
								type="text"
								id="street2"
								bind:value={formData.address.street2}
								class="form-input"
								placeholder={currentLang === 'ar' ? 'شقة، جناح، وحدة، إلخ' : 'Apt, Suite, Unit, etc.'}
								disabled={isLoading}
								on:keypress={handleKeyPress}
							/>
						</div>
						
						<!-- Postal Code -->
						<div class="form-group">
							<label for="postalCode" class="form-label">
								{currentLang === 'ar' ? 'الرمز البريدي' : 'Postal Code'}
							</label>
							<input
								type="text"
								id="postalCode"
								bind:value={formData.address.postalCode}
								class="form-input"
								placeholder={currentLang === 'ar' ? '12345' : '12345'}
								disabled={isLoading}
								on:keypress={handleKeyPress}
							/>
						</div>
						
						<!-- Apartment -->
						<div class="form-group">
							<label for="apartment" class="form-label">
								{currentLang === 'ar' ? 'الشقة (اختياري)' : 'Apartment (Optional)'}
							</label>
							<input
								type="text"
								id="apartment"
								bind:value={formData.address.apartment}
								class="form-input"
								placeholder={currentLang === 'ar' ? 'شقة 123' : 'Apt 123'}
								disabled={isLoading}
								on:keypress={handleKeyPress}
							/>
						</div>
						
						<!-- Complex -->
						<div class="form-group">
							<label for="complex" class="form-label">
								{currentLang === 'ar' ? 'المجمع (اختياري)' : 'Complex (Optional)'}
							</label>
							<input
								type="text"
								id="complex"
								bind:value={formData.address.complex}
								class="form-input"
								placeholder={currentLang === 'ar' ? 'اسم المبنى أو المجمع' : 'Building or Complex Name'}
								disabled={isLoading}
								on:keypress={handleKeyPress}
							/>
						</div>
					</div>
				</div>

				<div class="form-actions">
					<button
						type="button"
						class="btn btn-secondary"
						style="flex: 1;"
						on:click={goBack}
						disabled={isLoading}
					>
						{currentLang === 'ar' ? 'السابق' : 'Back'}
					</button>
					
					<button
						type="button"
						class="btn btn-outline"
						style="flex: 1;"
						on:click={skipStep}
						disabled={isLoading}
					>
						{currentLang === 'ar' ? 'تخطي' : 'Skip'}
					</button>
					
					<button
						type="submit"
						class="btn btn-primary btn-lg"
						style="flex: 2;"
						disabled={isLoading}
					>
						{#if isLoading}
							<span class="loading-spinner"></span>
						{/if}
						{isLoading 
							? (currentLang === 'ar' ? 'جاري الحفظ...' : 'Saving...') 
							: (currentLang === 'ar' ? 'التالي' : 'Next')
						}
					</button>
				</div>
			</form>
		</div>
	</div>
</div>

<style>
	.address-section {
		width: 100%;
	}
	
	.form-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 1rem;
	}
	
	@media (min-width: 768px) {
		.form-grid {
			grid-template-columns: 1fr 1fr;
		}
	}
	
	.form-actions {
		display: flex;
		gap: 0.75rem;
		margin-top: 1.5rem;
	}
	
	.btn-outline {
		background: transparent;
		border: 1px solid var(--primary-color);
		color: var(--primary-color);
	}
	
	.btn-outline:hover {
		background: var(--primary-color);
		color: white;
	}
</style>