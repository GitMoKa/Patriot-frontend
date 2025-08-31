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
			
			// If tokens are returned, store them and proceed to step 2 (address)
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
				<div class="step active">1</div>
				<div class="step-line"></div>
				<div class="step">2</div>
				<div class="step-line"></div>
				<div class="step">3</div>
			</div>
			
			<!-- Title -->
			<h1 class="page-title">
				{currentLang === 'ar' ? 'إنشاء حساب - الخطوة 1' : 'Create Account - Step 1'}
			</h1>
			<p class="page-subtitle">
				{currentLang === 'ar' ? 'أدخل بيانات تسجيل الدخول' : 'Enter your login credentials'}
			</p>
			
			<!-- Error Message -->
			{#if error}
				<div class="message message-error">
					{error}
				</div>
			{/if}
			
			<!-- Signup Form -->
			<form class="form" on:submit|preventDefault={handleSignupStep1}>
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
					class="btn btn-primary btn-lg"
					style="width: 100%;"
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
			<div class="form-links">
				<p>
					{currentLang === 'ar' ? 'لديك حساب بالفعل؟' : 'Already have an account?'}
					<a href="/login" class="form-link">
						{currentLang === 'ar' ? 'تسجيل الدخول' : 'Sign In'}
					</a>
				</p>
			</div>
		</div>
	</div>
</div>


