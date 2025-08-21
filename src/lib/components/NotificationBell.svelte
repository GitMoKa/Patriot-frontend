<script>
  import { onMount, onDestroy } from 'svelte';
  import { createEventDispatcher } from 'svelte';
  import { notificationStore } from '../stores/notifications';
  import { authStore } from '../stores/auth';

  export let onClick = () => {};
  
  const dispatch = createEventDispatcher();

  let unreadCount = 0;
  let isAuthenticated = false;
  let pollInterval;

  const unsubscribeAuth = authStore.subscribe(store => {
    isAuthenticated = store.isAuthenticated;
  });

  const unsubscribeNotifications = notificationStore.subscribe(store => {
    unreadCount = store.unreadCount;
  });

  $: if (isAuthenticated) {
    notificationStore.fetchUnreadCount();
    if (!pollInterval) {
      pollInterval = setInterval(() => {
        notificationStore.fetchUnreadCount();
      }, 30000); // Poll every 30 seconds
    }
  } else {
    if (pollInterval) {
      clearInterval(pollInterval);
      pollInterval = null;
    }
  }

  onDestroy(() => {
    if (pollInterval) {
      clearInterval(pollInterval);
    }
    unsubscribeAuth();
    unsubscribeNotifications();
  });
</script>

<button on:click={() => { 
    console.log('Notification bell clicked!'); 
    onClick(); 
    dispatch('click'); 
  }} class="notification-bell-btn" title="Notifications">
  <img src="/bell.png" alt="Notifications" class="bell-icon" />
  {#if unreadCount > 0}
    <span class="notification-badge">
      {unreadCount > 99 ? '99+' : unreadCount}
    </span>
  {/if}
</button>

<style>
  .notification-bell-btn {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border: none;
    background: transparent;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    padding: 8px;
  }

  .notification-bell-btn:hover {
    background-color: var(--color-gray-100, rgba(0, 0, 0, 0.05));
  }

  .notification-bell-btn:active {
    transform: scale(0.95);
  }

  .bell-icon {
    width: 24px;
    height: 24px;
    transition: filter 0.2s ease;
    /* Filter to match the app's color palette - converts black to current text color */
    filter: brightness(0) saturate(100%) invert(0.4) sepia(0) saturate(0) hue-rotate(0deg) brightness(0.6) contrast(1);
  }

  /* Light theme - darker icon */
  :global([data-theme="light"]) .bell-icon {
    filter: brightness(0) saturate(100%) invert(0.2) sepia(0) saturate(0) hue-rotate(0deg) brightness(0.4) contrast(1);
  }

  /* Dark theme - lighter icon */
  :global([data-theme="dark"]) .bell-icon {
    filter: brightness(0) saturate(100%) invert(0.8) sepia(0) saturate(0) hue-rotate(0deg) brightness(1.2) contrast(1);
  }

  .notification-bell-btn:hover .bell-icon {
    /* Slightly brighter on hover */
    filter: brightness(0) saturate(100%) invert(0.6) sepia(0) saturate(0) hue-rotate(0deg) brightness(0.8) contrast(1);
  }

  :global([data-theme="light"]) .notification-bell-btn:hover .bell-icon {
    filter: brightness(0) saturate(100%) invert(0.1) sepia(0) saturate(0) hue-rotate(0deg) brightness(0.2) contrast(1);
  }

  :global([data-theme="dark"]) .notification-bell-btn:hover .bell-icon {
    filter: brightness(0) saturate(100%) invert(1) sepia(0) saturate(0) hue-rotate(0deg) brightness(1.4) contrast(1);
  }

  .notification-badge {
    position: absolute;
    top: -2px;
    right: -2px;
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 18px;
    height: 18px;
    padding: 0 4px;
    background-color: #ef4444; /* Red-500 */
    color: white;
    font-size: 11px;
    font-weight: 600;
    border-radius: 9px;
    border: 2px solid var(--color-background, white);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    line-height: 1;
  }

  /* Ensure badge is visible in both themes */
  :global([data-theme="dark"]) .notification-badge {
    border-color: var(--color-background, #1f2937);
  }

  /* Animation for new notifications */
  .notification-badge {
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0%, 100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.1);
    }
  }
</style>
