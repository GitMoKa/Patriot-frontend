import { apiService } from './api.js';

export class FavoritesService {
	// Get all favorites with pagination support
	async getAllFavorites(page = 0, limit = 10) {
		try {
			// Build query parameters for pagination
			const queryParams = new URLSearchParams({
				limit: limit.toString(),
				page: page.toString()
			});

			const response = await apiService.get(`/favorites?${queryParams}`);
			
			// Handle the response structure: { total: number, results: Favorite[] }
			const favorites = response.results || [];

			return {
				total: response.total || favorites.length,
				results: response.results || favorites,
				favorites: favorites,
				page: page,
				limit: limit,
				totalPages: Math.ceil((response.total || favorites.length) / limit)
			};
		} catch (error) {
			throw new Error('Failed to fetch favorites: ' + error.message);
		}
	}

	// Add product to favorites
	async addToFavorites(productId) {
		try {
			const response = await apiService.post('/favorites', {
				productId: productId
			});
			return response;
		} catch (error) {
			throw new Error('Failed to add to favorites: ' + error.message);
		}
	}

	// Remove product from favorites
	async removeFromFavorites(productId) {
		try {
			const response = await apiService.delete(`/favorites/${productId}`);
			return response;
		} catch (error) {
			throw new Error('Failed to remove from favorites: ' + error.message);
		}
	}

	// Check if product is in favorites
	async isProductInFavorites(productId) {
		try {
			const response = await this.getAllFavorites(0, 100); // Get first 100 to check
			const favorites = response.favorites || [];
			return favorites.some(fav => fav.product?.id === productId);
		} catch (error) {
			console.error('Failed to check favorites:', error);
			return false;
		}
	}
}

export const favoritesService = new FavoritesService();