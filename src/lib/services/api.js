import { authService } from './auth.js';

// API Configuration and Base Service
const API_BASE_URL = '/api'; // Update this to your backend URL

class ApiService {
	constructor() {
		this.baseURL = API_BASE_URL;
		this.isRefreshing = false;
		this.failedQueue = [];
	}

	processQueue = (error, token = null) => {
		this.failedQueue.forEach(prom => {
			if (error) {
				prom.reject(error);
			} else {
				prom.resolve(token);
			}
		});

		this.failedQueue = [];
	};

	// Get auth token from localStorage
	getAuthToken() {
		if (typeof window !== 'undefined') {
			return localStorage.getItem('accessToken');
		}
		return null;
	}

	// Set auth token in localStorage
	setAuthToken(token) {
		if (typeof window !== 'undefined') {
			localStorage.setItem('accessToken', token);
		}
	}

	getRefreshToken() {
		if (typeof window !== 'undefined') {
			return localStorage.getItem('refreshToken');
		}
		return null;
	}

	setRefreshToken(token) {
		if (typeof window !== 'undefined') {
			localStorage.setItem('refreshToken', token);
		}
	}

	// Remove auth token from localStorage
	removeAuthToken() {
		if (typeof window !== 'undefined') {
			localStorage.removeItem('accessToken');
			localStorage.removeItem('refreshToken');
		}
	}

	// Check if user is authenticated
	isAuthenticated() {
		return !!this.getAuthToken();
	}

	// Generic request method
	async request(endpoint, options = {}) {
		const url = `${this.baseURL}${endpoint}`;
		const token = this.getAuthToken();

		const config = {
			headers: {
				'Content-Type': 'application/json',
				...options.headers
			},
			...options
		};

		if (token) {
			config.headers.Authorization = `Bearer ${token}`;
		}

		try {
			const response = await fetch(url, config);

			if (!response.ok) {
				let errorMessage = `HTTP error! status: ${response.status}`;
				try {
					const errorBody = await response.text();
					if (errorBody) {
						errorMessage += ` - ${errorBody}`;
					}
				} catch (e) {
					// Ignore error reading response body
				}
				const error = new Error(errorMessage);
				error.response = response;
				throw error;
			}

			const contentType = response.headers.get('content-type');
			if (contentType && contentType.includes('application/json')) {
				return await response.json();
			}
			return response;
		} catch (error) {
			const originalRequest = { endpoint, options };

			if (error.response && error.response.status === 401) {
				if (this.isRefreshing) {
					return new Promise((resolve, reject) => {
						this.failedQueue.push({ resolve, reject });
					})
						.then(token => {
							originalRequest.headers.Authorization = `Bearer ${token}`;
							return this.request(originalRequest.endpoint, originalRequest.options);
						})
						.catch(err => {
							return Promise.reject(err);
						});
				}

				this.isRefreshing = true;

				try {
					const refreshToken = this.getRefreshToken();
					if (!refreshToken) {
						authService.logout();
						return Promise.reject(new Error('No refresh token available'));
					}
					const newTokens = await authService.refreshToken(refreshToken);
					this.setAuthToken(newTokens.accessToken);
					this.setRefreshToken(newTokens.refreshToken);
					this.processQueue(null, newTokens.accessToken);
					return this.request(endpoint, options);
				} catch (refreshError) {
					this.processQueue(refreshError, null);
					authService.logout();
					return Promise.reject(refreshError);
				} finally {
					this.isRefreshing = false;
				}
			}
			console.error('API request failed:', error);
			throw error;
		}
	}

	// GET request
	async get(endpoint) {
		return this.request(endpoint, { method: 'GET' });
	}

	// POST request
	async post(endpoint, data) {
		return this.request(endpoint, {
			method: 'POST',
			body: JSON.stringify(data)
		});
	}

	// PATCH request
	async patch(endpoint, data) {
		return this.request(endpoint, {
			method: 'PATCH',
			body: JSON.stringify(data)
		});
	}

	// DELETE request
	async delete(endpoint) {
		return this.request(endpoint, { method: 'DELETE' });
	}

	// Upload file
	async upload(endpoint, formData) {
		const token = this.getAuthToken();
		const config = {
			method: 'POST',
			body: formData
		};

		if (token) {
			config.headers = {
				Authorization: `Bearer ${token}`
			};
		}

		try {
			const response = await fetch(`${this.baseURL}${endpoint}`, config);

			if (!response.ok) {
				if (response.status === 401) {
					// This part won't auto-refresh token for simplicity in file uploads.
					// You might want to implement a similar logic as in the `request` method if needed.
					this.removeAuthToken();
					throw new Error('Authentication failed');
				}
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			return await response.json();
		} catch (error) {
			console.error('Upload failed:', error);
			throw error;
		}
	}
}

export const apiService = new ApiService();

