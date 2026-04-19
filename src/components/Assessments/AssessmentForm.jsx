  // Cardiovascular section renderer moved inside AssessmentForm
// components/AssessmentForm.jsx
import React, { useEffect, useMemo, useState } from 'react';
import assessmentService from '../../services/assessmentService';
import './AssessmentForm.css';

// Icon components (simplified versions - replace with your actual icons)
const VitalIcon = () => <span>❤️</span>;
const InterventionsIcon = () => <span>💊</span>;
const NeuroIcon = () => <span>🧠</span>;
const SkinIcon = () => <span>🩹</span>;
const RespiratoryIcon = () => <span>🫁</span>;
const MobilityIcon = () => <span>🚶</span>;
const NotesIcon = () => <span>📝</span>;

const BLOOD_PRESSURE_POSITIONS = ['Standing', 'Sitting', 'Lying', 'Other'];
const TEMPERATURE_ROUTES = ['Rectal', 'Oral', 'Tympanic', 'Temporal', 'Axillary', 'Other'];
const HEART_SOUND_TYPES = ['Normal', 'Irregular', 'Murmur', 'Other'];
const PULSE_STRENGTH_TYPES = ['Strong', 'Bounding', 'Weak', 'Thready', 'Absent', 'Other'];
const LUNG_SOUND_TYPES = ['Clear', 'Wheezing', 'Crackles', 'Diminished', 'Stridor', 'Coarse', 'Other'];
const RESPIRATORY_EFFORT_TYPES = ['Normal', 'Labored', 'Dyspnea', 'Shallow', 'Tachypneic', 'Other'];
const SHORTNESS_OF_BREATH_LEVELS = [
  'WithWalkingOver20FtOrStairs',
  'WithModerateExertion',
  'WithMinimalExertionOrAgitation',
  'AtRest',
  'Other',
];
const COUGH_TYPES = ['Productive', 'Nonproductive', 'Other'];
const OXYGEN_DELIVERY_METHODS = ['None', 'NasalCannula', 'Mask', 'Ventilator', 'Other'];
const OXYGEN_FREQUENCIES = ['Continuous', 'AtNight', 'WithActivity', 'PRN', 'Other'];
const SLEEP_PATTERNS = ['Wnl', 'Interrupted', 'FrequentNaps', 'SleepingMostOfTheTime', 'AsleepDuringVisit', 'Other'];
const DIET_TYPES = ['Regular', 'NPO', 'TubeFeeding', 'Other'];
const APPETITE_LEVELS = ['Good', 'Fair', 'Poor', 'Other'];
const URINE_APPEARANCES = ['Clear', 'Yellow', 'Amber', 'Brown', 'Cloudy', 'Other'];
const CONTINENCE_STATUSES = ['Continent', 'Incontinent', 'Other'];

const OTHER_FIELD_DEPENDENCIES = {
  BloodPressurePosition: { otherField: 'OtherBloodPressurePosition', label: 'Other Blood Pressure Position' },
  TemperatureRoute: { otherField: 'OtherTemperatureRoute', label: 'Other Temperature Route' },
  HeartSounds: { otherField: 'OtherHeartSounds', label: 'Other Heart Sounds' },
  PeripheralPulses: { otherField: 'OtherPeripheralPulses', label: 'Other Pulse Strength' },
  SleepPattern: { otherField: 'OtherSleepPattern', label: 'Other Sleep Pattern' },
  lungSounds: { otherField: 'OtherLungSounds', label: 'Other Lung Sounds' },
  respiratoryEffort: { otherField: 'OtherRespiratoryEffort', label: 'Other Respiratory Effort' },
  ShortnessOfBreath: { otherField: 'OtherShortnessOfBreath', label: 'Other Shortness Of Breath' },
  Cough: { otherField: 'OtherCough', label: 'Other Cough' },
  OxygenDeliveryMethod: { otherField: 'OtherOxygenDeliveryMethod', label: 'Other Oxygen Delivery Method' },
  OxygenFrequency: { otherField: 'OtherOxygenFrequency', label: 'Other Oxygen Frequency' },
  diet: { otherField: 'OtherDiet', label: 'Other Diet' },
  appetite: { otherField: 'OtherAppetite', label: 'Other Appetite' },
  urineAppearance: { otherField: 'OtherUrineAppearance', label: 'Other Urine Appearance' },
  continence: { otherField: 'OtherContinence', label: 'Other Continence' },
};

const createDefaultFormData = () => ({
  bloodPressure: '',
  BloodPressurePosition: '',
  OtherBloodPressurePosition: '',
  TemperatureRoute: '',
  OtherTemperatureRoute: '',
  Weight: '',
  StandardPrecautionsMaintained: false,
  VitalSignsComments: '',
  pulseRate: '',
  respiratoryRate: '',
  spO2: '',
  temperature: '',
  oxygenLitersPerMinute: '',
  painScore: '',
  oxygenGiven: false,
  ivStarted: false,
  cprPerformed: false,
  isAlert: true,
  isOriented: true,
  OrientationPerson: false,
  OrientationPlace: false,
  OrientationTime: false,
  Disoriented: false,
  CognitiveForgetful: false,
  CognitiveHallucinations: false,
  OtherCognitiveStatus: '',
  PupilsPerrla: false,
  PupilsNonReactive: false,
  PupilsUnequal: false,
  PupilsImpairedMovement: false,
  Tremors: false,
  SeizureActivity: false,
  SeizureLocations: '',
  SeizureBilateral: false,
  SensoryWnl: false,
  DecreasedSensation: false,
  SensoryLocation: '',
  HearingWnl: false,
  HearingImpairedLeft: false,
  HearingImpairedRight: false,
  Deaf: false,
  SpeechWnl: false,
  SpeechImpaired: false,
  VisionWnl: false,
  VisionImpairedLeft: false,
  VisionImpairedRight: false,
  Blind: false,
  SleepPattern: '',
  OtherSleepPattern: '',
  NeurologicalComments: '',
  skinWarm: false,
  skinDry: false,
  skinPale: false,
  skinCool: false,
  skinHot: false,
  skinFlushed: false,
  skinCyanotic: false,
  skinClammy: false,
  skinJaundice: false,
  skinDiaphoretic: false,
  otherSkinCondition: '',
  respiratorySymmetrical: true,
  respiratoryAsymmetrical: false,
  lungSounds: '',
  OtherLungSounds: '',
  respiratoryEffort: '',
  OtherRespiratoryEffort: '',
  RespiratoryWnl: false,
  ShortnessOfBreath: '',
  OtherShortnessOfBreath: '',
  Cough: '',
  OtherCough: '',
  SputumAmount: '',
  SputumDescription: '',
  RoomAir: false,
  OxygenDeliveryMethod: '',
  OtherOxygenDeliveryMethod: '',
  OxygenFrequency: '',
  OtherOxygenFrequency: '',
  Nebulizer: '',
  RespiratoryComments: '',
  gaitSteady: true,
  usesCane: false,
  usesCrutches: false,
  usesWheelchair: false,
  bedridden: false,
  requiresAssistance: false,
  otherMobilityStatus: '',
  otherAssistiveDevice: '',
  diet: '',
  OtherDiet: '',
  appetite: '',
  OtherAppetite: '',
  bowelSounds: '',
  lastBowelMovement: '',
  abdomen: '',
  gastrointestinalComments: '',
  urineAppearance: '',
  OtherUrineAppearance: '',
  continence: '',
  OtherContinence: '',
  catheter: false,
  lastVoid: '',
  genitourinaryComments: '',
  painLocation: '',
  painDuration: '',
  painIntervention: '',
  painEffectiveness: '',
  painComments: '',
  diagnoses: [],
  CardiovascularWnl: false,
  ChestPain: '',
  HeartSounds: '',
  OtherHeartSounds: '',
  PeripheralPulses: '',
  OtherPeripheralPulses: '',
  CapillaryRefillNormal: false,
  Dizziness: '',
  EdemaRUE: '',
  EdemaLUE: '',
  EdemaRLE: '',
  EdemaLLE: '',
  NeckVeinDistention: '',
  CardiovascularComments: '',
  hospicePrognosisSixMonthsOrLess: false,
  hospiceHospitalizationsLast30Days: '',
  hospiceFunctionalDecline: false,
  hospicePhysicalDecline: false,
  hospiceCognitiveDecline: false,
  hospiceRapidWeightLossKgLastMonth: '',
  hospiceDysphagia: false,
  hospicePersistentSymptomsDespiteTreatment: false,
  hospiceIncreasedLethargy: false,
  hospiceDisorientation: false,
  hospiceNotes: '',
  nurseNotes: '',
});

const toDateInputValue = (value) => {
  if (!value) return '';
  const text = String(value);
  return text.includes('T') ? text.slice(0, 10) : text;
};

const mapAssessmentToFormData = (assessment) => {
  const defaults = createDefaultFormData();
  if (!assessment || typeof assessment !== 'object') return defaults;

  const hospice = assessment.hospiceEligibility || {};
  const diagnoses = Array.isArray(assessment.diagnoses) ? assessment.diagnoses : [];
  const normalizedSleepPattern = assessment.sleepPattern === 'WNL' ? 'Wnl' : assessment.sleepPattern;

  return {
    ...defaults,
    bloodPressure: assessment.bloodPressure ?? defaults.bloodPressure,
    BloodPressurePosition: assessment.bloodPressurePosition ?? defaults.BloodPressurePosition,
    OtherBloodPressurePosition: assessment.otherBloodPressurePosition ?? defaults.OtherBloodPressurePosition,
    TemperatureRoute: assessment.temperatureRoute ?? defaults.TemperatureRoute,
    OtherTemperatureRoute: assessment.otherTemperatureRoute ?? defaults.OtherTemperatureRoute,
    Weight: assessment.weight ?? defaults.Weight,
    StandardPrecautionsMaintained: Boolean(assessment.standardPrecautionsMaintained),
    VitalSignsComments: assessment.vitalSignsComments ?? defaults.VitalSignsComments,
    pulseRate: assessment.pulseRate ?? defaults.pulseRate,
    respiratoryRate: assessment.respiratoryRate ?? defaults.respiratoryRate,
    spO2: assessment.spO2 ?? defaults.spO2,
    temperature: assessment.temperature ?? defaults.temperature,
    oxygenLitersPerMinute: assessment.oxygenLitersPerMinute ?? defaults.oxygenLitersPerMinute,
    painScore: assessment.painScore ?? defaults.painScore,
    oxygenGiven: Boolean(assessment.oxygenGiven),
    ivStarted: Boolean(assessment.ivStarted),
    cprPerformed: Boolean(assessment.cprPerformed),
    isAlert: Boolean(assessment.isAlert),
    isOriented: Boolean(assessment.isOriented),
    OrientationPerson: Boolean(assessment.orientationPerson),
    OrientationPlace: Boolean(assessment.orientationPlace),
    OrientationTime: Boolean(assessment.orientationTime),
    Disoriented: Boolean(assessment.disoriented),
    CognitiveForgetful: Boolean(assessment.cognitiveForgetful),
    CognitiveHallucinations: Boolean(assessment.cognitiveHallucinations),
    OtherCognitiveStatus: assessment.otherCognitiveStatus ?? defaults.OtherCognitiveStatus,
    PupilsPerrla: Boolean(assessment.pupilsPerrla),
    PupilsNonReactive: Boolean(assessment.pupilsNonReactive),
    PupilsUnequal: Boolean(assessment.pupilsUnequal),
    PupilsImpairedMovement: Boolean(assessment.pupilsImpairedMovement),
    Tremors: Boolean(assessment.tremors),
    SeizureActivity: Boolean(assessment.seizureActivity),
    SeizureLocations: assessment.seizureLocations ?? defaults.SeizureLocations,
    SeizureBilateral: Boolean(assessment.seizureBilateral),
    SensoryWnl: Boolean(assessment.sensoryWnl),
    DecreasedSensation: Boolean(assessment.decreasedSensation),
    SensoryLocation: assessment.sensoryLocation ?? defaults.SensoryLocation,
    HearingWnl: Boolean(assessment.hearingWnl),
    HearingImpairedLeft: Boolean(assessment.hearingImpairedLeft),
    HearingImpairedRight: Boolean(assessment.hearingImpairedRight),
    Deaf: Boolean(assessment.deaf),
    SpeechWnl: Boolean(assessment.speechWnl),
    SpeechImpaired: Boolean(assessment.speechImpaired),
    VisionWnl: Boolean(assessment.visionWnl),
    VisionImpairedLeft: Boolean(assessment.visionImpairedLeft),
    VisionImpairedRight: Boolean(assessment.visionImpairedRight),
    Blind: Boolean(assessment.blind),
    SleepPattern: normalizedSleepPattern ?? defaults.SleepPattern,
    OtherSleepPattern: assessment.otherSleepPattern ?? defaults.OtherSleepPattern,
    NeurologicalComments: assessment.neurologicalComments ?? defaults.NeurologicalComments,
    skinWarm: Boolean(assessment.skinWarm),
    skinDry: Boolean(assessment.skinDry),
    skinPale: Boolean(assessment.skinPale),
    skinCool: Boolean(assessment.skinCool),
    skinHot: Boolean(assessment.skinHot),
    skinFlushed: Boolean(assessment.skinFlushed),
    skinCyanotic: Boolean(assessment.skinCyanotic),
    skinClammy: Boolean(assessment.skinClammy),
    skinJaundice: Boolean(assessment.skinJaundice),
    skinDiaphoretic: Boolean(assessment.skinDiaphoretic),
    otherSkinCondition: assessment.otherSkinCondition ?? defaults.otherSkinCondition,
    respiratorySymmetrical: Boolean(assessment.respiratorySymmetrical),
    respiratoryAsymmetrical: Boolean(assessment.respiratoryAsymmetrical),
    lungSounds: assessment.lungSounds ?? defaults.lungSounds,
    OtherLungSounds: assessment.otherLungSounds ?? defaults.OtherLungSounds,
    respiratoryEffort: assessment.respiratoryEffort ?? defaults.respiratoryEffort,
    OtherRespiratoryEffort: assessment.otherRespiratoryEffort ?? defaults.OtherRespiratoryEffort,
    RespiratoryWnl: Boolean(assessment.respiratoryWnl),
    ShortnessOfBreath: assessment.shortnessOfBreath ?? defaults.ShortnessOfBreath,
    OtherShortnessOfBreath: assessment.otherShortnessOfBreath ?? defaults.OtherShortnessOfBreath,
    Cough: assessment.cough ?? defaults.Cough,
    OtherCough: assessment.otherCough ?? defaults.OtherCough,
    SputumAmount: assessment.sputumAmount ?? defaults.SputumAmount,
    SputumDescription: assessment.sputumDescription ?? defaults.SputumDescription,
    RoomAir: Boolean(assessment.roomAir),
    OxygenDeliveryMethod: assessment.oxygenDeliveryMethod ?? defaults.OxygenDeliveryMethod,
    OtherOxygenDeliveryMethod: assessment.otherOxygenDeliveryMethod ?? defaults.OtherOxygenDeliveryMethod,
    OxygenFrequency: assessment.oxygenFrequency ?? defaults.OxygenFrequency,
    OtherOxygenFrequency: assessment.otherOxygenFrequency ?? defaults.OtherOxygenFrequency,
    Nebulizer: assessment.nebulizer ?? defaults.Nebulizer,
    RespiratoryComments: assessment.respiratoryComments ?? defaults.RespiratoryComments,
    gaitSteady: Boolean(assessment.gaitSteady),
    usesCane: Boolean(assessment.usesCane),
    usesCrutches: Boolean(assessment.usesCrutches),
    usesWheelchair: Boolean(assessment.usesWheelchair),
    bedridden: Boolean(assessment.bedridden),
    requiresAssistance: Boolean(assessment.requiresAssistance),
    otherMobilityStatus: assessment.otherMobilityStatus ?? defaults.otherMobilityStatus,
    otherAssistiveDevice: assessment.otherAssistiveDevice ?? defaults.otherAssistiveDevice,
    diet: assessment.diet ?? defaults.diet,
    OtherDiet: assessment.otherDiet ?? defaults.OtherDiet,
    appetite: assessment.appetite ?? defaults.appetite,
    OtherAppetite: assessment.otherAppetite ?? defaults.OtherAppetite,
    bowelSounds: assessment.bowelSounds ?? defaults.bowelSounds,
    lastBowelMovement: toDateInputValue(assessment.lastBowelMovement),
    abdomen: assessment.abdomen ?? defaults.abdomen,
    gastrointestinalComments: assessment.gastrointestinalComments ?? defaults.gastrointestinalComments,
    urineAppearance: assessment.urineAppearance ?? defaults.urineAppearance,
    OtherUrineAppearance: assessment.otherUrineAppearance ?? defaults.OtherUrineAppearance,
    continence: assessment.continence ?? defaults.continence,
    OtherContinence: assessment.otherContinence ?? defaults.OtherContinence,
    catheter: Boolean(assessment.catheter),
    lastVoid: toDateInputValue(assessment.lastVoid),
    genitourinaryComments: assessment.genitourinaryComments ?? defaults.genitourinaryComments,
    painLocation: assessment.painLocation ?? defaults.painLocation,
    painDuration: assessment.painDuration ?? defaults.painDuration,
    painIntervention: assessment.painIntervention ?? defaults.painIntervention,
    painEffectiveness: assessment.painEffectiveness ?? defaults.painEffectiveness,
    painComments: assessment.painComments ?? defaults.painComments,
    diagnoses: diagnoses.map((d) => ({
      category: d?.category || '',
      description: d?.description || '',
      icd10Code: d?.icd10Code || '',
      isPrimary: Boolean(d?.isPrimary),
    })),
    CardiovascularWnl: Boolean(assessment.cardiovascularWnl),
    ChestPain: assessment.chestPain ?? defaults.ChestPain,
    HeartSounds: assessment.heartSounds ?? defaults.HeartSounds,
    OtherHeartSounds: assessment.otherHeartSounds ?? defaults.OtherHeartSounds,
    PeripheralPulses: assessment.peripheralPulses ?? defaults.PeripheralPulses,
    OtherPeripheralPulses: assessment.otherPeripheralPulses ?? defaults.OtherPeripheralPulses,
    CapillaryRefillNormal: Boolean(assessment.capillaryRefillNormal),
    Dizziness: assessment.dizziness ?? defaults.Dizziness,
    EdemaRUE: assessment.edemaRUE ?? defaults.EdemaRUE,
    EdemaLUE: assessment.edemaLUE ?? defaults.EdemaLUE,
    EdemaRLE: assessment.edemaRLE ?? defaults.EdemaRLE,
    EdemaLLE: assessment.edemaLLE ?? defaults.EdemaLLE,
    NeckVeinDistention: assessment.neckVeinDistention ?? defaults.NeckVeinDistention,
    CardiovascularComments: assessment.cardiovascularComments ?? defaults.CardiovascularComments,
    hospicePrognosisSixMonthsOrLess: Boolean(hospice.prognosisSixMonthsOrLess),
    hospiceHospitalizationsLast30Days: hospice.hospitalizationsLast30Days ?? defaults.hospiceHospitalizationsLast30Days,
    hospiceFunctionalDecline: Boolean(hospice.functionalDecline),
    hospicePhysicalDecline: Boolean(hospice.physicalDecline),
    hospiceCognitiveDecline: Boolean(hospice.cognitiveDecline),
    hospiceRapidWeightLossKgLastMonth: hospice.rapidWeightLossKgLastMonth ?? defaults.hospiceRapidWeightLossKgLastMonth,
    hospiceDysphagia: Boolean(hospice.dysphagia),
    hospicePersistentSymptomsDespiteTreatment: Boolean(hospice.persistentSymptomsDespiteTreatment),
    hospiceIncreasedLethargy: Boolean(hospice.increasedLethargy),
    hospiceDisorientation: Boolean(hospice.disorientation),
    hospiceNotes: hospice.notes ?? defaults.hospiceNotes,
    nurseNotes: assessment.nurseNotes ?? defaults.nurseNotes,
  };
};

const FormHeaderIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" width="24" height="24">
    <path
      d="M8 3h8a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M7 13h10M7 17h7"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const AssessmentForm = ({ patientId, assessmentId = null, initialData = null, onSuccess, onCancel }) => {
  const steps = useMemo(
    () => [
      { id: 'vitalSigns', title: 'Vital Signs', icon: <VitalIcon /> },
      { id: 'cardiovascular', title: 'Cardiovascular', icon: <InterventionsIcon /> },
      { id: 'interventions', title: 'Interventions', icon: <InterventionsIcon /> },
      { id: 'neurological', title: 'Neurological Status', icon: <NeuroIcon /> },
      { id: 'skin', title: 'Skin Conditions', icon: <SkinIcon /> },
      { id: 'respiratory', title: 'Respiratory Assessment', icon: <RespiratoryIcon /> },
      { id: 'musculoskeletal', title: 'Mobility Assessment', icon: <MobilityIcon /> },
      { id: 'gastrointestinal', title: 'Gastrointestinal Assessment', icon: <InterventionsIcon /> },
      { id: 'genitourinary', title: 'Genitourinary Assessment', icon: <InterventionsIcon /> },
      { id: 'painDetails', title: 'Pain Details', icon: <InterventionsIcon /> },
      { id: 'diagnoses', title: 'Diagnoses', icon: <NotesIcon /> },
      { id: 'hospiceEligibility', title: 'Hospice Eligibility', icon: <NeuroIcon /> },
      { id: 'nurseNotes', title: 'Nurse Notes', icon: <NotesIcon /> },
    ],
    []
  );

  const [stepIndex, setStepIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const currentStep = steps[stepIndex];
  const isFirstStep = stepIndex === 0;
  const isLastStep = stepIndex === steps.length - 1;

  const [formData, setFormData] = useState(createDefaultFormData);

  useEffect(() => {
    setFormData(initialData ? mapAssessmentToFormData(initialData) : createDefaultFormData());
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const nextValue = type === 'checkbox' ? checked : value;
    const dependency = OTHER_FIELD_DEPENDENCIES[name];

    setFormData((prev) => ({
      ...prev,
      [name]: nextValue,
      ...(dependency && nextValue !== 'Other' ? { [dependency.otherField]: '' } : {}),
    }));
  };

  const renderConditionalOtherInput = (enumField, label, placeholder) => {
    const dependency = OTHER_FIELD_DEPENDENCIES[enumField];
    if (!dependency || formData[enumField] !== 'Other') return null;

    return (
      <div className="form-group">
        <label className="form-label">{label}</label>
        <input
          type="text"
          name={dependency.otherField}
          value={formData[dependency.otherField]}
          onChange={handleChange}
          placeholder={placeholder}
        />
      </div>
    );
  };

  const diagnosisCategories = useMemo(
    () => [
      'Cancer',
      'Dementia',
      'HeartDisease',
      'LungDisease',
      'Stroke',
      'RenalFailure',
      'LiverDisease',
      'ALS',
      'NeurologicalDisease',
      'Other',
    ],
    []
  );

  // Helper to render diagnoses list
  const renderDiagnoses = () => {
    if (!Array.isArray(formData.diagnoses) || formData.diagnoses.length === 0) {
      return <div style={{ paddingTop: 'var(--spacing-md)', color: '#2c3e50' }}>No diagnoses added.</div>;
    }
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)', paddingTop: 'var(--spacing-md)' }}>
        {formData.diagnoses.map((d, idx) => (
          <div
            key={idx}
            style={{
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-xl)',
              padding: 'var(--spacing-lg)',
              background: 'var(--white-color)'
            }}
          >
            <div className="assessmentFormGrid">
              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  value={d?.category || ''}
                  onChange={(e) => updateDiagnosis(idx, 'category', e.target.value)}
                >
                  <option value="">Select Category</option>
                  {diagnosisCategories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <input
                  type="text"
                  value={d?.description || ''}
                  onChange={(e) => updateDiagnosis(idx, 'description', e.target.value)}
                  placeholder="Diagnosis description"
                />
              </div>
              <div className="form-group">
                <label className="form-label">ICD-10 Code (optional)</label>
                <input
                  type="text"
                  value={d?.icd10Code || ''}
                  onChange={(e) => updateDiagnosis(idx, 'icd10Code', e.target.value)}
                  placeholder="e.g., C34.90"
                />
              </div>
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={Boolean(d?.isPrimary)}
                    onChange={(e) => updateDiagnosis(idx, 'isPrimary', e.target.checked)}
                  />
                  Primary
                </label>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 'var(--spacing-sm)' }}>
              <button type="button" className="assessmentBtnCancel" onClick={() => removeDiagnosis(idx)}>
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const addDiagnosis = () => {
    setFormData((prev) => ({
      ...prev,
      diagnoses: [
        ...(Array.isArray(prev.diagnoses) ? prev.diagnoses : []),
        { category: '', description: '', icd10Code: '', isPrimary: false },
      ],
    }));
  };

  const removeDiagnosis = (indexToRemove) => {
    setFormData((prev) => ({
      ...prev,
      diagnoses: (Array.isArray(prev.diagnoses) ? prev.diagnoses : []).filter((_, idx) => idx !== indexToRemove),
    }));
  };

  const updateDiagnosis = (indexToUpdate, field, value) => {
    setFormData((prev) => ({
      ...prev,
      diagnoses: (Array.isArray(prev.diagnoses) ? prev.diagnoses : []).map((d, idx) => {
        if (idx !== indexToUpdate) return d;
        return { ...d, [field]: value };
      }),
    }));
  };

  const toIsoStringOrNull = (value) => {
    const v = String(value || '').trim();
    if (!v) return null;
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return null;
    return d.toISOString();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isLastStep) {
      setStepIndex((prev) => Math.min(prev + 1, steps.length - 1));
      return;
    }

    setIsSubmitting(true);
    
    try {
      const diagnoses = Array.isArray(formData.diagnoses) ? formData.diagnoses : [];
      const trimmedDiagnoses = diagnoses
        .map((d) => ({
          category: String(d?.category || '').trim(),
          description: String(d?.description || '').trim(),
          icd10Code: String(d?.icd10Code || '').trim(),
          isPrimary: Boolean(d?.isPrimary),
        }))
        .filter((d) => d.category || d.description || d.icd10Code || d.isPrimary);

      const invalidDiagnosis = trimmedDiagnoses.find((d) => !d.category || !d.description);
      if (invalidDiagnosis) {
        alert('Please complete diagnosis Category and Description (or remove the empty diagnosis row).');
        setIsSubmitting(false);
        return;
      }

      const missingOtherValue = Object.entries(OTHER_FIELD_DEPENDENCIES).find(([enumField, dependency]) => {
        return formData[enumField] === 'Other' && String(formData[dependency.otherField] || '').trim() === '';
      });

      if (missingOtherValue) {
        alert(`Please enter ${missingOtherValue[1].label}.`);
        setIsSubmitting(false);
        return;
      }

      const hospiceEligibilityHasAnyValue =
        Boolean(formData.hospicePrognosisSixMonthsOrLess) ||
        String(formData.hospiceHospitalizationsLast30Days || '').trim() !== '' ||
        Boolean(formData.hospiceFunctionalDecline) ||
        Boolean(formData.hospicePhysicalDecline) ||
        Boolean(formData.hospiceCognitiveDecline) ||
        String(formData.hospiceRapidWeightLossKgLastMonth || '').trim() !== '' ||
        Boolean(formData.hospiceDysphagia) ||
        Boolean(formData.hospicePersistentSymptomsDespiteTreatment) ||
        Boolean(formData.hospiceIncreasedLethargy) ||
        Boolean(formData.hospiceDisorientation) ||
        String(formData.hospiceNotes || '').trim() !== '';

      const hospiceEligibility = hospiceEligibilityHasAnyValue
        ? {
            prognosisSixMonthsOrLess: formData.hospicePrognosisSixMonthsOrLess ? true : null,
            hospitalizationsLast30Days: formData.hospiceHospitalizationsLast30Days
              ? parseInt(formData.hospiceHospitalizationsLast30Days, 10)
              : null,
            functionalDecline: formData.hospiceFunctionalDecline ? true : null,
            physicalDecline: formData.hospicePhysicalDecline ? true : null,
            cognitiveDecline: formData.hospiceCognitiveDecline ? true : null,
            rapidWeightLossKgLastMonth: formData.hospiceRapidWeightLossKgLastMonth
              ? parseFloat(formData.hospiceRapidWeightLossKgLastMonth)
              : null,
            dysphagia: formData.hospiceDysphagia ? true : null,
            persistentSymptomsDespiteTreatment: formData.hospicePersistentSymptomsDespiteTreatment ? true : null,
            increasedLethargy: formData.hospiceIncreasedLethargy ? true : null,
            disorientation: formData.hospiceDisorientation ? true : null,
            notes: String(formData.hospiceNotes || '').trim() || null,
          }
        : null;

      const dataToSubmit = {
        ...formData,
        patientId,
        pulseRate: formData.pulseRate ? parseInt(formData.pulseRate, 10) : null,
        respiratoryRate: formData.respiratoryRate ? parseInt(formData.respiratoryRate, 10) : null,
        spO2: formData.spO2 ? parseInt(formData.spO2, 10) : null,
        temperature: formData.temperature ? parseFloat(formData.temperature) : null,
        oxygenLitersPerMinute: formData.oxygenLitersPerMinute ? parseFloat(formData.oxygenLitersPerMinute) : null,
        painScore: formData.painScore ? parseInt(formData.painScore, 10) : null,
        lastBowelMovement: toIsoStringOrNull(formData.lastBowelMovement),
        lastVoid: toIsoStringOrNull(formData.lastVoid),
        catheter: formData.catheter ? true : null,
        diagnoses: trimmedDiagnoses.length ? trimmedDiagnoses.map((d) => ({
          category: d.category,
          description: d.description,
          icd10Code: d.icd10Code || null,
          isPrimary: d.isPrimary,
        })) : null,
        hospiceEligibility,
      };
      
      const result = assessmentId
        ? await assessmentService.updateAssessment(assessmentId, dataToSubmit)
        : await assessmentService.createAssessment(dataToSubmit);
      
      if (onSuccess) {
        onSuccess(result);
      }
    } catch (error) {
      console.error('Error creating assessment:', error);
      alert('Failed to create assessment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render Vital Signs section
  const renderVitalSigns = () => (
    <section className="assessmentFormSection">
      <div className="assessmentFormGrid">
        <div className="form-group">
          <label className="form-label">Blood Pressure</label>
          <input type="text" name="bloodPressure" value={formData.bloodPressure} onChange={handleChange} placeholder="e.g., 120/80" />
        </div>
        <div className="form-group">
          <label className="form-label">Blood Pressure Position</label>
          <select name="BloodPressurePosition" value={formData.BloodPressurePosition} onChange={handleChange}>
            <option value="">Select position</option>
            {BLOOD_PRESSURE_POSITIONS.map((value) => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>
        </div>
        {renderConditionalOtherInput('BloodPressurePosition', 'Other Blood Pressure Position', 'Describe position')}
        <div className="form-group">
          <label className="form-label">Temperature Route</label>
          <select name="TemperatureRoute" value={formData.TemperatureRoute} onChange={handleChange}>
            <option value="">Select route</option>
            {TEMPERATURE_ROUTES.map((value) => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>
        </div>
        {renderConditionalOtherInput('TemperatureRoute', 'Other Temperature Route', 'Describe route')}
        <div className="form-group">
          <label className="form-label">Weight (kg)</label>
          <input type="number" name="Weight" value={formData.Weight} onChange={handleChange} placeholder="kg" />
        </div>
        <div className="form-group">
          <label className="checkbox-label">
            <input type="checkbox" name="StandardPrecautionsMaintained" checked={formData.StandardPrecautionsMaintained} onChange={handleChange} />
            Standard Precautions Maintained
          </label>
        </div>
        <div className="form-group">
          <label className="checkbox-label">
            <input type="checkbox" name="oxygenGiven" checked={formData.oxygenGiven} onChange={handleChange} />
            Oxygen Given
          </label>
        </div>
        <div className="form-group">
          <label className="form-label">Vital Signs Comments</label>
          <input type="text" name="VitalSignsComments" value={formData.VitalSignsComments} onChange={handleChange} placeholder="Comments" />
        </div>
        <div className="form-group">
          <label className="form-label">Pulse Rate</label>
          <input type="number" name="pulseRate" value={formData.pulseRate} onChange={handleChange} placeholder="bpm" />
        </div>
        <div className="form-group">
          <label className="form-label">Respiratory Rate</label>
          <input type="number" name="respiratoryRate" value={formData.respiratoryRate} onChange={handleChange} placeholder="breaths/min" />
        </div>
        <div className="form-group">
          <label className="form-label">SpO2 (%)</label>
          <input type="number" name="spO2" value={formData.spO2} onChange={handleChange} placeholder="%" />
        </div>
        <div className="form-group">
          <label className="form-label">Temperature (°C)</label>
          <input type="number" step="0.1" name="temperature" value={formData.temperature} onChange={handleChange} placeholder="°C" />
        </div>
        <div className="form-group">
          <label className="form-label">Oxygen (L/min)</label>
          <input type="number" step="0.1" name="oxygenLitersPerMinute" value={formData.oxygenLitersPerMinute} onChange={handleChange} placeholder="L/min" />
        </div>
        <div className="form-group">
          <label className="form-label">Pain Score</label>
          <input type="number" name="painScore" value={formData.painScore} onChange={handleChange} placeholder="0-10" />
        </div>
      </div>
    </section>
  );

  const renderCardiovascular = () => (
    <section className="assessmentFormSection">
      <div className="assessmentFormGrid">
        <div className="form-group">
          <label className="form-label">Chest Pain</label>
          <input type="text" name="ChestPain" value={formData.ChestPain} onChange={handleChange} placeholder="Description" />
        </div>
        <div className="form-group">
          <label className="checkbox-label">
            <input type="checkbox" name="CardiovascularWnl" checked={formData.CardiovascularWnl} onChange={handleChange} />
            Cardiovascular WNL
          </label>
        </div>
        <div className="form-group">
          <label className="form-label">Heart Sounds</label>
          <select name="HeartSounds" value={formData.HeartSounds} onChange={handleChange}>
            <option value="">Select heart sounds</option>
            {HEART_SOUND_TYPES.map((value) => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>
        </div>
        {renderConditionalOtherInput('HeartSounds', 'Other Heart Sounds', 'Describe other sounds')}
        <div className="form-group">
          <label className="form-label">Pulse Strength</label>
          <select name="PeripheralPulses" value={formData.PeripheralPulses} onChange={handleChange}>
            <option value="">Select pulse strength</option>
            {PULSE_STRENGTH_TYPES.map((value) => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>
        </div>
        {renderConditionalOtherInput('PeripheralPulses', 'Other Pulse Strength', 'Describe pulse strength')}
        <div className="form-group">
          <label className="checkbox-label">
            <input type="checkbox" name="CapillaryRefillNormal" checked={formData.CapillaryRefillNormal} onChange={handleChange} />
            Capillary Refill Normal
          </label>
        </div>
        <div className="form-group">
          <label className="form-label">Dizziness</label>
          <input type="text" name="Dizziness" value={formData.Dizziness} onChange={handleChange} placeholder="Describe dizziness" />
        </div>
        <div className="form-group">
          <label className="form-label">Edema RUE</label>
          <input type="text" name="EdemaRUE" value={formData.EdemaRUE} onChange={handleChange} placeholder="Right Upper Extremity" />
        </div>
        <div className="form-group">
          <label className="form-label">Edema LUE</label>
          <input type="text" name="EdemaLUE" value={formData.EdemaLUE} onChange={handleChange} placeholder="Left Upper Extremity" />
        </div>
        <div className="form-group">
          <label className="form-label">Edema RLE</label>
          <input type="text" name="EdemaRLE" value={formData.EdemaRLE} onChange={handleChange} placeholder="Right Lower Extremity" />
        </div>
        <div className="form-group">
          <label className="form-label">Edema LLE</label>
          <input type="text" name="EdemaLLE" value={formData.EdemaLLE} onChange={handleChange} placeholder="Left Lower Extremity" />
        </div>
        <div className="form-group">
          <label className="form-label">Neck Vein Distention</label>
          <input type="text" name="NeckVeinDistention" value={formData.NeckVeinDistention} onChange={handleChange} placeholder="Describe distention" />
        </div>
        <div className="form-group">
          <label className="form-label">Cardiovascular Comments</label>
          <textarea name="CardiovascularComments" value={formData.CardiovascularComments} onChange={handleChange} rows="2" placeholder="Additional comments" />
        </div>
      </div>
    </section>
  );

  // Render other sections similarly...
    // Interventions
    const renderInterventions = () => (
      <section className="assessmentFormSection">
        <div className="checkbox-group">
          <label className="checkbox-label">
            <input type="checkbox" name="ivStarted" checked={formData.ivStarted} onChange={handleChange} />
            IV Started
          </label>
          <label className="checkbox-label">
            <input type="checkbox" name="cprPerformed" checked={formData.cprPerformed} onChange={handleChange} />
            CPR Performed
          </label>
        </div>
      </section>
    );

    // Neurological
    const renderNeurological = () => (
      <section className="assessmentFormSection">
        <div className="assessmentFormGrid">
          <div className="form-group">
            <label className="checkbox-label">
              <input type="checkbox" name="isAlert" checked={formData.isAlert} onChange={handleChange} />
              Alert
            </label>
          </div>
          <div className="form-group">
            <label className="checkbox-label">
              <input type="checkbox" name="isOriented" checked={formData.isOriented} onChange={handleChange} />
              Oriented
            </label>
          </div>
          <div className="form-group">
            <label className="checkbox-label">
              <input type="checkbox" name="OrientationPerson" checked={formData.OrientationPerson} onChange={handleChange} />
              Oriented to Person
            </label>
          </div>
          <div className="form-group">
            <label className="checkbox-label">
              <input type="checkbox" name="OrientationPlace" checked={formData.OrientationPlace} onChange={handleChange} />
              Oriented to Place
            </label>
          </div>
          <div className="form-group">
            <label className="checkbox-label">
              <input type="checkbox" name="OrientationTime" checked={formData.OrientationTime} onChange={handleChange} />
              Oriented to Time
            </label>
          </div>
          <div className="form-group">
            <label className="checkbox-label">
              <input type="checkbox" name="Disoriented" checked={formData.Disoriented} onChange={handleChange} />
              Disoriented
            </label>
          </div>
          <div className="form-group">
            <label className="checkbox-label">
              <input type="checkbox" name="CognitiveForgetful" checked={formData.CognitiveForgetful} onChange={handleChange} />
              Forgetful
            </label>
          </div>
          <div className="form-group">
            <label className="checkbox-label">
              <input type="checkbox" name="CognitiveHallucinations" checked={formData.CognitiveHallucinations} onChange={handleChange} />
              Hallucinations
            </label>
          </div>
          <div className="form-group">
            <label className="form-label">Other Cognitive Status</label>
            <input type="text" name="OtherCognitiveStatus" value={formData.OtherCognitiveStatus} onChange={handleChange} placeholder="Describe" />
          </div>
          <div className="form-group">
            <label className="checkbox-label">
              <input type="checkbox" name="PupilsPerrla" checked={formData.PupilsPerrla} onChange={handleChange} />
              Pupils PERRLA
            </label>
          </div>
          <div className="form-group">
            <label className="checkbox-label">
              <input type="checkbox" name="PupilsNonReactive" checked={formData.PupilsNonReactive} onChange={handleChange} />
              Pupils Non-Reactive
            </label>
          </div>
          <div className="form-group">
            <label className="checkbox-label">
              <input type="checkbox" name="PupilsUnequal" checked={formData.PupilsUnequal} onChange={handleChange} />
              Pupils Unequal
            </label>
          </div>
          <div className="form-group">
            <label className="checkbox-label">
              <input type="checkbox" name="PupilsImpairedMovement" checked={formData.PupilsImpairedMovement} onChange={handleChange} />
              Pupils Impaired Movement
            </label>
          </div>
          <div className="form-group">
            <label className="checkbox-label">
              <input type="checkbox" name="Tremors" checked={formData.Tremors} onChange={handleChange} />
              Tremors
            </label>
          </div>
          <div className="form-group">
            <label className="checkbox-label">
              <input type="checkbox" name="SeizureActivity" checked={formData.SeizureActivity} onChange={handleChange} />
              Seizure Activity
            </label>
          </div>
          <div className="form-group">
            <label className="form-label">Seizure Locations</label>
            <input type="text" name="SeizureLocations" value={formData.SeizureLocations} onChange={handleChange} placeholder="Describe" />
          </div>
          <div className="form-group">
            <label className="checkbox-label">
              <input type="checkbox" name="SeizureBilateral" checked={formData.SeizureBilateral} onChange={handleChange} />
              Seizure Bilateral
            </label>
          </div>
          <div className="form-group">
            <label className="checkbox-label">
              <input type="checkbox" name="SensoryWnl" checked={formData.SensoryWnl} onChange={handleChange} />
              Sensory WNL
            </label>
          </div>
          <div className="form-group">
            <label className="checkbox-label">
              <input type="checkbox" name="DecreasedSensation" checked={formData.DecreasedSensation} onChange={handleChange} />
              Decreased Sensation
            </label>
          </div>
          <div className="form-group">
            <label className="form-label">Sensory Location</label>
            <input type="text" name="SensoryLocation" value={formData.SensoryLocation} onChange={handleChange} placeholder="Describe" />
          </div>
          <div className="form-group">
            <label className="checkbox-label">
              <input type="checkbox" name="HearingWnl" checked={formData.HearingWnl} onChange={handleChange} />
              Hearing WNL
            </label>
          </div>
          <div className="form-group">
            <label className="checkbox-label">
              <input type="checkbox" name="HearingImpairedLeft" checked={formData.HearingImpairedLeft} onChange={handleChange} />
              Hearing Impaired Left
            </label>
          </div>
          <div className="form-group">
            <label className="checkbox-label">
              <input type="checkbox" name="HearingImpairedRight" checked={formData.HearingImpairedRight} onChange={handleChange} />
              Hearing Impaired Right
            </label>
          </div>
          <div className="form-group">
            <label className="checkbox-label">
              <input type="checkbox" name="Deaf" checked={formData.Deaf} onChange={handleChange} />
              Deaf
            </label>
          </div>
          <div className="form-group">
            <label className="checkbox-label">
              <input type="checkbox" name="SpeechWnl" checked={formData.SpeechWnl} onChange={handleChange} />
              Speech WNL
            </label>
          </div>
          <div className="form-group">
            <label className="checkbox-label">
              <input type="checkbox" name="SpeechImpaired" checked={formData.SpeechImpaired} onChange={handleChange} />
              Speech Impaired
            </label>
          </div>
          <div className="form-group">
            <label className="checkbox-label">
              <input type="checkbox" name="VisionWnl" checked={formData.VisionWnl} onChange={handleChange} />
              Vision WNL
            </label>
          </div>
          <div className="form-group">
            <label className="checkbox-label">
              <input type="checkbox" name="VisionImpairedLeft" checked={formData.VisionImpairedLeft} onChange={handleChange} />
              Vision Impaired Left
            </label>
          </div>
          <div className="form-group">
            <label className="checkbox-label">
              <input type="checkbox" name="VisionImpairedRight" checked={formData.VisionImpairedRight} onChange={handleChange} />
              Vision Impaired Right
            </label>
          </div>
          <div className="form-group">
            <label className="checkbox-label">
              <input type="checkbox" name="Blind" checked={formData.Blind} onChange={handleChange} />
              Blind
            </label>
          </div>
          <div className="form-group">
            <label className="form-label">Sleep Pattern</label>
            <select name="SleepPattern" value={formData.SleepPattern} onChange={handleChange}>
              <option value="">Select sleep pattern</option>
              {SLEEP_PATTERNS.map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
          </div>
          {renderConditionalOtherInput('SleepPattern', 'Other Sleep Pattern', 'Describe sleep pattern')}
          <div className="form-group">
            <label className="form-label">Neurological Comments</label>
            <textarea name="NeurologicalComments" value={formData.NeurologicalComments} onChange={handleChange} rows="2" placeholder="Comments" />
          </div>
        </div>
      </section>
    );

    // Skin
    const renderSkin = () => (
      <section className="assessmentFormSection">
        <div className="assessmentFormGrid">
          <div className="form-group">
            <label className="checkbox-label">
              <input type="checkbox" name="skinWarm" checked={formData.skinWarm} onChange={handleChange} />
              Warm
            </label>
          </div>
          <div className="form-group">
            <label className="checkbox-label">
              <input type="checkbox" name="skinDry" checked={formData.skinDry} onChange={handleChange} />
              Dry
            </label>
          </div>
          <div className="form-group">
            <label className="checkbox-label">
              <input type="checkbox" name="skinPale" checked={formData.skinPale} onChange={handleChange} />
              Pale
            </label>
          </div>
          <div className="form-group">
            <label className="checkbox-label">
              <input type="checkbox" name="skinCool" checked={formData.skinCool} onChange={handleChange} />
              Cool
            </label>
          </div>
          <div className="form-group">
            <label className="checkbox-label">
              <input type="checkbox" name="skinHot" checked={formData.skinHot} onChange={handleChange} />
              Hot
            </label>
          </div>
          <div className="form-group">
            <label className="checkbox-label">
              <input type="checkbox" name="skinFlushed" checked={formData.skinFlushed} onChange={handleChange} />
              Flushed
            </label>
          </div>
          <div className="form-group">
            <label className="checkbox-label">
              <input type="checkbox" name="skinCyanotic" checked={formData.skinCyanotic} onChange={handleChange} />
              Cyanotic
            </label>
          </div>
          <div className="form-group">
            <label className="checkbox-label">
              <input type="checkbox" name="skinClammy" checked={formData.skinClammy} onChange={handleChange} />
              Clammy
            </label>
          </div>
          <div className="form-group">
            <label className="checkbox-label">
              <input type="checkbox" name="skinJaundice" checked={formData.skinJaundice} onChange={handleChange} />
              Jaundice
            </label>
          </div>
          <div className="form-group">
            <label className="checkbox-label">
              <input type="checkbox" name="skinDiaphoretic" checked={formData.skinDiaphoretic} onChange={handleChange} />
              Diaphoretic
            </label>
          </div>
          <div className="form-group">
            <label className="form-label">Other Skin Condition</label>
            <input type="text" name="otherSkinCondition" value={formData.otherSkinCondition} onChange={handleChange} placeholder="Describe" />
          </div>
        </div>
      </section>
    );

    // Respiratory
    const renderRespiratory = () => (
      <section className="assessmentFormSection">
        <div className="assessmentFormGrid">
          <div className="form-group">
            <label className="checkbox-label">
              <input type="checkbox" name="respiratorySymmetrical" checked={formData.respiratorySymmetrical} onChange={handleChange} />
              Symmetrical
            </label>
          </div>
          <div className="form-group">
            <label className="checkbox-label">
              <input type="checkbox" name="respiratoryAsymmetrical" checked={formData.respiratoryAsymmetrical} onChange={handleChange} />
              Asymmetrical
            </label>
          </div>
          <div className="form-group">
            <label className="form-label">Lung Sounds</label>
            <select name="lungSounds" value={formData.lungSounds} onChange={handleChange}>
              <option value="">Select lung sounds</option>
              {LUNG_SOUND_TYPES.map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
          </div>
          {renderConditionalOtherInput('lungSounds', 'Other Lung Sounds', 'Describe lung sounds')}
          <div className="form-group">
            <label className="form-label">Respiratory Effort</label>
            <select name="respiratoryEffort" value={formData.respiratoryEffort} onChange={handleChange}>
              <option value="">Select respiratory effort</option>
              {RESPIRATORY_EFFORT_TYPES.map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
          </div>
          {renderConditionalOtherInput('respiratoryEffort', 'Other Respiratory Effort', 'Describe respiratory effort')}
          <div className="form-group">
            <label className="checkbox-label">
              <input type="checkbox" name="RespiratoryWnl" checked={formData.RespiratoryWnl} onChange={handleChange} />
              WNL
            </label>
          </div>
          <div className="form-group">
            <label className="form-label">Shortness Of Breath</label>
            <select name="ShortnessOfBreath" value={formData.ShortnessOfBreath} onChange={handleChange}>
              <option value="">Select severity</option>
              {SHORTNESS_OF_BREATH_LEVELS.map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
          </div>
          {renderConditionalOtherInput('ShortnessOfBreath', 'Other Shortness Of Breath', 'Describe shortness of breath')}
          <div className="form-group">
            <label className="form-label">Cough</label>
            <select name="Cough" value={formData.Cough} onChange={handleChange}>
              <option value="">Select cough type</option>
              {COUGH_TYPES.map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
          </div>
          {renderConditionalOtherInput('Cough', 'Other Cough', 'Describe cough')}
          <div className="form-group">
            <label className="form-label">Sputum Amount</label>
            <input type="text" name="SputumAmount" value={formData.SputumAmount} onChange={handleChange} placeholder="Describe" />
          </div>
          <div className="form-group">
            <label className="form-label">Sputum Description</label>
            <input type="text" name="SputumDescription" value={formData.SputumDescription} onChange={handleChange} placeholder="Describe" />
          </div>
          <div className="form-group">
            <label className="checkbox-label">
              <input type="checkbox" name="RoomAir" checked={formData.RoomAir} onChange={handleChange} />
              Room Air
            </label>
          </div>
          <div className="form-group">
            <label className="form-label">Oxygen Delivery Method</label>
            <select name="OxygenDeliveryMethod" value={formData.OxygenDeliveryMethod} onChange={handleChange}>
              <option value="">Select delivery method</option>
              {OXYGEN_DELIVERY_METHODS.map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
          </div>
          {renderConditionalOtherInput('OxygenDeliveryMethod', 'Other Oxygen Delivery Method', 'Describe delivery method')}
          <div className="form-group">
            <label className="form-label">Oxygen Frequency</label>
            <select name="OxygenFrequency" value={formData.OxygenFrequency} onChange={handleChange}>
              <option value="">Select frequency</option>
              {OXYGEN_FREQUENCIES.map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
          </div>
          {renderConditionalOtherInput('OxygenFrequency', 'Other Oxygen Frequency', 'Describe oxygen frequency')}
          <div className="form-group">
            <label className="form-label">Nebulizer</label>
            <input type="text" name="Nebulizer" value={formData.Nebulizer} onChange={handleChange} placeholder="Describe" />
          </div>
          <div className="form-group">
            <label className="form-label">Respiratory Comments</label>
            <textarea name="RespiratoryComments" value={formData.RespiratoryComments} onChange={handleChange} rows="2" placeholder="Comments" />
          </div>
        </div>
      </section>
    );

    // Musculoskeletal (Mobility)
    const renderMobility = () => (
      <section className="assessmentFormSection">
        <div className="assessmentFormGrid">
          <div className="form-group">
            <label className="checkbox-label">
              <input type="checkbox" name="gaitSteady" checked={formData.gaitSteady} onChange={handleChange} />
              Gait Steady
            </label>
          </div>
          <div className="form-group">
            <label className="checkbox-label">
              <input type="checkbox" name="usesCane" checked={formData.usesCane} onChange={handleChange} />
              Uses Cane
            </label>
          </div>
          <div className="form-group">
            <label className="checkbox-label">
              <input type="checkbox" name="usesCrutches" checked={formData.usesCrutches} onChange={handleChange} />
              Uses Crutches
            </label>
          </div>
          <div className="form-group">
            <label className="checkbox-label">
              <input type="checkbox" name="usesWheelchair" checked={formData.usesWheelchair} onChange={handleChange} />
              Uses Wheelchair
            </label>
          </div>
          <div className="form-group">
            <label className="checkbox-label">
              <input type="checkbox" name="bedridden" checked={formData.bedridden} onChange={handleChange} />
              Bedridden
            </label>
          </div>
          <div className="form-group">
            <label className="checkbox-label">
              <input type="checkbox" name="requiresAssistance" checked={formData.requiresAssistance} onChange={handleChange} />
              Requires Assistance
            </label>
          </div>
          <div className="form-group">
            <label className="form-label">Other Mobility Status</label>
            <input type="text" name="otherMobilityStatus" value={formData.otherMobilityStatus} onChange={handleChange} placeholder="Describe" />
          </div>
          <div className="form-group">
            <label className="form-label">Other Assistive Device</label>
            <input type="text" name="otherAssistiveDevice" value={formData.otherAssistiveDevice} onChange={handleChange} placeholder="Describe" />
          </div>
        </div>
      </section>
    );

    // Gastrointestinal
    const renderGastrointestinal = () => (
      <section className="assessmentFormSection">
        <div className="assessmentFormGrid">
          <div className="form-group">
            <label className="form-label">Diet</label>
            <select name="diet" value={formData.diet} onChange={handleChange}>
              <option value="">Select diet</option>
              {DIET_TYPES.map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
          </div>
          {renderConditionalOtherInput('diet', 'Other Diet', 'Describe diet')}
          <div className="form-group">
            <label className="form-label">Appetite</label>
            <select name="appetite" value={formData.appetite} onChange={handleChange}>
              <option value="">Select appetite</option>
              {APPETITE_LEVELS.map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
          </div>
          {renderConditionalOtherInput('appetite', 'Other Appetite', 'Describe appetite')}
          <div className="form-group">
            <label className="form-label">Bowel Sounds</label>
            <input type="text" name="bowelSounds" value={formData.bowelSounds} onChange={handleChange} placeholder="Describe" />
          </div>
          <div className="form-group">
            <label className="form-label">Last Bowel Movement</label>
            <input type="date" name="lastBowelMovement" value={formData.lastBowelMovement} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label className="form-label">Abdomen</label>
            <input type="text" name="abdomen" value={formData.abdomen} onChange={handleChange} placeholder="Describe" />
          </div>
          <div className="form-group">
            <label className="form-label">Gastrointestinal Comments</label>
            <textarea name="gastrointestinalComments" value={formData.gastrointestinalComments} onChange={handleChange} rows="2" placeholder="Comments" />
          </div>
        </div>
      </section>
    );

    // Genitourinary
    const renderGenitourinary = () => (
      <section className="assessmentFormSection">
        <div className="assessmentFormGrid">
          <div className="form-group">
            <label className="form-label">Urine Appearance</label>
            <select name="urineAppearance" value={formData.urineAppearance} onChange={handleChange}>
              <option value="">Select urine appearance</option>
              {URINE_APPEARANCES.map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
          </div>
          {renderConditionalOtherInput('urineAppearance', 'Other Urine Appearance', 'Describe urine appearance')}
          <div className="form-group">
            <label className="form-label">Continence</label>
            <select name="continence" value={formData.continence} onChange={handleChange}>
              <option value="">Select continence</option>
              {CONTINENCE_STATUSES.map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
          </div>
          {renderConditionalOtherInput('continence', 'Other Continence', 'Describe continence')}
          <div className="form-group">
            <label className="checkbox-label">
              <input type="checkbox" name="catheter" checked={formData.catheter} onChange={handleChange} />
              Catheter
            </label>
          </div>
          <div className="form-group">
            <label className="form-label">Last Void</label>
            <input type="date" name="lastVoid" value={formData.lastVoid} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label className="form-label">Genitourinary Comments</label>
            <textarea name="genitourinaryComments" value={formData.genitourinaryComments} onChange={handleChange} rows="2" placeholder="Comments" />
          </div>
        </div>
      </section>
    );

    // Pain Details
    const renderPainDetails = () => (
      <section className="assessmentFormSection">
        <div className="assessmentFormGrid">
          <div className="form-group">
            <label className="form-label">Pain Location</label>
            <input type="text" name="painLocation" value={formData.painLocation} onChange={handleChange} placeholder="Describe" />
          </div>
          <div className="form-group">
            <label className="form-label">Pain Duration</label>
            <input type="text" name="painDuration" value={formData.painDuration} onChange={handleChange} placeholder="Describe" />
          </div>
          <div className="form-group">
            <label className="form-label">Pain Intervention</label>
            <input type="text" name="painIntervention" value={formData.painIntervention} onChange={handleChange} placeholder="Describe" />
          </div>
          <div className="form-group">
            <label className="form-label">Pain Effectiveness</label>
            <input type="text" name="painEffectiveness" value={formData.painEffectiveness} onChange={handleChange} placeholder="Describe" />
          </div>
          <div className="form-group">
            <label className="form-label">Pain Comments</label>
            <textarea name="painComments" value={formData.painComments} onChange={handleChange} rows="2" placeholder="Comments" />
          </div>
        </div>
      </section>
    );

    // Hospice Eligibility
    const renderHospiceEligibility = () => (
      <section className="assessmentFormSection">
        <div className="assessmentFormGrid">
          <div className="form-group">
            <label className="checkbox-label">
              <input type="checkbox" name="hospicePrognosisSixMonthsOrLess" checked={formData.hospicePrognosisSixMonthsOrLess} onChange={handleChange} />
              Prognosis Six Months or Less
            </label>
          </div>
          <div className="form-group">
            <label className="form-label">Hospitalizations Last 30 Days</label>
            <input type="number" name="hospiceHospitalizationsLast30Days" value={formData.hospiceHospitalizationsLast30Days} onChange={handleChange} placeholder="Number" />
          </div>
          <div className="form-group">
            <label className="checkbox-label">
              <input type="checkbox" name="hospiceFunctionalDecline" checked={formData.hospiceFunctionalDecline} onChange={handleChange} />
              Functional Decline
            </label>
          </div>
          <div className="form-group">
            <label className="checkbox-label">
              <input type="checkbox" name="hospicePhysicalDecline" checked={formData.hospicePhysicalDecline} onChange={handleChange} />
              Physical Decline
            </label>
          </div>
          <div className="form-group">
            <label className="checkbox-label">
              <input type="checkbox" name="hospiceCognitiveDecline" checked={formData.hospiceCognitiveDecline} onChange={handleChange} />
              Cognitive Decline
            </label>
          </div>
          <div className="form-group">
            <label className="form-label">Rapid Weight Loss (kg, Last Month)</label>
            <input type="number" step="0.1" name="hospiceRapidWeightLossKgLastMonth" value={formData.hospiceRapidWeightLossKgLastMonth} onChange={handleChange} placeholder="kg" />
          </div>
          <div className="form-group">
            <label className="checkbox-label">
              <input type="checkbox" name="hospiceDysphagia" checked={formData.hospiceDysphagia} onChange={handleChange} />
              Dysphagia
            </label>
          </div>
          <div className="form-group">
            <label className="checkbox-label">
              <input type="checkbox" name="hospicePersistentSymptomsDespiteTreatment" checked={formData.hospicePersistentSymptomsDespiteTreatment} onChange={handleChange} />
              Persistent Symptoms Despite Treatment
            </label>
          </div>
          <div className="form-group">
            <label className="checkbox-label">
              <input type="checkbox" name="hospiceIncreasedLethargy" checked={formData.hospiceIncreasedLethargy} onChange={handleChange} />
              Increased Lethargy
            </label>
          </div>
          <div className="form-group">
            <label className="checkbox-label">
              <input type="checkbox" name="hospiceDisorientation" checked={formData.hospiceDisorientation} onChange={handleChange} />
              Disorientation
            </label>
          </div>
          <div className="form-group">
            <label className="form-label">Hospice Notes</label>
            <textarea name="hospiceNotes" value={formData.hospiceNotes} onChange={handleChange} rows="2" placeholder="Notes" />
          </div>
        </div>
      </section>
    );

    // Nurse Notes
    const renderNurseNotes = () => (
      <section className="assessmentFormSection">
        <textarea name="nurseNotes" value={formData.nurseNotes} onChange={handleChange} rows="5" placeholder="Enter detailed assessment notes..." />
      </section>
    );
  // For brevity, I'm showing the structure. You'll need to add all sections.

  return (
    <form className="assessmentForm" onSubmit={handleSubmit} autoComplete="off">
      <div className="assessmentFormHeader">
        <span className="assessmentFormHeaderIcon"><FormHeaderIcon /></span>
        <div>
          <h2 className="assessmentFormHeaderTitle">New Clinical Assessment</h2>
          <p className="assessmentFormHeaderSubtitle">Step {stepIndex + 1} of {steps.length}: {currentStep?.title}</p>
        </div>
      </div>

      {/* Step Navigation (dots only) */}
      <div className="step-indicator">
        {steps.map((step, idx) => (
          <div
            key={step.id}
            className={`step-dot ${idx === stepIndex ? 'active' : ''} ${idx < stepIndex ? 'completed' : ''}`}
            onClick={() => setStepIndex(idx)}
          />
        ))}
      </div>

      {/* Render current step content with icon next to section header */}
      {currentStep?.id === 'vitalSigns' && (
        <>
          <div className="section-header-with-icon"><VitalIcon /> <span>Vital Signs</span></div>
          {renderVitalSigns()}
        </>
      )}
      {currentStep?.id === 'cardiovascular' && (
        <>
          <div className="section-header-with-icon"><InterventionsIcon /> <span>Cardiovascular</span></div>
          {renderCardiovascular()}
        </>
      )}
      {currentStep?.id === 'interventions' && (
        <>
          <div className="section-header-with-icon"><InterventionsIcon /> <span>Interventions</span></div>
          {renderInterventions()}
        </>
      )}
      {currentStep?.id === 'neurological' && (
        <>
          <div className="section-header-with-icon"><NeuroIcon /> <span>Neurological Status</span></div>
          {renderNeurological()}
        </>
      )}
      {currentStep?.id === 'skin' && (
        <>
          <div className="section-header-with-icon"><SkinIcon /> <span>Skin Conditions</span></div>
          {renderSkin()}
        </>
      )}
      {currentStep?.id === 'respiratory' && (
        <>
          <div className="section-header-with-icon"><RespiratoryIcon /> <span>Respiratory Assessment</span></div>
          {renderRespiratory()}
        </>
      )}
      {currentStep?.id === 'musculoskeletal' && (
        <>
          <div className="section-header-with-icon"><MobilityIcon /> <span>Mobility Assessment</span></div>
          {renderMobility()}
        </>
      )}
      {currentStep?.id === 'gastrointestinal' && (
        <>
          <div className="section-header-with-icon"><InterventionsIcon /> <span>Gastrointestinal Assessment</span></div>
          {renderGastrointestinal()}
        </>
      )}
      {currentStep?.id === 'genitourinary' && (
        <>
          <div className="section-header-with-icon"><InterventionsIcon /> <span>Genitourinary Assessment</span></div>
          {renderGenitourinary()}
        </>
      )}
      {currentStep?.id === 'painDetails' && (
        <>
          <div className="section-header-with-icon"><InterventionsIcon /> <span>Pain Details</span></div>
          {renderPainDetails()}
        </>
      )}
      {currentStep?.id === 'diagnoses' && (
        <>
          <div className="section-header-with-icon"><NotesIcon /> <span>Diagnoses</span></div>
          <section className="assessmentFormSection">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <p style={{ margin: 0, color: 'var(--gray-color)', fontSize: '0.9rem' }}>
                Optional. Add one or more hospice-related diagnoses.
              </p>
              <button type="button" className="btn-primary" onClick={addDiagnosis}>
                + Add diagnosis
              </button>
            </div>
            {renderDiagnoses()}
          </section>
        </>
      )}
      {currentStep?.id === 'hospiceEligibility' && (
        <>
          <div className="section-header-with-icon"><NeuroIcon /> <span>Hospice Eligibility</span></div>
          {renderHospiceEligibility()}
        </>
      )}
      {currentStep?.id === 'nurseNotes' && (
        <>
          <div className="section-header-with-icon"><NotesIcon /> <span>Nurse Notes</span></div>
          {renderNurseNotes()}
        </>
      )}

      {/* Form Actions */}
      <div className="assessmentFormActions">
        <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
          {onCancel && (
            <button type="button" onClick={onCancel} className="assessmentBtnCancel">
              Cancel
            </button>
          )}
          <button
            type="button"
            onClick={() => setStepIndex((prev) => Math.max(prev - 1, 0))}
            className="assessmentBtnCancel"
            disabled={isFirstStep || isSubmitting}
          >
            Previous
          </button>
        </div>

        {!isLastStep ? (
          <button
            type="button"
            onClick={() => setStepIndex((prev) => Math.min(prev + 1, steps.length - 1))}
            disabled={isSubmitting}
            className="btn-primary"
          >
            Next
          </button>
        ) : (
          <button type="submit" disabled={isSubmitting} className="btn-primary">
            {isSubmitting ? 'Saving...' : 'Save Assessment'}
          </button>
        )}
      </div>
    </form>
  );
};

export default AssessmentForm;