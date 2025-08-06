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
		profilePhoto: null,
		address: '' // Not implemented yet
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
		// Check if user has access token (came from step 1)
		if (!apiService.getAuthToken()) {
			// No token found, redirect to step 1
			goto('/client/signup/step1');
		}
	});
	
	async function handleSignupStep2() {
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
			handleSignupStep2();
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
		
		// Clear tokens and go back to step 1
		authService.logout();
		goto('/client/signup/step1');
	}
</script>

<svelte:head>
	<title>{currentLang === 'ar' ? 'إنشاء حساب - الخطوة 2' : 'Sign Up - Step 2'} - Patriot Glass Factory</title>
</svelte:head>

<div class="signup-page" data-theme={currentTheme}>
	<div class="signup-background">
		<img src="/glass-factory-bg.jpg" alt="Glass Factory Background" />
		<div class="signup-overlay"></div>
	</div>
	
	<div class="signup-container">
		<div class="signup-card">
			<!-- Logo -->
			<div class="logo">
				<div class="logo-icon">
					<div class="diamond"></div>
				</div>
			</div>
			
			<!-- Progress indicator -->
			<div class="progress-indicator">
				<div class="step completed">✓</div>
				<div class="step-line completed"></div>
				<div class="step active">2</div>
			</div>
			
			<!-- Title -->
			<h1 class="signup-title">
				{currentLang === 'ar' ? 'إنشاء حساب - الخطوة 2' : 'Create Account - Step 2'}
			</h1>
			<p class="signup-subtitle">
				{currentLang === 'ar' ? 'أكمل ملفك الشخصي' : 'Complete your profile'}
			</p>
			
			<!-- Error Message -->
			{#if error}
				<div class="error-message">
					{error}
				</div>
			{/if}
			
			<!-- Signup Form -->
			<form class="signup-form" on:submit|preventDefault={handleSignupStep2}>
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
						<span class="optional">({currentLang === 'ar' ? 'اختياري' : 'Optional'})</span>
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

				<!-- Address - Not implemented yet -->
				<div class="form-group">
					<label for="address" class="form-label">
						{currentLang === 'ar' ? 'العنوان' : 'Address'} 
						<span class="optional">({currentLang === 'ar' ? 'اختياري - قريباً' : 'Optional - Coming Soon'})</span>
					</label>
					<textarea
						id="address"
						bind:value={formData.address}
						class="form-input"
						placeholder={currentLang === 'ar' ? 'سيتم تفعيل هذا الحقل قريباً' : 'This field will be available soon'}
						disabled={true}
						rows="3"
					></textarea>
				</div>

				<div class="form-actions">
					<button
						type="button"
						class="back-button"
						on:click={goBack}
						disabled={isLoading}
					>
						{currentLang === 'ar' ? 'السابق' : 'Back'}
					</button>
					
					<button
						type="submit"
						class="signup-button"
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
	.signup-page {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		position: relative;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		padding: 2rem 1rem;
	}

	.signup-background {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		z-index: 0;
	}

	.signup-background img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		opacity: 0.3;
	}

	.signup-overlay {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: linear-gradient(135deg, rgba(102, 126, 234, 0.8) 0%, rgba(118, 75, 162, 0.8) 100%);
	}

	.signup-container {
		position: relative;
		z-index: 1;
		width: 100%;
		max-width: 500px;
	}

	.signup-card {
		background: rgba(255, 255, 255, 0.95);
		backdrop-filter: blur(10px);
		border-radius: 20px;
		padding: 3rem 2.5rem;
		box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.2);
	}

	[data-theme="dark"] .signup-card {
		background: rgba(30, 41, 59, 0.95);
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	.logo {
		display: flex;
		justify-content: center;
		margin-bottom: 2rem;
	}

	.logo-icon {
		width: 80px;
		height: 80px;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		border-radius: 20px;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
	}

	.diamond {
		width: 40px;
		height: 40px;
		background: white;
		transform: rotate(45deg);
		border-radius: 8px;
	}

	.progress-indicator {
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 2rem;
		gap: 1rem;
	}

	.step {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 600;
		font-size: 1.1rem;
		background: #e2e8f0;
		color: #64748b;
		transition: all 0.3s ease;
	}

	.step.active {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
	}

	.step.completed {
		background: #10b981;
		color: white;
		font-size: 1rem;
	}

	.step-line {
		width: 60px;
		height: 2px;
		background: #e2e8f0;
		transition: all 0.3s ease;
	}

	.step-line.completed {
		background: #10b981;
	}

	.signup-title {
		text-align: center;
		font-size: 2.5rem;
		font-weight: 700;
		color: #1e293b;
		margin-bottom: 0.5rem;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	[data-theme="dark"] .signup-title {
		color: #f1f5f9;
	}

	.signup-subtitle {
		text-align: center;
		color: #64748b;
		margin-bottom: 2rem;
		font-size: 1.1rem;
	}

	[data-theme="dark"] .signup-subtitle {
		color: #94a3b8;
	}

	.error-message {
		background: #fee2e2;
		border: 1px solid #fecaca;
		color: #dc2626;
		padding: 1rem;
		border-radius: 12px;
		margin-bottom: 1.5rem;
		text-align: center;
		font-weight: 500;
	}

	[data-theme="dark"] .error-message {
		background: rgba(220, 38, 38, 0.1);
		border: 1px solid rgba(220, 38, 38, 0.3);
		color: #fca5a5;
	}

	.signup-form {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.form-label {
		font-weight: 600;
		color: #374151;
		font-size: 0.95rem;
	}

	[data-theme="dark"] .form-label {
		color: #d1d5db;
	}

	.optional {
		font-weight: 400;
		color: #6b7280;
		font-size: 0.85rem;
	}

	[data-theme="dark"] .optional {
		color: #9ca3af;
	}

	.form-input {
		padding: 1rem 1.25rem;
		border: 2px solid #e5e7eb;
		border-radius: 12px;
		font-size: 1rem;
		transition: all 0.3s ease;
		background: white;
		color: #1f2937;
		resize: vertical;
	}

	.form-input:focus {
		outline: none;
		border-color: #667eea;
		box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
	}

	.form-input:disabled {
		background: #f9fafb;
		color: #9ca3af;
		cursor: not-allowed;
	}

	[data-theme="dark"] .form-input {
		background: #374151;
		border-color: #4b5563;
		color: #f9fafb;
	}

	[data-theme="dark"] .form-input:focus {
		border-color: #667eea;
		box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2);
	}

	[data-theme="dark"] .form-input:disabled {
		background: #1f2937;
		color: #6b7280;
	}

	.photo-upload-area {
		border: 2px dashed #d1d5db;
		border-radius: 12px;
		background: #f9fafb;
		transition: all 0.3s ease;
		cursor: pointer;
	}

	.photo-upload-area:hover {
		border-color: #667eea;
		background: #f0f4ff;
	}

	[data-theme="dark"] .photo-upload-area {
		border-color: #4b5563;
		background: #374151;
	}

	[data-theme="dark"] .photo-upload-area:hover {
		border-color: #667eea;
		background: #1e293b;
	}

	.photo-input {
		display: none;
	}

	.photo-upload-label {
		display: block;
		padding: 2rem;
		text-align: center;
		cursor: pointer;
		color: #6b7280;
	}

	[data-theme="dark"] .photo-upload-label {
		color: #9ca3af;
	}

	.photo-icon {
		font-size: 2.5rem;
		margin-bottom: 0.5rem;
		display: block;
	}

	.upload-text {
		margin: 0 0 0.25rem 0;
		font-size: 1rem;
		font-weight: 500;
		color: #374151;
	}

	[data-theme="dark"] .upload-text {
		color: #d1d5db;
	}

	.upload-hint {
		margin: 0;
		font-size: 0.8rem;
		color: #6b7280;
	}

	[data-theme="dark"] .upload-hint {
		color: #9ca3af;
	}

	.photo-preview {
		position: relative;
		display: inline-block;
		border-radius: 12px;
		overflow: hidden;
		background: #f3f4f6;
		border: 2px solid #e5e7eb;
	}

	[data-theme="dark"] .photo-preview {
		background: #374151;
		border-color: #4b5563;
	}

	.preview-image {
		width: 120px;
		height: 120px;
		object-fit: cover;
		display: block;
	}

	.remove-photo-btn {
		position: absolute;
		top: 8px;
		right: 8px;
		width: 24px;
		height: 24px;
		border-radius: 50%;
		background: rgba(220, 38, 38, 0.9);
		color: white;
		border: none;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.8rem;
		font-weight: bold;
		transition: all 0.2s ease;
	}

	.remove-photo-btn:hover:not(:disabled) {
		background: #dc2626;
		transform: scale(1.1);
	}

	.remove-photo-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.form-actions {
		display: flex;
		gap: 1rem;
		margin-top: 1rem;
	}

	.back-button {
		flex: 1;
		background: #f3f4f6;
		color: #374151;
		border: 2px solid #e5e7eb;
		padding: 1.25rem 2rem;
		border-radius: 12px;
		font-size: 1.1rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s ease;
	}

	.back-button:hover:not(:disabled) {
		background: #e5e7eb;
		border-color: #d1d5db;
	}

	[data-theme="dark"] .back-button {
		background: #374151;
		color: #d1d5db;
		border-color: #4b5563;
	}

	[data-theme="dark"] .back-button:hover:not(:disabled) {
		background: #4b5563;
		border-color: #6b7280;
	}

	.signup-button {
		flex: 2;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		border: none;
		padding: 1.25rem 2rem;
		border-radius: 12px;
		font-size: 1.1rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s ease;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
	}

	.signup-button:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 8px 25px rgba(102, 126, 234, 0.6);
	}

	.signup-button:active:not(:disabled) {
		transform: translateY(0);
	}

	.signup-button:disabled {
		opacity: 0.7;
		cursor: not-allowed;
		transform: none;
	}

	.loading-spinner {
		width: 20px;
		height: 20px;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-radius: 50%;
		border-top-color: white;
		animation: spin 1s ease-in-out infinite;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	/* RTL Support */
	[dir="rtl"] .signup-title {
		text-align: center;
	}

	/* Responsive */
	@media (max-width: 480px) {
		.signup-card {
			padding: 2rem 1.5rem;
		}

		.signup-title {
			font-size: 2rem;
		}

		.logo-icon {
			width: 60px;
			height: 60px;
		}

		.diamond {
			width: 30px;
			height: 30px;
		}

		.form-actions {
			flex-direction: column;
		}
	}
</style>