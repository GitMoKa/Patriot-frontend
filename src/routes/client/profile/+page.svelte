<script>
	import { onMount } from 'svelte';
	import { authService } from '$lib/services/auth.js';
	
	let isEditing = false;
	let isLoading = false;
	let profileData = {
		id: '',
		name: '',
		email: '',
		phoneNumber: '',
		photoUrl: null
	};
	
	let editData = { ...profileData };
	let photoPreview = null;
	let errors = {};
	
	async function loadProfile() {
		isLoading = true;
		try {
			const user = await authService.getMe();
			profileData = {
				id: user.id,
				name: user.name || '',
				email: user.email,
				phoneNumber: user.phoneNumber || '',
				photoUrl: user.photoUrl || null
			};
			editData = { ...profileData };
		} catch (error) {
			console.error('Failed to load profile:', error);
			// Optionally, redirect to login if unauthorized or show an error message
		} finally {
			isLoading = false;
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
			
			if (Object.keys(errors).length > 0) {
				isLoading = false;
				return;
			}
			
			const updatedUser = await authService.updateMe({
				name: editData.name,
				email: editData.email,
				phoneNumber: editData.phoneNumber,
				photoUrl: editData.photoUrl // Assuming photoUrl is a string URL or null
			});
			
			profileData = { ...updatedUser };
			isEditing = false;
			
			alert('Profile updated successfully!');
			
		} catch (error) {
			console.error('Failed to update profile:', error);
			errors.submit = 'Failed to update profile. Please try again.';
		} finally {
			isLoading = false;
		}
	}
	
	function handlePhotoUpload(event) {
		const file = event.target.files[0];
		if (file) {
			if (file.size > 5 * 1024 * 1024) {
				errors.photoUrl = 'Photo must be less than 5MB';
				return;
			}
			
			if (!file.type.startsWith('image/')) {
				errors.photoUrl = 'Please select a valid image file';
				return;
			}
			
			// For simplicity, we'll just set the preview.
			// Actual upload to a service like AWS S3 would be needed here
			// and then update editData.photoUrl with the returned URL.
			editData.photoUrl = URL.createObjectURL(file); // Use URL.createObjectURL for preview
			const reader = new FileReader();
			reader.onload = (e) => {
				photoPreview = e.target.result;
			};
			reader.readAsDataURL(file);
			
			if (errors.photoUrl) {
				delete errors.photoUrl;
				errors = { ...errors };
			}
		}
	}
	
	function cancelEdit() {
		isEditing = false;
		editData = { ...profileData };
		photoPreview = null;
		errors = {};
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
						<img src={photoPreview || profileData.photoUrl} alt="Profile" class="profile-photo" />
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
							/>
							<label for="profilePhoto" class="photo-upload-btn">
								Change Photo
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
</style>

