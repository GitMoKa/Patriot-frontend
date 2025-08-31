<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/auth.js';
	import { languageStore, t } from '$lib/stores/language.js';
	import { themeStore } from '$lib/stores/theme.js';
	import { authService } from '$lib/services/auth.js';
	import { apiService } from '$lib/services/api.js';
	import { imageUploadService } from '$lib/services/imageUpload.js';
	
	let formData = {
		phone: '',
		profilePhoto: null
	};
	let isLoading = false;
	let error = '';
	let photoPreviewUrl = null;
	let isUploadingPhoto = false;
	
	// Reactive statements
	$: currentLang = $languageStore;
	$: currentTheme = $themeStore;
	$: isAuthenticated = $authStore.isAuthenticated;
	
	onMount(() => {
		// Check if user has access token (came from previous steps)
		if (!apiService.getAuthToken()) {
			// No token found, redirect to step 1
			goto('/client/signup/step1');
		}
	});
	
	async function handleSignupStep3() {
		// Validation
		if (!formData.phone) {
			error = currentLang === 'ar' ? 'رقم الهاتف مطلوب' : 'Phone number is required';
			return;
		}
		
		if (!isValidPhone(formData.phone)) {
			error = currentLang === 'ar' ? 'رقم الهاتف غير صحيح' : 'Invalid phone number';
			return;
		}
		
		isLoading = true;
		error = '';
		
		try {
			let photoUrl = null;
			
			// Upload profile photo first if selected
			if (formData.profilePhoto) {
				try {
					isUploadingPhoto = true;
					
					// Get current user to get userId
					const currentUser = await authService.getMe();
					
					// Upload image and get clean URL
					photoUrl = await imageUploadService.uploadImage(formData.profilePhoto, currentUser.id);
					
				} catch (photoError) {
					console.error('Photo upload failed:', photoError);
					// Don't fail the entire process if photo upload fails
					error = currentLang === 'ar' 
						? 'فشل في رفع الصورة، سيتم حفظ الملف الشخصي بدون صورة' 
						: 'Photo upload failed, profile will be saved without photo';
				} finally {
					isUploadingPhoto = false;
				}
			}
			
			// Update user profile with phone number and photo URL (if available)
			const updateData = { phone: formData.phone };
			if (photoUrl) {
				updateData.photoUrl = photoUrl;
			}
			
			console.log('Updating profile with data:', updateData);
			await authService.updateMe(updateData);
			
			// Initialize auth store with user data
			await authStore.init();
			
			// Redirect to home page
			goto('/client');
			
		} catch (err) {
			error = err.message || (currentLang === 'ar' ? 'فشل في تحديث الملف الشخصي' : 'Failed to update profile');
		} finally {
			isLoading = false;
		}
	}
	
	function isValidPhone(phone) {
		// Basic phone validation - adjust regex as needed
		const phoneRegex = /^(?:\+963|0)9\d{8}$/;
		return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
	}
	
	function handleKeyPress(event) {
		if (event.key === 'Enter') {
			handleSignupStep3();
		}
	}
	
	function handlePhotoSelect(event) {
		const file = event.target.files[0];
		if (!file) return;
		
		try {
			// Validate the image file
			imageUploadService.validateImageFile(file);
			
			// Clean up previous preview URL
			if (photoPreviewUrl) {
				imageUploadService.revokePreviewUrl(photoPreviewUrl);
			}
			
			// Set the file and create preview
			formData.profilePhoto = file;
			photoPreviewUrl = imageUploadService.createPreviewUrl(file);
			error = ''; // Clear any previous errors
			
		} catch (validationError) {
			error = validationError.message;
			formData.profilePhoto = null;
			if (photoPreviewUrl) {
				imageUploadService.revokePreviewUrl(photoPreviewUrl);
				photoPreviewUrl = null;
			}
		}
	}
	
	function removePhoto() {
		if (photoPreviewUrl) {
			imageUploadService.revokePreviewUrl(photoPreviewUrl);
		}
		formData.profilePhoto = null;
		photoPreviewUrl = null;
		
		// Reset the file input
		const fileInput = document.getElementById('profilePhoto');
		if (fileInput) {
			fileInput.value = '';
		}
	}
	
	function goBack() {
		// Clean up preview URL
		if (photoPreviewUrl) {
			imageUploadService.revokePreviewUrl(photoPreviewUrl);
		}
		
		// Go back to step 2 (address step)
		goto('/client/signup/step2');
	}
</script>

<svelte:head>
	<title>{currentLang === 'ar' ? 'إنشاء حساب - الخطوة 3' : 'Sign Up - Step 3'} - Patriot Glass Factory</title>
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
				<div class="step completed">✓</div>
				<div class="step-line completed"></div>
				<div class="step active">3</div>
			</div>
			
			<!-- Title -->
			<h1 class="page-title">
				{currentLang === 'ar' ? 'إنشاء حساب - الخطوة 3' : 'Create Account - Step 3'}
			</h1>
			<p class="page-subtitle">
				{currentLang === 'ar' ? 'أكمل ملفك الشخصي' : 'Complete your profile'}
			</p>
			
			<!-- Error Message -->
			{#if error}
				<div class="message message-error">
					{error}
				</div>
			{/if}
			
			<!-- Signup Form -->
			<form class="form" on:submit|preventDefault={handleSignupStep3}>
				<div class="form-group">
					<label for="phone" class="form-label">
						{currentLang === 'ar' ? 'رقم الهاتف' : 'Phone Number'} *
					</label>
					<input
						type="tel"
						id="phone"
						bind:value={formData.phone}
						class="form-input"
						placeholder={currentLang === 'ar' ? 'أدخل رقم هاتفك' : 'Enter your phone number'}
						required
						disabled={isLoading}
						on:keypress={handleKeyPress}
					/>
				</div>

				<!-- Profile Photo -->
				<div class="form-group">
					<label for="profilePhoto" class="form-label">
						{currentLang === 'ar' ? 'صورة الملف الشخصي' : 'Profile Photo'} 
						<span style="font-weight: 400; color: var(--text-muted); font-size: 0.85rem;">({currentLang === 'ar' ? 'اختياري' : 'Optional'})</span>
					</label>
					
					{#if photoPreviewUrl}
						<div class="photo-preview">
							<img src={photoPreviewUrl} alt="Profile preview" class="preview-image" />
							<button 
								type="button" 
								class="remove-photo-btn"
								on:click={removePhoto}
								disabled={isLoading || isUploadingPhoto}
							>
								✕
							</button>
						</div>
					{:else}
						<div class="photo-upload-area">
							<input
								type="file"
								id="profilePhoto"
								accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
								on:change={handlePhotoSelect}
								class="photo-input"
								disabled={isLoading || isUploadingPhoto}
							/>
							<label for="profilePhoto" class="photo-upload-label">
								<div class="photo-icon">📷</div>
								<p class="upload-text">
									{currentLang === 'ar' ? 'اضغط لاختيار صورة' : 'Click to select image'}
								</p>
								<p class="upload-hint">
									{currentLang === 'ar' ? 'JPEG, PNG, GIF, WebP (حد أقصى 5MB)' : 'JPEG, PNG, GIF, WebP (Max 5MB)'}
								</p>
							</label>
						</div>
					{/if}
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
						type="submit"
						class="btn btn-primary btn-lg"
						style="flex: 2;"
						disabled={isLoading || isUploadingPhoto}
					>
						{#if isLoading || isUploadingPhoto}
							<span class="loading-spinner"></span>
						{/if}
						{isLoading 
							? (currentLang === 'ar' ? 'جاري الحفظ...' : 'Saving...') 
							: isUploadingPhoto
							? (currentLang === 'ar' ? 'جاري رفع الصورة...' : 'Uploading photo...')
							: (currentLang === 'ar' ? 'إنهاء التسجيل' : 'Complete Registration')
						}
					</button>
				</div>
			</form>
		</div>
	</div>
</div>

<style>
	.form-actions {
		display: flex;
		gap: 0.75rem;
		margin-top: 1.5rem;
	}
	
	.photo-preview {
		position: relative;
		display: inline-block;
		margin-top: 0.5rem;
	}
	
	.preview-image {
		width: 120px;
		height: 120px;
		border-radius: 50%;
		object-fit: cover;
		border: 3px solid var(--border-color);
	}
	
	.remove-photo-btn {
		position: absolute;
		top: -5px;
		right: -5px;
		width: 24px;
		height: 24px;
		border-radius: 50%;
		background: var(--danger-color);
		color: white;
		border: none;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 12px;
		font-weight: bold;
	}
	
	.remove-photo-btn:hover {
		background: var(--danger-hover);
	}
	
	.photo-upload-area {
		margin-top: 0.5rem;
	}
	
	.photo-input {
		display: none;
	}
	
	.photo-upload-label {
		display: block;
		padding: 2rem;
		border: 2px dashed var(--border-color);
		border-radius: 8px;
		text-align: center;
		cursor: pointer;
		transition: all 0.2s ease;
		background: var(--background-secondary);
	}
	
	.photo-upload-label:hover {
		border-color: var(--primary-color);
		background: var(--background-hover);
	}
	
	.photo-icon {
		font-size: 2rem;
		margin-bottom: 0.5rem;
	}
	
	.upload-text {
		margin: 0 0 0.25rem 0;
		font-weight: 500;
		color: var(--text-primary);
	}
	
	.upload-hint {
		margin: 0;
		font-size: 0.85rem;
		color: var(--text-muted);
	}
</style>