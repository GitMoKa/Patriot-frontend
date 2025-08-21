import { apiService } from './api.js';

export class ProductsService {
	// Get all products
	async getAllProducts() {
		try {
			const response = await apiService.get('/products');
			
			// Handle the response structure: { total: number, results: Product[] }
			const products = response.results?.map(product => ({
				id: product.id,
				name: product.name,
				description: product.description,
				imageUrl: product.imageUrl,
				height: product.height,
				width: product.width,
				category: product.category,
				ratingsAverage: product.ratingsAverage,
				ratingsQuantity: product.ratingsQuantity,
				createdAt: product.createdAt,
				updatedAt: product.updatedAt
			})) || [];

			return {
				total: response.total,
				results: response.results,
				products: products
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

	// Get products by category
	async getProductsByCategory(categoryName) {
		try {
			const response = await apiService.get('/products');
			
			// Extract products from response.results
			const products = response.results || [];
			
			// Filter products by category name
			const filteredProducts = products.filter(product => {
				// Handle null category case (no category)
				if (categoryName === null) {
					return product.category === null || product.category === undefined;
				}
				
				// Handle both string and object category formats
				const productCategory = typeof product.category === 'string' 
					? product.category 
					: (product.category?.name?.en || product.category?.name?.ar || product.category?.name);
				
				// Also handle localized category names
				const categoryToMatch = typeof categoryName === 'string' 
					? categoryName 
					: (categoryName?.en || categoryName?.ar || categoryName);
				
				return productCategory === categoryToMatch;
			});
			
			return filteredProducts;
		} catch (error) {
			throw new Error('Failed to fetch products by category: ' + error.message);
		}
	}
}

export const productsService = new ProductsService();

