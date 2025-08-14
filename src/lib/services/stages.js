import { apiService } from './api.js';

export class StagesService {
	// Get all stages
	async getAllStages() {
		try {
			const response = await apiService.get('/stages');
			
			// Handle API response structure similar to other services
			if (response.results && Array.isArray(response.results)) {
				return {
					results: response.results,
					stages: response.results
				};
			}
			
			// Fallback for different response structures
			return Array.isArray(response) ? response : [];
		} catch (error) {
			throw new Error('Failed to fetch stages: ' + error.message);
		}
	}

	// Get stage by ID
	async getStageById(id) {
		try {
			const response = await apiService.get(`/stages/${id}`);
			return response;
		} catch (error) {
			throw new Error('Failed to fetch stage: ' + error.message);
		}
	}
}

export const stagesService = new StagesService();