import api from './api';

const extractArray = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.patients)) return data.patients;
  if (Array.isArray(data?.$values)) return data.$values;
  return [];
};

const normalizePatientFromApi = (patient) => {
  if (!patient || typeof patient !== 'object') return patient;
  return {
    ...patient,
    id: patient.id ?? patient.patientId,
  };
};

const normalizePatientPayload = (patientData) => {
  const payload = {
    firstName: patientData?.firstName?.trim() || '',
    lastName: patientData?.lastName?.trim() || '',
    dateOfBirth: patientData?.dateOfBirth,
    gender: patientData?.gender,
    phoneNumber: patientData?.phoneNumber,
    address: patientData?.address,
  };

  if (!payload.dateOfBirth) {
    delete payload.dateOfBirth;
  } else {
    payload.dateOfBirth = new Date(`${payload.dateOfBirth}T00:00:00`).toISOString();
  }

  if (!payload.gender) delete payload.gender;
  if (!payload.phoneNumber) delete payload.phoneNumber;
  if (!payload.address) delete payload.address;

  return payload;
};

const patientService = {
  getAllPatients: async () => {
    const response = await api.get('/Patients');
    return extractArray(response.data).map(normalizePatientFromApi);
  },

  getPatientById: async (id) => {
    const response = await api.get(`/Patients/${id}`);
    const patient = response.data?.patient ?? response.data;
    return normalizePatientFromApi(patient);
  },

  createPatient: async (patientData) => {
    const response = await api.post('/Patients', normalizePatientPayload(patientData));
    return response.data;
  },

  getPatientAssessments: async (patientId) => {
    // Note: You'll need to create this endpoint on your backend
    // For now, it might return an empty array if not implemented
    try {
      const response = await api.get(`/Patients/${patientId}/assessments`);
      return extractArray(response.data);
    } catch (error) {
      console.error('Error fetching patient assessments:', error);
      return [];
    }
  },
};
    
export default patientService;