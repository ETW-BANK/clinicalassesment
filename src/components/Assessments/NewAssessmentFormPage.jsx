import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import AssessmentForm from './AssessmentForm';

const NewAssessmentFormPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [patient, setPatient] = useState(null);
  const [loadingPatient, setLoadingPatient] = useState(true);

  const patientId = searchParams.get('patientId') || '';
  const assessmentType = searchParams.get('type') || '';

  const normalizedPatientId = useMemo(() => patientId.trim(), [patientId]);
  const normalizedAssessmentType = useMemo(() => String(assessmentType).trim(), [assessmentType]);

  useEffect(() => {
    if (!normalizedPatientId) {
      toast.error('Missing patient information. Please start from a patient.');
      navigate('/patients');
    } else {
      loadPatient();
    }
  }, [navigate, normalizedPatientId]);

  const loadPatient = async () => {
    try {
      setLoadingPatient(true);
      // Import patient service dynamically or add import at top
      const patientService = (await import('../../services/patientService')).default;
      const patientData = await patientService.getPatientById(normalizedPatientId);
      setPatient(patientData);
    } catch (error) {
      console.error('Error loading patient:', error);
      toast.error('Failed to load patient information');
      navigate('/patients');
    } finally {
      setLoadingPatient(false);
    }
  };

  if (!normalizedPatientId) return null;

  if (loadingPatient) {
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <div style={styles.loadingCard}>
            <div style={styles.spinner}></div>
            <p style={styles.loadingText}>Loading patient information...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* Hero Section */}
        <div style={styles.heroSection}>
          <div style={styles.heroContent}>
            <div style={styles.heroIcon}>📝</div>
            <div>
              <h1 style={styles.heroTitle}>New Clinical Assessment</h1>
              <p style={styles.heroSubtitle}>Document patient examination and clinical findings</p>
            </div>
          </div>

          {/* Patient Summary Card */}
          {patient && (
            <div style={styles.patientSummary}>
              <div style={styles.patientAvatar}>
                {patient.fullName?.charAt(0) || patient.firstName?.charAt(0) || 'P'}
              </div>
              <div style={styles.patientSummaryInfo}>
                <h3 style={styles.patientSummaryName}>
                  {patient.fullName || `${patient.firstName} ${patient.lastName}` || 'Patient'}
                </h3>
                <div style={styles.patientSummaryDetails}>
                  {patient.dateOfBirth && (
                    <span>
                      <span style={styles.summaryIcon}>🎂</span>
                      {new Date(patient.dateOfBirth).toLocaleDateString()}
                    </span>
                  )}
                  {patient.gender && (
                    <span>
                      <span style={styles.summaryIcon}>⚥</span>
                      {patient.gender}
                    </span>
                  )}
                  {patient.phone && (
                    <span>
                      <span style={styles.summaryIcon}>📞</span>
                      {patient.phone}
                    </span>
                  )}
                </div>
              </div>
              <button onClick={() => navigate(`/patients/${normalizedPatientId}`)} style={styles.viewPatientButton}>
                View Full Profile →
              </button>
            </div>
          )}
        </div>

        {/* Assessment Form Container */}
        <div style={styles.formContainer}>
          <AssessmentForm patientId={normalizedPatientId} assessmentType={normalizedAssessmentType} />
        </div>
      </div>
    </div>
  );
};

const styles = {
  page: {
    backgroundColor: '#667eea',
    minHeight: 'calc(100vh - 70px)',
  },
  container: {
    maxWidth: '1600px',
    margin: '0 auto',
    padding: '2rem',
  },
  heroSection: {
    marginBottom: '2rem',
  },
  heroContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    marginBottom: '1.5rem',
  },
  heroIcon: {
    fontSize: '3rem',
    background: 'rgba(255,255,255,0.2)',
    width: '70px',
    height: '70px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backdropFilter: 'blur(10px)',
  },
  heroTitle: {
    margin: 0,
    fontSize: '1.8rem',
    color: 'white',
    fontWeight: 'bold',
  },
  heroSubtitle: {
    margin: '0.25rem 0 0 0',
    fontSize: '0.9rem',
    color: 'rgba(255,255,255,0.8)',
  },
  patientSummary: {
    background: 'rgba(255,255,255,0.95)',
    borderRadius: '20px',
    padding: '1rem 1.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    flexWrap: 'wrap',
    backdropFilter: 'blur(10px)',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
  },
  patientAvatar: {
    width: '50px',
    height: '50px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.2rem',
    fontWeight: 'bold',
    color: 'white',
  },
  patientSummaryInfo: {
    flex: 1,
  },
  patientSummaryName: {
    margin: 0,
    fontSize: '1.1rem',
    color: '#2c3e50',
    fontWeight: '600',
  },
  patientSummaryDetails: {
    display: 'flex',
    gap: '1rem',
    flexWrap: 'wrap',
    marginTop: '0.25rem',
    fontSize: '0.8rem',
    color: '#7f8c8d',
  },
  summaryIcon: {
    marginRight: '0.25rem',
  },
  viewPatientButton: {
    padding: '0.5rem 1rem',
    backgroundColor: 'transparent',
    border: '1px solid #667eea',
    borderRadius: '8px',
    color: '#667eea',
    cursor: 'pointer',
    fontSize: '0.85rem',
    transition: 'all 0.3s ease',
  },
  formContainer: {
    animation: 'slideUp 0.5s ease',
  },
  loadingCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '400px',
    backgroundColor: 'white',
    borderRadius: '24px',
    padding: '2rem',
    boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
  },
  spinner: {
    width: '50px',
    height: '50px',
    border: '3px solid #f3f3f3',
    borderTop: '3px solid #667eea',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '1rem',
  },
  loadingText: {
    color: '#7f8c8d',
    fontSize: '0.9rem',
  },
};

const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
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
  
  button:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  }
  
  .view-patient-button:hover {
    background-color: #667eea;
    color: white;
  }
`;
document.head.appendChild(styleSheet);

export default NewAssessmentFormPage;