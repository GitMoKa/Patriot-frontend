import { apiService } from './api.js';

export class ProductsService {
	// Get all products
	async getAllProducts() {
		try {
			const response = await apiService.get('/products');
			return response;
		} catch (error) {
			throw new Error('Failed to fetch products: ' + error.message);
		}
	}

	// Get product by ID
	async getProductById(id) {
		try {
			const response = await apiService.get(`/products/${id}`);
			return response;
		} catch (error) {
			throw new Error('Failed to fetch product: ' + error.message);
		}
	}

	// Get products by category
	async getProductsByCategory(categoryId) {
		try {
			const response = await apiService.get('/products');
			const filteredProducts = response.filter(product => product.categoryId === categoryId);
			return filteredProducts;
		} catch (error) {
			throw new Error('Failed to fetch products by category: ' + error.message);
		}
	}
}

export const productsService = new ProductsService();

