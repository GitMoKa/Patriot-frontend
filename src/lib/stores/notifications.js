import { writable } from 'svelte/store';
import { getNotifications, getUnreadCount, dismissNotifications } from '../services/notifications';

const createNotificationStore = () => {
  const { subscribe, set, update } = writable({
    notifications: [],
    unreadCount: 0,
    total: 0
  });

  const fetchUnreadCount = async () => {
    try {
      const data = await getUnreadCount();
      update(store => ({ ...store, unreadCount: data.count }));
    } catch (error) {
      console.error('Failed to fetch unread notification count:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const data = await getNotifications();
      update(store => ({
        ...store,
        notifications: data.results.sort((a, b) => {
          // First sort by isSeen status (unseen first)
          if (a.isSeen !== b.isSeen) {
            return a.isSeen ? 1 : -1;
          }
          // Then sort by creation date (newest first) if both have same seen status
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        }),
        total: data.total
      }));
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const dismiss = async (notificationIds) => {
    try {
      await dismissNotifications(notificationIds);
      await fetchNotifications();
      await fetchUnreadCount();
    } catch (error) {
      console.error('Failed to dismiss notifications:', error);
    }
  };

  const dismissAll = async () => {
    try {
      const currentStore = await new Promise(resolve => {
        const unsubscribe = subscribe(store => {
          unsubscribe();
          resolve(store);
        });
      });
      
      const allNotificationIds = currentStore.notifications.map(n => n.id);
      if (allNotificationIds.length > 0) {
        await dismiss(allNotificationIds);
      }
    } catch (error) {
      console.error('Failed to dismiss all notifications:', error);
    }
  };

  return {
    subscribe,
    fetchUnreadCount,
    fetchNotifications,
    dismiss,
    dismissAll
  };
};

export const notificationStore = createNotificationStore();
