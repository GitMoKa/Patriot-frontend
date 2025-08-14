import { apiService } from './api.js';

export class CitiesService {
	// Get all cities
	async getAllCities() {
		try {
			const response = await apiService.get('/cities');
			
			// Handle API response structure
			if (response.results && Array.isArray(response.results)) {
				return {
					results: response.results,
					cities: response.results
				};
			}
			
			// Fallback for different response structures
			return Array.isArray(response) ? response : [];
		} catch (error) {
			throw new Error('Failed to fetch cities: ' + error.message);
		}
	}

	// Get city by ID
	async getCityById(id) {
		try {
			const response = await apiService.get(`/cities/${id}`);
			return response;
		} catch (error) {
			throw new Error('Failed to fetch city: ' + error.message);
		}
	}

	// Get cities by state (if the API supports filtering)
	async getCitiesByState(stateId) {
		try {
			const response = await apiService.get(`/cities?stateId=${stateId}`);
			
			// Handle API response structure
			if (response.results && Array.isArray(response.results)) {
				return response.results;
			}
			
			return Array.isArray(response) ? response : [];
		} catch (error) {
			// Fallback: get all cities and filter client-side
			const allCities = await this.getAllCities();
			const cities = allCities.results || allCities.cities || allCities;
			return cities.filter(city => city.stateId === stateId);
		}
	}
}

export const citiesService = new CitiesService();