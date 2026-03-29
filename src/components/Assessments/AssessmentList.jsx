import React, { useState, useEffect } from 'react';
import assessmentService from '../../services/assessmentService';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const AssessmentList = () => {
  const [assessments, setAssessments] = useState([]);
  const [filteredAssessments, setFilteredAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    loadAssessments();
  }, []);

  useEffect(() => {
    filterAssessments();
  }, [searchTerm, selectedType, assessments]);

  const loadAssessments = async () => {
    try {
      const data = await assessmentService.getAllAssessments();
      console.log('All assessments:', data);
      setAssessments(data);
      setFilteredAssessments(data);
    } catch (error) {
      console.error('Error loading assessments:', error);
      toast.error('Failed to load assessments');
    } finally {
      setLoading(false);
    }
  };

  const filterAssessments = () => {
    let filtered = [...assessments];
    
    if (searchTerm) {
      filtered = filtered.filter(assessment => 
        assessment.patient?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assessment.patient?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assessment.patient?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assessment.assessmentType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assessment.id?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (selectedType !== 'all') {
      filtered = filtered.filter(assessment => 
        assessment.assessmentType === selectedType
      );
    }
    
    setFilteredAssessments(filtered);
  };

  const getAssessmentTypeIcon = (type) => {
    switch(type) {
      case 'hospice': return '🕊️';
      case 'palliative': return '💙';
      case 'emergency': return '🚨';
      case 'followup': return '📊';
      case 'homehealth': return '🏠';
      default: return '📋';
    }
  };

  const getAssessmentTypeColor = (type) => {
    switch(type) {
      case 'hospice': return '#9b59b6';
      case 'palliative': return '#3498db';
      case 'emergency': return '#e74c3c';
      case 'followup': return '#27ae60';
      case 'homehealth': return '#f39c12';
      default: return '#667eea';
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
          <p>Loading assessments...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Clinical Assessments</h1>
          <p style={styles.subtitle}>View and manage all patient assessments</p>
        </div>
        <div style={styles.stats}>
          <span style={styles.statsBadge}>{filteredAssessments.length} assessments</span>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div style={styles.filterBar}>
        <div style={styles.searchContainer}>
          <span style={styles.searchIcon}>🔍</span>
          <input
            type="text"
            placeholder="Search by patient name or assessment type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} style={styles.clearButton}>
              ✕
            </button>
          )}
        </div>
        
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          style={styles.filterSelect}
        >
          <option value="all">All Types</option>
          <option value="standard">Standard</option>
          <option value="hospice">Hospice</option>
          <option value="palliative">Palliative</option>
          <option value="emergency">Emergency</option>
          <option value="followup">Follow-Up</option>
          <option value="homehealth">Home Health</option>
        </select>
      </div>

      {/* Results Summary */}
      <div style={styles.resultsSummary}>
        <span>
          {filteredAssessments.length} {filteredAssessments.length === 1 ? 'assessment' : 'assessments'} found
          {searchTerm && ` matching "${searchTerm}"`}
          {selectedType !== 'all' && ` in ${selectedType} category`}
        </span>
      </div>

      {/* Assessment Grid */}
      {filteredAssessments.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>📭</div>
          <h3>No assessments found</h3>
          <p>Try adjusting your search or filter criteria</p>
          {(searchTerm || selectedType !== 'all') && (
            <button onClick={() => { setSearchTerm(''); setSelectedType('all'); }} style={styles.clearFiltersButton}>
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div style={styles.grid}>
          {filteredAssessments.map((assessment) => {
            const assessmentType = assessment.assessmentType || 'standard';
            const typeIcon = getAssessmentTypeIcon(assessmentType);
            const typeColor = getAssessmentTypeColor(assessmentType);
            const patientName = assessment.patient?.fullName || 
                               `${assessment.patient?.firstName} ${assessment.patient?.lastName}` || 
                               'Unknown Patient';
            
            return (
              <div key={assessment.id || assessment.assessmentId} style={styles.card}>
                <div style={{...styles.typeBadge, backgroundColor: typeColor}}>
                  <span>{typeIcon}</span> {assessmentType.charAt(0).toUpperCase() + assessmentType.slice(1)}
                </div>
                
                <div style={styles.cardHeader}>
                  <div style={styles.patientAvatar}>
                    {patientName.charAt(0).toUpperCase()}
                  </div>
                  <div style={styles.patientInfo}>
                    <h3 style={styles.patientName}>{patientName}</h3>
                    <p style={styles.patientDetail}>
                      <span style={styles.detailIcon}>🆔</span> ID: {assessment.patientId?.substring(0, 8)}...
                    </p>
                  </div>
                </div>
                
                <div style={styles.cardDetails}>
                  <div style={styles.detailRow}>
                    <span style={styles.detailLabel}>Assessment Date:</span>
                    <span style={styles.detailValue}>
                      {new Date(assessment.assessmentDate || assessment.generatedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div style={styles.detailRow}>
                    <span style={styles.detailLabel}>Generated:</span>
                    <span style={styles.detailValue}>
                      {new Date(assessment.generatedAt).toLocaleString()}
                    </span>
                  </div>
                  {assessment.vitals && (
                    <div style={styles.vitalsPreview}>
                      <span style={styles.vitalsLabel}>Vitals:</span>
                      <span style={styles.vitalsValue}>
                        {assessment.vitals.bloodPressure && `${assessment.vitals.bloodPressure} `}
                        {assessment.vitals.pulseRate && `| Pulse: ${assessment.vitals.pulseRate}`}
                        {assessment.vitals.spO2 && ` | SpO2: ${assessment.vitals.spO2}%`}
                      </span>
                    </div>
                  )}
                </div>
                
                <button 
                  onClick={() => navigate(`/assessments/${assessment.assessmentId || assessment.id}/report`)}
                  style={styles.viewButton}
                >
                  View Full Report →
                </button>
              </div>
            );
          })}
        </div>
      )}
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
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '2rem',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  title: {
    margin: 0,
    fontSize: '2rem',
    color: 'white',
    fontWeight: 'bold',
  },
  subtitle: {
    margin: '0.5rem 0 0 0',
    fontSize: '0.9rem',
    color: 'rgba(255,255,255,0.8)',
  },
  stats: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  statsBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: '0.5rem 1rem',
    borderRadius: '20px',
    color: 'white',
    fontSize: '0.875rem',
    fontWeight: '500',
  },
  filterBar: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '1.5rem',
    flexWrap: 'wrap',
  },
  searchContainer: {
    flex: 1,
    position: 'relative',
  },
  searchIcon: {
    position: 'absolute',
    left: '1rem',
    top: '50%',
    transform: 'translateY(-50%)',
    fontSize: '1.2rem',
    color: '#999',
  },
  searchInput: {
    width: '100%',
    padding: '0.875rem 2.5rem 0.875rem 3rem',
    border: '2px solid rgba(255,255,255,0.2)',
    borderRadius: '12px',
    fontSize: '1rem',
    backgroundColor: 'rgba(255,255,255,0.95)',
    transition: 'all 0.3s ease',
    outline: 'none',
  },
  clearButton: {
    position: 'absolute',
    right: '1rem',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    fontSize: '1.2rem',
    cursor: 'pointer',
    color: '#999',
    padding: '0.25rem',
    borderRadius: '50%',
    width: '28px',
    height: '28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
  },
  filterSelect: {
    padding: '0.875rem 1rem',
    border: '2px solid rgba(255,255,255,0.2)',
    borderRadius: '12px',
    fontSize: '1rem',
    backgroundColor: 'rgba(255,255,255,0.95)',
    cursor: 'pointer',
    outline: 'none',
    minWidth: '150px',
  },
  resultsSummary: {
    marginBottom: '1.5rem',
    padding: '0.5rem 0',
    color: 'rgba(255,255,255,0.9)',
    fontSize: '0.875rem',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
    gap: '1.5rem',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '1.5rem',
    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
    transition: 'all 0.3s ease',
    position: 'relative',
    overflow: 'hidden',
  },
  typeBadge: {
    position: 'absolute',
    top: '1rem',
    right: '1rem',
    padding: '0.25rem 0.75rem',
    borderRadius: '20px',
    fontSize: '0.75rem',
    fontWeight: '500',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
  },
  cardHeader: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '1rem',
    marginTop: '0.5rem',
  },
  patientAvatar: {
    width: '50px',
    height: '50px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.25rem',
    fontWeight: 'bold',
    color: 'white',
    flexShrink: 0,
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    margin: '0 0 0.25rem 0',
    fontSize: '1.1rem',
    fontWeight: '600',
    color: '#2c3e50',
  },
  patientDetail: {
    margin: 0,
    fontSize: '0.75rem',
    color: '#7f8c8d',
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
  },
  detailIcon: {
    fontSize: '0.75rem',
  },
  cardDetails: {
    marginBottom: '1rem',
    padding: '0.75rem',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '0.5rem',
    fontSize: '0.875rem',
  },
  detailLabel: {
    color: '#7f8c8d',
    fontWeight: '500',
  },
  detailValue: {
    color: '#2c3e50',
    fontWeight: '500',
  },
  vitalsPreview: {
    marginTop: '0.5rem',
    paddingTop: '0.5rem',
    borderTop: '1px solid #e0e0e0',
    fontSize: '0.75rem',
  },
  vitalsLabel: {
    color: '#7f8c8d',
    fontWeight: '500',
  },
  vitalsValue: {
    color: '#2c3e50',
    marginLeft: '0.5rem',
  },
  viewButton: {
    width: '100%',
    padding: '0.75rem',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontSize: '0.875rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
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
  emptyState: {
    textAlign: 'center',
    padding: '3rem',
    backgroundColor: 'white',
    borderRadius: '16px',
    color: '#7f8c8d',
  },
  emptyIcon: {
    fontSize: '4rem',
    marginBottom: '1rem',
  },
  clearFiltersButton: {
    marginTop: '1rem',
    padding: '0.5rem 1rem',
    backgroundColor: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.875rem',
  },
};

const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  button:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  }
  
  .card:hover {
    transform: translateY(-4px);
    box-shadow: 0 15px 35px rgba(0,0,0,0.15);
  }
  
  input:focus, select:focus {
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }
  
  @media (max-width: 768px) {
    .grid {
      grid-template-columns: 1fr;
    }
  }
`;
document.head.appendChild(styleSheet);

export default AssessmentList;