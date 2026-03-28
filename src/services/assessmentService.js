import api from './api';

const assessmentService = {
  createAssessment: async (assessmentData) => {
    const response = await api.post('/Assessments', assessmentData);
    console.log('Create assessment response:', response.data);
    return response.data;
  },

  getAssessmentReport: async (assessmentId) => {
    console.log('Fetching report for assessmentId:', assessmentId);
    try {
      const response = await api.get(`/Assessments/${assessmentId}/report`);
      console.log('Report response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error in getAssessmentReport:', error);
      throw error;
    }
  },

  // Get all assessments
  getAllAssessments: async () => {
    try {
      const response = await api.get('/Assessments');
      console.log('All assessments retrieved:', response.data?.length || 0, 'assessments');
      return response.data;
    } catch (error) {
      console.error('Error fetching all assessments:', error);
      // Return empty array to prevent breaking the UI
      return [];
    }
  },

  // Get assessments by patient ID (efficient filtering)
  getAssessmentsByPatientId: async (patientId) => {
    try {
      // Get all assessments from the API
      const allAssessments = await assessmentService.getAllAssessments();
      
      // Filter assessments for the specific patient
      const patientAssessments = allAssessments.filter(
        assessment => assessment.patientId === patientId
      );
      
      console.log(`Found ${patientAssessments.length} assessments for patient ${patientId}`);
      
      // Sort by assessment date (newest first)
      return patientAssessments.sort((a, b) => 
        new Date(b.assessmentDate) - new Date(a.assessmentDate)
      );
    } catch (error) {
      console.error('Error fetching assessments by patient ID:', error);
      return [];
    }
  },

  // Get latest assessment for a patient
  getLatestAssessment: async (patientId) => {
    try {
      const assessments = await assessmentService.getAssessmentsByPatientId(patientId);
      return assessments.length > 0 ? assessments[0] : null;
    } catch (error) {
      console.error('Error fetching latest assessment:', error);
      return null;
    }
  },

  // Get assessments by date range
  getAssessmentsByDateRange: async (startDate, endDate) => {
    try {
      const allAssessments = await assessmentService.getAllAssessments();
      return allAssessments.filter(assessment => {
        const assessmentDate = new Date(assessment.assessmentDate);
        return assessmentDate >= startDate && assessmentDate <= endDate;
      });
    } catch (error) {
      console.error('Error fetching assessments by date range:', error);
      return [];
    }
  },

  // Delete assessment (if you need this endpoint)
  deleteAssessment: async (assessmentId) => {
    try {
      const response = await api.delete(`/Assessments/${assessmentId}`);
      console.log('Assessment deleted:', assessmentId);
      return response.data;
    } catch (error) {
      console.error('Error deleting assessment:', error);
      throw error;
    }
  },

  // Update assessment (if you need this endpoint)
  updateAssessment: async (assessmentId, assessmentData) => {
    try {
      const response = await api.put(`/Assessments/${assessmentId}`, assessmentData);
      console.log('Assessment updated:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error updating assessment:', error);
      throw error;
    }
  }
};

export default assessmentService;