<script>
  import { createEventDispatcher } from 'svelte';
  import { authStore } from '../stores/auth.js';
  import { themeStore } from '../stores/theme.js';
  import { languageStore, t } from '../stores/language.js';
  import { goto } from '$app/navigation';

  export let isOpen = false;
  export let onClose = () => {};

  const dispatch = createEventDispatcher();

  $: currentTheme = $themeStore;
  $: currentLang = $languageStore;
  $: user = $authStore.user;
  
  // Check if user is a driver based on permissions
  function isDriver(user) {
    return user?.permissions?.accessType === 'driver';
  }

  function toggleTheme() {
    themeStore.toggle();
  }

  function toggleLanguage() {
    languageStore.toggle();
  }

  function handleLogout() {
    authStore.logout();
    onClose();
    goto('/about');
  }

  function navigateTo(path) {
    goto(path);
    onClose();
  }
</script>

{#if isOpen}
  <!-- Backdrop -->
  <div 
    class="fixed inset-0 bg-black bg-opacity-50 z-40"
    on:click={onClose}
  ></div>
  
  <!-- Sidebar -->
  <div class="user-profile-sidebar">
    <!-- Header -->
    <div class="sidebar-header">
      <div class="user-info">
        {#if user?.photoUrl}
          <img 
            src={user.photoUrl} 
            alt="Profile" 
            class="profile-avatar-large"
            on:error={(e) => {
              e.target.style.display = 'none';
              e.target.nextElementSibling?.style.setProperty('display', 'flex');
            }}
          />
          <div class="profile-avatar-placeholder-large" style="display: none;">
            <span>{user?.name?.[0]?.toUpperCase() || 'U'}</span>
          </div>
        {:else}
          <div class="profile-avatar-placeholder-large">
            <span>{user?.name?.[0]?.toUpperCase() || 'U'}</span>
          </div>
        {/if}
        <div class="user-details">
          <h3 class="user-name">{user?.name || 'User'}</h3>
          <p class="user-email">{user?.email || ''}</p>
        </div>
      </div>
      <button class="close-btn" on:click={onClose}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>

    <!-- Menu Items -->
    <div class="sidebar-content">
      <!-- Navigation Links -->
      <div class="menu-section">
        <h4 class="section-title">{t('navigation')}</h4>
        
        {#if isDriver(user)}
          <!-- Driver Navigation -->
          <button class="menu-item" on:click={() => navigateTo('/driver')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M9 22V12H15V22" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>
              {#if currentLang === 'ar'}
                لوحة التحكم
              {:else}
                Dashboard
              {/if}
            </span>
          </button>
          
          <button class="menu-item" on:click={() => navigateTo('/driver/available-orders')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 16V8C20.9996 7.64928 20.9071 7.30481 20.7315 7.00116C20.556 6.69751 20.3037 6.44536 20 6.27L13 2.27C12.696 2.09446 12.3511 2.00205 12 2.00205C11.6489 2.00205 11.304 2.09446 11 2.27L4 6.27C3.69626 6.44536 3.44398 6.69751 3.26846 7.00116C3.09294 7.30481 3.00036 7.64928 3 8V16C3.00036 16.3507 3.09294 16.6952 3.26846 16.9988C3.44398 17.3025 3.69626 17.5546 4 17.73L11 21.73C11.304 21.9055 11.6489 21.9979 12 21.9979C12.3511 21.9979 12.696 21.9055 13 21.73L20 17.73C20.3037 17.5546 20.556 17.3025 20.7315 16.9988C20.9071 16.6952 20.9996 16.3507 21 16Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M7.5 4.21L12 6.81L16.5 4.21M12 22.08V12M3 8L12 12L21 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>
              {#if currentLang === 'ar'}
                الطلبات المتاحة
              {:else}
                Available Orders
              {/if}
            </span>
          </button>
          
          <button class="menu-item" on:click={() => navigateTo('/driver/out-for-delivery')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 3H3L3.4 5M7 13H17L21 5H5.4M7 13L5.4 5M7 13L4.7 15.3C4.3 15.7 4.6 16.5 5.1 16.5H17M17 13V16.5M9 19.5C9.8 19.5 10.5 20.2 10.5 21S9.8 22.5 9 22.5 7.5 21.8 7.5 21 8.2 19.5 9 19.5ZM20 19.5C20.8 19.5 21.5 20.2 21.5 21S20.8 22.5 20 22.5 18.5 21.8 18.5 21 19.2 19.5 20 19.5Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>
              {#if currentLang === 'ar'}
                قيد التوصيل
              {:else}
                Out for Delivery
              {/if}
            </span>
          </button>
          
          <button class="menu-item" on:click={() => navigateTo('/driver/delivered')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>
              {#if currentLang === 'ar'}
                تم التسليم
              {:else}
                Delivered
              {/if}
            </span>
          </button>
        {:else}
          <!-- Client Navigation -->
          <button class="menu-item" on:click={() => navigateTo('/dashboard')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M9 22V12H15V22" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>
              {#if currentLang === 'ar'}
                لوحة التحكم
              {:else}
                Dashboard
              {/if}
            </span>
          </button>
          
          
          <button class="menu-item" on:click={() => navigateTo('/client/products')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 16V8C20.9996 7.64928 20.9071 7.30481 20.7315 7.00116C20.556 6.69751 20.3037 6.44536 20 6.27L13 2.27C12.696 2.09446 12.3511 2.00205 12 2.00205C11.6489 2.00205 11.304 2.09446 11 2.27L4 6.27C3.69626 6.44536 3.44398 6.69751 3.26846 7.00116C3.09294 7.30481 3.00036 7.64928 3 8V16C3.00036 16.3507 3.09294 16.6952 3.26846 16.9988C3.44398 17.3025 3.69626 17.5546 4 17.73L11 21.73C11.304 21.9055 11.6489 21.9979 12 21.9979C12.3511 21.9979 12.696 21.9055 13 21.73L20 17.73C20.3037 17.5546 20.556 17.3025 20.7315 16.9988C20.9071 16.6952 20.9996 16.3507 21 16Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M7.5 4.21L12 6.81L16.5 4.21M12 22.08V12M3 8L12 12L21 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>
              {#if currentLang === 'ar'}
                المنتجات
              {:else}
                Products
              {/if}
            </span>
          </button>
          
          <button class="menu-item" on:click={() => navigateTo('/client/favorites')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>
              {#if currentLang === 'ar'}
                المفضلة
              {:else}
                Favorites
              {/if}
            </span>
          </button>
          
          <button class="menu-item" on:click={() => navigateTo('/client/orders/create')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 5V19M5 12H19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>
              {#if currentLang === 'ar'}
                طلب جديد
              {:else}
                New Order
              {/if}
            </span>
          </button>
          
          <button class="menu-item" on:click={() => navigateTo('/client/profile')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>{t('profile')}</span>
          </button>
          
          <button class="menu-item" on:click={() => navigateTo('/complaints')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>
              {#if currentLang === 'ar'}
                تقديم شكوى
              {:else}
                Complaints
              {/if}
            </span>
          </button>
        {/if}
      </div>

      <!-- Settings -->
      <div class="menu-section">
        <h4 class="section-title">{t('settings')}</h4>
        
        <!-- Theme Toggle -->
        <button class="menu-item" on:click={toggleTheme}>
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
          <span>{t('toggleTheme')}</span>
        </button>

        <!-- Language Toggle -->
        <button class="menu-item" on:click={toggleLanguage}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 8L3 6L5 4M3 6H13C16.866 6 20 9.134 20 13S16.866 20 13 20H9M13 14L15 16L13 18M15 16H5C1.134 16 -2 12.866 -2 9S1.134 2 5 2H9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span>{currentLang === 'ar' ? 'English' : 'العربية'}</span>
        </button>
      </div>

      <!-- Logout -->
      <div class="menu-section">
        <button class="menu-item logout-item" on:click={handleLogout}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 21H5C4.44772 21 4 20.5523 4 20V4C4 3.44772 4.44772 3 5 3H9M16 17L21 12L16 7M21 12H9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span>{t('logout')}</span>
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .user-profile-sidebar {
    position: fixed;
    top: 70px; /* Height of the navbar */
    right: 0;
    width: 320px;
    height: calc(100vh - 70px); /* Full height minus navbar height */
    background: white;
    border-left: 1px solid var(--color-border, #e5e7eb);
    z-index: 50;
    overflow-y: auto;
    animation: slideIn 0.3s ease-out;
  }

  :global([data-theme="dark"]) .user-profile-sidebar {
    background: var(--color-surface, #374151);
    border-left-color: var(--color-border-dark, #4b5563);
  }

  :global([dir="rtl"]) .user-profile-sidebar {
    right: auto;
    left: 0;
    border-left: none;
    border-right: 1px solid var(--color-border, #e5e7eb);
  }

  :global([data-theme="dark"][dir="rtl"]) .user-profile-sidebar {
    border-right-color: var(--color-border-dark, #4b5563);
  }

  @keyframes slideIn {
    from {
      transform: translateX(100%);
    }
    to {
      transform: translateX(0);
    }
  }

  :global([dir="rtl"]) .user-profile-sidebar {
    animation: slideInRtl 0.3s ease-out;
  }

  @keyframes slideInRtl {
    from {
      transform: translateX(-100%);
    }
    to {
      transform: translateX(0);
    }
  }

  .sidebar-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 24px;
    border-bottom: 1px solid var(--color-border, #e5e7eb);
  }

  :global([data-theme="dark"]) .sidebar-header {
    border-bottom-color: var(--color-border-dark, #4b5563);
  }

  .user-info {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
  }

  .profile-avatar-large {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid var(--color-border, #e5e7eb);
  }

  .profile-avatar-placeholder-large {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: var(--color-primary, #3b82f6);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    font-weight: 600;
    border: 2px solid var(--color-border, #e5e7eb);
  }

  .user-details {
    flex: 1;
    min-width: 0;
  }

  .user-name {
    font-size: 18px;
    font-weight: 600;
    color: var(--color-text, #111827);
    margin: 0 0 4px 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .user-email {
    font-size: 14px;
    color: var(--color-text-secondary, #6b7280);
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  :global([data-theme="dark"]) .user-name {
    color: var(--color-text-dark, #f9fafb);
  }

  :global([data-theme="dark"]) .user-email {
    color: var(--color-text-secondary-dark, #d1d5db);
  }

  .close-btn {
    width: 32px;
    height: 32px;
    border: none;
    background: transparent;
    color: var(--color-text-tertiary, #9ca3af);
    cursor: pointer;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    flex-shrink: 0;
  }

  .close-btn:hover {
    background: var(--color-gray-100, #f3f4f6);
    color: var(--color-text, #111827);
  }

  :global([data-theme="dark"]) .close-btn:hover {
    background: var(--color-gray-700, #4b5563);
    color: var(--color-text-dark, #f9fafb);
  }

  .sidebar-content {
    padding: 0;
  }

  .menu-section {
    padding: 16px 0;
    border-bottom: 1px solid var(--color-border, #f3f4f6);
  }

  .menu-section:last-child {
    border-bottom: none;
  }

  :global([data-theme="dark"]) .menu-section {
    border-bottom-color: var(--color-border-dark, #4b5563);
  }

  .section-title {
    font-size: 12px;
    font-weight: 600;
    color: var(--color-text-tertiary, #9ca3af);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin: 0 0 8px 0;
    padding: 0 24px;
  }

  :global([data-theme="dark"]) .section-title {
    color: var(--color-text-tertiary-dark, #6b7280);
  }

  .menu-item {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 24px;
    border: none;
    background: transparent;
    color: var(--color-text, #374151);
    font-size: 14px;
    font-weight: 500;
    text-align: left;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .menu-item:hover {
    background: var(--color-gray-50, #f9fafb);
    color: var(--color-text, #111827);
  }

  .menu-item.logout-item {
    color: #dc2626;
  }

  .menu-item.logout-item:hover {
    background: #fef2f2;
    color: #dc2626;
  }

  :global([data-theme="dark"]) .menu-item {
    color: var(--color-text-dark, #d1d5db);
  }

  :global([data-theme="dark"]) .menu-item:hover {
    background: var(--color-gray-700, #4b5563);
    color: var(--color-text-dark, #f9fafb);
  }

  :global([data-theme="dark"]) .menu-item.logout-item {
    color: #fca5a5;
  }

  :global([data-theme="dark"]) .menu-item.logout-item:hover {
    background: #7f1d1d;
    color: #fca5a5;
  }

  /* Mobile responsive */
  @media (max-width: 768px) {
    .user-profile-sidebar {
      width: 100vw;
      right: 0;
    }

    :global([dir="rtl"]) .user-profile-sidebar {
      left: 0;
    }
  }
</style>