<script>
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/auth.js';
	import { languageStore, t } from '$lib/stores/language.js';
	import { themeStore } from '$lib/stores/theme.js';
	import { authService } from '$lib/services/auth.js';
	
	let formData = {
		fullName: '',
		email: '',
		password: '',
		confirmPassword: ''
	};
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
	
	async function handleSignupStep1() {
		// Validation
		if (!formData.fullName || !formData.email || !formData.password || !formData.confirmPassword) {
			error = currentLang === 'ar' ? 'جميع الحقول مطلوبة' : 'All fields are required';
			return;
		}
		
		if (!isValidEmail(formData.email)) {
			error = currentLang === 'ar' ? 'البريد الإلكتروني غير صحيح' : 'Invalid email address';
			return;
		}
		
		if (formData.password !== formData.confirmPassword) {
			error = currentLang === 'ar' ? 'كلمات المرور غير متطابقة' : 'Passwords do not match';
			return;
		}
		
		if (formData.password.length < 8) {
			error = currentLang === 'ar' 
				? 'كلمة المرور يجب أن تكون 8 أحرف على الأقل'
				: 'Password must be at least 8 characters long';
			return;
		}
		
		isLoading = true;
		error = '';
		
		try {
			// Create account with email, password, and name
			const response = await authService.register({
				name: formData.fullName,
				email: formData.email,
				password: formData.password
			});
			
			// If tokens are returned, store them and proceed to step 2
			if (response.accessToken && response.refreshToken) {
				// Tokens are already stored by authService.register()
				goto('/client/signup/step2');
			} else {
				error = currentLang === 'ar' 
					? 'فشل في إنشاء الحساب - لم يتم إرجاع الرموز المميزة'
					: 'Account creation failed - no tokens returned';
			}
			
		} catch (err) {
			error = err.message || (currentLang === 'ar' ? 'فشل في إنشاء الحساب' : 'Failed to create account');
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
			handleSignupStep1();
		}
	}
</script>

<svelte:head>
	<title>{currentLang === 'ar' ? 'إنشاء حساب - الخطوة 1' : 'Sign Up - Step 1'} - Patriot Glass Factory</title>
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
				<div class="step active">1</div>
				<div class="step-line"></div>
				<div class="step">2</div>
			</div>
			
			<!-- Title -->
			<h1 class="signup-title">
				{currentLang === 'ar' ? 'إنشاء حساب - الخطوة 1' : 'Create Account - Step 1'}
			</h1>
			<p class="signup-subtitle">
				{currentLang === 'ar' ? 'أدخل بيانات تسجيل الدخول' : 'Enter your login credentials'}
			</p>
			
			<!-- Error Message -->
			{#if error}
				<div class="error-message">
					{error}
				</div>
			{/if}
			
			<!-- Signup Form -->
			<form class="signup-form" on:submit|preventDefault={handleSignupStep1}>
				<div class="form-group">
					<label for="fullName" class="form-label">
						{currentLang === 'ar' ? 'الاسم الكامل' : 'Full Name'}
					</label>
					<input
						type="text"
						id="fullName"
						bind:value={formData.fullName}
						class="form-input"
						placeholder={currentLang === 'ar' ? 'أدخل اسمك الكامل' : 'Enter your full name'}
						required
						disabled={isLoading}
						on:keypress={handleKeyPress}
					/>
				</div>

				<div class="form-group">
					<label for="email" class="form-label">
						{currentLang === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}
					</label>
					<input
						type="email"
						id="email"
						bind:value={formData.email}
						class="form-input"
						placeholder={currentLang === 'ar' ? 'أدخل بريدك الإلكتروني' : 'Enter your email'}
						required
						disabled={isLoading}
						on:keypress={handleKeyPress}
					/>
				</div>

				<div class="form-group">
					<label for="password" class="form-label">
						{currentLang === 'ar' ? 'كلمة المرور' : 'Password'}
					</label>
					<input
						type="password"
						id="password"
						bind:value={formData.password}
						class="form-input"
						placeholder={currentLang === 'ar' ? 'أدخل كلمة المرور' : 'Enter your password'}
						required
						disabled={isLoading}
						on:keypress={handleKeyPress}
					/>
				</div>

				<div class="form-group">
					<label for="confirmPassword" class="form-label">
						{currentLang === 'ar' ? 'تأكيد كلمة المرور' : 'Confirm Password'}
					</label>
					<input
						type="password"
						id="confirmPassword"
						bind:value={formData.confirmPassword}
						class="form-input"
						placeholder={currentLang === 'ar' ? 'أعد إدخال كلمة المرور' : 'Re-enter your password'}
						required
						disabled={isLoading}
						on:keypress={handleKeyPress}
					/>
				</div>

				<button
					type="submit"
					class="signup-button"
					disabled={isLoading}
				>
					{#if isLoading}
						<span class="loading-spinner"></span>
					{/if}
					{isLoading 
						? (currentLang === 'ar' ? 'جاري الإنشاء...' : 'Creating...') 
						: (currentLang === 'ar' ? 'التالي' : 'Next')
					}
				</button>
			</form>
			
			<!-- Links -->
			<div class="signup-links">
				<p>
					{currentLang === 'ar' ? 'لديك حساب بالفعل؟' : 'Already have an account?'}
					<a href="/login" class="login-link">
						{currentLang === 'ar' ? 'تسجيل الدخول' : 'Sign In'}
					</a>
				</p>
			</div>
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
		max-width: 450px;
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

	.step-line {
		width: 60px;
		height: 2px;
		background: #e2e8f0;
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

	.form-input {
		padding: 1rem 1.25rem;
		border: 2px solid #e5e7eb;
		border-radius: 12px;
		font-size: 1rem;
		transition: all 0.3s ease;
		background: white;
		color: #1f2937;
	}

	.form-input:focus {
		outline: none;
		border-color: #667eea;
		box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
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

	.signup-button {
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
		margin-top: 1rem;
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

	.signup-links {
		text-align: center;
		margin-top: 2rem;
		padding-top: 2rem;
		border-top: 1px solid #e5e7eb;
	}

	[data-theme="dark"] .signup-links {
		border-top-color: #374151;
	}

	.signup-links p {
		color: #6b7280;
		margin: 0;
	}

	[data-theme="dark"] .signup-links p {
		color: #9ca3af;
	}

	.login-link {
		color: #667eea;
		text-decoration: none;
		font-weight: 600;
		margin-left: 0.5rem;
		transition: color 0.3s ease;
	}

	.login-link:hover {
		color: #764ba2;
		text-decoration: underline;
	}

	[data-theme="dark"] .login-link {
		color: #818cf8;
	}

	[data-theme="dark"] .login-link:hover {
		color: #a78bfa;
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
	}
</style>