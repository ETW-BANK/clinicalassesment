// services/patientService.js
import api from './api';

const toNullableTrimmedString = (value) => {
  const trimmed = (value ?? '').toString().trim();
  return trimmed ? trimmed : null;
};

const toRequiredTrimmedString = (value) => (value ?? '').toString().trim();

const toDateTimeString = (value) => {
  if (!value) return value;
  const asString = value.toString();

  // If it's already an ISO/date-time string, keep it.
  if (asString.includes('T')) return asString;

  // If it's a YYYY-MM-DD date from <input type="date">, convert to date-time
  if (/^\d{4}-\d{2}-\d{2}$/.test(asString)) {
    return `${asString}T00:00:00`;
  }

  return asString;
};

const patientService = {
  // Create new patient
  async createPatient(patientData) {
    const payload = {
      firstName: toRequiredTrimmedString(patientData.firstName),
      lastName: toRequiredTrimmedString(patientData.lastName),
      dateOfBirth: toDateTimeString(patientData.dateOfBirth),
      gender: toRequiredTrimmedString(patientData.gender),
      phoneNumber: toNullableTrimmedString(patientData.phoneNumber),
      address: toNullableTrimmedString(patientData.address)
    };

    const response = await api.post('/Patients', {
      ...payload
    });
    return response.data;
  },

  // Get all patients with optional name filter
  async getPatients(name = '') {
    const params = name ? { name } : {};
    const response = await api.get('/Patients', { params });
    return response.data;
  },

  // Back-compat alias (some components use getAllPatients)
  async getAllPatients(name = '') {
    return patientService.getPatients(name);
  },

  // Get patient by ID
  async getPatientById(id) {
    const response = await api.get(`/Patients/${id}`);
    return response.data;
  },

  // Update patient
  async updatePatient(id, patientData) {
    const response = await api.put(`/Patients/${id}`, {
      firstName: toRequiredTrimmedString(patientData.firstName),
      lastName: toRequiredTrimmedString(patientData.lastName),
      dateOfBirth: toDateTimeString(patientData.dateOfBirth),
      gender: toRequiredTrimmedString(patientData.gender),
      phoneNumber: toNullableTrimmedString(patientData.phoneNumber),
      address: toNullableTrimmedString(patientData.address)
    });
    return response.data;
  },

  // Delete patient
  async deletePatient(id) {
    const response = await api.delete(`/Patients/${id}`);
    return response.data;
  },

  // Get patient lookup (for dropdowns)
  async getPatientLookup(name = '') {
    const params = name ? { name } : {};
    const response = await api.get('/Patients/lookup', { params });
    return response.data;
  },

  // Get patient's assessments
  async getPatientAssessments(id) {
    const response = await api.get(`/Patients/${id}/assessments`);
    return response.data;
  }
};

export default patientService;