// services/assessmentService.js
import api from './api';

const extractArray = (data) => {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.items)) return data.items;
  if (data && Array.isArray(data.assessments)) return data.assessments;
  if (data && Array.isArray(data.$values)) return data.$values;
  return [];
};

const mergeSectionIntoAssessment = (target, section) => {
  if (!section || typeof section !== 'object' || Array.isArray(section)) return;

  Object.entries(section).forEach(([key, value]) => {
    if (target[key] === undefined || target[key] === null || target[key] === '') {
      target[key] = value;
    }
  });
};

const normalizeAssessment = (assessment) => {
  if (!assessment || typeof assessment !== 'object') return assessment;

  // Backend (OpenAPI) uses vitalSigns; UI historically used vitals.
  const vitalSigns = assessment.vitals || assessment.vitalSigns || null;

  const neurological = assessment.neurological || null;
  const cardiovascular = assessment.cardiovascular || null;
  const skin = assessment.skin || null;
  const respiratory = assessment.respiratory || null;
  const gastrointestinal = assessment.gastrointestinal || null;
  const genitourinary = assessment.genitourinary || null;
  const painDetails = assessment.painDetails || assessment.pain || null;
  const interventions = assessment.interventions || null;

  // Backend uses musculoskeletal; UI historically used mobility.
  const mobilitySection = assessment.mobility || null;
  const musculoskeletal = assessment.musculoskeletal || mobilitySection?.musculoskeletal || mobilitySection || null;
  const mobility = mobilitySection || (musculoskeletal ? { musculoskeletal } : null);

  const normalized = {
    ...assessment,
    vitals: vitalSigns,
    vitalSigns: assessment.vitalSigns || vitalSigns,
    neurological,
    cardiovascular,
    skin,
    respiratory,
    mobility,
    musculoskeletal: assessment.musculoskeletal || musculoskeletal,
    gastrointestinal,
    genitourinary,
    painDetails,
    interventions,
  };

  [
    vitalSigns,
    interventions,
    neurological,
    cardiovascular,
    skin,
    respiratory,
    musculoskeletal,
    gastrointestinal,
    genitourinary,
    painDetails,
  ].forEach((section) => mergeSectionIntoAssessment(normalized, section));

  return normalized;
};

const normalizeAssessments = (data) => extractArray(data).map(normalizeAssessment);

const toNullableNumber = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

const toOtherFieldOrNull = (enumValue, otherValue) => {
  if (String(enumValue || '').trim() !== 'Other') return null;
  const text = String(otherValue || '').trim();
  return text || null;
};

const buildCreateAssessmentPayload = (assessmentData) => {
  const payload = {
    patientId: assessmentData.patientId,
    nurseNotes: assessmentData.nurseNotes || null,

    // Vital Signs
    bloodPressure: assessmentData.bloodPressure || null,
    bloodPressurePosition: assessmentData.BloodPressurePosition || assessmentData.bloodPressurePosition || null,
    otherBloodPressurePosition: toOtherFieldOrNull(
      assessmentData.BloodPressurePosition || assessmentData.bloodPressurePosition,
      assessmentData.OtherBloodPressurePosition || assessmentData.otherBloodPressurePosition
    ),
    temperatureRoute: assessmentData.TemperatureRoute || assessmentData.temperatureRoute || null,
    otherTemperatureRoute: toOtherFieldOrNull(
      assessmentData.TemperatureRoute || assessmentData.temperatureRoute,
      assessmentData.OtherTemperatureRoute || assessmentData.otherTemperatureRoute
    ),
    weight: toNullableNumber(assessmentData.Weight ?? assessmentData.weight),
    standardPrecautionsMaintained: Boolean(assessmentData.StandardPrecautionsMaintained ?? assessmentData.standardPrecautionsMaintained),
    vitalSignsComments: assessmentData.VitalSignsComments || assessmentData.vitalSignsComments || null,
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
    orientationPerson: Boolean(assessmentData.OrientationPerson ?? assessmentData.orientationPerson),
    orientationPlace: Boolean(assessmentData.OrientationPlace ?? assessmentData.orientationPlace),
    orientationTime: Boolean(assessmentData.OrientationTime ?? assessmentData.orientationTime),
    disoriented: Boolean(assessmentData.Disoriented ?? assessmentData.disoriented),
    cognitiveForgetful: Boolean(assessmentData.CognitiveForgetful ?? assessmentData.cognitiveForgetful),
    cognitiveHallucinations: Boolean(assessmentData.CognitiveHallucinations ?? assessmentData.cognitiveHallucinations),
    otherCognitiveStatus: assessmentData.OtherCognitiveStatus || assessmentData.otherCognitiveStatus || null,
    pupilsPerrla: Boolean(assessmentData.PupilsPerrla ?? assessmentData.pupilsPerrla),
    pupilsNonReactive: Boolean(assessmentData.PupilsNonReactive ?? assessmentData.pupilsNonReactive),
    pupilsUnequal: Boolean(assessmentData.PupilsUnequal ?? assessmentData.pupilsUnequal),
    pupilsImpairedMovement: Boolean(assessmentData.PupilsImpairedMovement ?? assessmentData.pupilsImpairedMovement),
    tremors: Boolean(assessmentData.Tremors ?? assessmentData.tremors),
    seizureActivity: Boolean(assessmentData.SeizureActivity ?? assessmentData.seizureActivity),
    seizureLocations: assessmentData.SeizureLocations || assessmentData.seizureLocations || null,
    seizureBilateral: Boolean(assessmentData.SeizureBilateral ?? assessmentData.seizureBilateral),
    sensoryWnl: Boolean(assessmentData.SensoryWnl ?? assessmentData.sensoryWnl),
    decreasedSensation: Boolean(assessmentData.DecreasedSensation ?? assessmentData.decreasedSensation),
    sensoryLocation: assessmentData.SensoryLocation || assessmentData.sensoryLocation || null,
    hearingWnl: Boolean(assessmentData.HearingWnl ?? assessmentData.hearingWnl),
    hearingImpairedLeft: Boolean(assessmentData.HearingImpairedLeft ?? assessmentData.hearingImpairedLeft),
    hearingImpairedRight: Boolean(assessmentData.HearingImpairedRight ?? assessmentData.hearingImpairedRight),
    deaf: Boolean(assessmentData.Deaf ?? assessmentData.deaf),
    speechWnl: Boolean(assessmentData.SpeechWnl ?? assessmentData.speechWnl),
    speechImpaired: Boolean(assessmentData.SpeechImpaired ?? assessmentData.speechImpaired),
    visionWnl: Boolean(assessmentData.VisionWnl ?? assessmentData.visionWnl),
    visionImpairedLeft: Boolean(assessmentData.VisionImpairedLeft ?? assessmentData.visionImpairedLeft),
    visionImpairedRight: Boolean(assessmentData.VisionImpairedRight ?? assessmentData.visionImpairedRight),
    blind: Boolean(assessmentData.Blind ?? assessmentData.blind),
    sleepPattern: assessmentData.SleepPattern || assessmentData.sleepPattern || null,
    otherSleepPattern: toOtherFieldOrNull(
      assessmentData.SleepPattern || assessmentData.sleepPattern,
      assessmentData.OtherSleepPattern || assessmentData.otherSleepPattern
    ),
    neurologicalComments: assessmentData.NeurologicalComments || assessmentData.neurologicalComments || null,

    // Cardiovascular
    cardiovascularWnl: Boolean(assessmentData.CardiovascularWnl ?? assessmentData.cardiovascularWnl),
    chestPain: assessmentData.ChestPain || assessmentData.chestPain || null,
    heartSounds: assessmentData.HeartSounds || assessmentData.heartSounds || null,
    otherHeartSounds: toOtherFieldOrNull(
      assessmentData.HeartSounds || assessmentData.heartSounds,
      assessmentData.OtherHeartSounds || assessmentData.otherHeartSounds
    ),
    peripheralPulses: assessmentData.PeripheralPulses || assessmentData.peripheralPulses || null,
    otherPeripheralPulses: toOtherFieldOrNull(
      assessmentData.PeripheralPulses || assessmentData.peripheralPulses,
      assessmentData.OtherPeripheralPulses || assessmentData.otherPeripheralPulses
    ),
    capillaryRefillNormal: Boolean(assessmentData.CapillaryRefillNormal ?? assessmentData.capillaryRefillNormal),
    dizziness: assessmentData.Dizziness || assessmentData.dizziness || null,
    edemaRUE: assessmentData.EdemaRUE || assessmentData.edemaRUE || null,
    edemaLUE: assessmentData.EdemaLUE || assessmentData.edemaLUE || null,
    edemaRLE: assessmentData.EdemaRLE || assessmentData.edemaRLE || null,
    edemaLLE: assessmentData.EdemaLLE || assessmentData.edemaLLE || null,
    neckVeinDistention: assessmentData.NeckVeinDistention || assessmentData.neckVeinDistention || null,
    cardiovascularComments: assessmentData.CardiovascularComments || assessmentData.cardiovascularComments || null,

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
    respiratoryWnl: Boolean(assessmentData.RespiratoryWnl ?? assessmentData.respiratoryWnl),
    lungSounds: assessmentData.lungSounds || null,
    otherLungSounds: toOtherFieldOrNull(
      assessmentData.lungSounds,
      assessmentData.OtherLungSounds || assessmentData.otherLungSounds
    ),
    respiratoryEffort: assessmentData.respiratoryEffort || null,
    otherRespiratoryEffort: toOtherFieldOrNull(
      assessmentData.respiratoryEffort,
      assessmentData.OtherRespiratoryEffort || assessmentData.otherRespiratoryEffort
    ),
    shortnessOfBreath: assessmentData.ShortnessOfBreath || assessmentData.shortnessOfBreath || null,
    otherShortnessOfBreath: toOtherFieldOrNull(
      assessmentData.ShortnessOfBreath || assessmentData.shortnessOfBreath,
      assessmentData.OtherShortnessOfBreath || assessmentData.otherShortnessOfBreath
    ),
    cough: assessmentData.Cough || assessmentData.cough || null,
    otherCough: toOtherFieldOrNull(
      assessmentData.Cough || assessmentData.cough,
      assessmentData.OtherCough || assessmentData.otherCough
    ),
    sputumAmount: assessmentData.SputumAmount || assessmentData.sputumAmount || null,
    sputumDescription: assessmentData.SputumDescription || assessmentData.sputumDescription || null,
    roomAir: Boolean(assessmentData.RoomAir ?? assessmentData.roomAir),
    oxygenDeliveryMethod: assessmentData.OxygenDeliveryMethod || assessmentData.oxygenDeliveryMethod || null,
    otherOxygenDeliveryMethod: toOtherFieldOrNull(
      assessmentData.OxygenDeliveryMethod || assessmentData.oxygenDeliveryMethod,
      assessmentData.OtherOxygenDeliveryMethod || assessmentData.otherOxygenDeliveryMethod
    ),
    oxygenFrequency: assessmentData.OxygenFrequency || assessmentData.oxygenFrequency || null,
    otherOxygenFrequency: toOtherFieldOrNull(
      assessmentData.OxygenFrequency || assessmentData.oxygenFrequency,
      assessmentData.OtherOxygenFrequency || assessmentData.otherOxygenFrequency
    ),
    nebulizer: assessmentData.Nebulizer || assessmentData.nebulizer || null,
    respiratoryComments: assessmentData.RespiratoryComments || assessmentData.respiratoryComments || null,

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
    otherDiet: toOtherFieldOrNull(assessmentData.diet, assessmentData.OtherDiet || assessmentData.otherDiet),
    appetite: assessmentData.appetite || null,
    otherAppetite: toOtherFieldOrNull(assessmentData.appetite, assessmentData.OtherAppetite || assessmentData.otherAppetite),
    bowelSounds: assessmentData.bowelSounds || null,
    lastBowelMovement: assessmentData.lastBowelMovement || null,
    abdomen: assessmentData.abdomen || null,
    gastrointestinalComments: assessmentData.gastrointestinalComments || null,

    // Genitourinary
    urineAppearance: assessmentData.urineAppearance || null,
    otherUrineAppearance: toOtherFieldOrNull(
      assessmentData.urineAppearance,
      assessmentData.OtherUrineAppearance || assessmentData.otherUrineAppearance
    ),
    continence: assessmentData.continence || null,
    otherContinence: toOtherFieldOrNull(
      assessmentData.continence,
      assessmentData.OtherContinence || assessmentData.otherContinence
    ),
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
    const payload = buildCreateAssessmentPayload(assessmentData);
    
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