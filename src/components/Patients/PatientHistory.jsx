import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import patientService from '../../services/patientService';
import assessmentService from '../../services/assessmentService';

const getDateKey = (dateString) => {
  if (!dateString) return null;
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return null;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const formatDateTime = (dateString) => {
  if (!dateString) return 'N/A';
  const d = new Date(dateString);
  return Number.isNaN(d.getTime()) ? String(dateString) : d.toLocaleString();
};

const formatDateKey = (dateKey) => {
  if (!dateKey) return 'N/A';
  const [yyyy, mm, dd] = String(dateKey).split('-');
  const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
  return Number.isNaN(d.getTime()) ? String(dateKey) : d.toLocaleDateString();
};

const hasSavedReport = (assessment) => Boolean(
  assessment?.aiReport ||
  assessment?.reportText ||
  assessment?.report?.reportText ||
  assessment?.report?.aiReport
);

const PatientHistory = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generatingId, setGeneratingId] = useState(null);

  useEffect(() => {
    // Avoid import-time DOM side effects (helps tests and HMR)
    const styleId = 'patient-history-inline-keyframes';
    if (document.getElementById(styleId)) return;
    const styleSheet = document.createElement('style');
    styleSheet.id = styleId;
    styleSheet.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(styleSheet);
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [patientData, patientAssessments] = await Promise.all([
          patientService.getPatientById(id),
          assessmentService.getAssessmentsByPatientId(id),
        ]);
        setPatient(patientData);
        setAssessments(Array.isArray(patientAssessments) ? patientAssessments : []);
      } catch (error) {
        console.error('Error loading patient history:', error);
        toast.error('Failed to load patient history');
      } finally {
        setLoading(false);
      }
    };

    if (id) load();
  }, [id]);

  const rows = useMemo(() => {
    const byDate = new Map();
    (assessments || []).forEach((a) => {
      const key =
        getDateKey(a?.assessmentDate) ||
        getDateKey(a?.createdAt) ||
        getDateKey(a?.dateCreated) ||
        'unknown';
      const existing = byDate.get(key);
      if (!existing) {
        byDate.set(key, a);
        return;
      }
      const existingTime = new Date(existing?.assessmentDate || existing?.createdAt || existing?.dateCreated || 0).getTime();
      const currentTime = new Date(a?.assessmentDate || a?.createdAt || a?.dateCreated || 0).getTime();
      if (currentTime > existingTime) byDate.set(key, a);
    });

    return Array.from(byDate.entries())
      .map(([dateKey, assessment]) => ({ dateKey, assessment }))
      .sort((a, b) => {
        const at = new Date(a.assessment?.assessmentDate || a.assessment?.createdAt || a.assessment?.dateCreated || 0).getTime();
        const bt = new Date(b.assessment?.assessmentDate || b.assessment?.createdAt || b.assessment?.dateCreated || 0).getTime();
        return bt - at;
      });
  }, [assessments]);

  const getVitalsSummary = (assessment) => {
    const v = assessment?.vitals || assessment?.vitalSigns || null;
    if (!v) return 'Not recorded';
    const parts = [];
    if (v.bloodPressure) parts.push(`BP ${v.bloodPressure}`);
    if (v.pulseRate != null) parts.push(`PR ${v.pulseRate}`);
    if (v.respiratoryRate != null) parts.push(`RR ${v.respiratoryRate}`);
    if (v.spO2 != null) parts.push(`SpO₂ ${v.spO2}%`);
    if (v.temperature != null) parts.push(`Temp ${v.temperature}`);
    return parts.length ? parts.join(' · ') : 'Not recorded';
  };

  const getSkinSummary = (assessment) => {
    const skin = assessment?.skin || null;
    if (!skin) return 'Not assessed';
    const flags = [
      skin.skinWarm && 'Warm',
      skin.skinDry && 'Dry',
      skin.skinPale && 'Pale',
      skin.skinCool && 'Cool',
      skin.skinHot && 'Hot',
      skin.skinFlushed && 'Flushed',
      skin.skinCyanotic && 'Cyanotic',
      skin.skinClammy && 'Clammy',
      skin.skinJaundice && 'Jaundice',
      skin.skinDiaphoretic && 'Diaphoretic',
    ].filter(Boolean);
    if (skin.otherSkinCondition) flags.push(String(skin.otherSkinCondition));
    return flags.length ? flags.join(', ') : 'Normal';
  };

  const getMobilitySummary = (assessment) => {
    const musculoskeletal = assessment?.musculoskeletal || assessment?.mobility?.musculoskeletal || assessment?.mobility || null;
    if (!musculoskeletal) return 'Not assessed';
    const flags = [];
    if (musculoskeletal.gaitSteady) flags.push('Steady gait');
    if (musculoskeletal.requiresAssistance) flags.push('Needs assistance');
    if (musculoskeletal.bedridden) flags.push('Bedridden');
    if (musculoskeletal.usesCane) flags.push('Cane');
    if (musculoskeletal.usesCrutches) flags.push('Crutches');
    if (musculoskeletal.usesWheelchair) flags.push('Wheelchair');
    if (musculoskeletal.otherMobilityStatus) flags.push(String(musculoskeletal.otherMobilityStatus));
    if (musculoskeletal.otherAssistiveDevice) flags.push(String(musculoskeletal.otherAssistiveDevice));
    return flags.length ? flags.join(', ') : 'Independent';
  };

  const handleGenerateReport = async (assessment) => {
    const assessmentId = assessment?.assessmentId || assessment?.id;
    if (!assessmentId) return;

    try {
      setGeneratingId(assessmentId);
      await assessmentService.getAssessmentReport(assessmentId);

      // Fetch latest assessment from backend (expecting report to be saved there)
      const refreshed = await assessmentService.getAssessmentById(assessmentId);
      setAssessments((prev) => (prev || []).map((a) => ((a?.assessmentId || a?.id) === assessmentId ? refreshed : a)));

      toast.success('Report generated');
      navigate(`/assessments/${assessmentId}/report`);
    } catch (error) {
      console.error('Failed to generate report:', error);
      toast.error('Failed to generate report');
    } finally {
      setGeneratingId(null);
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>
          <div style={styles.spinner} />
          <p>Loading patient history...</p>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div style={styles.container}>
        <div style={styles.errorContainer}>
          <p>Patient not found</p>
          <button onClick={() => navigate('/patients')} style={styles.backButton}>
            Back to Patients
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={() => navigate('/patients')} style={styles.backButton}>
          ← Back to Patients
        </button>
        <button
          onClick={() => navigate(`/assessments/new/form?patientId=${id}`)}
          style={styles.newAssessmentButton}
        >
          + New Assessment
        </button>
      </div>

      <div style={styles.patientCard}>
        <h2 style={styles.patientName}>
          {patient.fullName || `${patient.firstName ?? ''} ${patient.lastName ?? ''}`.trim() || 'Unnamed Patient'}
        </h2>
        <div style={styles.patientInfo}>
          {patient.dateOfBirth && (
            <span><strong>DOB:</strong> {new Date(patient.dateOfBirth).toLocaleDateString()}</span>
          )}
          {patient.gender && <span><strong>Gender:</strong> {patient.gender}</span>}
          {patient.phoneNumber && <span><strong>Phone:</strong> {patient.phoneNumber}</span>}
          {patient.address && <span><strong>Address:</strong> {patient.address}</span>}
          <span><strong>Rows (by date):</strong> {rows.length}</span>
        </div>
      </div>

      <div style={styles.historySection}>
        <div style={styles.sectionHeaderRow}>
          <h3 style={styles.sectionTitle}>Assessment History</h3>
        </div>

        {rows.length === 0 ? (
          <div style={styles.emptyState}>
            <p>No assessments found.</p>
          </div>
        ) : (
          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Date</th>
                  <th style={styles.th}>Vitals</th>
                  <th style={styles.th}>Skin</th>
                  <th style={styles.th}>Mobility</th>
                  <th style={styles.th}>Report</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ dateKey, assessment }) => {
                  const assessmentId = assessment?.assessmentId || assessment?.id;
                  const saved = hasSavedReport(assessment);
                  return (
                    <tr key={dateKey} style={styles.tr}>
                      <td style={styles.td}>
                        <div style={{ fontWeight: 600 }}>{formatDateKey(dateKey)}</div>
                        <div style={styles.smallText}>{formatDateTime(assessment?.assessmentDate || assessment?.createdAt || assessment?.dateCreated)}</div>
                      </td>
                      <td style={styles.td}>{getVitalsSummary(assessment)}</td>
                      <td style={styles.td}>{getSkinSummary(assessment)}</td>
                      <td style={styles.td}>{getMobilitySummary(assessment)}</td>
                      <td style={styles.td}>
                        {saved ? (
                          <button
                            style={styles.viewReportButton}
                            onClick={() => navigate(`/assessments/${assessmentId}/report`)}
                            disabled={!assessmentId}
                          >
                            View report
                          </button>
                        ) : (
                          <button
                            style={{
                              ...styles.generateReportButton,
                              ...(generatingId === assessmentId ? styles.disabledButton : null),
                            }}
                            onClick={() => handleGenerateReport(assessment)}
                            disabled={!assessmentId || generatingId === assessmentId}
                          >
                            {generatingId === assessmentId ? 'Generating...' : 'Generate report'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '2rem',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    minHeight: 'calc(100vh - 70px)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
  },
  backButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    border: 'none',
    color: 'white',
    cursor: 'pointer',
    padding: '0.5rem 1rem',
    fontSize: '1rem',
    fontWeight: '500',
    borderRadius: '8px',
    backdropFilter: 'blur(10px)',
    transition: 'all 0.3s ease',
  },
  newAssessmentButton: {
    padding: '0.75rem 1.5rem',
    background: 'linear-gradient(135deg, #27ae60, #2ecc71)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '500',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
  },
  patientCard: {
    background: 'white',
    borderRadius: '16px',
    padding: '1.5rem',
    marginBottom: '1.5rem',
    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
  },
  patientName: {
    margin: '0 0 0.5rem 0',
    color: '#2c3e50',
    fontSize: '1.5rem',
  },
  patientInfo: {
    display: 'flex',
    gap: '1.5rem',
    flexWrap: 'wrap',
    color: '#666',
    fontSize: '0.9rem',
  },
  historySection: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: '16px',
    padding: '1.5rem',
    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
  },
  sectionHeaderRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '1rem',
  },
  sectionTitle: {
    margin: 0,
    color: '#2c3e50',
    fontSize: '1.2rem',
  },
  smallText: {
    fontSize: '0.8rem',
    color: '#7f8c8d',
    marginTop: '0.25rem',
  },
  tableContainer: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    textAlign: 'left',
    padding: '0.75rem',
    borderBottom: '1px solid #e0e0e0',
    color: '#2c3e50',
    fontWeight: 700,
    fontSize: '0.9rem',
    whiteSpace: 'nowrap',
  },
  td: {
    padding: '0.75rem',
    borderBottom: '1px solid #f0f0f0',
    verticalAlign: 'top',
    color: '#2c3e50',
    fontSize: '0.9rem',
  },
  tr: {
    backgroundColor: 'transparent',
  },
  generateReportButton: {
    padding: '0.6rem 1rem',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontWeight: 600,
  },
  viewReportButton: {
    padding: '0.6rem 1rem',
    background: 'linear-gradient(135deg, #27ae60, #2ecc71)',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontWeight: 600,
  },
  disabledButton: {
    opacity: 0.7,
    cursor: 'not-allowed',
  },
  emptyState: {
    padding: '1.25rem',
    color: '#2c3e50',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '400px',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: '24px',
    padding: '2rem',
    boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
  },
  errorContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '400px',
    backgroundColor: 'rgba(255,255,255,0.95)',
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
};

export default PatientHistory;
