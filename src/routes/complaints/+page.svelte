<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/auth.js';
	import { complaintsService } from '$lib/services/complaints.js';
	import { languageStore, t } from '$lib/stores/language.js';
	import { themeStore } from '$lib/stores/theme.js';
	import { imageUploadService } from '$lib/services/imageUpload.js';
	import { authService } from '$lib/services/auth.js';
	
	// Reactive statements
	$: isAuthenticated = $authStore.isAuthenticated;
	$: user = $authStore.user;
	$: currentLang = $languageStore;
	$: currentTheme = $themeStore;
	
	// Form state
	let description = '';
	let complaintType = '';
	let isSubmitting = false;
	let error = null;
	let showConfirmation = false;
	
	// Complaint type options
	const complaintTypes = [
		{ value: 'maintenance', labelEn: 'Maintenance', labelAr: 'صيانة' },
		{ value: 'noise', labelEn: 'Noise', labelAr: 'ضوضاء' },
		{ value: 'cleanliness', labelEn: 'Cleanliness', labelAr: 'نظافة' },
		{ value: 'staffBehavior', labelEn: 'Staff Behavior', labelAr: 'سلوك الموظفين' },
		{ value: 'technicalIssue', labelEn: 'Technical Issue', labelAr: 'مشكلة تقنية' },
		{ value: 'other', labelEn: 'Other', labelAr: 'أخرى' }
	];
	
	// File upload state
	let selectedFile = null;
	let uploadedFileUrl = '';
	let isUploadingFile = false;
	let fileUploadError = '';
	
	// Form validation
	$: isFormValid = description.trim().length > 0 && complaintType.trim().length > 0;
	
	async function handleSubmit() {
		if (!isFormValid || isSubmitting) return;
		
		// Debug: Log user object to see its structure
		console.log('Current user object:', user);
		console.log('User ID from user.id:', user?.id);
		console.log('User ID from user.userId:', user?.userId);
		console.log('User ID from user._id:', user?._id);
		
		// Try different possible user ID properties
		const userId = user?.id || user?.userId || user?._id;
		
		if (!isAuthenticated || !userId) {
			error = currentLang === 'ar' ? 'يجب تسجيل الدخول لتقديم شكوى' : 'You must be logged in to submit a complaint';
			return;
		}
		
		isSubmitting = true;
		error = null;
		
		try {
			const complaintData = {
				description: description.trim(),
				userId: userId,
				location:"",
				complaintType: complaintType
			};
			
			// Add file URL if uploaded
			if (uploadedFileUrl) {
				complaintData.attachmentUrl = uploadedFileUrl;
			}
			
			console.log('Sending complaint data:', complaintData);
			
			await complaintsService.createComplaint(complaintData);
			
			// Show confirmation message
			showConfirmation = true;
			
			// Redirect to home page after 2 seconds
			setTimeout(() => {
				goto(isAuthenticated ? '/dashboard' : '/about');
			}, 2000);
			
		} catch (err) {
			console.error('Failed to submit complaint:', err);
			error = err.message || (currentLang === 'ar' ? 'فشل في إرسال الشكوى' : 'Failed to submit complaint');
		} finally {
			isSubmitting = false;
		}
	}
	
	function handleCancel() {
		goto(isAuthenticated ? '/dashboard' : '/about');
	}
	
	// File upload handling
	async function handleFileUpload(event) {
		const file = event.target.files[0];
		if (!file) return;

		try {
			// Validate file size only (10MB limit for complaint attachments)
			imageUploadService.validateFileSize(file, 10);
			
			isUploadingFile = true;
			fileUploadError = '';
			
			// Get current user info
			const currentUser = await authService.getMe();
			if (!currentUser?.id) {
				throw new Error('User not authenticated');
			}
			
			// Upload the file
			uploadedFileUrl = await imageUploadService.uploadImage(file, currentUser.id);
			selectedFile = file;
			
			console.log('File uploaded successfully:', uploadedFileUrl);
			
		} catch (err) {
			fileUploadError = err.message || 'File upload failed';
			uploadedFileUrl = '';
			selectedFile = null;
			console.error('File upload error:', err);
		} finally {
			isUploadingFile = false;
		}
	}

	function removeFile() {
		selectedFile = null;
		uploadedFileUrl = '';
		fileUploadError = '';
		// Clear the file input
		const fileInput = document.getElementById('complaint-file');
		if (fileInput) fileInput.value = '';
	}
	
	// Initialize auth and ensure user data is loaded
	onMount(async () => {
		// Initialize auth store if not already done
		if (!$authStore.user && $authStore.isAuthenticated) {
			try {
				await authStore.refreshUser();
			} catch (error) {
				console.error('Failed to refresh user data:', error);
				goto('/login');
				return;
			}
		}
		
		// Redirect if not authenticated
		if (!isAuthenticated) {
			goto('/login');
		}
	});
</script>

<svelte:head>
	<title>{currentLang === 'ar' ? 'تقديم شكوى - مصنع باتريوت للزجاج' : 'Submit Complaint - Patriot Glass Factory'}</title>
</svelte:head>

<div class="complaints-page" data-theme={currentTheme}>
	<div class="container">
		{#if showConfirmation}
			<!-- Confirmation Message -->
			<div class="confirmation-card">
				<div class="confirmation-icon">✅</div>
				<h2 class="confirmation-title">
					{#if currentLang === 'ar'}
						تم إرسال الشكوى بنجاح
					{:else}
						Complaint Submitted Successfully
					{/if}
				</h2>
				<p class="confirmation-message">
					{#if currentLang === 'ar'}
						شكراً لك على تقديم الشكوى. سيتم مراجعتها والرد عليك قريباً.
					{:else}
						Thank you for submitting your complaint. It will be reviewed and you'll hear back from us soon.
					{/if}
				</p>
				<div class="confirmation-redirect">
					{#if currentLang === 'ar'}
						جاري التوجيه إلى الصفحة الرئيسية...
					{:else}
						Redirecting to home page...
					{/if}
				</div>
			</div>
		{:else}
			<!-- Complaint Form -->
			<div class="form-container">
				<header class="page-header">
					<h1 class="page-title">
						{#if currentLang === 'ar'}
							تقديم شكوى
						{:else}
							Submit a Complaint
						{/if}
					</h1>
					<p class="page-subtitle">
						{#if currentLang === 'ar'}
							نحن نقدر ملاحظاتكم ونسعى لتحسين خدماتنا
						{:else}
							We value your feedback and strive to improve our services
						{/if}
					</p>
				</header>

				<form class="complaint-form" on:submit|preventDefault={handleSubmit}>
					<!-- Complaint Type Field -->
					<div class="form-group">
						<label for="complaintType" class="form-label">
							{#if currentLang === 'ar'}
								نوع الشكوى *
							{:else}
								Complaint Type *
							{/if}
						</label>
						<select
							id="complaintType"
							bind:value={complaintType}
							class="form-select"
							required
							disabled={isSubmitting}
						>
							<option value="">
								{#if currentLang === 'ar'}
									اختر نوع الشكوى
								{:else}
									Select complaint type
								{/if}
							</option>
							{#each complaintTypes as type}
								<option value={type.value}>
									{currentLang === 'ar' ? type.labelAr : type.labelEn}
								</option>
							{/each}
						</select>
					</div>

					<!-- Description Field -->
					<div class="form-group">
						<label for="description" class="form-label">
							{#if currentLang === 'ar'}
								وصف الشكوى *
							{:else}
								Complaint Description *
							{/if}
						</label>
						<textarea
							id="description"
							bind:value={description}
							class="form-textarea"
							placeholder={currentLang === 'ar' ? 'يرجى وصف الشكوى بالتفصيل...' : 'Please describe your complaint in detail...'}
							rows="6"
							required
							disabled={isSubmitting}
						></textarea>
						<div class="form-help">
							{#if currentLang === 'ar'}
								يرجى تقديم أكبر قدر من التفاصيل لمساعدتنا في فهم المشكلة
							{:else}
								Please provide as much detail as possible to help us understand the issue
							{/if}
						</div>
					</div>

					<!-- File Upload Section -->
					<div class="form-group">
						<label for="complaint-file" class="form-label">
							{#if currentLang === 'ar'}
								إرفاق ملف (اختياري)
							{:else}
								Attach File (Optional)
							{/if}
						</label>
						<div class="file-upload-container">
							<input
								type="file"
								id="complaint-file"
								class="file-input"
								on:change={handleFileUpload}
								disabled={isSubmitting || isUploadingFile}
								accept="*/*"
							/>
							<label for="complaint-file" class="file-upload-label" class:disabled={isSubmitting || isUploadingFile}>
								<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
									<path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
									<path d="M7 10L12 15L17 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
									<path d="M12 15V3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
								</svg>
								<span>
									{#if isUploadingFile}
										{#if currentLang === 'ar'}
											جاري الرفع...
										{:else}
											Uploading...
										{/if}
									{:else if selectedFile}
										{#if currentLang === 'ar'}
											تغيير الملف
										{:else}
											Change File
										{/if}
									{:else}
										{#if currentLang === 'ar'}
											اختر ملف للرفع
										{:else}
											Choose file to upload
										{/if}
									{/if}
								</span>
							</label>
						</div>
						
						<!-- File Upload Status -->
						{#if selectedFile}
							<div class="uploaded-file-info">
								<div class="file-details">
									<span class="file-name">{selectedFile.name}</span>
									<span class="file-size">({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</span>
								</div>
								<button type="button" class="remove-file-btn" on:click={removeFile} disabled={isSubmitting}>
									<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
										<path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
									</svg>
								</button>
							</div>
						{/if}
						
						{#if fileUploadError}
							<div class="file-error-message">
								{fileUploadError}
							</div>
						{/if}
						
						<div class="form-help">
							{#if currentLang === 'ar'}
								يمكنك إرفاق أي نوع من الملفات (الحد الأقصى 10 ميجابايت)
							{:else}
								You can attach any type of file (maximum 10MB)
							{/if}
						</div>
					</div>

					<!-- Error Message -->
					{#if error}
						<div class="error-message">
							{error}
						</div>
					{/if}

					<!-- Form Actions -->
					<div class="form-actions">
						<button
							type="button"
							class="btn btn-secondary"
							on:click={handleCancel}
							disabled={isSubmitting}
						>
							{#if currentLang === 'ar'}
								إلغاء
							{:else}
								Cancel
							{/if}
						</button>
						<button
							type="submit"
							class="btn btn-primary"
							disabled={!isFormValid || isSubmitting}
						>
							{#if isSubmitting}
								{#if currentLang === 'ar'}
									جاري الإرسال...
								{:else}
									Submitting...
								{/if}
							{:else}
								{#if currentLang === 'ar'}
									إرسال الشكوى
								{:else}
									Submit Complaint
								{/if}
							{/if}
						</button>
					</div>
				</form>
			</div>
		{/if}
	</div>
</div>

<style>
	.complaints-page {
		min-height: 100vh;
		background: var(--bg-color);
		color: var(--text-color);
		padding: 2rem 0;
	}

	.container {
		max-width: 800px;
		margin: 0 auto;
		padding: 0 20px;
	}

	.page-header {
		text-align: center;
		margin-bottom: 3rem;
	}

	.page-title {
		font-size: 2.5rem;
		font-weight: bold;
		margin-bottom: 0.5rem;
		color: var(--primary-color);
	}

	.page-subtitle {
		font-size: 1.1rem;
		color: var(--text-secondary);
		max-width: 600px;
		margin: 0 auto;
	}

	.form-container {
		background: var(--card-bg);
		border: 1px solid var(--border-color);
		border-radius: 12px;
		padding: 2rem;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
	}

	.complaint-form {
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
		color: var(--text-color);
		font-size: 0.9rem;
	}

	.form-select {
		padding: 1rem;
		border: 2px solid var(--border-color);
		border-radius: 8px;
		font-size: 1rem;
		font-family: inherit;
		background: var(--input-bg);
		color: var(--text-color);
		transition: border-color 0.3s ease;
		cursor: pointer;
	}

	.form-select:focus {
		outline: none;
		border-color: var(--primary-color);
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	.form-select:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.form-textarea {
		padding: 1rem;
		border: 2px solid var(--border-color);
		border-radius: 8px;
		font-size: 1rem;
		font-family: inherit;
		background: var(--input-bg);
		color: var(--text-color);
		resize: vertical;
		min-height: 120px;
		transition: border-color 0.3s ease;
	}

	.form-textarea:focus {
		outline: none;
		border-color: var(--primary-color);
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	.form-textarea:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.form-help {
		font-size: 0.875rem;
		color: var(--text-secondary);
		line-height: 1.4;
	}

	.error-message {
		background: rgba(239, 68, 68, 0.1);
		border: 1px solid rgba(239, 68, 68, 0.3);
		color: #dc2626;
		padding: 1rem;
		border-radius: 8px;
		font-size: 0.9rem;
	}

	.form-actions {
		display: flex;
		gap: 1rem;
		justify-content: flex-end;
		margin-top: 1rem;
	}

	.btn {
		padding: 12px 24px;
		border: none;
		border-radius: 8px;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s ease;
		text-decoration: none;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 120px;
	}

	.btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		transform: none;
	}

	.btn-primary {
		background: linear-gradient(135deg, #3b82f6, #1d4ed8);
		color: white;
	}

	.btn-primary:hover:not(:disabled) {
		background: linear-gradient(135deg, #2563eb, #1e40af);
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
	}

	.btn-secondary {
		background: var(--surface-color);
		color: var(--text-secondary);
		border: 2px solid var(--border-color);
	}

	.btn-secondary:hover:not(:disabled) {
		background: var(--border-color);
		color: var(--text-color);
	}

	/* Confirmation Styles */
	.confirmation-card {
		background: var(--card-bg);
		border: 1px solid var(--border-color);
		border-radius: 12px;
		padding: 3rem 2rem;
		text-align: center;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
	}

	.confirmation-icon {
		font-size: 4rem;
		margin-bottom: 1rem;
	}

	.confirmation-title {
		font-size: 2rem;
		font-weight: bold;
		margin-bottom: 1rem;
		color: var(--success-color, #10b981);
	}

	.confirmation-message {
		font-size: 1.1rem;
		color: var(--text-secondary);
		margin-bottom: 2rem;
		line-height: 1.6;
	}

	.confirmation-redirect {
		font-size: 0.9rem;
		color: var(--text-secondary);
		font-style: italic;
	}

	/* File Upload Styles */
	.file-upload-container {
		position: relative;
		margin-bottom: 1rem;
	}

	.file-input {
		position: absolute;
		opacity: 0;
		width: 0;
		height: 0;
		overflow: hidden;
	}

	.file-upload-label {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		padding: 1.5rem;
		border: 2px dashed var(--border-color);
		border-radius: 12px;
		background: var(--bg-secondary);
		color: var(--text-secondary);
		cursor: pointer;
		transition: all 0.3s ease;
		font-weight: 500;
	}

	.file-upload-label:hover:not(.disabled) {
		border-color: #3b82f6;
		background: rgba(59, 130, 246, 0.05);
		color: #3b82f6;
	}

	.file-upload-label.disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.uploaded-file-info {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem 1rem;
		background: var(--bg-secondary);
		border: 1px solid var(--border-color);
		border-radius: 8px;
		margin-bottom: 0.5rem;
	}

	.file-details {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.file-name {
		font-weight: 500;
		color: var(--text-primary);
		font-size: 0.875rem;
	}

	.file-size {
		font-size: 0.75rem;
		color: var(--text-secondary);
	}

	.remove-file-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		border: none;
		background: #ef4444;
		color: white;
		border-radius: 6px;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.remove-file-btn:hover:not(:disabled) {
		background: #dc2626;
		transform: scale(1.05);
	}

	.remove-file-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.file-error-message {
		background: #fef2f2;
		border: 1px solid #fecaca;
		color: #dc2626;
		padding: 0.75rem;
		border-radius: 8px;
		margin-bottom: 0.5rem;
		font-size: 0.875rem;
	}

	[data-theme="dark"] .file-error-message {
		background: rgba(220, 38, 38, 0.1);
		border-color: rgba(220, 38, 38, 0.3);
		color: #fca5a5;
	}

	@media (max-width: 768px) {
		.page-title {
			font-size: 2rem;
		}

		.form-container {
			padding: 1.5rem;
		}

		.form-actions {
			flex-direction: column;
		}

		.btn {
			width: 100%;
		}

		.confirmation-card {
			padding: 2rem 1.5rem;
		}

		.confirmation-icon {
			font-size: 3rem;
		}

		.confirmation-title {
			font-size: 1.5rem;
		}

		.file-upload-label {
			padding: 1rem;
			flex-direction: column;
			gap: 0.5rem;
		}

		.uploaded-file-info {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.75rem;
		}

		.file-details {
			width: 100%;
		}
	}
</style>