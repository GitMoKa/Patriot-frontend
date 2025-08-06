<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/auth.js';
	import { languageStore, t } from '$lib/stores/language.js';
	import { themeStore } from '$lib/stores/theme.js';
	
	let email = '';
	let password = '';
	let isLoading = false;
	let error = '';
	
	// Reactive statements
	$: currentLang = $languageStore;
	$: currentTheme = $themeStore;
	$: isAuthenticated = $authStore.isAuthenticated;
	
	// Redirect if already authenticated
	$: if (isAuthenticated) {
		goto('/client');
	}
	
	async function handleLogin() {
		if (!email || !password) {
			error = t('requiredField');
			return;
		}
		
		if (!isValidEmail(email)) {
			error = t('invalidEmail');
			return;
		}
		
		isLoading = true;
		error = '';
		
		try {
			await authStore.login(email, password);
			// Redirect will happen automatically due to reactive statement
		} catch (err) {
			error = err.message || t('loginFailed');
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
			handleLogin();
		}
	}
</script>

<svelte:head>
	<title>{t('login')} - Patriot Glass Factory</title>
</svelte:head>

<div class="login-page" data-theme={currentTheme}>
	<div class="login-background">
		<img src="/glass-factory-bg.jpg" alt="Glass Factory Background" />
		<div class="login-overlay"></div>
	</div>
	
	<div class="login-container">
		<div class="login-card">
			<!-- Logo -->
			<div class="logo">
				<div class="logo-icon">
					<div class="diamond"></div>
				</div>
			</div>
			
			<!-- Title -->
			<h1 class="login-title">{t('login')}</h1>
			
			<!-- Error Message -->
			{#if error}
				<div class="error-message">
					{error}
				</div>
			{/if}
			
			<!-- Login Form -->
			<form class="login-form" on:submit|preventDefault={handleLogin}>
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
				
				<!-- Password Field -->
				<div class="form-group">
					<label for="password">{t('password')}</label>
					<input
						id="password"
						type="password"
						bind:value={password}
						placeholder={t('password')}
						required
						disabled={isLoading}
						on:keypress={handleKeyPress}
						class="form-input"
					/>
				</div>
				
				<!-- Login Button -->
				<button 
					type="submit" 
					class="login-button"
					disabled={isLoading}
				>
					{#if isLoading}
						<div class="spinner"></div>
						{t('loading')}
					{:else}
						{t('login')}
					{/if}
				</button>
			</form>
			
			<!-- Links -->
			<div class="login-links">
				<a href="/client/forgot-password" class="forgot-link">
					{t('forgotPassword')}
				</a>
				
				<a href="/client/signup/step1" class="signup-link">
					{t('dontHaveAccount')}
				</a>
			</div>
		</div>
	</div>
</div>

<style>
	.login-page {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		position: relative;
		padding: 1rem;
	}

	.login-background {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		z-index: -2;
	}

	.login-background img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.login-overlay {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: linear-gradient(135deg, rgba(59, 130, 246, 0.9), rgba(37, 99, 235, 0.8));
		z-index: -1;
	}

	.login-container {
		width: 100%;
		max-width: 400px;
		z-index: 1;
	}

	.login-card {
		background: rgba(255, 255, 255, 0.95);
		backdrop-filter: blur(10px);
		border-radius: 20px;
		padding: 3rem 2rem;
		box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.2);
		text-align: center;
	}

	[data-theme="dark"] .login-card {
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
	.login-title {
		font-size: 2.5rem;
		font-weight: 700;
		color: var(--text-primary, #1e293b);
		margin-bottom: 2rem;
		text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	[data-theme="dark"] .login-title {
		color: #f1f5f9;
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
	.login-form {
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

	/* Login Button */
	.login-button {
		width: 100%;
		background: linear-gradient(135deg, #1e40af, #3b82f6);
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
		box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4);
	}

	.login-button:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 6px 20px rgba(59, 130, 246, 0.6);
	}

	.login-button:active:not(:disabled) {
		transform: translateY(0);
	}

	.login-button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		transform: none;
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
	.login-links {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.forgot-link,
	.signup-link {
		color: #3b82f6;
		text-decoration: none;
		font-weight: 500;
		transition: color 0.3s ease;
		font-size: 0.875rem;
	}

	.forgot-link:hover,
	.signup-link:hover {
		color: #2563eb;
		text-decoration: underline;
	}

	[data-theme="dark"] .forgot-link,
	[data-theme="dark"] .signup-link {
		color: #60a5fa;
	}

	[data-theme="dark"] .forgot-link:hover,
	[data-theme="dark"] .signup-link:hover {
		color: #93c5fd;
	}

	/* RTL Support */
	[dir="rtl"] .form-group {
		text-align: right;
	}

	[dir="rtl"] .login-title {
		text-align: center;
	}

	/* Responsive */
	@media (max-width: 480px) {
		.login-card {
			padding: 2rem 1.5rem;
		}

		.login-title {
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

