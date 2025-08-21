<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/auth.js';
	import { themeStore } from '$lib/stores/theme.js';
	import { languageStore, t } from '$lib/stores/language.js';
	import NotificationBell from '$lib/components/NotificationBell.svelte';
	import NotificationSidebar from '$lib/components/NotificationSidebar.svelte';
	import UserProfileSidebar from '$lib/components/UserProfileSidebar.svelte';
	import '$lib/styles/global.css';
	import '$lib/styles/components.css';
	
	// Reactive statements
	$: currentTheme = $themeStore;
	$: currentLang = $languageStore;
	$: isAuthenticated = $authStore.isAuthenticated;
	$: user = $authStore.user;
	$: currentPath = $page.url.pathname;
	
	// No navigation items needed anymore
	
	// Show mobile menu and sidebars
	let showMobileMenu = false;
	let isNotificationSidebarOpen = false;
	let isUserProfileSidebarOpen = false;

	function toggleNotificationSidebar() {
		console.log('Toggling notification sidebar. Current state:', isNotificationSidebarOpen);
		isNotificationSidebarOpen = !isNotificationSidebarOpen;
		console.log('New state:', isNotificationSidebarOpen);
		// Close user profile sidebar if open
		if (isNotificationSidebarOpen && isUserProfileSidebarOpen) {
			isUserProfileSidebarOpen = false;
		}
	}

	function toggleUserProfileSidebar() {
		isUserProfileSidebarOpen = !isUserProfileSidebarOpen;
		// Close notification sidebar if open
		if (isUserProfileSidebarOpen && isNotificationSidebarOpen) {
			isNotificationSidebarOpen = false;
		}
	}

	function toggleMobileMenu() {
		showMobileMenu = !showMobileMenu;
	}

	function closeMobileMenu() {
		showMobileMenu = false;
	}
	
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
		goto('/about');
	}
	
	// Check if user is a driver based on permissions
	function isDriver(user) {
		return user?.permissions?.accessType === 'driver';
	}
	
	// Check if user is a client (no permissions or role is 'user')
	function isClient(user) {
		return !user?.permissions || user?.role === 'user';
	}
	
	// Check if route requires authentication
	function requiresAuth(path) {
		const publicRoutes = [
			'/login', 
			'/client', 
			'/client/signup', 
			'/client/signup/step1', 
			'/client/signup/step2', 
			'/client/forgot-password', 
			'/client/reset-password',
			'/about',
			'/client/products'
		];
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
				<a href={isAuthenticated ? (isDriver(user) ? '/driver' : '/dashboard') : '/about'} class="logo" on:click={closeMobileMenu}>
					<div class="logo-icon">
						<img src="/patriot-logo.jpg" alt="Patriot Logo" class="logo-img" />
					</div>
					<span class="logo-text">Patriot</span>
				</a>
				
				<!-- Desktop Navigation -->
				<div class="nav-links">
					{#if !isAuthenticated}
						<!-- Public navigation -->
						<a href="/about" class="nav-link" class:active={currentPath === '/about'}>
							{#if currentLang === 'ar'}
								من نحن
							{:else}
								About Us
							{/if}
						</a>
						<a href="/client/products" class="nav-link" class:active={currentPath === '/client/products'}>
							{#if currentLang === 'ar'}
								المنتجات
							{:else}
								Products
							{/if}
						</a>
					{:else if isDriver(user)}
						<!-- Driver navigation -->
						<a href="/driver" class="nav-link" class:active={currentPath === '/driver'}>
							{#if currentLang === 'ar'}
								لوحة التحكم
							{:else}
								Dashboard
							{/if}
						</a>
						<a href="/driver/available-orders" class="nav-link" class:active={currentPath === '/driver/available-orders'}>
							{#if currentLang === 'ar'}
								الطلبات المتاحة
							{:else}
								Available Orders
							{/if}
						</a>
						<a href="/driver/out-for-delivery" class="nav-link" class:active={currentPath === '/driver/out-for-delivery'}>
							{#if currentLang === 'ar'}
								قيد التوصيل
							{:else}
								Out for Delivery
							{/if}
						</a>
						<a href="/driver/delivered" class="nav-link" class:active={currentPath === '/driver/delivered'}>
							{#if currentLang === 'ar'}
								تم التسليم
							{:else}
								Delivered
							{/if}
						</a>
					{:else}
						<!-- Client navigation -->
						<a href="/dashboard" class="nav-link" class:active={currentPath === '/dashboard'}>
							{#if currentLang === 'ar'}
								لوحة التحكم
							{:else}
								Dashboard
							{/if}
						</a>
						<a href="/client/products" class="nav-link" class:active={currentPath === '/client/products'}>
							{#if currentLang === 'ar'}
								المنتجات
							{:else}
								Products
							{/if}
						</a>
						<a href="/client/favorites" class="nav-link" class:active={currentPath === '/client/favorites'}>
							{#if currentLang === 'ar'}
								المفضلة
							{:else}
								Favorites
							{/if}
						</a>
						<a href="/client/orders/create" class="nav-link" class:active={currentPath === '/client/orders/create'}>
							{#if currentLang === 'ar'}
								طلب جديد
							{:else}
								New Order
							{/if}
						</a>
						<a href="/complaints" class="nav-link" class:active={currentPath === '/complaints'}>
							{#if currentLang === 'ar'}
								تقديم شكوى
							{:else}
								Complaints
							{/if}
						</a>
					{/if}
				</div>
				
				<!-- Controls -->
				<div class="nav-controls">
					<!-- Notification Bell -->
					{#if isAuthenticated}
						<div class="notification-bell-wrapper">
							<NotificationBell on:click={toggleNotificationSidebar} />
							<NotificationSidebar isOpen={isNotificationSidebarOpen} onClose={toggleNotificationSidebar} />
						</div>
					{/if}
					
					<!-- Auth Controls -->
					{#if isAuthenticated}
						<button class="user-profile-btn" on:click={toggleUserProfileSidebar}>
							{#if user?.photoUrl}
								<img 
									src={user.photoUrl} 
									alt="Profile" 
									class="profile-avatar"
									on:error={(e) => {
										console.error('Failed to load profile image:', user.photoUrl);
										e.target.style.display = 'none';
										e.target.nextElementSibling?.style.setProperty('display', 'flex');
									}}
								/>
								<div class="profile-avatar-placeholder" style="display: none;">
									<span>{user?.name?.[0]?.toUpperCase() || 'U'}</span>
								</div>
							{:else}
								<div class="profile-avatar-placeholder">
									<span>{user?.name?.[0]?.toUpperCase() || 'U'}</span>
								</div>
							{/if}
						</button>
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
					<!-- Mobile Navigation Links -->
					<div class="mobile-nav-links">
						{#if !isAuthenticated}
							<!-- Public navigation -->
							<a href="/about" class="mobile-nav-link" class:active={currentPath === '/about'} on:click={closeMobileMenu}>
								{#if currentLang === 'ar'}
									من نحن
								{:else}
									About Us
								{/if}
							</a>
							<a href="/client/products" class="mobile-nav-link" class:active={currentPath === '/client/products'} on:click={closeMobileMenu}>
								{#if currentLang === 'ar'}
									المنتجات
								{:else}
									Products
								{/if}
							</a>
						{:else if isDriver(user)}
							<!-- Driver mobile navigation -->
							<a href="/driver" class="mobile-nav-link" class:active={currentPath === '/driver'} on:click={closeMobileMenu}>
								{#if currentLang === 'ar'}
									لوحة التحكم
								{:else}
									Dashboard
								{/if}
							</a>
							<a href="/driver/available-orders" class="mobile-nav-link" class:active={currentPath === '/driver/available-orders'} on:click={closeMobileMenu}>
								{#if currentLang === 'ar'}
									الطلبات المتاحة
								{:else}
									Available Orders
								{/if}
							</a>
							<a href="/driver/out-for-delivery" class="mobile-nav-link" class:active={currentPath === '/driver/out-for-delivery'} on:click={closeMobileMenu}>
								{#if currentLang === 'ar'}
									قيد التوصيل
								{:else}
									Out for Delivery
								{/if}
							</a>
							<a href="/driver/delivered" class="mobile-nav-link" class:active={currentPath === '/driver/delivered'} on:click={closeMobileMenu}>
								{#if currentLang === 'ar'}
									تم التسليم
								{:else}
									Delivered
								{/if}
							</a>
						{:else}
							<!-- Client mobile navigation -->
							<a href="/dashboard" class="mobile-nav-link" class:active={currentPath === '/dashboard'} on:click={closeMobileMenu}>
								{#if currentLang === 'ar'}
									لوحة التحكم
								{:else}
									Dashboard
								{/if}
							</a>
							<a href="/client/products" class="mobile-nav-link" class:active={currentPath === '/client/products'} on:click={closeMobileMenu}>
								{#if currentLang === 'ar'}
									المنتجات
								{:else}
									Products
								{/if}
							</a>
							<a href="/client/favorites" class="mobile-nav-link" class:active={currentPath === '/client/favorites'} on:click={closeMobileMenu}>
								{#if currentLang === 'ar'}
									المفضلة
								{:else}
									Favorites
								{/if}
							</a>
							<a href="/client/orders/create" class="mobile-nav-link" class:active={currentPath === '/client/orders/create'} on:click={closeMobileMenu}>
								{#if currentLang === 'ar'}
									طلب جديد
								{:else}
									New Order
								{/if}
							</a>
							<a href="/complaints" class="mobile-nav-link" class:active={currentPath === '/complaints'} on:click={closeMobileMenu}>
								{#if currentLang === 'ar'}
									تقديم شكوى
								{:else}
									Complaints
								{/if}
							</a>
						{/if}
					</div>
					
					<!-- Mobile Auth Controls -->
					{#if !isAuthenticated}
						<div class="mobile-auth-buttons">
							<a href="/login" class="mobile-auth-btn login-btn" on:click={closeMobileMenu}>{t('login')}</a>
							<a href="/client/signup/step1" class="mobile-auth-btn signup-btn" on:click={closeMobileMenu}>{t('signup')}</a>
						</div>
					{:else}
						<p class="mobile-user-info">Welcome, {user?.name || 'User'}!</p>
						<p class="mobile-note">Use your profile picture to access menu options.</p>
					{/if}
				</div>
			</div>
		{/if}
	</header>
	
	<!-- User Profile Sidebar -->
	<UserProfileSidebar isOpen={isUserProfileSidebarOpen} onClose={() => isUserProfileSidebarOpen = false} />

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
	.nav-links {
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

	/* User Profile Button */
	.user-profile-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		border-radius: 50%;
		overflow: hidden;
		border: 2px solid var(--border-color);
		background: transparent;
		cursor: pointer;
		transition: all 0.2s ease;
		padding: 0;
	}

	.user-profile-btn:hover {
		border-color: #3b82f6;
		transform: scale(1.05);
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	/* Profile Avatar */
	.user-profile {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.profile-avatar {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		object-fit: cover;
		border: 2px solid var(--border-color);
		transition: all 0.3s ease;
	}

	.profile-avatar:hover {
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}

	.profile-avatar-placeholder {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		background: linear-gradient(135deg, #3b82f6, #2563eb);
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
		font-weight: 600;
		font-size: 16px;
		border: 2px solid var(--border-color);
		transition: all 0.3s ease;
		cursor: pointer;
	}

	.profile-avatar-placeholder:hover {
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
		transform: scale(1.05);
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

	/* Responsive Design */
	@media (max-width: 768px) {
		.nav-links {
			display: none;
		}

		.mobile-menu-toggle {
			display: block;
		}

		.auth-buttons {
			display: none;
		}
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

	.mobile-nav-links {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-bottom: 1rem;
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

	.mobile-user-info {
		padding: 16px 20px 8px;
		margin: 0;
		font-size: 16px;
		font-weight: 600;
		color: var(--text-primary);
		text-align: center;
	}

	.mobile-note {
		padding: 0 20px 16px;
		margin: 0;
		font-size: 14px;
		color: var(--text-secondary);
		text-align: center;
		font-style: italic;
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

	/* Notification Bell Wrapper */
	.notification-bell-wrapper {
		position: relative;
		display: inline-block;
	}
</style>

