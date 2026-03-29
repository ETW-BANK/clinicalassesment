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

const toNullableNumber = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

const buildCreateAssessmentPayload = (assessmentData) => {
  const payload = {
    patientId: assessmentData.patientId,
    nurseNotes: assessmentData.nurseNotes || null,

    // Vital Signs
    bloodPressure: assessmentData.bloodPressure || null,
    pulseRate: toNullableNumber(assessmentData.pulseRate),
    respiratoryRate: toNullableNumber(assessmentData.respiratoryRate),
    spO2: toNullableNumber(assessmentData.spO2),
    temperature: toNullableNumber(assessmentData.temperature),
    oxygenSaturation: toNullableNumber(assessmentData.oxygenSaturation),

    // Additional vital sign fields
    oxygenLitersPerMinute: toNullableNumber(assessmentData.oxygenLitersPerMinute),
    painScore: toNullableNumber(assessmentData.painScore),

    // Interventions
    oxygenGiven: Boolean(assessmentData.oxygenGiven),
    ivStarted: Boolean(assessmentData.ivStarted),
    cprPerformed: Boolean(assessmentData.cprPerformed),

    // Neurological
    isAlert: Boolean(assessmentData.isAlert),
    isOriented: Boolean(assessmentData.isOriented),

    // Skin conditions
    skinWarm: Boolean(assessmentData.skinWarm),
    skinDry: Boolean(assessmentData.skinDry),
    skinPale: Boolean(assessmentData.skinPale),
    skinCool: Boolean(assessmentData.skinCool),
    skinHot: Boolean(assessmentData.skinHot),
    skinFlushed: Boolean(assessmentData.skinFlushed),
    skinCyanotic: Boolean(assessmentData.skinCyanotic),
    skinClammy: Boolean(assessmentData.skinClammy),
    skinJaundice: Boolean(assessmentData.skinJaundice),
    skinDiaphoretic: Boolean(assessmentData.skinDiaphoretic),
    otherSkinCondition: assessmentData.otherSkinCondition || null,

    // Respiratory
    respiratorySymmetrical: Boolean(assessmentData.respiratorySymmetrical),
    respiratoryAsymmetrical: Boolean(assessmentData.respiratoryAsymmetrical),
    lungSounds: assessmentData.lungSounds || null,
    otherLungSounds: assessmentData.otherLungSounds || null,
    respiratoryEffort: assessmentData.respiratoryEffort || null,
    otherRespiratoryEffort: assessmentData.otherRespiratoryEffort || null,

    // Mobility
    gaitSteady: Boolean(assessmentData.gaitSteady),
    usesCane: Boolean(assessmentData.usesCane),
    usesCrutches: Boolean(assessmentData.usesCrutches),
    usesWheelchair: Boolean(assessmentData.usesWheelchair),
    bedridden: Boolean(assessmentData.bedridden),
    requiresAssistance: Boolean(assessmentData.requiresAssistance),
    otherMobilityStatus: assessmentData.otherMobilityStatus || null,
    otherAssistiveDevice: assessmentData.otherAssistiveDevice || null,

    // Gastrointestinal
    diet: assessmentData.diet || null,
    appetite: assessmentData.appetite || null,
    bowelSounds: assessmentData.bowelSounds || null,
    lastBowelMovement: assessmentData.lastBowelMovement || null,
    abdomen: assessmentData.abdomen || null,
    gastrointestinalComments: assessmentData.gastrointestinalComments || null,

    // Genitourinary
    urineAppearance: assessmentData.urineAppearance || null,
    continence: assessmentData.continence || null,
    catheter: assessmentData.catheter ?? null,
    lastVoid: assessmentData.lastVoid || null,
    genitourinaryComments: assessmentData.genitourinaryComments || null,

    // Pain details
    painLocation: assessmentData.painLocation || null,
    painDuration: assessmentData.painDuration || null,
    painIntervention: assessmentData.painIntervention || null,
    painEffectiveness: assessmentData.painEffectiveness || null,
    painComments: assessmentData.painComments || null,
  };

  // NEW optional fields
  if (Array.isArray(assessmentData.diagnoses)) {
    payload.diagnoses = assessmentData.diagnoses;
  } else if (assessmentData.diagnoses == null) {
    payload.diagnoses = null;
  }

  if (assessmentData.hospiceEligibility && typeof assessmentData.hospiceEligibility === 'object') {
    payload.hospiceEligibility = assessmentData.hospiceEligibility;
  } else if (assessmentData.hospiceEligibility == null) {
    payload.hospiceEligibility = null;
  }

  return payload;
};

const assessmentService = {
  // Create new assessment
  async createAssessment(assessmentData) {
    const payload = buildCreateAssessmentPayload(assessmentData);
    
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