import React from 'react';

// Define which sections appear for each assessment type
export const ASSESSMENT_TYPE_CONFIG = {
  standard: {
    id: 'standard',
    name: 'Standard Clinical Assessment',
    description: 'Complete clinical evaluation with all assessment areas',
    icon: '📋',
    color: '#667eea',
    sections: ['vitalSigns', 'neurological', 'skin', 'respiratory', 'musculoskeletal', 'interventions']
  },
  hospice: {
    id: 'hospice',
    name: 'Hospice Assessment',
    description: 'End-of-life care evaluation focusing on comfort and quality of life',
    icon: '🕊️',
    color: '#9b59b6',
    sections: ['neurological', 'skin', 'respiratory', 'interventions']  // Focus on comfort measures
  },
  palliative: {
    id: 'palliative',
    name: 'Palliative Care Assessment',
    description: 'Symptom management and quality of life evaluation',
    icon: '💙',
    color: '#3498db',
    sections: ['vitalSigns', 'neurological', 'respiratory', 'skin']
  },
  emergency: {
    id: 'emergency',
    name: 'Emergency/Triage Assessment',
    description: 'Rapid assessment for critical situations',
    icon: '🚨',
    color: '#e74c3c',
    sections: ['vitalSigns', 'respiratory', 'interventions']  // Critical sections only
  },
  followup: {
    id: 'followup',
    name: 'Follow-Up Assessment',
    description: 'Progress tracking and treatment review',
    icon: '📊',
    color: '#27ae60',
    sections: ['vitalSigns', 'neurological', 'interventions']  // Progress-focused
  },
  homehealth: {
    id: 'homehealth',
    name: 'Home Health Assessment',
    description: 'Home environment and ADL evaluation',
    icon: '🏠',
    color: '#f39c12',
    sections: ['vitalSigns', 'musculoskeletal', 'skin']  // ADL and mobility focus
  }
};

// Map section IDs to display names
export const SECTION_DISPLAY_NAMES = {
  vitalSigns: 'Vital Signs',
  neurological: 'Neurological',
  skin: 'Skin',
  respiratory: 'Respiratory',
  musculoskeletal: 'Mobility & ADLs',
  interventions: 'Interventions'
};

const AssessmentTypeSelector = ({ selectedType, onTypeSelect }) => {
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerIcon}>📝</div>
        <div>
          <h2 style={styles.title}>Select Assessment Type</h2>
          <p style={styles.subtitle}>Choose the type of assessment that best fits the patient's needs</p>
        </div>
      </div>
      
      <div style={styles.grid}>
        {Object.values(ASSESSMENT_TYPE_CONFIG).map(type => (
          <div
            key={type.id}
            style={{
              ...styles.card,
              ...(selectedType === type.id ? styles.selectedCard : {}),
              borderColor: selectedType === type.id ? type.color : '#e0e0e0'
            }}
            onClick={() => onTypeSelect(type.id)}
          >
            <div style={{...styles.cardIcon, backgroundColor: type.color }}>
              {type.icon}
            </div>
            <h4 style={styles.cardName}>{type.name}</h4>
            <p style={styles.cardDescription}>{type.description}</p>
            <div style={styles.sectionTags}>
              {type.sections.map(sectionId => (
                <span 
                  key={sectionId} 
                  style={{
                    ...styles.sectionTag,
                    backgroundColor: selectedType === type.id ? `${type.color}20` : '#f0f0f0',
                    color: selectedType === type.id ? type.color : '#666'
                  }}
                >
                  {SECTION_DISPLAY_NAMES[sectionId]}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '1rem',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    marginBottom: '2rem',
    paddingBottom: '1rem',
    borderBottom: '2px solid #f0f0f0',
  },
  headerIcon: {
    fontSize: '2.5rem',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.8rem',
    color: 'white',
  },
  title: {
    margin: 0,
    fontSize: '1.5rem',
    color: '#2c3e50',
    fontWeight: '600',
  },
  subtitle: {
    margin: '0.25rem 0 0 0',
    color: '#7f8c8d',
    fontSize: '0.875rem',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '1.5rem',
  },
  card: {
    padding: '1.5rem',
    borderRadius: '16px',
    border: '2px solid #e0e0e0',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    backgroundColor: 'white',
  },
  selectedCard: {
    borderWidth: '2px',
    boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
    transform: 'translateY(-4px)',
  },
  cardIcon: {
    width: '50px',
    height: '50px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.5rem',
    marginBottom: '1rem',
    color: 'white',
  },
  cardName: {
    fontSize: '1.1rem',
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: '0.5rem',
  },
  cardDescription: {
    fontSize: '0.875rem',
    color: '#7f8c8d',
    marginBottom: '1rem',
    lineHeight: '1.4',
  },
  sectionTags: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
  },
  sectionTag: {
    fontSize: '0.7rem',
    padding: '0.25rem 0.5rem',
    backgroundColor: '#f0f0f0',
    borderRadius: '4px',
    color: '#666',
  },
};

export default AssessmentTypeSelector;