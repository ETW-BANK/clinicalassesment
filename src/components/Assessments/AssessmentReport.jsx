import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import assessmentService from '../../services/assessmentService';
import patientService from '../../services/patientService';
import toast from 'react-hot-toast';

const AssessmentReport = () => {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadReportAndPatient();
  }, [id]);

  const loadReportAndPatient = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching report for assessment ID:', id);
      const reportData = await assessmentService.getAssessmentReport(id);
      console.log('Report data:', reportData);
      setReport(reportData);
      
      // Try to get patient info from the report or fetch it
      if (reportData.patientId) {
        const patientData = await patientService.getPatientById(reportData.patientId);
        setPatient(patientData);
      }
    } catch (error) {
      console.error('Error loading report:', error);
      setError(error);
      
      if (error.response?.status === 404) {
        toast.error('Report not found. The assessment may still be processing.');
      } else if (error.code === 'ERR_NETWORK') {
        toast.error('Network error. Please check your connection.');
      } else {
        toast.error(error.response?.data?.message || 'Failed to load assessment report');
      }
    } finally {
      setLoading(false);
    }
  };

const replacePatientIdWithName = (text, patientInfo) => {
  if (!text) return text;
  if (!patientInfo || !patientInfo.id) return text;
  
  const patientName = patientInfo.fullName || 
                     `${patientInfo.firstName} ${patientInfo.lastName}` || 
                     'Patient';
  const patientId = patientInfo.id;
  
  let updatedText = text;
  
  // Replace the patient ID with the full name (case insensitive)
  if (patientId) {
    const regex = new RegExp(patientId, 'gi');
    updatedText = updatedText.replace(regex, patientName);
  }
  
  // Replace "Patient Identification:" with "Patient Name:"
  updatedText = updatedText.replace(/Patient Identification:/gi, 'Patient Name:');
  updatedText = updatedText.replace(/Patient ID:/gi, 'Patient Name:');
  
  // Replace true/false with Yes/No (case insensitive)
  updatedText = updatedText.replace(/\btrue\b/gi, 'Yes');
  updatedText = updatedText.replace(/\bfalse\b/gi, 'No');
  
  return updatedText;
};

  const copyReportToClipboard = async () => {
  if (!selectedAssessment?.report?.reportText) {
    toast.error('No report content to copy');
    return;
  }

  try {
    // Get the report text
    let cleanReport = selectedAssessment.report.reportText;
    
    // Get patient info
    const patientInfo = selectedAssessment.patientInfo || patient;
    
    // Replace patient ID with name if patient info exists
    if (patientInfo && patientInfo.id) {
      const patientName = patientInfo.fullName || 
                         `${patientInfo.firstName} ${patientInfo.lastName}` || 
                         'Patient';
      const patientId = patientInfo.id;
      
      // Replace the patient ID with the full name
      cleanReport = cleanReport.replace(new RegExp(patientId, 'g'), patientName);
    }
    
    // Replace "Patient Identification:" with "Patient Name:"
    cleanReport = cleanReport.replace(/Patient Identification:/g, 'Patient Name:');
    cleanReport = cleanReport.replace(/Patient ID:/g, 'Patient Name:');
    
    // Replace true/false with Yes/No
    cleanReport = cleanReport.replace(/\btrue\b/gi, 'Yes');
    cleanReport = cleanReport.replace(/\bfalse\b/gi, 'No');
    
    // Clean up markdown formatting for a cleaner copy
    cleanReport = cleanReport
      // Remove bold markdown **text** -> text
      .replace(/\*\*(.*?)\*\*/g, '$1')
      // Remove italic markdown *text* -> text
      .replace(/\*(.*?)\*/g, '$1')
      // Remove heading markers (#, ##, etc.)
      .replace(/^#{1,6}\s+/gm, '')
      // Replace bullet points (* or -) with • symbol
      .replace(/^[\*\-]\s+/gm, '• ')
      // Remove extra asterisks
      .replace(/\*/g, '')
      // Replace multiple newlines with double newline
      .replace(/\n{3,}/g, '\n\n')
      // Trim whitespace
      .trim();
    
    // Add a clean header
    const header = `PATIENT CLINICAL ASSESSMENT REPORT\n${'='.repeat(50)}\n\n`;
    const footer = `\n\n${'='.repeat(50)}\nReport generated on: ${new Date().toLocaleString()}\n`;
    
    const finalReport = header + cleanReport + footer;
    
    await navigator.clipboard.writeText(finalReport);
    toast.success('✓ Report copied to clipboard!');
  } catch (err) {
    console.error('Failed to copy:', err);
    toast.error('Failed to copy report. Please try again.');
  }
};

  const handleRetry = () => {
    loadReportAndPatient();
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
          <p>Loading AI-generated report...</p>
          <p style={styles.smallText}>This may take a few moments</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.errorContainer}>
          <div style={styles.errorIcon}>⚠️</div>
          <h3 style={styles.errorTitle}>Unable to Load Report</h3>
          <p style={styles.errorMessage}>
            {error.response?.status === 404 
              ? 'The assessment report is not yet available or may have been deleted.'
              : error.response?.data?.message || 'An error occurred while loading the report.'}
          </p>
          <div style={styles.buttonGroup}>
            <button onClick={handleRetry} style={styles.retryButton}>
              Retry
            </button>
            <button onClick={() => navigate('/patients')} style={styles.backButton}>
              Back to Patients
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div style={styles.container}>
        <div style={styles.errorContainer}>
          <p>No report data available.</p>
          <button onClick={() => navigate('/patients')} style={styles.backButton}>
            Back to Patients
          </button>
        </div>
      </div>
    );
  }

  // Get report text and replace patient ID with name
  let reportText = report.reportText || report;
  if (patient) {
    reportText = replacePatientIdWithName(reportText);
  }
  
  const generatedAt = report.generatedAt;

  return (
    <div style={styles.container}>
      <div style={styles.reportContainer}>
        <div style={styles.header}>
          <button onClick={() => navigate('/patients')} style={styles.backButton}>
            ← Back to Patients
          </button>
          <div style={styles.headerActions}>
            <button onClick={copyReportToClipboard} style={styles.copyButton}>
              📋 Copy Report
            </button>
            <button onClick={() => window.print()} style={styles.printButton}>
              🖨️ Print Report
            </button>
          </div>
        </div>
        
        {patient && (
          <div style={styles.patientInfoBar}>
            <div style={styles.patientAvatar}>
              {patient.fullName?.charAt(0) || patient.firstName?.charAt(0) || 'P'}
            </div>
            <div>
              <h3 style={styles.patientName}>{patient.fullName || `${patient.firstName} ${patient.lastName}`}</h3>
              <p style={styles.patientDetails}>
                {patient.email && <span>📧 {patient.email}</span>}
                {patient.phone && <span>📞 {patient.phone}</span>}
                {patient.dateOfBirth && <span>🎂 {new Date(patient.dateOfBirth).toLocaleDateString()}</span>}
              </p>
            </div>
          </div>
        )}
        
        <div style={styles.report}>
          <ReactMarkdown>{reportText}</ReactMarkdown>
        </div>
        
        {generatedAt && (
          <div style={styles.footer}>
            <p style={styles.metadata}>
              <strong>Generated:</strong> {new Date(generatedAt).toLocaleString()}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '1000px',
    margin: '0 auto',
    padding: '2rem',
    minHeight: 'calc(100vh - 70px)',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },
  reportContainer: {
    backgroundColor: 'white',
    borderRadius: '16px',
    boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
    overflow: 'hidden',
    animation: 'slideUp 0.5s ease',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 2rem',
    backgroundColor: '#f8f9fa',
    borderBottom: '1px solid #dee2e6',
  },
  backButton: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#667eea',
    cursor: 'pointer',
    padding: '0.5rem 1rem',
    fontSize: '1rem',
    fontWeight: '500',
    borderRadius: '8px',
    transition: 'all 0.3s ease',
  },
  headerActions: {
    display: 'flex',
    gap: '0.5rem',
  },
  copyButton: {
    padding: '0.5rem 1rem',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    transition: 'all 0.3s ease',
  },
  printButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#27ae60',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    transition: 'all 0.3s ease',
  },
  patientInfoBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '1.5rem 2rem',
    background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
    borderBottom: '1px solid #e0e0e0',
  },
  patientAvatar: {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: 'white',
  },
  patientName: {
    margin: 0,
    fontSize: '1.25rem',
    color: '#2c3e50',
  },
  patientDetails: {
    margin: '0.25rem 0 0 0',
    fontSize: '0.875rem',
    color: '#666',
    display: 'flex',
    gap: '1rem',
    flexWrap: 'wrap',
  },
  report: {
    padding: '2rem',
    lineHeight: '1.6',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  footer: {
    padding: '1rem 2rem',
    backgroundColor: '#f8f9fa',
    borderTop: '1px solid #dee2e6',
    fontSize: '0.875rem',
    color: '#6c757d',
  },
  metadata: {
    margin: 0,
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
  spinner: {
    width: '50px',
    height: '50px',
    border: '3px solid #f3f3f3',
    borderTop: '3px solid #667eea',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '1rem',
  },
  smallText: {
    fontSize: '0.875rem',
    color: '#999',
    marginTop: '0.5rem',
  },
  errorContainer: {
    textAlign: 'center',
    padding: '3rem',
    backgroundColor: 'white',
    borderRadius: '16px',
  },
  errorIcon: {
    fontSize: '4rem',
    marginBottom: '1rem',
  },
  errorTitle: {
    color: '#e74c3c',
    marginBottom: '1rem',
  },
  errorMessage: {
    color: '#666',
    marginBottom: '2rem',
  },
  buttonGroup: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'center',
  },
  retryButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '1rem',
    transition: 'all 0.3s ease',
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
`;
document.head.appendChild(styleSheet);

export default AssessmentReport;