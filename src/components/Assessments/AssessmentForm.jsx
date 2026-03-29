// components/AssessmentForm.jsx
import React, { useMemo, useState } from 'react';
import assessmentService from '../../services/assessmentService';
import './AssessmentForm.css';

const FormHeaderIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path
      d="M8 3h8a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M9 8h6M9 12h6M9 16h4"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const SectionIcon = ({ children }) => (
  <span className="assessmentSectionIcon" aria-hidden="true">
    {children}
  </span>
);

const VitalIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path
      d="M3 12h4l2-6 4 12 2-6h6"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const InterventionsIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path
      d="M12 5v14M5 12h14"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const NeuroIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path
      d="M9.5 3.5c-2.5 0-4.5 2-4.5 4.5 0 1.3.5 2.5 1.4 3.3-.9.9-1.4 2.1-1.4 3.4 0 2.5 2 4.5 4.5 4.5"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M14.5 3.5c2.5 0 4.5 2 4.5 4.5 0 1.3-.5 2.5-1.4 3.3.9.9 1.4 2.1 1.4 3.4 0 2.5-2 4.5-4.5 4.5"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12 4v16"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const SkinIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path
      d="M12 3s6 6.3 6 11a6 6 0 1 1-12 0c0-4.7 6-11 6-11Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const RespiratoryIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path
      d="M12 3v7"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M7 10c-2.2 0-4 1.8-4 4v2a4 4 0 0 0 8 0v-1"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M17 10c2.2 0 4 1.8 4 4v2a4 4 0 0 1-8 0v-1"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const MobilityIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path
      d="M10 4a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M10 8l-1 4 3 2 1 6"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M9 12l-3 2M12 14l3-2 3 2"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const NotesIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path
      d="M4 5a2 2 0 0 1 2-2h8l6 6v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M14 3v6h6"
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

const AssessmentForm = ({ patientId, onSuccess, onCancel }) => {
  const steps = useMemo(
    () => [
      { id: 'vitalSigns', title: 'Vital Signs', icon: <VitalIcon /> },
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
  const currentStep = steps[stepIndex] || steps[0];
  const isFirstStep = stepIndex === 0;
  const isLastStep = stepIndex === steps.length - 1;

  const [formData, setFormData] = useState({
    patientId: patientId,
    nurseNotes: '',
    
    // Vital Signs
    bloodPressure: '',
    pulseRate: '',
    respiratoryRate: '',
    spO2: '',
    temperature: '',
    oxygenLitersPerMinute: '',
    painScore: '',
    
    // Interventions
    oxygenGiven: false,
    ivStarted: false,
    cprPerformed: false,
    
    // Neurological
    isAlert: true,
    isOriented: true,
    
    // Skin Conditions
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
    
    // Respiratory
    respiratorySymmetrical: true,
    respiratoryAsymmetrical: false,
    lungSounds: '',
    otherLungSounds: '',
    respiratoryEffort: '',
    otherRespiratoryEffort: '',
    
    // Mobility
    gaitSteady: true,
    usesCane: false,
    usesCrutches: false,
    usesWheelchair: false,
    bedridden: false,
    requiresAssistance: false,
    otherMobilityStatus: '',
    otherAssistiveDevice: '',

    // Gastrointestinal
    diet: '',
    appetite: '',
    bowelSounds: '',
    lastBowelMovement: '',
    abdomen: '',
    gastrointestinalComments: '',

    // Genitourinary
    urineAppearance: '',
    continence: '',
    catheter: false,
    lastVoid: '',
    genitourinaryComments: '',

    // Pain details
    painLocation: '',
    painDuration: '',
    painIntervention: '',
    painEffectiveness: '',
    painComments: '',

    // Diagnoses
    diagnoses: [],

    // Hospice eligibility (optional)
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
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
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

      // Convert string numbers to actual numbers + build new objects
      const dataToSubmit = {
        ...formData,
        pulseRate: formData.pulseRate ? parseInt(formData.pulseRate, 10) : null,
        respiratoryRate: formData.respiratoryRate ? parseInt(formData.respiratoryRate, 10) : null,
        spO2: formData.spO2 ? parseInt(formData.spO2, 10) : null,
        temperature: formData.temperature ? parseFloat(formData.temperature) : null,
        oxygenLitersPerMinute: formData.oxygenLitersPerMinute ? parseFloat(formData.oxygenLitersPerMinute) : null,
        painScore: formData.painScore ? parseInt(formData.painScore, 10) : null,

        // datetime-local to ISO
        lastBowelMovement: toIsoStringOrNull(formData.lastBowelMovement),
        lastVoid: toIsoStringOrNull(formData.lastVoid),

        // optional boolean|null
        catheter: formData.catheter ? true : null,

        // NEW optional fields
        diagnoses: trimmedDiagnoses.length
          ? trimmedDiagnoses.map((d) => ({
              category: d.category,
              description: d.description,
              icd10Code: d.icd10Code ? d.icd10Code : null,
              isPrimary: d.isPrimary,
            }))
          : null,
        hospiceEligibility,
      };
      
      const result = await assessmentService.createAssessment(dataToSubmit);
      
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

  return (
    <form onSubmit={handleSubmit} className="assessmentForm">
      <div className="assessmentFormHeader">
        <span className="assessmentFormHeaderIcon"><FormHeaderIcon /></span>
        <div>
          <h2 className="assessmentFormHeaderTitle">New Clinical Assessment</h2>
        </div>
      </div>

      <section className="assessmentFormSection">
        <h3 className="assessmentSectionTitle">
          <SectionIcon>{currentStep?.icon}</SectionIcon>
          {currentStep?.title}
        </h3>
      </section>
      
      {/* Vital Signs Section */}
      {currentStep?.id === 'vitalSigns' && (
        <section className="assessmentFormSection">
          <div className="assessmentFormGrid">
            <div className="form-group">
              <label className="form-label">Blood Pressure (e.g., 120/80)</label>
              <input
                type="text"
                name="bloodPressure"
                value={formData.bloodPressure}
                onChange={handleChange}
                placeholder="120/80"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Pulse Rate (bpm)</label>
              <input
                type="number"
                name="pulseRate"
                value={formData.pulseRate}
                onChange={handleChange}
                placeholder="60-100"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Respiratory Rate</label>
              <input
                type="number"
                name="respiratoryRate"
                value={formData.respiratoryRate}
                onChange={handleChange}
                placeholder="12-20"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">SpO2 (%)</label>
              <input
                type="number"
                name="spO2"
                value={formData.spO2}
                onChange={handleChange}
                placeholder="95-100"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Temperature (°C)</label>
              <input
                type="number"
                step="0.1"
                name="temperature"
                value={formData.temperature}
                onChange={handleChange}
                placeholder="36.5-37.5"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Oxygen (L/min)</label>
              <input
                type="number"
                step="0.5"
                name="oxygenLitersPerMinute"
                value={formData.oxygenLitersPerMinute}
                onChange={handleChange}
                placeholder="e.g., 2"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Pain Score (0-10)</label>
              <input
                type="number"
                min="0"
                max="10"
                name="painScore"
                value={formData.painScore}
                onChange={handleChange}
                placeholder="0-10"
              />
            </div>
          </div>
        </section>
      )}
      
      {/* Interventions Section */}
      {currentStep?.id === 'interventions' && (
        <section className="assessmentFormSection">
          <div className="checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="oxygenGiven"
                checked={formData.oxygenGiven}
                onChange={handleChange}
              />
              Oxygen Given
            </label>
            
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="ivStarted"
                checked={formData.ivStarted}
                onChange={handleChange}
              />
              IV Started
            </label>
            
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="cprPerformed"
                checked={formData.cprPerformed}
                onChange={handleChange}
              />
              CPR Performed
            </label>
          </div>
        </section>
      )}
      
      {/* Neurological Section */}
      {currentStep?.id === 'neurological' && (
        <section className="assessmentFormSection">
          <div className="checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="isAlert"
                checked={formData.isAlert}
                onChange={handleChange}
              />
              Alert
            </label>
            
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="isOriented"
                checked={formData.isOriented}
                onChange={handleChange}
              />
              Oriented
            </label>
          </div>
        </section>
      )}
      
      {/* Skin Conditions Section */}
      {currentStep?.id === 'skin' && (
        <section className="assessmentFormSection">
          <div className="assessmentCheckboxGrid">
            {['Warm', 'Dry', 'Pale', 'Cool', 'Hot', 'Flushed', 'Cyanotic', 'Clammy', 'Jaundice', 'Diaphoretic'].map(condition => {
              const fieldName = `skin${condition}`;
              return (
                <label key={condition} className="checkbox-label">
                  <input
                    type="checkbox"
                    name={fieldName}
                    checked={formData[fieldName]}
                    onChange={handleChange}
                  />
                  {condition}
                </label>
              );
            })}
          </div>
          
          <div className="form-group">
            <label className="form-label">Other Skin Condition</label>
            <input
              type="text"
              name="otherSkinCondition"
              value={formData.otherSkinCondition}
              onChange={handleChange}
              placeholder="Describe any other skin conditions"
            />
          </div>
        </section>
      )}
      
      {/* Respiratory Section */}
      {currentStep?.id === 'respiratory' && (
        <section className="assessmentFormSection">
          <div className="checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="respiratorySymmetrical"
                checked={formData.respiratorySymmetrical}
                onChange={handleChange}
              />
              Symmetrical Breath Sounds
            </label>
            
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="respiratoryAsymmetrical"
                checked={formData.respiratoryAsymmetrical}
                onChange={handleChange}
              />
              Asymmetrical Breath Sounds
            </label>
          </div>
          
          <div className="form-group">
            <label className="form-label">Lung Sounds</label>
            <select
              name="lungSounds"
              value={formData.lungSounds}
              onChange={handleChange}
            >
              <option value="">Select Lung Sounds</option>
              <option value="Clear">Clear</option>
              <option value="Wheezing">Wheezing</option>
              <option value="Crackles">Crackles</option>
              <option value="Diminished">Diminished</option>
              <option value="Stridor">Stridor</option>
              <option value="Coarse">Coarse</option>
            </select>
          </div>
          
          <div className="form-group">
            <label className="form-label">Other Lung Sounds</label>
            <input
              type="text"
              name="otherLungSounds"
              value={formData.otherLungSounds}
              onChange={handleChange}
              placeholder="Describe other lung sounds"
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Respiratory Effort</label>
            <select
              name="respiratoryEffort"
              value={formData.respiratoryEffort}
              onChange={handleChange}
            >
              <option value="">Select Respiratory Effort</option>
              <option value="Normal">Normal</option>
              <option value="Labored">Labored</option>
              <option value="Dyspnea">Dyspnea</option>
              <option value="Shallow">Shallow</option>
              <option value="Tachypneic">Tachypneic</option>
            </select>
          </div>
          
          <div className="form-group">
            <label className="form-label">Other Respiratory Effort</label>
            <input
              type="text"
              name="otherRespiratoryEffort"
              value={formData.otherRespiratoryEffort}
              onChange={handleChange}
              placeholder="Describe other respiratory effort"
            />
          </div>
        </section>
      )}
      
      {/* Mobility Section */}
      {currentStep?.id === 'musculoskeletal' && (
        <section className="assessmentFormSection">
          <div className="checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="gaitSteady"
                checked={formData.gaitSteady}
                onChange={handleChange}
              />
              Gait Steady
            </label>
            
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="requiresAssistance"
                checked={formData.requiresAssistance}
                onChange={handleChange}
              />
              Requires Assistance
            </label>
            
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="bedridden"
                checked={formData.bedridden}
                onChange={handleChange}
              />
              Bedridden
            </label>
          </div>
          
          <h4>Assistive Devices</h4>
          <div className="checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="usesCane"
                checked={formData.usesCane}
                onChange={handleChange}
              />
              Cane
            </label>
            
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="usesCrutches"
                checked={formData.usesCrutches}
                onChange={handleChange}
              />
              Crutches
            </label>
            
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="usesWheelchair"
                checked={formData.usesWheelchair}
                onChange={handleChange}
              />
              Wheelchair
            </label>
          </div>
          
          <div className="form-group">
            <label className="form-label">Other Mobility Status</label>
            <input
              type="text"
              name="otherMobilityStatus"
              value={formData.otherMobilityStatus}
              onChange={handleChange}
              placeholder="Describe other mobility status"
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Other Assistive Device</label>
            <input
              type="text"
              name="otherAssistiveDevice"
              value={formData.otherAssistiveDevice}
              onChange={handleChange}
              placeholder="Describe other assistive device"
            />
          </div>
        </section>
      )}

      {/* Gastrointestinal Section */}
      {currentStep?.id === 'gastrointestinal' && (
        <section className="assessmentFormSection">
          <div className="assessmentFormGrid">
            <div className="form-group">
              <label className="form-label">Diet</label>
              <select name="diet" value={formData.diet} onChange={handleChange}>
                <option value="">Select Diet</option>
                <option value="Regular">Regular</option>
                <option value="NPO">NPO</option>
                <option value="TubeFeeding">Tube Feeding</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Appetite</label>
              <select name="appetite" value={formData.appetite} onChange={handleChange}>
                <option value="">Select Appetite</option>
                <option value="Good">Good</option>
                <option value="Fair">Fair</option>
                <option value="Poor">Poor</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Bowel Sounds</label>
              <input
                type="text"
                name="bowelSounds"
                value={formData.bowelSounds}
                onChange={handleChange}
                placeholder="e.g., Present/Absent/Hyperactive"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Last Bowel Movement</label>
              <input
                type="datetime-local"
                name="lastBowelMovement"
                value={formData.lastBowelMovement}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Abdomen</label>
              <input
                type="text"
                name="abdomen"
                value={formData.abdomen}
                onChange={handleChange}
                placeholder="e.g., Soft/Distended/Tender"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Gastrointestinal Comments</label>
            <textarea
              name="gastrointestinalComments"
              value={formData.gastrointestinalComments}
              onChange={handleChange}
              rows="4"
              placeholder="Additional GI notes..."
            />
          </div>
        </section>
      )}

      {/* Genitourinary Section */}
      {currentStep?.id === 'genitourinary' && (
        <section className="assessmentFormSection">
          <div className="assessmentFormGrid">
            <div className="form-group">
              <label className="form-label">Urine Appearance</label>
              <select name="urineAppearance" value={formData.urineAppearance} onChange={handleChange}>
                <option value="">Select Appearance</option>
                <option value="Clear">Clear</option>
                <option value="Yellow">Yellow</option>
                <option value="Amber">Amber</option>
                <option value="Brown">Brown</option>
                <option value="Cloudy">Cloudy</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Continence</label>
              <select name="continence" value={formData.continence} onChange={handleChange}>
                <option value="">Select Continence</option>
                <option value="Continent">Continent</option>
                <option value="Incontinent">Incontinent</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Last Void</label>
              <input type="datetime-local" name="lastVoid" value={formData.lastVoid} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input type="checkbox" name="catheter" checked={formData.catheter} onChange={handleChange} />
                Catheter present
              </label>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Genitourinary Comments</label>
            <textarea
              name="genitourinaryComments"
              value={formData.genitourinaryComments}
              onChange={handleChange}
              rows="4"
              placeholder="Additional GU notes..."
            />
          </div>
        </section>
      )}

      {/* Pain Details */}
      {currentStep?.id === 'painDetails' && (
        <section className="assessmentFormSection">
          <div className="assessmentFormGrid">
            <div className="form-group">
              <label className="form-label">Pain Location</label>
              <input
                type="text"
                name="painLocation"
                value={formData.painLocation}
                onChange={handleChange}
                placeholder="e.g., Lower back"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Pain Duration</label>
              <input
                type="text"
                name="painDuration"
                value={formData.painDuration}
                onChange={handleChange}
                placeholder="e.g., 2 days"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Intervention</label>
              <input
                type="text"
                name="painIntervention"
                value={formData.painIntervention}
                onChange={handleChange}
                placeholder="e.g., Repositioned / Medication"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Effectiveness</label>
              <input
                type="text"
                name="painEffectiveness"
                value={formData.painEffectiveness}
                onChange={handleChange}
                placeholder="e.g., Improved"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Pain Comments</label>
            <textarea
              name="painComments"
              value={formData.painComments}
              onChange={handleChange}
              rows="4"
              placeholder="Additional pain notes..."
            />
          </div>
        </section>
      )}

      {/* Diagnoses */}
      {currentStep?.id === 'diagnoses' && (
        <section className="assessmentFormSection">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <p style={{ margin: 0, color: 'var(--gray-color)', fontSize: '0.9rem' }}>
              Optional. Add one or more hospice-related diagnoses.
            </p>
            <button type="button" className="btn-primary" onClick={addDiagnosis}>
              + Add diagnosis
            </button>
          </div>

          {(Array.isArray(formData.diagnoses) ? formData.diagnoses : []).length === 0 ? (
            <div style={{ paddingTop: 'var(--spacing-md)', color: '#2c3e50' }}>
              No diagnoses added.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)', paddingTop: 'var(--spacing-md)' }}>
              {(formData.diagnoses || []).map((d, idx) => (
                <div
                  key={idx}
                  style={{
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-xl)',
                    padding: 'var(--spacing-lg)',
                    background: 'var(--white-color)',
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
                          <option key={c} value={c}>
                            {c}
                          </option>
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
          )}
        </section>
      )}

      {/* Hospice Eligibility */}
      {currentStep?.id === 'hospiceEligibility' && (
        <section className="assessmentFormSection">
          <p style={{ marginTop: 0, color: 'var(--gray-color)', fontSize: '0.9rem' }}>
            Optional. Check items that apply and add notes as needed.
          </p>

          <div className="assessmentCheckboxGrid">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="hospicePrognosisSixMonthsOrLess"
                checked={formData.hospicePrognosisSixMonthsOrLess}
                onChange={handleChange}
              />
              Prognosis ≤ 6 months
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="hospiceFunctionalDecline"
                checked={formData.hospiceFunctionalDecline}
                onChange={handleChange}
              />
              Functional decline
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="hospicePhysicalDecline"
                checked={formData.hospicePhysicalDecline}
                onChange={handleChange}
              />
              Physical decline
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="hospiceCognitiveDecline"
                checked={formData.hospiceCognitiveDecline}
                onChange={handleChange}
              />
              Cognitive decline
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="hospiceDysphagia"
                checked={formData.hospiceDysphagia}
                onChange={handleChange}
              />
              Dysphagia
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="hospicePersistentSymptomsDespiteTreatment"
                checked={formData.hospicePersistentSymptomsDespiteTreatment}
                onChange={handleChange}
              />
              Persistent symptoms despite treatment
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="hospiceIncreasedLethargy"
                checked={formData.hospiceIncreasedLethargy}
                onChange={handleChange}
              />
              Increased lethargy
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="hospiceDisorientation"
                checked={formData.hospiceDisorientation}
                onChange={handleChange}
              />
              Disorientation
            </label>
          </div>

          <div className="assessmentFormGrid" style={{ marginTop: 'var(--spacing-md)' }}>
            <div className="form-group">
              <label className="form-label">Hospitalizations (last 30 days)</label>
              <input
                type="number"
                min="0"
                name="hospiceHospitalizationsLast30Days"
                value={formData.hospiceHospitalizationsLast30Days}
                onChange={handleChange}
                placeholder="0"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Rapid weight loss (kg last month)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                name="hospiceRapidWeightLossKgLastMonth"
                value={formData.hospiceRapidWeightLossKgLastMonth}
                onChange={handleChange}
                placeholder="e.g., 2.5"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Eligibility Notes</label>
            <textarea
              name="hospiceNotes"
              value={formData.hospiceNotes}
              onChange={handleChange}
              rows="4"
              placeholder="Additional hospice eligibility notes..."
            />
          </div>
        </section>
      )}
      
      {/* Nurse Notes */}
      {currentStep?.id === 'nurseNotes' && (
        <section className="assessmentFormSection">
          <textarea
            name="nurseNotes"
            value={formData.nurseNotes}
            onChange={handleChange}
            rows="5"
            placeholder="Enter detailed assessment notes..."
          />
        </section>
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