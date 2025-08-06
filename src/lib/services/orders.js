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
			const response = await apiService.get('/orders');
			let userId = null;
			authStore.subscribe(state => {
				if (state.user) {
					userId = state.user.id;
				}
			})();

			if (userId) {
				return response.filter(order => order.userId === userId);
			} else {
				throw new Error('401 Not Authorized: User not logged in.');
			}
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
			return response;
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
}

export const ordersService = new OrdersService();

