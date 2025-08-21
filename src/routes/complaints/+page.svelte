<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/auth.js';
	import { complaintsService } from '$lib/services/complaints.js';
	import { languageStore, t } from '$lib/stores/language.js';
	import { themeStore } from '$lib/stores/theme.js';
	
	// Reactive statements
	$: isAuthenticated = $authStore.isAuthenticated;
	$: user = $authStore.user;
	$: currentLang = $languageStore;
	$: currentTheme = $themeStore;
	
	// Form state
	let description = '';
	let isSubmitting = false;
	let error = null;
	let showConfirmation = false;
	
	// Form validation
	$: isFormValid = description.trim().length > 0;
	
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
				userId: userId
			};
			
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
	}
</style>