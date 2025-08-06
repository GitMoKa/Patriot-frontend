import { apiService } from './api.js';

export class MaterialsService {
	// Get all materials
	async getAllMaterials() {
		try {
			const response = await apiService.get('/materials');
			return response;
		} catch (error) {
			throw new Error('Failed to fetch materials: ' + error.message);
		}
	}

	// Get material by ID
	async getMaterialById(id) {
		try {
			const response = await apiService.get(`/materials/${id}`);
			return response;
		} catch (error) {
			throw new Error('Failed to fetch material: ' + error.message);
		}
	}

	// Create a new material
	async createMaterial(materialData) {
		try {
			const response = await apiService.post('/materials', materialData);
			return response;
		} catch (error) {
			throw new Error('Failed to create material: ' + error.message);
		}
	}

	// Update a material
	async updateMaterial(id, materialData) {
		try {
			const response = await apiService.patch(`/materials/${id}`, materialData);
			return response;
		} catch (error) {
			throw new Error('Failed to update material: ' + error.message);
		}
	}

	// Delete a material
	async deleteMaterial(id) {
		try {
			const response = await apiService.delete(`/materials/${id}`);
			return response;
		} catch (error) {
			throw new Error('Failed to delete material: ' + error.message);
		}
	}
}

export const materialsService = new MaterialsService();

