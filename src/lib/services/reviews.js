import { apiService } from './api.js';

export class ReviewsService {
	// Get reviews for a specific product
	async getProductReviews(productId) {
		try {
			const response = await apiService.get(`/products/${productId}/reviews`);
			return response;
		} catch (error) {
			throw new Error('Failed to fetch product reviews: ' + error.message);
		}
	}

	// Create a new review for a product
	async createReview(reviewData) {
		try {
			console.log('Reviews service - sending data:', reviewData);
			console.log('Reviews service - API endpoint: /product-reviews');
			
			// Validate required fields
			if (!reviewData.rating || !reviewData.productId) {
				throw new Error('Rating and productId are required');
			}
			
			const response = await apiService.post('/product-reviews', reviewData);
			console.log('Reviews service - API response:', response);
			return response;
		} catch (error) {
			console.error('Reviews service - API error:', error);
			console.error('Reviews service - Error details:', {
				message: error.message,
				status: error.status,
				response: error.response
			});
			throw error; // Re-throw the original error instead of wrapping it
		}
	}
}

export const reviewsService = new ReviewsService();