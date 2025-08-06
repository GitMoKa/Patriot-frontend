<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/auth.js';
	import { themeStore } from '$lib/stores/theme.js';
	import { languageStore, t } from '$lib/stores/language.js';
	
	// Reactive statements
	$: currentTheme = $themeStore;
	$: currentLang = $languageStore;
	$: isAuthenticated = $authStore.isAuthenticated;
	$: user = $authStore.user;
	$: currentPath = $page.url.pathname;
	
	// Navigation items
	$: navigationItems = [
		{ 
			href: '/client', 
			label: t('home'), 
			icon: 'home',
			public: true 
		},
		{ 
			href: '/client/orders', 
			label: t('myOrders'), 
			icon: 'orders',
			public: false 
		},
		{ 
			href: '/client/profile', 
			label: t('profile'), 
			icon: 'profile',
			public: false 
		},
		{ 
			href: '/client/password', 
			label: t('password'), 
			icon: 'password',
			public: false 
		}
	];
	
	// Show mobile menu
	let showMobileMenu = false;
	
	onMount(() => {
		// Initialize auth state
		authStore.init();
		
		// Set document direction based on language
		updateDocumentDirection();
	});
	
	// Update document direction when language changes
	$: if (currentLang) {
		updateDocumentDirection();
	}
	
	function updateDocumentDirection() {
		if (typeof document !== 'undefined') {
			document.documentElement.dir = currentLang === 'ar' ? 'rtl' : 'ltr';
			document.documentElement.lang = currentLang;
		}
	}
	
	function toggleTheme() {
		themeStore.toggle();
	}
	
	function toggleLanguage() {
		languageStore.toggle();
	}
	
	function handleLogout() {
		authStore.logout();
		goto('/client');
	}
	
	function toggleMobileMenu() {
		showMobileMenu = !showMobileMenu;
	}
	
	function closeMobileMenu() {
		showMobileMenu = false;
	}
	
	// Check if route requires authentication
	function requiresAuth(path) {
		const publicRoutes = ['/login', '/client/signup', '/client/signup/step1', '/client/signup/step2', '/client/forgot-password', '/client/reset-password'];
		return !publicRoutes.includes(path) && !path.startsWith('/products/');
	}
	
	// Redirect to login if not authenticated and route requires auth
	$: if (typeof window !== 'undefined' && requiresAuth(currentPath) && !isAuthenticated) {
		goto('/login');
	}
</script>

<svelte:head>
	<meta name="viewport" content="width=device-width, initial-scale=1.0" />
	<meta name="description" content="Patriot Glass Factory - Premium glass manufacturing and custom orders" />
</svelte:head>

<div class="app" data-theme={currentTheme} dir={currentLang === 'ar' ? 'rtl' : 'ltr'}>
	<!-- Navigation Header -->
	<header class="header">
		<nav class="navbar">
			<div class="nav-container">
				<!-- Logo -->
				<a href="/" class="logo" on:click={closeMobileMenu}>
					<div class="logo-icon">
						<img src="/patriot-logo.jpg" alt="Patriot Logo" class="logo-img" />
					</div>
					<span class="logo-text">Patriot</span>
				</a>
				
				<!-- Desktop Navigation -->
				<div class="nav-links desktop-nav">
					{#each navigationItems as item}
						{#if item.public || isAuthenticated}
							<a 
								href={item.href} 
								class="nav-link"
								class:active={currentPath === item.href}
								on:click={closeMobileMenu}
							>
								<span class="nav-icon">
									{#if item.icon === 'home'}
										<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
											<path d="M3 9L12 2L21 9V20C21 20.5523 20.5523 21 20 21H4C3.44772 21 3 20.5523 3 20V9Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
											<path d="M9 22V12H15V22" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
										</svg>
									{:else if item.icon === 'orders'}
										<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
											<path d="M9 11H15M9 15H15M17 21H7C5.89543 21 5 20.1046 5 19V5C5 3.89543 5.89543 3 7 3H12.5858C12.851 3 13.1054 3.10536 13.2929 3.29289L19.7071 9.70711C19.8946 9.89464 20 10.149 20 10.4142V19C20 20.1046 19.1046 21 18 21H17Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
										</svg>
									{:else if item.icon === 'profile'}
										<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
											<path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
										</svg>
									{:else if item.icon === 'password'}
										<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
											<rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
											<circle cx="12" cy="16" r="1" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
											<path d="M7 11V7C7 5.67392 7.52678 4.40215 8.46447 3.46447C9.40215 2.52678 10.6739 2 12 2C13.3261 2 14.5979 2.52678 15.5355 3.46447C16.4732 4.40215 17 5.67392 17 7V11" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
										</svg>
									{/if}
								</span>
								{item.label}
							</a>
						{/if}
					{/each}
				</div>
				
				<!-- Controls -->
				<div class="nav-controls">
					<!-- Theme Toggle -->
					<button class="control-btn theme-toggle" on:click={toggleTheme} title={t('toggleTheme')}>
						{#if currentTheme === 'dark'}
							<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
								<circle cx="12" cy="12" r="5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
								<path d="M12 1V3M12 21V23M4.22 4.22L5.64 5.64M18.36 18.36L19.78 19.78M1 12H3M21 12H23M4.22 19.78L5.64 18.36M18.36 5.64L19.78 4.22" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
							</svg>
						{:else}
							<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
								<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
							</svg>
						{/if}
					</button>
					
					<!-- Language Toggle -->
					<button class="control-btn language-toggle" on:click={toggleLanguage} title={t('toggleLanguage')}>
						<span class="language-text">
							{currentLang === 'ar' ? 'EN' : 'ع'}
						</span>
					</button>
					
					<!-- Auth Controls -->
					{#if isAuthenticated}
						<div class="user-menu">
							<span class="user-name">{user?.name || t('user')}</span>
							<button class="control-btn logout-btn" on:click={handleLogout} title={t('logout')}>
								<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
									<path d="M9 21H5C4.44772 21 4 20.5523 4 20V4C4 3.44772 4.44772 3 5 3H9M16 17L21 12L16 7M21 12H9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
								</svg>
							</button>
						</div>
					{:else}
						<div class="auth-buttons">
							<a href="/login" class="auth-btn login-btn">{t('login')}</a>
							<a href="/client/signup/step1" class="auth-btn signup-btn">{t('signup')}</a>
						</div>
					{/if}
					
					<!-- Mobile Menu Toggle -->
					<button class="mobile-menu-toggle" on:click={toggleMobileMenu}>
						<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
							<path d="M3 12H21M3 6H21M3 18H21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
						</svg>
					</button>
				</div>
			</div>
		</nav>
		
		<!-- Mobile Navigation -->
		{#if showMobileMenu}
			<div class="mobile-nav" class:show={showMobileMenu}>
				<div class="mobile-nav-content">
					{#each navigationItems as item}
						{#if item.public || isAuthenticated}
							<a 
								href={item.href} 
								class="mobile-nav-link"
								class:active={currentPath === item.href}
								on:click={closeMobileMenu}
							>
								<span class="nav-icon">
									{#if item.icon === 'home'}
										<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
											<path d="M3 9L12 2L21 9V20C21 20.5523 20.5523 21 20 21H4C3.44772 21 3 20.5523 3 20V9Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
											<path d="M9 22V12H15V22" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
										</svg>
									{:else if item.icon === 'orders'}
										<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
											<path d="M9 11H15M9 15H15M17 21H7C5.89543 21 5 20.1046 5 19V5C5 3.89543 5.89543 3 7 3H12.5858C12.851 3 13.1054 3.10536 13.2929 3.29289L19.7071 9.70711C19.8946 9.89464 20 10.149 20 10.4142V19C20 20.1046 19.1046 21 18 21H17Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
										</svg>
									{:else if item.icon === 'profile'}
										<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
											<path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
										</svg>
									{:else if item.icon === 'password'}
										<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
											<rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
											<circle cx="12" cy="16" r="1" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
											<path d="M7 11V7C7 5.67392 7.52678 4.40215 8.46447 3.46447C9.40215 2.52678 10.6739 2 12 2C13.3261 2 14.5979 2.52678 15.5355 3.46447C16.4732 4.40215 17 5.67392 17 7V11" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
										</svg>
									{/if}
								</span>
								{item.label}
							</a>
						{/if}
					{/each}
					
					<!-- Mobile Auth Controls -->
					{#if !isAuthenticated}
						<div class="mobile-auth-buttons">
							<a href="/login" class="mobile-auth-btn login-btn" on:click={closeMobileMenu}>{t('login')}</a>
							<a href="/client/signup/step1" class="mobile-auth-btn signup-btn" on:click={closeMobileMenu}>{t('signup')}</a>
						</div>
					{:else}
						<button class="mobile-logout-btn" on:click={handleLogout}>
							<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
								<path d="M9 21H5C4.44772 21 4 20.5523 4 20V4C4 3.44772 4.44772 3 5 3H9M16 17L21 12L16 7M21 12H9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
							</svg>
							{t('logout')}
						</button>
					{/if}
				</div>
			</div>
		{/if}
	</header>
	
	<!-- Main Content -->
	<main class="main-content">
		<slot />
	</main>
	
	<!-- Footer -->
	<footer class="footer">
		<div class="footer-container">
			<div class="footer-content">
				<div class="footer-section">
					<div class="footer-logo">
						<div class="logo-icon">
							<img src="/patriot-logo.jpg" alt="Patriot Logo" class="logo-img" />
						</div>
						<span class="logo-text">Patriot</span>
					</div>
					<p class="footer-description">
						{#if currentLang === 'ar'}
							مصنع باتريوت للزجاج - جودة عالية وخدمة متميزة
						{:else}
							Patriot Glass Factory - Premium quality and exceptional service
						{/if}
					</p>
				</div>
				
				<div class="footer-section">
					<h4>{t('quickLinks')}</h4>
					<ul class="footer-links">
						<li><a href="/client">{t('home')}</a></li>
						{#if isAuthenticated}
							<li><a href="/client/orders">{t('myOrders')}</a></li>
							<li><a href="/client/profile">{t('profile')}</a></li>
						{/if}
					</ul>
				</div>
				
				<div class="footer-section">
					<h4>{t('contact')}</h4>
					<div class="contact-info">
						<p>📧 info@patriotglass.com</p>
						<p>📞 +1 (555) 123-4567</p>
						<p>📍 123 Glass Street, City, Country</p>
					</div>
				</div>
			</div>
			
			<div class="footer-bottom">
				<p>&copy; 2024 Patriot Glass Factory. {t('allRightsReserved')}</p>
			</div>
		</div>
	</footer>
</div>

<style>
	/* Global Styles */
	:global(html) {
		scroll-behavior: smooth;
	}

	:global(body) {
		margin: 0;
		padding: 0;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
		line-height: 1.6;
		color: var(--text-primary);
		background: var(--bg-primary);
		transition: color 0.3s ease, background-color 0.3s ease;
	}

	:global(*) {
		box-sizing: border-box;
	}

	.app {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
	}

	/* Header */
	.header {
		background: var(--bg-primary);
		border-bottom: 1px solid var(--border-color);
		position: sticky;
		top: 0;
		z-index: 100;
		backdrop-filter: blur(10px);
	}

	.navbar {
		padding: 0 1rem;
	}

	.nav-container {
		max-width: 1200px;
		margin: 0 auto;
		display: flex;
		align-items: center;
		justify-content: space-between;
		height: 70px;
	}

	/* Logo */
	.logo {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		text-decoration: none;
		color: var(--text-primary);
		font-weight: 700;
		font-size: 1.25rem;
	}

	.logo-icon {
		width: 40px;
		height: 40px;
		background: white;
		border-radius: 8px;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		overflow: hidden; /* Ensure image doesn't overflow rounded corners */
	}

	.logo-img {
		width: 100%;
		height: 100%;
		object-fit: cover; /* Cover the area, cropping if necessary */
		border-radius: 8px; /* Match parent border-radius */
	}

	.logo-text {
		color: var(--text-primary);
	}

	/* Desktop Navigation */
	.desktop-nav {
		display: flex;
		align-items: center;
		gap: 2rem;
	}

	.nav-link {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		text-decoration: none;
		color: var(--text-secondary);
		font-weight: 500;
		padding: 0.5rem 1rem;
		border-radius: 8px;
		transition: all 0.3s ease;
	}

	.nav-link:hover,
	.nav-link.active {
		color: #3b82f6;
		background: rgba(59, 130, 246, 0.1);
	}

	.nav-icon {
		display: flex;
		align-items: center;
	}

	/* Controls */
	.nav-controls {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.control-btn {
		background: none;
		border: 2px solid var(--border-color);
		color: var(--text-secondary);
		padding: 0.5rem;
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.3s ease;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.control-btn:hover {
		border-color: #3b82f6;
		color: #3b82f6;
	}

	.language-toggle {
		padding: 0.5rem 0.75rem;
	}

	.language-text {
		font-weight: 600;
		font-size: 0.875rem;
	}

	/* User Menu */
	.user-menu {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.user-name {
		color: var(--text-primary);
		font-weight: 500;
	}

	/* Auth Buttons */
	.auth-buttons {
		display: flex;
		gap: 0.5rem;
	}

	.auth-btn {
		text-decoration: none;
		padding: 0.5rem 1rem;
		border-radius: 8px;
		font-weight: 500;
		transition: all 0.3s ease;
	}

	.login-btn {
		color: var(--text-secondary);
		border: 2px solid var(--border-color);
	}

	.login-btn:hover {
		color: #3b82f6;
		border-color: #3b82f6;
	}

	.signup-btn {
		background: linear-gradient(135deg, #3b82f6, #2563eb);
		color: white;
		border: 2px solid transparent;
	}

	.signup-btn:hover {
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
	}

	/* Mobile Menu Toggle */
	.mobile-menu-toggle {
		display: none;
		background: none;
		border: none;
		color: var(--text-secondary);
		cursor: pointer;
		padding: 0.5rem;
	}

	/* Mobile Navigation */
	.mobile-nav {
		display: none;
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		background: var(--bg-primary);
		border-bottom: 1px solid var(--border-color);
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	}

	.mobile-nav.show {
		display: block;
	}

	.mobile-nav-content {
		padding: 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.mobile-nav-link {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		text-decoration: none;
		color: var(--text-secondary);
		font-weight: 500;
		padding: 1rem;
		border-radius: 8px;
		transition: all 0.3s ease;
	}

	.mobile-nav-link:hover,
	.mobile-nav-link.active {
		color: #3b82f6;
		background: rgba(59, 130, 246, 0.1);
	}

	.mobile-auth-buttons {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-top: 1rem;
		padding-top: 1rem;
		border-top: 1px solid var(--border-color);
	}

	.mobile-auth-btn {
		text-decoration: none;
		padding: 1rem;
		border-radius: 8px;
		font-weight: 500;
		text-align: center;
		transition: all 0.3s ease;
	}

	.mobile-auth-btn.login-btn {
		color: var(--text-secondary);
		border: 2px solid var(--border-color);
	}

	.mobile-auth-btn.signup-btn {
		background: linear-gradient(135deg, #3b82f6, #2563eb);
		color: white;
		border: 2px solid transparent;
	}

	.mobile-logout-btn {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		background: none;
		border: none;
		color: #ef4444;
		font-weight: 500;
		padding: 1rem;
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.3s ease;
		margin-top: 1rem;
		border-top: 1px solid var(--border-color);
		width: 100%;
		justify-content: flex-start;
	}

	.mobile-logout-btn:hover {
		background: rgba(239, 68, 68, 0.1);
	}

	/* Main Content */
	.main-content {
		flex: 1;
		min-height: calc(100vh - 140px);
	}

	/* Footer */
	.footer {
		background: var(--bg-secondary);
		border-top: 1px solid var(--border-color);
		margin-top: auto;
	}

	.footer-container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 3rem 1rem 1rem;
	}

	.footer-content {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 2rem;
		margin-bottom: 2rem;
	}

	.footer-section h4 {
		color: var(--text-primary);
		margin-bottom: 1rem;
		font-weight: 600;
	}

	.footer-description {
		color: var(--text-secondary);
		line-height: 1.6;
	}

	.footer-links {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.footer-links li {
		margin-bottom: 0.5rem;
	}

	.footer-links a {
		color: var(--text-secondary);
		text-decoration: none;
		transition: color 0.3s ease;
	}

	.footer-links a:hover {
		color: #3b82f6;
	}

	.contact-info p {
		color: var(--text-secondary);
		margin: 0.5rem 0;
	}

	.footer-bottom {
		text-align: center;
		padding-top: 2rem;
		border-top: 1px solid var(--border-color);
		color: var(--text-secondary);
	}

	/* Responsive */
	@media (max-width: 768px) {
		.desktop-nav {
			display: none;
		}

		.mobile-menu-toggle {
			display: block;
		}

		.nav-controls {
			gap: 0.5rem;
		}

		.user-name {
			display: none;
		}

		.auth-buttons {
			display: none;
		}

		.footer-content {
			grid-template-columns: 1fr;
			text-align: center;
		}
	}

	/* RTL Support */
	[dir="rtl"] .nav-container {
		flex-direction: row-reverse;
	}

	[dir="rtl"] .logo {
		flex-direction: row-reverse;
	}

	[dir="rtl"] .nav-link {
		flex-direction: row-reverse;
	}

	[dir="rtl"] .mobile-nav-link {
		flex-direction: row-reverse;
	}

	[dir="rtl"] .mobile-logout-btn {
		flex-direction: row-reverse;
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

	/* Dark mode specific adjustments */
	[data-theme="dark"] .logo-icon {
		background: #334155;
	}

	[data-theme="dark"] .header {
		background: rgba(30, 41, 59, 0.95);
	}
</style>

