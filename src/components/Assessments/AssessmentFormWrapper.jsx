// AssessmentFormWrapper.tsx
import React, { useState } from 'react';
import AssessmentTypeSelector, { ASSESSMENT_TYPE_CONFIG } from './AssessmentTypeSelector';
import VitalSignsSection from './sections/VitalSignsSection';
import NeurologicalSection from './sections/NeurologicalSection';
import RespiratorySection from './sections/RespiratorySection';
import SkinSection from './sections/SkinSection';
import MusculoskeletalSection from './sections/MusculoskeletalSection';
import InterventionsSection from './sections/InterventionsSection';
import NurseNotesSection from './sections/NurseNotesSection';

const SECTION_COMPONENTS = {
  vitalSigns: VitalSignsSection,
  neurological: NeurologicalSection,
  respiratory: RespiratorySection,
  skin: SkinSection,
  musculoskeletal: MusculoskeletalSection,
  interventions: InterventionsSection,
  nurseNotes: NurseNotesSection
};

const AssessmentFormWrapper = ({ patientId, onSubmit }) => {
  const [selectedType, setSelectedType] = useState(null);
  const [currentSection, setCurrentSection] = useState(0);
  const [formData, setFormData] = useState({
    patientId: patientId,
    nurseNotes: '',
    vitalSigns: {
      bloodPressure: '',
      pulseRate: null,
      respiratoryRate: null,
      spO2: null,
      temperature: null
    },
    neurological: {
      isAlert: false,
      isOriented: false
    },
    respiratory: {
      respiratorySymmetrical: false,
      respiratoryAsymmetrical: false,
      lungSounds: '',
      otherLungSounds: '',
      respiratoryEffort: '',
      otherRespiratoryEffort: ''
    },
    skin: {
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
      otherSkinCondition: ''
    },
    musculoskeletal: {
      gaitSteady: false,
      usesCane: false,
      usesCrutches: false,
      usesWheelchair: false,
      bedridden: false,
      requiresAssistance: false,
      otherMobilityStatus: '',
      otherAssistiveDevice: ''
    },
    interventions: {
      oxygenGiven: false,
      ivStarted: false,
      cprPerformed: false
    }
  });

  const handleTypeSelect = (typeId) => {
    setSelectedType(typeId);
    setCurrentSection(0);
  };

  const updateFormData = (section, data) => {
    setFormData(prev => ({
      ...prev,
      [section]: { ...prev[section], ...data }
    }));
  };

  const handleSubmit = async () => {
    // Transform to match CreateAssessmentDto
    const payload = {
      patientId: formData.patientId,
      nurseNotes: formData.nurseNotes,
      bloodPressure: formData.vitalSigns.bloodPressure,
      pulseRate: formData.vitalSigns.pulseRate,
      respiratoryRate: formData.vitalSigns.respiratoryRate,
      spO2: formData.vitalSigns.spO2,
      temperature: formData.vitalSigns.temperature,
      oxygenGiven: formData.interventions.oxygenGiven,
      ivStarted: formData.interventions.ivStarted,
      cprPerformed: formData.interventions.cprPerformed,
      isAlert: formData.neurological.isAlert,
      isOriented: formData.neurological.isOriented,
      // ... spread all other fields
      ...formData.skin,
      ...formData.respiratory,
      ...formData.musculoskeletal
    };
    
    await onSubmit(payload);
  };

  if (!selectedType) {
    return <AssessmentTypeSelector selectedType={selectedType} onTypeSelect={handleTypeSelect} />;
  }

  const activeSections = ASSESSMENT_TYPE_CONFIG[selectedType]?.sections || [];
  const CurrentSectionComponent = SECTION_COMPONENTS[activeSections[currentSection]];
  
  // Add Nurse Notes at the end
  const sectionsWithNotes = [...activeSections, 'nurseNotes'];
  const isLastSection = currentSection === sectionsWithNotes.length - 1;

  return (
    <div style={styles.formContainer}>
      {/* Progress indicator */}
      <div style={styles.progressHeader}>
        <button 
          onClick={() => setSelectedType(null)} 
          style={styles.backButton}
        >
          ← Back to Types
        </button>
        <div style={styles.progressBar}>
          {sectionsWithNotes.map((section, idx) => (
            <div
              key={section}
              style={{
                ...styles.progressStep,
                backgroundColor: idx <= currentSection ? '#667eea' : '#e0e0e0'
              }}
            />
          ))}
        </div>
        <span style={styles.progressText}>
          {currentSection + 1} of {sectionsWithNotes.length}
        </span>
      </div>

      {/* Current section form */}
      {CurrentSectionComponent ? (
        <CurrentSectionComponent
          data={formData[activeSections[currentSection]]}
          onChange={(data) => updateFormData(activeSections[currentSection], data)}
        />
      ) : currentSection === sectionsWithNotes.length - 1 ? (
        <NurseNotesSection
          data={formData.nurseNotes}
          onChange={(notes) => setFormData(prev => ({ ...prev, nurseNotes: notes }))}
        />
      ) : null}

      {/* Navigation buttons */}
      <div style={styles.navigationButtons}>
        {currentSection > 0 && (
          <button 
            onClick={() => setCurrentSection(prev => prev - 1)}
            style={styles.prevButton}
          >
            Previous
          </button>
        )}
        {!isLastSection ? (
          <button 
            onClick={() => setCurrentSection(prev => prev + 1)}
            style={styles.nextButton}
          >
            Next
          </button>
        ) : (
          <button 
            onClick={handleSubmit}
            style={styles.submitButton}
          >
            Submit Assessment
          </button>
        )}
      </div>
    </div>
  );
};

const styles = {
  formContainer: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '2rem',
  },
  progressHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '2rem',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  backButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#f0f0f0',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.875rem',
  },
  progressBar: {
    display: 'flex',
    gap: '0.5rem',
    flex: 1,
    maxWidth: '300px',
  },
  progressStep: {
    height: '4px',
    flex: 1,
    borderRadius: '2px',
    transition: 'background-color 0.3s',
  },
  progressText: {
    fontSize: '0.875rem',
    color: '#666',
  },
  navigationButtons: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '2rem',
    paddingTop: '1rem',
    borderTop: '1px solid #e0e0e0',
  },
  prevButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#f0f0f0',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  nextButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    marginLeft: 'auto',
  },
  submitButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#27ae60',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    marginLeft: 'auto',
  },
};

export default AssessmentFormWrapper;