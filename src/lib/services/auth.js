import { apiService } from './api.js';

export class AuthService {
	// Login user
	async login(email, password) {
		try {
			const response = await apiService.post('/auth-sessions/email', {
				email,
				password
			});

			if (response.accessToken && response.refreshToken) {
				apiService.setAuthToken(response.accessToken);
				apiService.setRefreshToken(response.refreshToken);
			}

			return response;
		} catch (error) {
			throw new Error('Login failed: ' + error.message);
		}
	}

	// Register user
	async register(userData) {
		try {
			const response = await apiService.post('/users', userData);
			
			// If the response includes tokens, set them automatically
			if (response.accessToken && response.refreshToken) {
				apiService.setAuthToken(response.accessToken);
				apiService.setRefreshToken(response.refreshToken);
			}
			
			return response;
		} catch (error) {
			throw new Error('Registration failed: ' + error.message);
		}
	}

	// Logout user
	logout() {
		apiService.removeAuthToken();
	}

	// Refresh token
	async refreshToken(refreshToken) {
		try {
			const response = await apiService.post('/auth-sessions/refresh', {
				refreshToken
			});
			return response;
		} catch (error) {
			throw new Error('Refresh token failed: ' + error.message);
		}
	}

	// Forgot password
	async forgotPassword(email) {
		try {
			const response = await apiService.post('/users/forgot-password', { email });
			return response;
		} catch (error) {
			throw new Error('Forgot password failed: ' + error.message);
		}
	}

	// Reset password
	async resetPassword(email, code, newPassword) {
		try {
			const response = await apiService.post('/users/reset-password', {
				email,
				code,
				password: newPassword
			});
			return response;
		} catch (error) {
			throw new Error('Reset password failed: ' + error.message);
		}
	}

	// Update password
	async updatePassword(currentPassword, newPassword) {
		try {
			const response = await apiService.post('/users/update-password', {
				currentPassword,
				newPassword
			});
			return response;
		} catch (error) {
			throw new Error('Update password failed: ' + error.message);
		}
	}

	// Get current user
	async getMe() {
		try {
			const response = await apiService.get('/users/me');
			return response;
		} catch (error) {
			throw new Error('Get user failed: ' + error.message);
		}
	}

	// Update user profile
	async updateMe(userData) {
		try {
			const response = await apiService.patch('/users/me', userData);
			return response;
		} catch (error) {
			throw new Error('Update profile failed: ' + error.message);
		}
	}


	// Check if user is authenticated
	isAuthenticated() {
		return apiService.isAuthenticated();
	}
}

export const authService = new AuthService();

