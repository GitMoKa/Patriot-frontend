import { apiService } from './api.js';

export class DriverService {
	// Get driver statistics
	async getDriverStatistics(driverId) {
		try {
			// Get available for delivery orders (completed, no driver assigned)
			const availableResponse = await apiService.get('/orders?status=completed&driver=null');
			const availableOrders = availableResponse.results || availableResponse || [];
			
			// Get out for delivery orders (out-for-delivery, assigned to current driver)
			const outForDeliveryResponse = await apiService.get(`/orders?status=out-for-delivery&driver=${driverId}`);
			const outForDeliveryOrders = outForDeliveryResponse.results || outForDeliveryResponse || [];
			
			// Get delivered orders (delivered, assigned to current driver)
			const deliveredResponse = await apiService.get(`/orders?status=delivered&driver=${driverId}`);
			const deliveredOrders = deliveredResponse.results || deliveredResponse || [];
			
			return {
				availableForDelivery: availableOrders.length,
				outForDelivery: outForDeliveryOrders.length,
				delivered: deliveredOrders.length
			};
		} catch (error) {
			throw new Error('Failed to fetch driver statistics: ' + error.message);
		}
	}

	// Get available orders for delivery
	async getAvailableOrders() {
		try {
			const response = await apiService.get('/orders?status=completed&driver=null');
			return response.results || response || [];
		} catch (error) {
			throw new Error('Failed to fetch available orders: ' + error.message);
		}
	}

	// Get out for delivery orders for current driver
	async getOutForDeliveryOrders(driverId) {
		try {
			const response = await apiService.get(`/orders?status=out-for-delivery&driver=${driverId}`);
			return response.results || response || [];
		} catch (error) {
			throw new Error('Failed to fetch out for delivery orders: ' + error.message);
		}
	}

	// Get delivered orders for current driver
	async getDeliveredOrders(driverId) {
		try {
			const response = await apiService.get(`/orders?status=delivered&driver=${driverId}`);
			return response.results || response || [];
		} catch (error) {
			throw new Error('Failed to fetch delivered orders: ' + error.message);
		}
	}

	// Take an order for delivery
	async takeOrder(orderId, driverId) {
		try {
			const response = await apiService.patch(`/orders/${orderId}`, {
				driverId: driverId
			});
			return response;
		} catch (error) {
			throw new Error('Failed to take order: ' + error.message);
		}
	}

	// Send delivery codes
	async sendDeliveryCodes(orderId) {
		try {
			const response = await apiService.post(`/orders/${orderId}/send-codes`, {});
			return response;
		} catch (error) {
			throw new Error('Failed to send delivery codes: ' + error.message);
		}
	}

	// Verify delivery code
	async verifyDeliveryCode(orderId, code) {
		try {
			const response = await apiService.post(`/orders/${orderId}/verify-codes`, {
				code: code
			});
			return response;
		} catch (error) {
			throw new Error('Failed to verify delivery code: ' + error.message);
		}
	}

	// Get order details
	async getOrderDetails(orderId) {
		try {
			const response = await apiService.get(`/orders/${orderId}`);
			return response;
		} catch (error) {
			throw new Error('Failed to fetch order details: ' + error.message);
		}
	}
}

export const driverService = new DriverService();