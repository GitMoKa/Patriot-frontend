import { apiService } from './api.js';

export class StatesService {
	// Get all states
	async getAllStates() {
		try {
			const response = await apiService.get('/states');
			
			// Handle API response structure
			if (response.results && Array.isArray(response.results)) {
				return {
					results: response.results,
					states: response.results
				};
			}
			
			// Fallback for different response structures
			return Array.isArray(response) ? response : [];
		} catch (error) {
			throw new Error('Failed to fetch states: ' + error.message);
		}
	}

	// Get state by ID
	async getStateById(id) {
		try {
			const response = await apiService.get(`/states/${id}`);
			return response;
		} catch (error) {
			throw new Error('Failed to fetch state: ' + error.message);
		}
	}
}

export const statesService = new StatesService();