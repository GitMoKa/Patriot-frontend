import { apiService } from './api.js';

export class ComplaintsService {
	// Create new complaint
	async createComplaint(complaintData) {
		try {
			// Ensure only required fields are sent
			const dataToSend = {
				description: complaintData.description,
				userId: complaintData.userId,
				complaintType: complaintData.complaintType
			};

			// Add file URL if provided (sent as "fileUrl" to match server expectation)
			if (complaintData.attachmentUrl) {
				dataToSend.fileUrl = complaintData.attachmentUrl;
			}

			const response = await apiService.post('/complaints', dataToSend);
			return response;
		} catch (error) {
			throw new Error('Failed to create complaint: ' + error.message);
		}
	}

	// Get all complaints (for future use)
	async getAllComplaints() {
		try {
			const response = await apiService.get('/complaints');
			return response;
		} catch (error) {
			throw new Error('Failed to fetch complaints: ' + error.message);
		}
	}

	// Get complaint by ID (for future use)
	async getComplaintById(id) {
		try {
			const response = await apiService.get(`/complaints/${id}`);
			return response;
		} catch (error) {
			throw new Error('Failed to fetch complaint: ' + error.message);
		}
	}

	// Update complaint (for future use)
	async updateComplaint(id, complaintData) {
		try {
			const response = await apiService.patch(`/complaints/${id}`, complaintData);
			return response;
		} catch (error) {
			throw new Error('Failed to update complaint: ' + error.message);
		}
	}

	// Delete complaint (for future use)
	async deleteComplaint(id) {
		try {
			const response = await apiService.delete(`/complaints/${id}`);
			return response;
		} catch (error) {
			throw new Error('Failed to delete complaint: ' + error.message);
		}
	}
}

export const complaintsService = new ComplaintsService();