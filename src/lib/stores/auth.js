import { writable } from 'svelte/store';
import { authService } from '../services/auth.js';

// Create auth store
function createAuthStore() {
	const { subscribe, set, update } = writable({
		user: null,
		isAuthenticated: false,
		isLoading: false,
		error: null
	});

	return {
		subscribe,
		
		// Initialize auth state
		init: async () => {
			if (authService.isAuthenticated()) {
				try {
					update(state => ({ ...state, isLoading: true }));
					const user = await authService.getMe();
					set({
						user,
						isAuthenticated: true,
						isLoading: false,
						error: null
					});
				} catch (error) {
					authService.logout();
					set({
						user: null,
						isAuthenticated: false,
						isLoading: false,
						error: error.message
					});
				}
			}
		},

		// Login
		login: async (email, password) => {
			try {
				update(state => ({ ...state, isLoading: true, error: null }));
				const response = await authService.login(email, password);
				const user = await authService.getMe();
				set({
					user,
					isAuthenticated: true,
					isLoading: false,
					error: null
				});
				return response;
			} catch (error) {
				set({
					user: null,
					isAuthenticated: false,
					isLoading: false,
					error: error.message
				});
				throw error;
			}
		},

		// Register
		register: async (userData) => {
			try {
				update(state => ({ ...state, isLoading: true, error: null }));
				const response = await authService.register(userData);
				
				// If tokens are returned, get user data and set authenticated state
				if (response.accessToken && response.refreshToken) {
					const user = await authService.getMe();
					set({
						user,
						isAuthenticated: true,
						isLoading: false,
						error: null
					});
				} else {
					// If no tokens returned, just set loading to false
					update(state => ({ ...state, isLoading: false }));
				}
				
				return response;
			} catch (error) {
				set({
					user: null,
					isAuthenticated: false,
					isLoading: false,
					error: error.message
				});
				throw error;
			}
		},

		// Logout
		logout: () => {
			authService.logout();
			set({
				user: null,
				isAuthenticated: false,
				isLoading: false,
				error: null
			});
		},

		// Update user
		updateUser: (userData) => {
			update(state => ({
				...state,
				user: { ...state.user, ...userData }
			}));
		},

		// Refresh user data from server
		refreshUser: async () => {
			try {
				update(state => ({ ...state, isLoading: true }));
				const user = await authService.getMe();
				update(state => ({
					...state,
					user,
					isLoading: false,
					error: null
				}));
				return user;
			} catch (error) {
				update(state => ({
					...state,
					isLoading: false,
					error: error.message
				}));
				throw error;
			}
		},

		// Clear error
		clearError: () => {
			update(state => ({ ...state, error: null }));
		}
	};
}

export const authStore = createAuthStore();

