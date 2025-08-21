import { apiService } from './api.js';
import { authStore } from '../stores/auth.js';

export class OrdersService {
	// Create new order
	async createOrder(orderData) {
		try {
			let userId = null;
			authStore.subscribe(state => {
				if (state.user) {
					userId = state.user.id;
				}
			})();

			const dataToSend = { ...orderData };
			if (userId) {
				dataToSend.userId = userId;
			}

			const response = await apiService.post('/orders', dataToSend);
			return response;
		} catch (error) {
			throw new Error('Failed to create order: ' + error.message);
		}
	}

	// Get all orders
	async getAllOrders() {
		try {
			// Check authentication first
			let userId = null;
			authStore.subscribe(state => {
				if (state.user) {
					userId = state.user.id;
				}
			})();

			if (!userId) {
				throw new Error('401 Not Authorized: User not logged in.');
			}

			// Make authenticated API call
			const response = await apiService.get('/orders');

			// Handle API response structure: { results: Order[], total: number }
			let orders = [];
			if (response.results && Array.isArray(response.results)) {
				orders = response.results;
			} else if (Array.isArray(response)) {
				orders = response;
			}

			// Filter orders by user ID (check user.id in the order object)
			const userOrders = orders.filter(order => order.user?.id === userId);
			
			return {
				total: response.total || userOrders.length,
				results: response.results || userOrders,
				orders: userOrders
			};
		} catch (error) {
			throw new Error('Failed to fetch orders: ' + error.message);
		}
	}

	// Get order by ID
	async getOrderById(id) {
		try {
			const response = await apiService.get(`/orders/${id}`);
			return response;
		} catch (error) {
			throw new Error('Failed to fetch order: ' + error.message);
		}
	}

	// Update order
	async updateOrder(id, orderData) {
		try {
			const response = await apiService.patch(`/orders/${id}`, orderData);
			return response;
		} catch (error) {
			throw new Error('Failed to update order: ' + error.message);
		}
	}

	// Delete order
	async deleteOrder(id) {
		try {
			const response = await apiService.delete(`/orders/${id}`);
			return response;
		} catch (error) {
			throw new Error('Failed to delete order: ' + error.message);
		}
	}

	// Get order items
	async getOrderItems(orderId) {
		try {
			const response = await apiService.get(`/orders/${orderId}/items`);
			
			// Handle API response structure
			if (response.result && Array.isArray(response.result)) {
				return {
					results: response.results,
					items: response.result
				};
			}
			
			// Fallback for different response structures
			return Array.isArray(response) ? response : [];
		} catch (error) {
			throw new Error('Failed to fetch order items: ' + error.message);
		}
	}

	// Add item to order
	async addOrderItem(orderId, itemData) {
		try {
			const response = await apiService.post(`/orders/${orderId}/items`, itemData);
			return response;
		} catch (error) {
			throw new Error('Failed to add order item: ' + error.message);
		}
	}

	// Update order item
	async updateOrderItem(orderId, itemId, itemData) {
		try {
			const response = await apiService.patch(`/orders/${orderId}/items/${itemId}`, itemData);
			return response;
		} catch (error) {
			throw new Error('Failed to update order item: ' + error.message);
		}
	}

	// Delete order item
	async deleteOrderItem(orderId, itemId) {
		try {
			const response = await apiService.delete(`/orders/${orderId}/items/${itemId}`);
			return response;
		} catch (error) {
			throw new Error('Failed to delete order item: ' + error.message);
		}
	}

	// Verify order code
	async verifyOrderCode(orderId, code) {
		try {
			const response = await apiService.post(`/orders/${orderId}/verify-code`, { code });
			return response;
		} catch (error) {
			throw new Error('Failed to verify order code: ' + error.message);
		}
	}

	// Get order statistics for dashboard
	async getOrderStatistics() {
		try {
			const response = await apiService.get('/home/me/statistics');
			return response;
		} catch (error) {
			throw new Error('Failed to fetch order statistics: ' + error.message);
		}
	}
}

export const ordersService = new OrdersService();

