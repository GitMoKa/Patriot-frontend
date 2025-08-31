import { apiService } from './api.js';

export class ProductsService {
	// Get all products with pagination support
	async getAllProducts(page = 0, limit = 10) {
		try {
			// Build query parameters for pagination
			const queryParams = new URLSearchParams({
				limit: limit.toString(),
				page: page.toString()
			});

			const response = await apiService.get(`/products?${queryParams}`);
			
			// Handle the response structure: { total: number, results: Product[] }
			const products = response.results?.map(product => ({
				id: product.id,
				name: product.name,
				description: product.description,
				imageUrl: product.imageUrl,
				height: product.height,
				width: product.width,
				category: product.category,
				stages: product.stages, // Include stages for painting step logic
				ratingsAverage: product.ratingsAverage,
				ratingsQuantity: product.ratingsQuantity,
				createdAt: product.createdAt,
				updatedAt: product.updatedAt
			})) || [];

			return {
				total: response.total,
				results: response.results,
				products: products,
				page: page,
				limit: limit,
				totalPages: Math.ceil((response.total || 0) / limit)
			};
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

	// Get products by category with pagination support
	async getProductsByCategory(categoryid, page = 0, limit = 10) {
		try {
			// Build query parameters for pagination and category filter
			const queryParams = new URLSearchParams({
				limit: limit.toString(),
				page: page.toString()
			});

			// Handle special case for "no-category" products
			if (categoryid === 'no-category' || categoryid === null) {
				// For no-category products, we might need a special API endpoint or parameter
				// For now, we'll use a special categoryId value that the backend understands
				queryParams.set('categoryId', 'null');
			} else {
				// Normal category filtering
				queryParams.set('categoryId', categoryid);
			}

			const response = await apiService.get(`/products?${queryParams}`);
			
			// Extract products from response.results - these should already include stages
			const products = response.results || [];
			
			return {
				total: response.total || products.length,
				results: response.results || products,
				products: products,
				page: page,
				limit: limit,
				totalPages: Math.ceil((response.total || products.length) / limit)
			};
		} catch (error) {
			throw new Error('Failed to fetch products by category: ' + error.message);
		}
	}
}

export const productsService = new ProductsService();

