// components/AssessmentForm.jsx
import React, { useState } from 'react';
import assessmentService from '../../services/assessmentService';
import { ASSESSMENT_TYPE_CONFIG } from './AssessmentTypeSelector';

const AssessmentForm = ({ patientId, assessmentType, onSuccess, onCancel }) => {
  const normalizedType = String(assessmentType || '').trim().toLowerCase();
  const typeConfig = ASSESSMENT_TYPE_CONFIG[normalizedType] || ASSESSMENT_TYPE_CONFIG.standard;
  const enabledSections = typeConfig?.sections || ASSESSMENT_TYPE_CONFIG.standard.sections;
  const hasSection = (sectionId) => enabledSections.includes(sectionId);

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
    otherAssistiveDevice: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Convert string numbers to actual numbers
      const dataToSubmit = {
        ...formData,
        pulseRate: formData.pulseRate ? parseInt(formData.pulseRate) : null,
        respiratoryRate: formData.respiratoryRate ? parseInt(formData.respiratoryRate) : null,
        spO2: formData.spO2 ? parseInt(formData.spO2) : null,
        temperature: formData.temperature ? parseFloat(formData.temperature) : null,
        oxygenLitersPerMinute: formData.oxygenLitersPerMinute ? parseFloat(formData.oxygenLitersPerMinute) : null,
        painScore: formData.painScore ? parseInt(formData.painScore) : null,
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
    <form onSubmit={handleSubmit} style={styles.form}>
      <h2>New {typeConfig?.name || 'Assessment'}</h2>
      
      {/* Vital Signs Section */}
      {hasSection('vitalSigns') && (
        <section style={styles.section}>
          <h3>Vital Signs</h3>
          <div style={styles.grid}>
            <div style={styles.formGroup}>
              <label>Blood Pressure (e.g., 120/80)</label>
              <input
                type="text"
                name="bloodPressure"
                value={formData.bloodPressure}
                onChange={handleChange}
                placeholder="120/80"
              />
            </div>
            
            <div style={styles.formGroup}>
              <label>Pulse Rate (bpm)</label>
              <input
                type="number"
                name="pulseRate"
                value={formData.pulseRate}
                onChange={handleChange}
                placeholder="60-100"
              />
            </div>
            
            <div style={styles.formGroup}>
              <label>Respiratory Rate</label>
              <input
                type="number"
                name="respiratoryRate"
                value={formData.respiratoryRate}
                onChange={handleChange}
                placeholder="12-20"
              />
            </div>
            
            <div style={styles.formGroup}>
              <label>SpO2 (%)</label>
              <input
                type="number"
                name="spO2"
                value={formData.spO2}
                onChange={handleChange}
                placeholder="95-100"
              />
            </div>
            
            <div style={styles.formGroup}>
              <label>Temperature (°C)</label>
              <input
                type="number"
                step="0.1"
                name="temperature"
                value={formData.temperature}
                onChange={handleChange}
                placeholder="36.5-37.5"
              />
            </div>

            <div style={styles.formGroup}>
              <label>Oxygen (L/min)</label>
              <input
                type="number"
                step="0.5"
                name="oxygenLitersPerMinute"
                value={formData.oxygenLitersPerMinute}
                onChange={handleChange}
                placeholder="e.g., 2"
              />
            </div>

            <div style={styles.formGroup}>
              <label>Pain Score (0-10)</label>
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
      {hasSection('interventions') && (
        <section style={styles.section}>
          <h3>Interventions</h3>
          <div style={styles.checkboxGroup}>
            <label>
              <input
                type="checkbox"
                name="oxygenGiven"
                checked={formData.oxygenGiven}
                onChange={handleChange}
              />
              Oxygen Given
            </label>
            
            <label>
              <input
                type="checkbox"
                name="ivStarted"
                checked={formData.ivStarted}
                onChange={handleChange}
              />
              IV Started
            </label>
            
            <label>
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
      {hasSection('neurological') && (
        <section style={styles.section}>
          <h3>Neurological Status</h3>
          <div style={styles.checkboxGroup}>
            <label>
              <input
                type="checkbox"
                name="isAlert"
                checked={formData.isAlert}
                onChange={handleChange}
              />
              Alert
            </label>
            
            <label>
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
      {hasSection('skin') && (
        <section style={styles.section}>
          <h3>Skin Conditions</h3>
          <div style={styles.checkboxGrid}>
            {['Warm', 'Dry', 'Pale', 'Cool', 'Hot', 'Flushed', 'Cyanotic', 'Clammy', 'Jaundice', 'Diaphoretic'].map(condition => {
              const fieldName = `skin${condition}`;
              return (
                <label key={condition}>
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
          
          <div style={styles.formGroup}>
            <label>Other Skin Condition</label>
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
      {hasSection('respiratory') && (
        <section style={styles.section}>
          <h3>Respiratory Assessment</h3>
          <div style={styles.checkboxGroup}>
            <label>
              <input
                type="checkbox"
                name="respiratorySymmetrical"
                checked={formData.respiratorySymmetrical}
                onChange={handleChange}
              />
              Symmetrical Breath Sounds
            </label>
            
            <label>
              <input
                type="checkbox"
                name="respiratoryAsymmetrical"
                checked={formData.respiratoryAsymmetrical}
                onChange={handleChange}
              />
              Asymmetrical Breath Sounds
            </label>
          </div>
          
          <div style={styles.formGroup}>
            <label>Lung Sounds</label>
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
          
          <div style={styles.formGroup}>
            <label>Other Lung Sounds</label>
            <input
              type="text"
              name="otherLungSounds"
              value={formData.otherLungSounds}
              onChange={handleChange}
              placeholder="Describe other lung sounds"
            />
          </div>
          
          <div style={styles.formGroup}>
            <label>Respiratory Effort</label>
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
          
          <div style={styles.formGroup}>
            <label>Other Respiratory Effort</label>
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
      {hasSection('musculoskeletal') && (
        <section style={styles.section}>
          <h3>Mobility Assessment</h3>
          <div style={styles.checkboxGroup}>
            <label>
              <input
                type="checkbox"
                name="gaitSteady"
                checked={formData.gaitSteady}
                onChange={handleChange}
              />
              Gait Steady
            </label>
            
            <label>
              <input
                type="checkbox"
                name="requiresAssistance"
                checked={formData.requiresAssistance}
                onChange={handleChange}
              />
              Requires Assistance
            </label>
            
            <label>
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
          <div style={styles.checkboxGroup}>
            <label>
              <input
                type="checkbox"
                name="usesCane"
                checked={formData.usesCane}
                onChange={handleChange}
              />
              Cane
            </label>
            
            <label>
              <input
                type="checkbox"
                name="usesCrutches"
                checked={formData.usesCrutches}
                onChange={handleChange}
              />
              Crutches
            </label>
            
            <label>
              <input
                type="checkbox"
                name="usesWheelchair"
                checked={formData.usesWheelchair}
                onChange={handleChange}
              />
              Wheelchair
            </label>
          </div>
          
          <div style={styles.formGroup}>
            <label>Other Mobility Status</label>
            <input
              type="text"
              name="otherMobilityStatus"
              value={formData.otherMobilityStatus}
              onChange={handleChange}
              placeholder="Describe other mobility status"
            />
          </div>
          
          <div style={styles.formGroup}>
            <label>Other Assistive Device</label>
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
      
      {/* Nurse Notes */}
      <section style={styles.section}>
        <h3>Nurse Notes</h3>
        <textarea
          name="nurseNotes"
          value={formData.nurseNotes}
          onChange={handleChange}
          rows="5"
          style={styles.textarea}
          placeholder="Enter detailed assessment notes..."
        />
      </section>
      
      {/* Form Actions */}
      <div style={styles.buttonGroup}>
        {onCancel && (
          <button type="button" onClick={onCancel} style={styles.cancelButton}>
            Cancel
          </button>
        )}
        <button type="submit" disabled={isSubmitting} style={styles.submitButton}>
          {isSubmitting ? 'Submitting...' : 'Submit Assessment'}
        </button>
      </div>
    </form>
  );
};

const styles = {
  form: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '24px',
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  section: {
    marginBottom: '32px',
    paddingBottom: '24px',
    borderBottom: '1px solid #e0e0e0',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '16px',
  },
  formGroup: {
    marginBottom: '16px',
  },
  checkboxGroup: {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap',
    marginBottom: '16px',
  },
  checkboxGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
    gap: '8px',
    marginBottom: '16px',
  },
  textarea: {
    width: '100%',
    padding: '8px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    fontFamily: 'inherit',
  },
  buttonGroup: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
  },
  submitButton: {
    padding: '10px 20px',
    backgroundColor: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  cancelButton: {
    padding: '10px 20px',
    backgroundColor: '#f0f0f0',
    color: '#666',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
  },
};

export default AssessmentForm;