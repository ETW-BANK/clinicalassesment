import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import assessmentService from '../../services/assessmentService';
import patientService from '../../services/patientService';
import toast from 'react-hot-toast';

const AssessmentForm = () => {
  const [searchParams] = useSearchParams();
  const patientId = searchParams.get('patientId');
  
  const [formData, setFormData] = useState({
    patientId: patientId || '',
    nurseNotes: '',
    assessmentDate: new Date().toISOString().split('T')[0],
    vitals: {
      bloodPressure: '',
      pulseRate: null,
      respiratoryRate: null,
      temperature: null,
      spO2: null,
      oxygenSaturation: null,
      oxygenGiven: false,
      ivStarted: false,
      cprPerformed: false,
    },
    neuro: {
      isAlert: true,
      isOriented: true,
    },
    skin: {
      warm: false,
      dry: false,
      pale: false,
      cool: false,
      hot: false,
      flushed: false,
      cyanotic: false,
      clammy: false,
      jaundice: false,
      diaphoretic: false,
    },
    respiratory: {
      symmetrical: true,
      asymmetrical: false,
      lungSounds: '',
    },
    mobility: {
      gaitSteady: false,
      usesCane: false,
      usesCrutches: false,
      usesWheelchair: false,
      bedridden: false,
      requiresAssistance: false,
    },
  });
  
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    try {
      const data = await patientService.getAllPatients();
      setPatients(data || []);
    } catch (error) {
      console.error('Error loading patients:', error);
      toast.error('Failed to load patients');
      setPatients([]);
    } finally {
      setLoadingPatients(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: type === 'checkbox' ? checked : value,
        },
      });
    } else {
      setFormData({
        ...formData,
        [name]: type === 'checkbox' ? checked : value,
      });
    }
  };

  const handleNumberChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: value === '' ? null : Number(value),
        },
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.patientId) {
      toast.error('Please select a patient');
      return;
    }

    setLoading(true);

    const submitData = {
      patientId: formData.patientId,
      nurseNotes: formData.nurseNotes,
      assessmentDate: formData.assessmentDate,
      vitals: {
        bloodPressure: formData.vitals.bloodPressure,
        pulseRate: formData.vitals.pulseRate ? Number(formData.vitals.pulseRate) : null,
        respiratoryRate: formData.vitals.respiratoryRate ? Number(formData.vitals.respiratoryRate) : null,
        temperature: formData.vitals.temperature ? Number(formData.vitals.temperature) : null,
        spO2: formData.vitals.spO2 ? Number(formData.vitals.spO2) : null,
        oxygenSaturation: formData.vitals.oxygenSaturation ? Number(formData.vitals.oxygenSaturation) : null,
        oxygenGiven: formData.vitals.oxygenGiven,
        ivStarted: formData.vitals.ivStarted,
        cprPerformed: formData.vitals.cprPerformed,
      },
      neuro: formData.neuro,
      skin: formData.skin,
      respiratory: formData.respiratory,
      mobility: formData.mobility,
    };

    try {
      const response = await assessmentService.createAssessment(submitData);
      toast.success('Assessment created successfully!');
      navigate(`/patients/${formData.patientId}/history`);
    } catch (error) {
      console.error('Error creating assessment:', error);
      toast.error(error.response?.data?.message || 'Failed to create assessment');
    } finally {
      setLoading(false);
    }
  };

  if (loadingPatients) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
          <p>Loading patients...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.headerIcon}>📋</div>
          <div>
            <h1 style={styles.title}>New Clinical Assessment</h1>
            <p style={styles.subtitle}>Document patient examination and vital signs</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {/* Patient Selection */}
          <div style={styles.formGroup}>
            <label style={styles.label}>
              <span style={styles.labelIcon}>👤</span>
              Select Patient *
            </label>
            <select
              name="patientId"
              value={formData.patientId}
              onChange={handleChange}
              required
              style={styles.select}
            >
              <option value="">-- Select a patient --</option>
              {patients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.fullName || `${patient.firstName} ${patient.lastName}` || patient.name || 'Unnamed Patient'} 
                  {patient.dateOfBirth ? ` (DOB: ${new Date(patient.dateOfBirth).toLocaleDateString()})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Assessment Date */}
          <div style={styles.formGroup}>
            <label style={styles.label}>
              <span style={styles.labelIcon}>📅</span>
              Assessment Date
            </label>
            <input
              type="date"
              name="assessmentDate"
              value={formData.assessmentDate}
              onChange={handleChange}
              style={styles.input}
            />
          </div>

          {/* Nurse Notes */}
          <div style={styles.formGroup}>
            <label style={styles.label}>
              <span style={styles.labelIcon}>📝</span>
              Nurse Notes
            </label>
            <textarea
              name="nurseNotes"
              value={formData.nurseNotes}
              onChange={handleChange}
              style={styles.textarea}
              rows="4"
              placeholder="Enter your clinical observations and notes..."
            />
          </div>

          {/* Vital Signs Section */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>🩺 Vital Signs</h3>
            <div style={styles.grid2}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Blood Pressure (mmHg)</label>
                <input
                  type="text"
                  name="vitals.bloodPressure"
                  value={formData.vitals.bloodPressure}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="e.g., 120/80"
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Pulse Rate (bpm)</label>
                <input
                  type="number"
                  name="vitals.pulseRate"
                  value={formData.vitals.pulseRate || ''}
                  onChange={handleNumberChange}
                  style={styles.input}
                  placeholder="e.g., 72"
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Respiratory Rate (breaths/min)</label>
                <input
                  type="number"
                  name="vitals.respiratoryRate"
                  value={formData.vitals.respiratoryRate || ''}
                  onChange={handleNumberChange}
                  style={styles.input}
                  placeholder="e.g., 16"
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>SpO2 (%)</label>
                <input
                  type="number"
                  name="vitals.spO2"
                  value={formData.vitals.spO2 || ''}
                  onChange={handleNumberChange}
                  style={styles.input}
                  placeholder="e.g., 98"
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Temperature (°C)</label>
                <input
                  type="number"
                  step="0.1"
                  name="vitals.temperature"
                  value={formData.vitals.temperature || ''}
                  onChange={handleNumberChange}
                  style={styles.input}
                  placeholder="e.g., 37.0"
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Oxygen Saturation (%)</label>
                <input
                  type="number"
                  name="vitals.oxygenSaturation"
                  value={formData.vitals.oxygenSaturation || ''}
                  onChange={handleNumberChange}
                  style={styles.input}
                  placeholder="e.g., 95"
                />
              </div>
            </div>
            
            <div style={styles.checkboxGroup}>
              <label style={styles.checkbox}>
                <input
                  type="checkbox"
                  name="vitals.oxygenGiven"
                  checked={formData.vitals.oxygenGiven}
                  onChange={handleChange}
                />
                <span>Oxygen Given</span>
              </label>
              <label style={styles.checkbox}>
                <input
                  type="checkbox"
                  name="vitals.ivStarted"
                  checked={formData.vitals.ivStarted}
                  onChange={handleChange}
                />
                <span>IV Started</span>
              </label>
              <label style={styles.checkbox}>
                <input
                  type="checkbox"
                  name="vitals.cprPerformed"
                  checked={formData.vitals.cprPerformed}
                  onChange={handleChange}
                />
                <span>CPR Performed</span>
              </label>
            </div>
          </div>

          {/* Neurological Status Section */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>🧠 Neurological Status</h3>
            <div style={styles.checkboxGroup}>
              <label style={styles.checkbox}>
                <input
                  type="checkbox"
                  name="neuro.isAlert"
                  checked={formData.neuro.isAlert}
                  onChange={handleChange}
                />
                <span>Alert</span>
              </label>
              <label style={styles.checkbox}>
                <input
                  type="checkbox"
                  name="neuro.isOriented"
                  checked={formData.neuro.isOriented}
                  onChange={handleChange}
                />
                <span>Oriented</span>
              </label>
            </div>
          </div>

          {/* Skin Assessment Section */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>🩸 Skin Assessment</h3>
            <div style={styles.checkboxGrid}>
              {Object.keys(formData.skin).map(key => (
                <label key={key} style={styles.checkbox}>
                  <input
                    type="checkbox"
                    name={`skin.${key}`}
                    checked={formData.skin[key]}
                    onChange={handleChange}
                  />
                  <span>{key.charAt(0).toUpperCase() + key.slice(1)}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Respiratory Assessment Section */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>🌬️ Respiratory Assessment</h3>
            <div style={styles.checkboxGroup}>
              <label style={styles.checkbox}>
                <input
                  type="checkbox"
                  name="respiratory.symmetrical"
                  checked={formData.respiratory.symmetrical}
                  onChange={handleChange}
                />
                <span>Symmetrical Breath Sounds</span>
              </label>
              <label style={styles.checkbox}>
                <input
                  type="checkbox"
                  name="respiratory.asymmetrical"
                  checked={formData.respiratory.asymmetrical}
                  onChange={handleChange}
                />
                <span>Asymmetrical Breath Sounds</span>
              </label>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Lung Sounds</label>
              <input
                type="text"
                name="respiratory.lungSounds"
                value={formData.respiratory.lungSounds}
                onChange={handleChange}
                style={styles.input}
                placeholder="e.g., Clear, Wheezing, Crackles, etc."
              />
            </div>
          </div>

          {/* Mobility Assessment Section */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>🚶 Mobility Assessment</h3>
            <div style={styles.checkboxGrid}>
              {Object.keys(formData.mobility).map(key => (
                <label key={key} style={styles.checkbox}>
                  <input
                    type="checkbox"
                    name={`mobility.${key}`}
                    checked={formData.mobility[key]}
                    onChange={handleChange}
                  />
                  <span>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Submit Buttons */}
          <div style={styles.buttonGroup}>
            <button
              type="button"
              onClick={() => navigate('/patients')}
              style={styles.cancelButton}
            >
              Cancel
            </button>
            <button type="submit" disabled={loading} style={styles.submitButton}>
              {loading ? (
                <>
                  <span style={styles.spinner}></span>
                  Creating...
                </>
              ) : (
                'Create Assessment'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '2rem',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    minHeight: 'calc(100vh - 70px)',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '24px',
    padding: '2rem',
    boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
    animation: 'slideUp 0.5s ease',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    marginBottom: '2rem',
    paddingBottom: '1.5rem',
    borderBottom: '2px solid #f0f0f0',
  },
  headerIcon: {
    fontSize: '2.5rem',
  },
  title: {
    margin: 0,
    fontSize: '1.8rem',
    color: '#2c3e50',
    fontWeight: '600',
  },
  subtitle: {
    margin: '0.5rem 0 0 0',
    color: '#7f8c8d',
    fontSize: '0.9rem',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  section: {
    borderTop: '1px solid #f0f0f0',
    paddingTop: '1.5rem',
  },
  sectionTitle: {
    margin: '0 0 1rem 0',
    fontSize: '1.2rem',
    color: '#2c3e50',
    fontWeight: '600',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  label: {
    fontWeight: '600',
    color: '#2c3e50',
    fontSize: '0.9rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  labelIcon: {
    fontSize: '1rem',
  },
  input: {
    padding: '0.75rem 1rem',
    border: '2px solid #e0e0e0',
    borderRadius: '12px',
    fontSize: '1rem',
    transition: 'all 0.3s ease',
    outline: 'none',
    fontFamily: 'inherit',
  },
  select: {
    padding: '0.75rem 1rem',
    border: '2px solid #e0e0e0',
    borderRadius: '12px',
    fontSize: '1rem',
    transition: 'all 0.3s ease',
    outline: 'none',
    fontFamily: 'inherit',
    backgroundColor: 'white',
    cursor: 'pointer',
  },
  textarea: {
    padding: '0.75rem 1rem',
    border: '2px solid #e0e0e0',
    borderRadius: '12px',
    fontSize: '1rem',
    transition: 'all 0.3s ease',
    outline: 'none',
    fontFamily: 'inherit',
    resize: 'vertical',
  },
  grid2: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '1rem',
  },
  checkboxGroup: {
    display: 'flex',
    gap: '1.5rem',
    flexWrap: 'wrap',
    marginTop: '0.5rem',
  },
  checkboxGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
    gap: '0.75rem',
    marginTop: '0.5rem',
  },
  checkbox: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    cursor: 'pointer',
    fontSize: '0.9rem',
    color: '#2c3e50',
  },
  buttonGroup: {
    display: 'flex',
    gap: '1rem',
    marginTop: '1rem',
    paddingTop: '1rem',
    borderTop: '2px solid #f0f0f0',
  },
  submitButton: {
    flex: 1,
    padding: '0.875rem',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
  },
  cancelButton: {
    flex: 1,
    padding: '0.875rem',
    backgroundColor: '#ecf0f1',
    color: '#7f8c8d',
    border: 'none',
    borderRadius: '12px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  spinner: {
    width: '16px',
    height: '16px',
    border: '2px solid rgba(255,255,255,0.3)',
    borderTopColor: 'white',
    borderRadius: '50%',
    animation: 'spin 0.6s linear infinite',
    display: 'inline-block',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '400px',
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '2rem',
  },
};

const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes slideUp {
    from {
      transform: translateY(30px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  input:focus, select:focus, textarea:focus {
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }
  
  button:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  }
  
  @media (max-width: 768px) {
    .grid2 {
      grid-template-columns: 1fr;
    }
  }
`;
document.head.appendChild(styleSheet);

export default AssessmentForm;