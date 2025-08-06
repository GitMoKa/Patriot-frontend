import { apiService } from './api.js';

export class CategoriesService {
	// Get all categories
	async getAllCategories() {
		try {
			const response = await apiService.get('/categories');
			return response;
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

