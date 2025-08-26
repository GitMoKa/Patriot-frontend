<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { notificationStore } from '../stores/notifications.js';
  import { languageStore } from '../stores/language';

  export let isOpen = false;
  export let onClose = () => {};

  let notifications = [];
  let currentLanguage = 'en';

  const unsubscribeNotifications = notificationStore.subscribe(store => {
    notifications = store.notifications;
  });

  const unsubscribeLanguage = languageStore.subscribe(lang => {
    currentLanguage = lang;
  });

  onMount(() => {
    if (isOpen) {
      notificationStore.fetchNotifications();
    }
    return () => {
      unsubscribeNotifications();
      unsubscribeLanguage();
    };
  });

  $: if (isOpen) {
    notificationStore.fetchNotifications();
  }

  const handleDismiss = (notificationId) => {
    notificationStore.dismiss([notificationId]);
  };

  const handleDismissAll = () => {
    notificationStore.dismissAll();
  };

  const handleNotificationClick = (notification) => {
    // Mark notification as seen if it's unread
    if (!notification.isSeen) {
      notificationStore.dismiss([notification.id]);
    }
    
    // Redirect based on notification type and recordId
    if (notification.type && notification.recordId) {
      const redirectPath = `/client/${notification.type}s/${notification.recordId}`;
      console.log('Redirecting to:', redirectPath);
      goto(redirectPath);
      
      // Close the notification sidebar
      onClose();
    } else {
      console.warn('Notification missing type or recordId:', notification);
    }
  };
</script>

{#if isOpen}
  <!-- Backdrop for mobile/tablet - click to close -->
  <div 
    class="fixed inset-0 bg-transparent z-30 md:hidden"
    on:click={onClose}
  ></div>
  
  <!-- Dropdown Menu -->
  <div class="notification-dropdown">
    <!-- Header -->
    <div class="notification-header">
      <h3 class="notification-title">Notifications</h3>
      {#if notifications.length > 0}
        <button 
          on:click={handleDismissAll} 
          class="dismiss-all-btn"
          title="Dismiss All"
        >
          Clear All
        </button>
      {/if}
    </div>
    
    <!-- Content -->
    <div class="notification-content">
      {#if notifications.length === 0}
        <div class="no-notifications">
          <div class="no-notifications-icon">🔔</div>
          <p class="no-notifications-text">No notifications</p>
          <p class="no-notifications-subtext">You're all caught up!</p>
        </div>
      {:else}
        <div class="notification-list">
          {#each notifications as notification (notification.id)}
            <div 
              class="notification-item {!notification.isSeen ? 'unread' : 'read'}"
              on:click={() => handleNotificationClick(notification)}
            >
              <div class="notification-content-wrapper">
                <div class="notification-text">
                  <p class="notification-item-title">{notification.title[currentLanguage] || notification.title.en}</p>
                  {#if notification.content}
                    <p class="notification-item-content">{notification.content[currentLanguage] || notification.content.en}</p>
                  {/if}
                </div>
                <button
                  on:click|stopPropagation={() => handleDismiss(notification.id)}
                  class="dismiss-btn {currentLanguage === 'ar' ? 'dismiss-btn-rtl' : 'dismiss-btn-ltr'}"
                  title="Dismiss"
                >
                  ×
                </button>
              </div>
              {#if !notification.isSeen}
                <div class="unread-indicator"></div>
              {/if}
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .notification-dropdown {
    position: absolute;
    top: 100%;
    right: 0;
    width: 380px;
    max-width: 90vw;
    max-height: 500px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
    border: 1px solid var(--color-border, #e5e7eb);
    z-index: 50;
    overflow: hidden;
    animation: dropdownSlide 0.2s ease-out;
  }

  /* Dark theme support */
  :global([data-theme="dark"]) .notification-dropdown {
    background: var(--color-surface, #374151);
    border-color: var(--color-border-dark, #4b5563);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
  }

  @keyframes dropdownSlide {
    from {
      opacity: 0;
      transform: translateY(-10px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  /* Header */
  .notification-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid var(--color-border, #e5e7eb);
    background: var(--color-background, white);
  }

  :global([data-theme="dark"]) .notification-header {
    border-bottom-color: var(--color-border-dark, #4b5563);
    background: var(--color-surface, #374151);
  }

  .notification-title {
    font-size: 18px;
    font-weight: 600;
    color: var(--color-text, #111827);
    margin: 0;
  }

  :global([data-theme="dark"]) .notification-title {
    color: var(--color-text-dark, #f9fafb);
  }

  .dismiss-all-btn {
    padding: 6px 12px;
    font-size: 12px;
    font-weight: 500;
    color: #dc2626;
    background: transparent;
    border: 1px solid #dc2626;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .dismiss-all-btn:hover {
    background: #dc2626;
    color: white;
  }

  /* Content */
  .notification-content {
    max-height: 400px;
    overflow-y: auto;
  }

  /* Custom scrollbar */
  .notification-content::-webkit-scrollbar {
    width: 6px;
  }

  .notification-content::-webkit-scrollbar-track {
    background: var(--color-background, #f9fafb);
  }

  .notification-content::-webkit-scrollbar-thumb {
    background: var(--color-border, #d1d5db);
    border-radius: 3px;
  }

  .notification-content::-webkit-scrollbar-thumb:hover {
    background: var(--color-border-hover, #9ca3af);
  }

  /* No notifications state */
  .no-notifications {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
    text-align: center;
  }

  .no-notifications-icon {
    font-size: 48px;
    margin-bottom: 12px;
    opacity: 0.5;
  }

  .no-notifications-text {
    font-size: 16px;
    font-weight: 500;
    color: var(--color-text, #374151);
    margin: 0 0 4px 0;
  }

  .no-notifications-subtext {
    font-size: 14px;
    color: var(--color-text-secondary, #6b7280);
    margin: 0;
  }

  :global([data-theme="dark"]) .no-notifications-text {
    color: var(--color-text-dark, #d1d5db);
  }

  :global([data-theme="dark"]) .no-notifications-subtext {
    color: var(--color-text-secondary-dark, #9ca3af);
  }

  /* Notification list */
  .notification-list {
    padding: 0;
  }

  .notification-item {
    position: relative;
    padding: 16px 20px;
    border-bottom: 1px solid var(--color-border, #f3f4f6);
    transition: background-color 0.2s ease;
    cursor: pointer;
  }

  .notification-item:last-child {
    border-bottom: none;
  }

  .notification-item:hover {
    background: var(--color-hover, #f9fafb);
  }

  .notification-item.unread {
    background: var(--color-unread, #eff6ff);
    border-left: 3px solid #3b82f6;
  }

  .notification-item.unread:hover {
    background: var(--color-unread-hover, #dbeafe);
  }

  :global([data-theme="dark"]) .notification-item {
    border-bottom-color: var(--color-border-dark, #4b5563);
  }

  :global([data-theme="dark"]) .notification-item:hover {
    background: var(--color-hover-dark, #4b5563);
  }

  :global([data-theme="dark"]) .notification-item.unread {
    background: var(--color-unread-dark, #1e3a8a);
    border-left-color: #60a5fa;
  }

  :global([data-theme="dark"]) .notification-item.unread:hover {
    background: var(--color-unread-hover-dark, #1e40af);
  }

  .notification-content-wrapper {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
  }

  .notification-text {
    flex: 1;
    min-width: 0;
  }

  .notification-item-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--color-text, #111827);
    margin: 0 0 4px 0;
    line-height: 1.4;
  }

  .notification-item.unread .notification-item-title {
    color: var(--color-text-unread, #1e40af);
  }

  .notification-item-content {
    font-size: 13px;
    color: var(--color-text-secondary, #6b7280);
    margin: 0;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .notification-item.unread .notification-item-content {
    color: var(--color-text-secondary-unread, #1d4ed8);
  }

  :global([data-theme="dark"]) .notification-item-title {
    color: var(--color-text-dark, #f9fafb);
  }

  :global([data-theme="dark"]) .notification-item-content {
    color: var(--color-text-secondary-dark, #d1d5db);
  }

  :global([data-theme="dark"]) .notification-item.unread .notification-item-title {
    color: var(--color-text-unread-dark, #93c5fd);
  }

  :global([data-theme="dark"]) .notification-item.unread .notification-item-content {
    color: var(--color-text-secondary-unread-dark, #60a5fa);
  }

  /* Dismiss button */
  .dismiss-btn {
    width: 20px;
    height: 20px;
    border: none;
    background: transparent;
    color: var(--color-text-tertiary, #9ca3af);
    font-size: 16px;
    line-height: 1;
    cursor: pointer;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    flex-shrink: 0;
  }

  .dismiss-btn:hover {
    background: var(--color-error-light, #fee2e2);
    color: var(--color-error, #dc2626);
  }

  .dismiss-btn-rtl {
    order: -1;
  }

  .dismiss-btn-ltr {
    order: 1;
  }

  :global([data-theme="dark"]) .dismiss-btn {
    color: var(--color-text-tertiary-dark, #6b7280);
  }

  :global([data-theme="dark"]) .dismiss-btn:hover {
    background: var(--color-error-dark, #7f1d1d);
    color: var(--color-error-light, #fca5a5);
  }

  /* Unread indicator */
  .unread-indicator {
    position: absolute;
    top: 18px;
    right: 8px;
    width: 8px;
    height: 8px;
    background: #3b82f6;
    border-radius: 50%;
    border: 2px solid white;
  }

  :global([data-theme="dark"]) .unread-indicator {
    border-color: var(--color-surface, #374151);
  }

  /* RTL support */
  :global([dir="rtl"]) .notification-dropdown {
    right: auto;
    left: 0;
  }

  :global([dir="rtl"]) .notification-item.unread {
    border-left: none;
    border-right: 3px solid #3b82f6;
  }

  :global([dir="rtl"]) .unread-indicator {
    right: auto;
    left: 8px;
  }

  /* Mobile responsive */
  @media (max-width: 768px) {
    .notification-dropdown {
      width: 100vw;
      max-width: none;
      right: -20px;
      border-radius: 0;
      border-left: none;
      border-right: none;
    }

    :global([dir="rtl"]) .notification-dropdown {
      left: -20px;
    }
  }
</style>
