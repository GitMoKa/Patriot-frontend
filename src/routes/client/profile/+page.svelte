<script>
	import { onMount } from 'svelte';
	import { authService } from '$lib/services/auth.js';
	import { authStore } from '$lib/stores/auth.js';
	import { statesService } from '$lib/services/states.js';
	import { citiesService } from '$lib/services/cities.js';
	import { imageUploadService } from '$lib/services/imageUpload.js';
	import { languageStore } from '$lib/stores/language.js';
	
	let isEditing = false;
	let isLoading = false;
	let profileData = {
		id: '',
		name: '',
		email: '',
		phoneNumber: '',
		photoUrl: null,
		address: null
	};
	
	let editData = { ...profileData };
	let photoPreview = null;
	let errors = {};
	
	// Address-related data
	let states = [];
	let cities = [];
	let selectedState = null;
	let selectedCity = null;
	
	// Get current language
	$: currentLang = $languageStore;
	
	// Helper function to get localized name
	function getLocalizedName(item) {
		if (!item || !item.name) return '';
		if (typeof item.name === 'string') return item.name;
		
		// Use current language preference, fallback to English, then Arabic
		return item.name[currentLang] || item.name.en || item.name.ar || '';
	}
	
	async function loadProfile() {
		isLoading = true;
		try {
			// First try to get user from auth store
			let user = $authStore.user;
			
			// If no user in store, try to fetch from API
			if (!user) {
				user = await authService.getMe();
			}
			
			const statesResponse = await statesService.getAllStates();
			
			profileData = {
				id: user.id,
				name: user.name || '',
				email: user.email,
				phoneNumber: user.phoneNumber || '',
				photoUrl: user.photoUrl || null,
				address: user.address || null
			};
			editData = { ...profileData };
			
			// Load states
			states = statesResponse.results || statesResponse.states || statesResponse;
			
			// If user has an address, set the selected state and load cities
			if (profileData.address) {
				selectedState = profileData.address.state;
				selectedCity = profileData.address.city || null;
				if (selectedState) {
					await loadCitiesForState(selectedState.id);
				}
			}
		} catch (error) {
			console.error('Failed to load profile:', error);
			// Optionally, redirect to login if unauthorized or show an error message
		} finally {
			isLoading = false;
		}
	}

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
	
	async function updateProfile() {
		isLoading = true;
		errors = {};
		
		try {
			// Validate form
			if (!editData.name.trim()) {
				errors.name = 'Name is required';
			}
			if (!editData.email.trim()) {
				errors.email = 'Email is required';
			}
			
			// Validate address if any address field is filled
			const addressFields = editData.address || {};
			const hasAnyAddressField = addressFields.street1 || addressFields.street2 || 
				addressFields.postalCode || addressFields.apartment || addressFields.complex || 
				selectedState || selectedCity;
			
			if (hasAnyAddressField) {
				if (!selectedState) {
					errors.state = 'State is required when providing address information';
				}
				if (!addressFields.street1?.trim()) {
					errors.street1 = 'Street address is required when providing address information';
				}
				if (!addressFields.postalCode?.trim()) {
					errors.postalCode = 'Postal code is required when providing address information';
				}
			}
			
			if (Object.keys(errors).length > 0) {
				isLoading = false;
				return;
			}
			
			// Prepare update data
			const updateData = {
				name: editData.name,
				email: editData.email,
				phoneNumber: editData.phoneNumber,
				photoUrl: editData.photoUrl
			};
			
			// Add address if provided
			if (hasAnyAddressField && selectedState) {
				updateData.address = {
					stateId: selectedState.id,
					state: selectedState,
					street1: addressFields.street1?.trim(),
					postalCode: addressFields.postalCode?.trim()
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
			}
			
			const updatedUser = await authService.updateMe(updateData);
			
			profileData = { ...updatedUser };
			isEditing = false;
			
			// Update the auth store with the new user data
			authStore.updateUser(updatedUser);
			
			alert('Profile updated successfully!');
			
		} catch (error) {
			console.error('Failed to update profile:', error);
			errors.submit = 'Failed to update profile. Please try again.';
		} finally {
			isLoading = false;
		}
	}
	
	async function handlePhotoUpload(event) {
		const file = event.target.files[0];
		if (!file) return;

		try {
			// Clear any previous errors
			if (errors.photoUrl) {
				delete errors.photoUrl;
				errors = { ...errors };
			}

			// Validate the image file using the service
			imageUploadService.validateImageFile(file);

			// Create preview immediately for better UX
			photoPreview = imageUploadService.createPreviewUrl(file);

			// Show loading state
			isLoading = true;

			// Upload the image and get the URL
			const uploadedImageUrl = await imageUploadService.uploadImage(file, profileData.id);
			
			// Update editData with the actual uploaded image URL
			editData.photoUrl = uploadedImageUrl;
			
			console.log('Image uploaded successfully:', uploadedImageUrl);

		} catch (error) {
			console.error('Failed to upload image:', error);
			errors.photoUrl = error.message;
			errors = { ...errors };
			
			// Clear the preview on error
			if (photoPreview) {
				imageUploadService.revokePreviewUrl(photoPreview);
				photoPreview = null;
			}
		} finally {
			isLoading = false;
		}
	}
	
	function cancelEdit() {
		isEditing = false;
		editData = { ...profileData };
		
		// Clean up preview URL if it exists
		if (photoPreview) {
			imageUploadService.revokePreviewUrl(photoPreview);
			photoPreview = null;
		}
		
		errors = {};
		
		// Reset address-related data
		if (profileData.address) {
			selectedState = profileData.address.state;
			selectedCity = profileData.address.city || null;
		} else {
			selectedState = null;
			selectedCity = null;
			cities = [];
		}
	}
	
	onMount(() => {
		loadProfile();
	});
</script>

<svelte:head>
	<title>Profile - Patriot</title>
</svelte:head>

<div class="profile-page">
	<div class="header">
		<h1>Profile</h1>
		<p>Manage your account information and settings</p>
	</div>
	
	{#if isLoading && !isEditing}
		<div class="loading">
			<div class="spinner"></div>
			<p>Loading profile...</p>
		</div>
	{:else}
		<div class="profile-card">
			<div class="profile-header">
				<div class="profile-photo-section">
					{#if photoPreview || profileData.photoUrl}
						<img 
							src={photoPreview || profileData.photoUrl} 
							alt="Profile" 
							class="profile-photo"
							on:error={(e) => {
								console.error('Failed to load profile image:', photoPreview || profileData.photoUrl);
								e.target.style.display = 'none';
								e.target.nextElementSibling?.style.setProperty('display', 'flex');
							}}
						/>
						<div class="profile-photo-placeholder" style="display: none;">
							<span>{profileData.name?.[0] || 'U'}</span>
						</div>
					{:else}
						<div class="profile-photo-placeholder">
							<span>{profileData.name?.[0] || 'U'}</span>
						</div>
					{/if}
					
					{#if isEditing}
						<div class="photo-upload">
							<input
								type="file"
								id="profilePhoto"
								accept="image/*"
								on:change={handlePhotoUpload}
								class="photo-input"
								disabled={isLoading}
							/>
							<label for="profilePhoto" class="photo-upload-btn" class:disabled={isLoading}>
								{#if isLoading}
									<span class="spinner-small"></span>
									Uploading...
								{:else}
									Change Photo
								{/if}
							</label>
							{#if errors.photoUrl}
								<span class="error-message">{errors.photoUrl}</span>
							{/if}
						</div>
					{/if}
				</div>
				
				<div class="profile-actions">
					{#if !isEditing}
						<button class="btn btn-primary" on:click={() => isEditing = true}>
							Edit Profile
						</button>
					{:else}
						<div class="edit-actions">
							<button class="btn btn-primary" on:click={updateProfile} disabled={isLoading}>
								{#if isLoading}
									<span class="spinner-small"></span>
									Saving...
								{:else}
									Save Changes
								{/if}
							</button>
							<button class="btn btn-secondary" on:click={cancelEdit} disabled={isLoading}>
								Cancel
							</button>
						</div>
					{/if}
				</div>
			</div>
			
			<div class="profile-form">
				{#if errors.submit}
					<div class="error-banner">{errors.submit}</div>
				{/if}
				
				<div class="form-grid">
					<div class="form-group">
						<label for="name">Name</label>
						{#if isEditing}
							<input
								type="text"
								id="name"
								bind:value={editData.name}
								class:error={errors.name}
								disabled={isLoading}
							/>
							{#if errors.name}
								<span class="error-message">{errors.name}</span>
							{/if}
						{:else}
							<div class="form-value">{profileData.name || 'Not set'}</div>
						{/if}
					</div>
					
					<div class="form-group">
						<label for="email">Email</label>
						{#if isEditing}
							<input
								type="email"
								id="email"
								bind:value={editData.email}
								class:error={errors.email}
								disabled={isLoading}
							/>
							{#if errors.email}
								<span class="error-message">{errors.email}</span>
							{/if}
						{:else}
							<div class="form-value">{profileData.email || 'Not set'}</div>
						{/if}
					</div>
					
					<div class="form-group">
						<label for="phoneNumber">Phone Number</label>
						{#if isEditing}
							<input
								type="tel"
								id="phoneNumber"
								bind:value={editData.phoneNumber}
								class:error={errors.phoneNumber}
								disabled={isLoading}
							/>
							{#if errors.phoneNumber}
								<span class="error-message">{errors.phoneNumber}</span>
							{/if}
						{:else}
							<div class="form-value">{profileData.phoneNumber || 'Not set'}</div>
						{/if}
					</div>
				</div>
				
				<!-- Address Section -->
				<div class="address-section">
					<h3>Address Information</h3>
					
					{#if isEditing}
						<div class="address-form">
							<!-- Initialize address object if it doesn't exist -->
							{#if !editData.address}
								{editData.address = {}}
							{/if}
							
							<div class="form-grid">
								<!-- State Selection -->
								<div class="form-group">
									<label for="state">State *</label>
									<select 
										id="state" 
										bind:value={selectedState} 
										on:change={handleStateChange}
										class:error={errors.state}
										disabled={isLoading}
									>
										<option value={null}>Select State</option>
										{#each states as state}
											<option value={state}>{getLocalizedName(state)}</option>
										{/each}
									</select>
									{#if errors.state}
										<span class="error-message">{errors.state}</span>
									{/if}
								</div>
								
								<!-- City Selection -->
								<div class="form-group">
									<label for="city">City (Optional)</label>
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
								
								<!-- Street 1 -->
								<div class="form-group">
									<label for="street1">Street Address *</label>
									<input
										type="text"
										id="street1"
										bind:value={editData.address.street1}
										class:error={errors.street1}
										disabled={isLoading}
										placeholder="123 Main Street"
									/>
									{#if errors.street1}
										<span class="error-message">{errors.street1}</span>
									{/if}
								</div>
								
								<!-- Street 2 -->
								<div class="form-group">
									<label for="street2">Street Address 2 (Optional)</label>
									<input
										type="text"
										id="street2"
										bind:value={editData.address.street2}
										disabled={isLoading}
										placeholder="Apt, Suite, Unit, etc."
									/>
								</div>
								
								<!-- Postal Code -->
								<div class="form-group">
									<label for="postalCode">Postal Code *</label>
									<input
										type="text"
										id="postalCode"
										bind:value={editData.address.postalCode}
										class:error={errors.postalCode}
										disabled={isLoading}
										placeholder="12345"
									/>
									{#if errors.postalCode}
										<span class="error-message">{errors.postalCode}</span>
									{/if}
								</div>
								
								<!-- Apartment -->
								<div class="form-group">
									<label for="apartment">Apartment (Optional)</label>
									<input
										type="text"
										id="apartment"
										bind:value={editData.address.apartment}
										disabled={isLoading}
										placeholder="Apt 123"
									/>
								</div>
								
								<!-- Complex -->
								<div class="form-group">
									<label for="complex">Complex (Optional)</label>
									<input
										type="text"
										id="complex"
										bind:value={editData.address.complex}
										disabled={isLoading}
										placeholder="Building or Complex Name"
									/>
								</div>
							</div>
						</div>
					{:else}
						<!-- Display Address -->
						{#if profileData.address}
							<div class="address-display">
								<div class="address-line">
									<strong>State:</strong> {getLocalizedName(profileData.address.state) || 'Not set'}
								</div>
								{#if profileData.address.city}
									<div class="address-line">
										<strong>City:</strong> {getLocalizedName(profileData.address.city)}
									</div>
								{/if}
								<div class="address-line">
									<strong>Street:</strong> {profileData.address.street1 || 'Not set'}
								</div>
								{#if profileData.address.street2}
									<div class="address-line">
										<strong>Street 2:</strong> {profileData.address.street2}
									</div>
								{/if}
								<div class="address-line">
									<strong>Postal Code:</strong> {profileData.address.postalCode || 'Not set'}
								</div>
								{#if profileData.address.apartment}
									<div class="address-line">
										<strong>Apartment:</strong> {profileData.address.apartment}
									</div>
								{/if}
								{#if profileData.address.complex}
									<div class="address-line">
										<strong>Complex:</strong> {profileData.address.complex}
									</div>
								{/if}
							</div>
						{:else}
							<div class="form-value">No address information provided</div>
						{/if}
					{/if}
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.profile-page {
		max-width: 800px;
		margin: 0 auto;
	}
	
	.header {
		margin-bottom: 32px;
	}
	
	.header h1 {
		margin: 0 0 8px 0;
		font-size: 32px;
		font-weight: 700;
		color: #1e293b;
	}
	
	.header p {
		margin: 0;
		color: #64748b;
		font-size: 16px;
	}
	
	.loading {
		text-align: center;
		padding: 48px;
	}
	
	.spinner {
		width: 40px;
		height: 40px;
		border: 4px solid #f3f4f6;
		border-top: 4px solid #3b82f6;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin: 0 auto 16px;
	}
	
	.spinner-small {
		width: 16px;
		height: 16px;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-top: 2px solid white;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		display: inline-block;
		margin-right: 8px;
	}
	
	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}
	
	.profile-card {
		background: white;
		border-radius: 12px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		border: 1px solid #e2e8f0;
		overflow: hidden;
	}
	
	.profile-header {
		padding: 32px;
		border-bottom: 1px solid #e2e8f0;
		display: flex;
		align-items: center;
		gap: 32px;
	}
	
	.profile-photo-section {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 16px;
	}
	
	.profile-photo {
		width: 120px;
		height: 120px;
		border-radius: 50%;
		object-fit: cover;
		border: 4px solid #f1f5f9;
	}
	
	.profile-photo-placeholder {
		width: 120px;
		height: 120px;
		border-radius: 50%;
		background: #3b82f6;
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
		font-size: 32px;
		font-weight: 600;
		border: 4px solid #f1f5f9;
	}
	
	.photo-input {
		display: none;
	}
	
	.photo-upload-btn {
		background: #f1f5f9;
		border: 1px solid #d1d5db;
		border-radius: 8px;
		padding: 8px 16px;
		font-size: 14px;
		cursor: pointer;
		transition: all 0.2s ease;
	}
	
	.photo-upload-btn:hover {
		background: #e5e7eb;
	}
	
	.profile-actions {
		flex: 1;
	}
	
	.edit-actions {
		display: flex;
		gap: 12px;
	}
	
	.btn {
		padding: 12px 24px;
		border-radius: 8px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
		border: none;
		font-size: 14px;
	}
	
	.btn-primary {
		background: #3b82f6;
		color: white;
	}
	
	.btn-primary:hover:not(:disabled) {
		background: #2563eb;
	}
	
	.btn-primary:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
	
	.btn-secondary {
		background: #f8fafc;
		color: #64748b;
		border: 1px solid #d1d5db;
	}
	
	.btn-secondary:hover:not(:disabled) {
		background: #f1f5f9;
	}
	
	.profile-form {
		padding: 32px;
	}
	
	.error-banner {
		background: #fef2f2;
		border: 1px solid #fecaca;
		color: #dc2626;
		padding: 12px 16px;
		border-radius: 8px;
		margin-bottom: 24px;
	}
	
	.form-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 24px;
	}
	
	.form-group {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	
	.form-group label {
		font-weight: 500;
		color: #374151;
		font-size: 14px;
	}
	
	.form-group input {
		padding: 12px 16px;
		border: 1px solid #d1d5db;
		border-radius: 8px;
		font-size: 16px;
		transition: border-color 0.2s ease;
	}
	
	.form-group input:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}
	
	.form-group input.error {
		border-color: #dc2626;
	}
	
	.form-value {
		padding: 12px 16px;
		background: #f8fafc;
		border-radius: 8px;
		color: #1e293b;
		font-size: 16px;
	}
	
	.error-message {
		color: #dc2626;
		font-size: 14px;
	}
	
	@media (max-width: 768px) {
		.profile-header {
			flex-direction: column;
			text-align: center;
		}
		
		.form-grid {
			grid-template-columns: 1fr;
		}
		
		.edit-actions {
			flex-direction: column;
		}
	}
	/* Address Section Styles */
	.address-section {
		margin-top: 2rem;
		padding-top: 2rem;
		border-top: 1px solid var(--border-color);
	}

	.address-section h3 {
		margin: 0 0 1.5rem 0;
		color: var(--text-primary);
		font-size: 1.25rem;
		font-weight: 600;
	}

	.address-form {
		margin-top: 1rem;
	}

	.address-display {
		background: var(--bg-light);
		padding: 1.5rem;
		border-radius: 12px;
		border: 1px solid var(--border-color);
	}

	.address-line {
		margin-bottom: 0.75rem;
		color: var(--text-primary);
	}

	.address-line:last-child {
		margin-bottom: 0;
	}

	.address-line strong {
		display: inline-block;
		width: 120px;
		color: var(--text-secondary);
		font-weight: 500;
	}

	/* Select styling for address dropdowns */
	select {
		width: 100%;
		padding: 0.75rem;
		border: 2px solid var(--border-color);
		border-radius: 8px;
		background: var(--bg-primary);
		color: var(--text-primary);
		font-size: 1rem;
		transition: all 0.3s ease;
		appearance: none;
		background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6,9 12,15 18,9'%3e%3c/polyline%3e%3c/svg%3e");
		background-repeat: no-repeat;
		background-position: right 0.75rem center;
		background-size: 1rem;
		padding-right: 2.5rem;
	}

	select:focus {
		outline: none;
		border-color: var(--primary-color);
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	select:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		background-color: var(--bg-light);
	}

	select.error {
		border-color: var(--error-color);
	}

	/* Responsive adjustments for address section */
	@media (max-width: 768px) {
		.address-line strong {
			width: 100px;
			font-size: 0.9rem;
		}
		
		.address-display {
			padding: 1rem;
		}
	}
</style>

