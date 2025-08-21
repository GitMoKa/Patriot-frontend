import { apiService } from './api.js';

export class CategoriesService {
	// Get all categories
	async getAllCategories() {
		try {
			const response = await apiService.get('/categories');
			
			// Handle the new API response structure with results array
			if (response.results && Array.isArray(response.results)) {
				return {
					results: response.results,
					total: response.total || response.results.length
				};
			}
			
			// Handle direct response or wrapped response
			const data = response.data || response;
			if (data.results && Array.isArray(data.results)) {
				return {
					results: data.results,
					total: data.total || data.results.length
				};
			}
			
			// Fallback for different response structures
			return {
				results: Array.isArray(data) ? data : [],
				total: Array.isArray(data) ? data.length : 0
			};
		} catch (error) {
			throw new Error('Failed to fetch categories: ' + error.message);
		}
	}

	// Get category by ID
	async getCategoryById(id) {
		try {
			const response = await apiService.get(`/categories/${id}`);
			return response;
		} catch (error) {
			throw new Error('Failed to fetch category: ' + error.message);
		}
	}
}

export const categoriesService = new CategoriesService();

