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

const getPatientAge = (dateOfBirth) => {
  if (!dateOfBirth) return null;

  const birthDate = new Date(dateOfBirth);
  if (Number.isNaN(birthDate.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDifference = today.getMonth() - birthDate.getMonth();

  if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
    age -= 1;
  }

  return age >= 0 ? age : null;
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
  const [deletingId, setDeletingId] = useState(null);
  const [filterFromDate, setFilterFromDate] = useState('');
  const [filterToDate, setFilterToDate] = useState('');

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
    return (assessments || [])
      .map((assessment) => ({
        dateKey:
          getDateKey(assessment?.assessmentDate) ||
          getDateKey(assessment?.createdAt) ||
          getDateKey(assessment?.dateCreated) ||
          'unknown',
        assessment,
      }))
      .sort((a, b) => {
        const at = new Date(a.assessment?.assessmentDate || a.assessment?.createdAt || a.assessment?.dateCreated || 0).getTime();
        const bt = new Date(b.assessment?.assessmentDate || b.assessment?.createdAt || b.assessment?.dateCreated || 0).getTime();
        return bt - at;
      });
  }, [assessments]);

  const filteredRows = useMemo(() => {
    const from = String(filterFromDate || '').trim();
    const to = String(filterToDate || '').trim();

    if (!from && !to) return rows;

    const start = from || to;
    const end = to || from;
    if (!start || !end) return rows;

    const rangeStart = start <= end ? start : end;
    const rangeEnd = start <= end ? end : start;

    return (rows || []).filter((r) => {
      const key = r?.dateKey;
      if (!key || key === 'unknown') return false;
      return key >= rangeStart && key <= rangeEnd;
    });
  }, [filterFromDate, filterToDate, rows]);

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

  const handleDeleteAssessment = async (assessmentId) => {
    if (!assessmentId) return;
    const confirmed = window.confirm('Delete this assessment and its generated report?');
    if (!confirmed) return;

    try {
      setDeletingId(assessmentId);
      await assessmentService.deleteAssessment(assessmentId);

      const normalizedDeletedId = String(assessmentId).toLowerCase();

      setAssessments((prev) =>
        (prev || []).filter((a) => {
          const currentId = String(a?.assessmentId || a?.id || '').toLowerCase();
          return currentId !== normalizedDeletedId;
        })
      );

      const refreshedAssessments = await assessmentService.getAssessmentsByPatientId(id);
      setAssessments(Array.isArray(refreshedAssessments) ? refreshedAssessments : []);

      toast.success('Assessment deleted');
    } catch (error) {
      console.error('Failed to delete assessment:', error);
      toast.error('Failed to delete assessment');
    } finally {
      setDeletingId(null);
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

  const patientAge = getPatientAge(patient.dateOfBirth);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={() => navigate('/patients')} style={styles.backButton}>
          ← Back to Patients
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
          {patientAge !== null && <span><strong>Age:</strong> {patientAge}</span>}
          {patient.gender && <span><strong>Gender:</strong> {patient.gender}</span>}
          {patient.phoneNumber && <span><strong>Phone:</strong> {patient.phoneNumber}</span>}
          {patient.address && <span><strong>Address:</strong> {patient.address}</span>}
          <span><strong>Rows (by date):</strong> {rows.length}</span>
        </div>
      </div>

      <div style={styles.historySection}>
        <div style={styles.sectionHeaderRow}>
          <h3 style={styles.sectionTitle}>Assessment History</h3>
          <div style={styles.filterControls}>
            <div style={styles.filterGroup}>
              <label style={styles.filterLabel} htmlFor="historyFromDate">From</label>
              <input
                id="historyFromDate"
                type="date"
                value={filterFromDate}
                onChange={(e) => setFilterFromDate(e.target.value)}
                style={styles.filterInput}
              />
            </div>
            <div style={styles.filterGroup}>
              <label style={styles.filterLabel} htmlFor="historyToDate">To</label>
              <input
                id="historyToDate"
                type="date"
                value={filterToDate}
                onChange={(e) => setFilterToDate(e.target.value)}
                style={styles.filterInput}
              />
            </div>
            <button
              type="button"
              style={styles.clearFilterButton}
              onClick={() => {
                setFilterFromDate('');
                setFilterToDate('');
              }}
              disabled={!filterFromDate && !filterToDate}
              aria-disabled={!filterFromDate && !filterToDate}
            >
              Clear
            </button>
          </div>
        </div>

        {filteredRows.length === 0 ? (
          <div style={styles.emptyState}>
            <p>No assessments found for that date/range.</p>
          </div>
        ) : (
          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Date</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map(({ dateKey, assessment }) => {
                  const assessmentId = assessment?.assessmentId || assessment?.id;
                  const rowKey = String(assessmentId || `${dateKey}-${assessment?.assessmentDate || assessment?.createdAt || assessment?.dateCreated || 'unknown'}`);
                  return (
                    <tr key={rowKey} style={styles.tr}>
                      <td style={styles.td}>
                        <div style={{ fontWeight: 600 }}>
                          {formatDateTime(assessment?.assessmentDate || assessment?.createdAt || assessment?.dateCreated)}
                        </div>
                      </td>
                      <td style={styles.td}>
                        <div style={styles.actionGroup}>
                          {hasSavedReport(assessment) ? (
                            <button
                              style={styles.viewReportButton}
                              onClick={() => navigate(`/assessments/${assessmentId}/report`)}
                              disabled={!assessmentId}
                            >
                              View Report
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
                              {generatingId === assessmentId ? 'Generating...' : 'Generate Report'}
                            </button>
                          )}

                          <button
                            style={styles.secondaryActionButton}
                            onClick={() => handleGenerateReport(assessment)}
                            disabled={!assessmentId || generatingId === assessmentId}
                          >
                            {generatingId === assessmentId ? 'Generating...' : 'Regenerate Report'}
                          </button>

                          <button
                            style={styles.secondaryActionButton}
                            onClick={() => navigate(`/assessments/${assessmentId}/edit`)}
                            disabled={!assessmentId}
                          >
                            Edit Assessment
                          </button>

                          <button
                            style={styles.secondaryActionButton}
                            onClick={() => navigate(`/patients/${id}`)}
                          >
                            Patient Details
                          </button>

                          <button
                            style={styles.dangerActionButton}
                            onClick={() => handleDeleteAssessment(assessmentId)}
                            disabled={!assessmentId || deletingId === assessmentId}
                          >
                            {deletingId === assessmentId ? 'Deleting...' : 'Delete Assessment'}
                          </button>
                        </div>
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
    background: 'transparent',
    minHeight: 'calc(100vh - 70px)',
  },
  header: {
    display: 'flex',
    justifyContent: 'flex-start',
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
    gap: '1rem',
    flexWrap: 'wrap',
  },
  filterControls: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '0.75rem',
    flexWrap: 'wrap',
  },
  filterGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  filterLabel: {
    fontSize: '0.75rem',
    fontWeight: 700,
    color: '#2c3e50',
  },
  filterInput: {
    padding: '0.5rem 0.75rem',
    borderRadius: '10px',
    border: '1px solid #e0e0e0',
    backgroundColor: 'white',
    color: '#2c3e50',
    fontSize: '0.9rem',
    minWidth: '170px',
  },
  clearFilterButton: {
    padding: '0.55rem 0.9rem',
    backgroundColor: 'transparent',
    border: '1px solid #667eea',
    borderRadius: '10px',
    cursor: 'pointer',
    fontWeight: 700,
    color: '#667eea',
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
  secondaryActionButton: {
    padding: '0.6rem 1rem',
    background: '#f4f6fb',
    color: '#2c3e50',
    border: '1px solid #d6dcef',
    borderRadius: '10px',
    cursor: 'pointer',
    fontWeight: 600,
  },
  dangerActionButton: {
    padding: '0.6rem 1rem',
    background: '#fff1f0',
    color: '#c0392b',
    border: '1px solid #f5b7b1',
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
  actionGroup: {
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap',
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
