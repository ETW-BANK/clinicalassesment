// services/assessmentService.js
import api from './api';

const extractArray = (data) => {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.items)) return data.items;
  if (data && Array.isArray(data.assessments)) return data.assessments;
  if (data && Array.isArray(data.$values)) return data.$values;
  return [];
};

const normalizeAssessment = (assessment) => {
  if (!assessment || typeof assessment !== 'object') return assessment;

  // Backend (OpenAPI) uses vitalSigns; UI historically used vitals.
  const vitalSigns = assessment.vitals || assessment.vitalSigns || null;

  // Backend uses musculoskeletal; UI historically used mobility.
  const musculoskeletal = assessment.musculoskeletal || null;
  const mobility = assessment.mobility || (musculoskeletal ? { musculoskeletal } : null);

  return {
    ...assessment,
    vitals: vitalSigns,
    vitalSigns: assessment.vitalSigns || vitalSigns,
    mobility,
    musculoskeletal: assessment.musculoskeletal || musculoskeletal,
  };
};

const normalizeAssessments = (data) => extractArray(data).map(normalizeAssessment);

const assessmentService = {
  // Create new assessment
  async createAssessment(assessmentData) {
    // Transform data to match CreateAssessmentDto
    const payload = {
      patientId: assessmentData.patientId,
      nurseNotes: assessmentData.nurseNotes || null,
      
      // Vital Signs
      bloodPressure: assessmentData.bloodPressure || null,
      pulseRate: assessmentData.pulseRate || null,
      respiratoryRate: assessmentData.respiratoryRate || null,
      spO2: assessmentData.spO2 || null,
      temperature: assessmentData.temperature || null,
      oxygenSaturation: assessmentData.oxygenSaturation || null,

      // Additional vital sign fields (updated API)
      oxygenLitersPerMinute: assessmentData.oxygenLitersPerMinute ?? null,
      painScore: assessmentData.painScore ?? null,
      
      // Interventions
      oxygenGiven: assessmentData.oxygenGiven || false,
      ivStarted: assessmentData.ivStarted || false,
      cprPerformed: assessmentData.cprPerformed || false,
      
      // Neurological
      isAlert: assessmentData.isAlert || false,
      isOriented: assessmentData.isOriented || false,
      
      // Skin conditions (all booleans)
      skinWarm: assessmentData.skinWarm || false,
      skinDry: assessmentData.skinDry || false,
      skinPale: assessmentData.skinPale || false,
      skinCool: assessmentData.skinCool || false,
      skinHot: assessmentData.skinHot || false,
      skinFlushed: assessmentData.skinFlushed || false,
      skinCyanotic: assessmentData.skinCyanotic || false,
      skinClammy: assessmentData.skinClammy || false,
      skinJaundice: assessmentData.skinJaundice || false,
      skinDiaphoretic: assessmentData.skinDiaphoretic || false,
      otherSkinCondition: assessmentData.otherSkinCondition || null,
      
      // Respiratory
      respiratorySymmetrical: assessmentData.respiratorySymmetrical || false,
      respiratoryAsymmetrical: assessmentData.respiratoryAsymmetrical || false,
      lungSounds: assessmentData.lungSounds || null,
      otherLungSounds: assessmentData.otherLungSounds || null,
      respiratoryEffort: assessmentData.respiratoryEffort || null,
      otherRespiratoryEffort: assessmentData.otherRespiratoryEffort || null,
      
      // Mobility
      gaitSteady: assessmentData.gaitSteady || false,
      usesCane: assessmentData.usesCane || false,
      usesCrutches: assessmentData.usesCrutches || false,
      usesWheelchair: assessmentData.usesWheelchair || false,
      bedridden: assessmentData.bedridden || false,
      requiresAssistance: assessmentData.requiresAssistance || false,
      otherMobilityStatus: assessmentData.otherMobilityStatus || null,
      otherAssistiveDevice: assessmentData.otherAssistiveDevice || null,

      // Gastrointestinal (updated API)
      diet: assessmentData.diet || null,
      appetite: assessmentData.appetite || null,
      bowelSounds: assessmentData.bowelSounds || null,
      lastBowelMovement: assessmentData.lastBowelMovement || null,
      abdomen: assessmentData.abdomen || null,
      gastrointestinalComments: assessmentData.gastrointestinalComments || null,

      // Genitourinary (updated API)
      urineAppearance: assessmentData.urineAppearance || null,
      continence: assessmentData.continence || null,
      catheter: assessmentData.catheter ?? null,
      lastVoid: assessmentData.lastVoid || null,
      genitourinaryComments: assessmentData.genitourinaryComments || null,

      // Pain details (updated API)
      painLocation: assessmentData.painLocation || null,
      painDuration: assessmentData.painDuration || null,
      painIntervention: assessmentData.painIntervention || null,
      painEffectiveness: assessmentData.painEffectiveness || null,
      painComments: assessmentData.painComments || null,
    };
    
    const response = await api.post('/Assessments', payload);
    return response.data; // Returns AIReport
  },

  // Get all assessments
  async getAssessments() {
    const response = await api.get('/Assessments');
    return normalizeAssessments(response.data);
  },

  // Get assessments by patient ID (client-side filter for backends without a dedicated endpoint)
  async getAssessmentsByPatientId(patientId) {
    const all = await assessmentService.getAssessments();
    return extractArray(all).filter((a) => {
      const id = a?.patientId || a?.patient?.id;
      return id && patientId && String(id).toLowerCase() === String(patientId).toLowerCase();
    });
  },

  // Back-compat alias (some components use getAllAssessments)
  async getAllAssessments() {
    return assessmentService.getAssessments();
  },

  // Get assessment by ID
  async getAssessmentById(assessmentId) {
    const response = await api.get(`/Assessments/${assessmentId}`);
    return normalizeAssessment(response.data);
  },

  // Update assessment
  async updateAssessment(assessmentId, assessmentData) {
    const payload = {
      patientId: assessmentData.patientId,
      nurseNotes: assessmentData.nurseNotes,
      // ... same transformation as create
      bloodPressure: assessmentData.bloodPressure,
      pulseRate: assessmentData.pulseRate,
      // ... all other fields
    };
    
    const response = await api.put(`/Assessments/${assessmentId}`, payload);
    return response.data;
  },

  // Delete assessment
  async deleteAssessment(assessmentId) {
    const response = await api.delete(`/Assessments/${assessmentId}`);
    return response.data;
  },

  // Get assessment report
  async getAssessmentReport(assessmentId) {
    const response = await api.get(`/Assessments/${assessmentId}/report`);
    return response.data; // Returns AIReport
  },

  // Get assessments by patient ID
  async getAssessmentsByPatientId(patientId) {
    try {
      const response = await api.get(`/Patients/${encodeURIComponent(patientId)}/assessments`);
      return normalizeAssessments(response.data);
    } catch (error) {
      // Fallback for backends that don't expose /Patients/{id}/assessments
      const all = await assessmentService.getAssessments();
      return extractArray(all).filter((a) => {
        const id = a?.patientId || a?.patient?.id;
        return id && patientId && String(id).toLowerCase() === String(patientId).toLowerCase();
      });
    }
  }
};

export default assessmentService;