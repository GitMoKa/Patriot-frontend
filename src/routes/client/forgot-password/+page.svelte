<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/auth.js';
	import { languageStore, t } from '$lib/stores/language.js';
	import { themeStore } from '$lib/stores/theme.js';
	import { authService } from '$lib/services/auth.js';
	
	let email = '';
	let isLoading = false;
	let error = '';
	let success = '';
	let emailSent = false;
	
	// Reactive statements
	$: currentLang = $languageStore;
	$: currentTheme = $themeStore;
	$: isAuthenticated = $authStore.isAuthenticated;
	
	// Redirect if already authenticated
	$: if (isAuthenticated) {
		goto('/client');
	}
	
	async function handleForgotPassword() {
		if (!email) {
			error = t('requiredField');
			return;
		}
		
		if (!isValidEmail(email)) {
			error = t('invalidEmail');
			return;
		}
		
		isLoading = true;
		error = '';
		success = '';
		
		try {
			await authService.forgotPassword(email);
			
			success = currentLang === 'ar' 
				? 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني'
				: 'Password reset link has been sent to your email';
			
			emailSent = true;
			
		} catch (err) {
			error = err.message || (currentLang === 'ar' ? 'فشل في إرسال البريد الإلكتروني' : 'Failed to send email');
		} finally {
			isLoading = false;
		}
	}
	
	function isValidEmail(email) {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return emailRegex.test(email);
	}
	
	function handleKeyPress(event) {
		if (event.key === 'Enter') {
			handleForgotPassword();
		}
	}
	
	function resetForm() {
		email = '';
		error = '';
		success = '';
		emailSent = false;
	}
</script>

<svelte:head>
	<title>{t('forgotPassword')} - Patriot Glass Factory</title>
</svelte:head>

<div class="forgot-password-page" data-theme={currentTheme}>
	<div class="forgot-password-background">
		<img src="/glass-factory-bg.jpg" alt="Glass Factory Background" />
		<div class="forgot-password-overlay"></div>
	</div>
	
	<div class="forgot-password-container">
		<div class="forgot-password-card">
			<!-- Logo -->
			<div class="logo">
				<div class="logo-icon">
					<img src="/patriot-logo.jpg" alt="Patriot Glass Factory" class="logo-image" />
				</div>
			</div>
			
			<!-- Title -->
			<h1 class="forgot-password-title">{t('resetPassword')}</h1>
			
			{#if !emailSent}
				<!-- Description -->
				<p class="description">
					{#if currentLang === 'ar'}
						أدخل عنوان بريدك الإلكتروني وسنرسل لك رابط لإعادة تعيين كلمة المرور
					{:else}
						Enter your email address and we'll send you a link to reset your password
					{/if}
				</p>
				
				<!-- Error Message -->
				{#if error}
					<div class="error-message">
						{error}
					</div>
				{/if}
				
				<!-- Forgot Password Form -->
				<form class="forgot-password-form" on:submit|preventDefault={handleForgotPassword}>
					<!-- Email Field -->
					<div class="form-group">
						<label for="email">{t('email')}</label>
						<input
							id="email"
							type="email"
							bind:value={email}
							placeholder={t('email')}
							required
							disabled={isLoading}
							on:keypress={handleKeyPress}
							class="form-input"
						/>
					</div>
					
					<!-- Send Reset Link Button -->
					<button 
						type="submit" 
						class="reset-button"
						disabled={isLoading}
					>
						{#if isLoading}
							<div class="spinner"></div>
							{t('loading')}
						{:else}
							{#if currentLang === 'ar'}
								إرسال رابط إعادة التعيين
							{:else}
								Send Reset Link
							{/if}
						{/if}
					</button>
				</form>
			{:else}
				<!-- Success State -->
				<div class="success-state">
					<div class="success-icon">
						<svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
							<path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
						</svg>
					</div>
					
					<div class="success-message">
						{success}
					</div>
					
					<p class="success-description">
						{#if currentLang === 'ar'}
							تحقق من بريدك الإلكتروني واتبع التعليمات لإعادة تعيين كلمة المرور
						{:else}
							Check your email and follow the instructions to reset your password
						{/if}
					</p>
					
					<button class="try-again-button" on:click={resetForm}>
						{#if currentLang === 'ar'}
							إرسال إلى بريد إلكتروني آخر
						{:else}
							Send to different email
						{/if}
					</button>
				</div>
			{/if}
			
			<!-- Links -->
			<div class="forgot-password-links">
				<a href="/login" class="back-link">
					{#if currentLang === 'ar'}
						العودة إلى تسجيل الدخول
					{:else}
						Back to Login
					{/if}
				</a>
			</div>
		</div>
	</div>
</div>

<style>
	.forgot-password-page {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		position: relative;
		padding: 1rem;
	}

	.forgot-password-background {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		z-index: -2;
	}

	.forgot-password-background img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.forgot-password-overlay {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: linear-gradient(135deg, rgba(59, 130, 246, 0.9), rgba(37, 99, 235, 0.8));
		z-index: -1;
	}

	.forgot-password-container {
		width: 100%;
		max-width: 450px;
		z-index: 1;
	}

	.forgot-password-card {
		background: rgba(255, 255, 255, 0.95);
		backdrop-filter: blur(10px);
		border-radius: 20px;
		padding: 3rem 2rem;
		box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.2);
		text-align: center;
	}

	[data-theme="dark"] .forgot-password-card {
		background: rgba(30, 41, 59, 0.95);
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	/* Logo */
	.logo {
		margin-bottom: 2rem;
		display: flex;
		justify-content: center;
	}

	.logo-icon {
		width: 80px;
		height: 80px;
		background: white;
		border-radius: 16px;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
	}

	.diamond {
		width: 40px;
		height: 40px;
		background: linear-gradient(135deg, #3b82f6, #2563eb);
		transform: rotate(45deg);
		border-radius: 4px;
	}

	/* Title */
	.forgot-password-title {
		font-size: 2.5rem;
		font-weight: 700;
		color: var(--text-primary, #1e293b);
		margin-bottom: 1rem;
		text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	[data-theme="dark"] .forgot-password-title {
		color: #f1f5f9;
	}

	/* Description */
	.description {
		color: var(--text-secondary, #64748b);
		margin-bottom: 2rem;
		line-height: 1.6;
	}

	[data-theme="dark"] .description {
		color: #94a3b8;
	}

	/* Error Message */
	.error-message {
		background: #fef2f2;
		border: 1px solid #fecaca;
		color: #dc2626;
		padding: 0.75rem 1rem;
		border-radius: 8px;
		margin-bottom: 1.5rem;
		font-size: 0.875rem;
	}

	[data-theme="dark"] .error-message {
		background: rgba(220, 38, 38, 0.1);
		border-color: rgba(220, 38, 38, 0.3);
		color: #fca5a5;
	}

	/* Form */
	.forgot-password-form {
		margin-bottom: 2rem;
	}

	.form-group {
		margin-bottom: 1.5rem;
		text-align: left;
	}

	.form-group label {
		display: block;
		font-weight: 500;
		color: var(--text-primary, #374151);
		margin-bottom: 0.5rem;
		font-size: 0.875rem;
	}

	[data-theme="dark"] .form-group label {
		color: #d1d5db;
	}

	.form-input {
		width: 100%;
		padding: 1rem;
		border: 2px solid rgba(59, 130, 246, 0.2);
		border-radius: 12px;
		font-size: 1rem;
		background: rgba(255, 255, 255, 0.8);
		color: var(--text-primary, #1e293b);
		transition: all 0.3s ease;
		backdrop-filter: blur(5px);
	}

	.form-input:focus {
		outline: none;
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
		background: rgba(255, 255, 255, 0.95);
	}

	.form-input:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	[data-theme="dark"] .form-input {
		background: rgba(30, 41, 59, 0.8);
		color: #f1f5f9;
		border-color: rgba(148, 163, 184, 0.3);
	}

	[data-theme="dark"] .form-input:focus {
		background: rgba(30, 41, 59, 0.95);
		border-color: #3b82f6;
	}

	/* Reset Button */
	.reset-button {
		width: 100%;
		background: linear-gradient(135deg, #f59e0b, #d97706);
		color: white;
		border: none;
		padding: 1rem;
		font-size: 1.125rem;
		font-weight: 600;
		border-radius: 12px;
		cursor: pointer;
		transition: all 0.3s ease;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		box-shadow: 0 4px 15px rgba(245, 158, 11, 0.4);
	}

	.reset-button:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 6px 20px rgba(245, 158, 11, 0.6);
	}

	.reset-button:active:not(:disabled) {
		transform: translateY(0);
	}

	.reset-button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		transform: none;
	}

	/* Success State */
	.success-state {
		text-align: center;
	}

	.success-icon {
		margin-bottom: 1.5rem;
		display: flex;
		justify-content: center;
	}

	.success-message {
		background: #f0fdf4;
		border: 1px solid #bbf7d0;
		color: #16a34a;
		padding: 1rem;
		border-radius: 8px;
		margin-bottom: 1.5rem;
		font-weight: 500;
	}

	[data-theme="dark"] .success-message {
		background: rgba(22, 163, 74, 0.1);
		border-color: rgba(22, 163, 74, 0.3);
		color: #86efac;
	}

	.success-description {
		color: var(--text-secondary, #64748b);
		margin-bottom: 2rem;
		line-height: 1.6;
	}

	[data-theme="dark"] .success-description {
		color: #94a3b8;
	}

	.try-again-button {
		background: transparent;
		color: #3b82f6;
		border: 2px solid #3b82f6;
		padding: 0.75rem 1.5rem;
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.3s ease;
		font-weight: 500;
	}

	.try-again-button:hover {
		background: #3b82f6;
		color: white;
	}

	/* Spinner */
	.spinner {
		width: 20px;
		height: 20px;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-top: 2px solid white;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}

	/* Links */
	.forgot-password-links {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.back-link {
		color: #3b82f6;
		text-decoration: none;
		font-weight: 500;
		transition: color 0.3s ease;
		font-size: 0.875rem;
	}

	.back-link:hover {
		color: #2563eb;
		text-decoration: underline;
	}

	[data-theme="dark"] .back-link {
		color: #60a5fa;
	}

	[data-theme="dark"] .back-link:hover {
		color: #93c5fd;
	}

	/* RTL Support */
	[dir="rtl"] .form-group {
		text-align: right;
	}

	[dir="rtl"] .forgot-password-title {
		text-align: center;
	}

	/* Responsive */
	@media (max-width: 480px) {
		.forgot-password-card {
			padding: 2rem 1.5rem;
		}

		.forgot-password-title {
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
	}

	/* CSS Variables for theming */
	:root {
		--text-primary: #1e293b;
		--text-secondary: #64748b;
		--bg-primary: #ffffff;
		--bg-secondary: #f8fafc;
		--border-color: #e2e8f0;
	}

	[data-theme="dark"] {
		--text-primary: #f1f5f9;
		--text-secondary: #94a3b8;
		--bg-primary: #1e293b;
		--bg-secondary: #0f172a;
		--border-color: #334155;
	}
</style>

