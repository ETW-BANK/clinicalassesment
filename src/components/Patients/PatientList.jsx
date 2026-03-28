import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import patientService from '../../services/patientService';
import assessmentService from '../../services/assessmentService';
import toast from 'react-hot-toast';

const PatientList = () => {
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name'); // 'name', 'date', 'assessments'
  const [sortOrder, setSortOrder] = useState('asc');
  const navigate = useNavigate();

  useEffect(() => {
    loadPatientsWithAssessmentCounts();
  }, []);

  useEffect(() => {
    filterAndSortPatients();
  }, [searchTerm, patients, sortBy, sortOrder]);

  const loadPatientsWithAssessmentCounts = async () => {
    try {
      setLoading(true);
      
      // Load all patients
      const patientsData = await patientService.getAllPatients();
      console.log('Loaded patients:', patientsData);
      
      // Load all assessments to count per patient
      const allAssessments = await assessmentService.getAllAssessments();
      console.log('All assessments:', allAssessments);
      
      // Create a map of patientId to assessment count
      const assessmentCountMap = {};
      allAssessments.forEach(assessment => {
        const patientId = assessment.patientId;
        assessmentCountMap[patientId] = (assessmentCountMap[patientId] || 0) + 1;
      });
      
      // Add assessment count to each patient
      const patientsWithCounts = patientsData.map(patient => ({
        ...patient,
        assessmentCount: assessmentCountMap[patient.id] || 0
      }));
      
      console.log('Patients with assessment counts:', patientsWithCounts);
      setPatients(patientsWithCounts);
      setFilteredPatients(patientsWithCounts);
      
    } catch (error) {
      console.error('Error loading patients:', error);
      toast.error('Failed to load patients');
      setPatients([]);
      setFilteredPatients([]);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortPatients = () => {
    let filtered = [...patients];
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(patient => {
        const fullName = (patient.fullName || `${patient.firstName} ${patient.lastName}` || patient.name || '').toLowerCase();
        const email = (patient.email || '').toLowerCase();
        const phone = (patient.phone || '').toLowerCase();
        const search = searchTerm.toLowerCase();
        
        return fullName.includes(search) || 
               email.includes(search) || 
               phone.includes(search);
      });
    }
    
    // Sort patients
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = (a.fullName || `${a.firstName} ${a.lastName}` || a.name || '').toLowerCase();
          bValue = (b.fullName || `${b.firstName} ${b.lastName}` || b.name || '').toLowerCase();
          break;
        case 'date':
          aValue = new Date(a.createdAt || a.dateOfBirth || 0);
          bValue = new Date(b.createdAt || b.dateOfBirth || 0);
          break;
        case 'assessments':
          aValue = a.assessmentCount || 0;
          bValue = b.assessmentCount || 0;
          break;
        default:
          aValue = a.name || '';
          bValue = b.name || '';
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    setFilteredPatients(filtered);
  };

  const handleViewPatient = (id) => {
    navigate(`/patients/${id}`);
  };

  const handleViewHistory = (id) => {
    navigate(`/patients/${id}/history`);
  };

  const handleNewAssessment = (patientId) => {
    navigate(`/assessments/new?patientId=${patientId}`);
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.charAt(0).toUpperCase();
  };

  if (loading) {
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
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Patients</h1>
          <p style={styles.subtitle}>Manage and view all patient records</p>
        </div>
        <button onClick={() => navigate('/patients/new')} style={styles.addButton}>
          + Add New Patient
        </button>
      </div>

      {/* Search and Filter Bar */}
      <div style={styles.searchSection}>
        <div style={styles.searchBar}>
          <span style={styles.searchIcon}>🔍</span>
          <input
            type="text"
            placeholder="Search by name, email, or phone number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
          {searchTerm && (
            <button onClick={clearSearch} style={styles.clearButton}>
              ✕
            </button>
          )}
        </div>
        
        <div style={styles.filterControls}>
          <div style={styles.sortGroup}>
            <label style={styles.sortLabel}>Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={styles.sortSelect}
            >
              <option value="name">Name</option>
              <option value="date">Date Added</option>
              <option value="assessments">Assessments</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              style={styles.sortOrderButton}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div style={styles.resultsSummary}>
        <span>
          {filteredPatients.length} {filteredPatients.length === 1 ? 'patient' : 'patients'} found
          {searchTerm && ` matching "${searchTerm}"`}
        </span>
        {searchTerm && (
          <button onClick={clearSearch} style={styles.clearSearchButton}>
            Clear search
          </button>
        )}
      </div>

      {/* Patient Grid */}
      {filteredPatients.length === 0 ? (
        <div style={styles.emptyState}>
          {searchTerm ? (
            <>
              <div style={styles.emptyIcon}>🔍</div>
              <h3>No patients found</h3>
              <p>No patients match "{searchTerm}". Try a different search term.</p>
              <button onClick={clearSearch} style={styles.emptyStateButton}>
                Clear Search
              </button>
            </>
          ) : (
            <>
              <div style={styles.emptyIcon}>👥</div>
              <h3>No patients yet</h3>
              <p>Get started by adding your first patient.</p>
              <button onClick={() => navigate('/patients/new')} style={styles.emptyStateButton}>
                Add New Patient
              </button>
            </>
          )}
        </div>
      ) : (
        <div style={styles.grid}>
          {filteredPatients.map((patient) => {
            const patientName = patient.fullName || `${patient.firstName} ${patient.lastName}` || patient.name || 'Unnamed Patient';
            const initials = getInitials(patientName);
            const assessmentCount = patient.assessmentCount || 0;
            
            return (
              <div key={patient.id} style={styles.card}>
                <div style={styles.cardHeader}>
                  <div style={styles.avatar}>
                    {initials}
                  </div>
                  <div style={styles.cardInfo}>
                    <h3 style={styles.patientName}>{patientName}</h3>
                    {patient.email && (
                      <p style={styles.patientDetail}>
                        <span style={styles.detailIcon}>📧</span> {patient.email}
                      </p>
                    )}
                    {patient.phone && (
                      <p style={styles.patientDetail}>
                        <span style={styles.detailIcon}>📞</span> {patient.phone}
                      </p>
                    )}
                    {patient.dateOfBirth && (
                      <p style={styles.patientDetail}>
                        <span style={styles.detailIcon}>🎂</span> {new Date(patient.dateOfBirth).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
                
                <div style={styles.cardStats}>
                  <div style={styles.stat}>
                    <span style={styles.statValue}>{assessmentCount}</span>
                    <span style={styles.statLabel}>Assessments</span>
                  </div>
                  {patient.gender && (
                    <div style={styles.stat}>
                      <span style={styles.statValue}>{patient.gender}</span>
                      <span style={styles.statLabel}>Gender</span>
                    </div>
                  )}
                </div>
                
                <div style={styles.cardActions}>
                  <button
                    onClick={() => handleViewPatient(patient.id)}
                    style={styles.viewButton}
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => handleViewHistory(patient.id)}
                    style={styles.historyButton}
                  >
                    View History
                  </button>
                  <button
                    onClick={() => handleNewAssessment(patient.id)}
                    style={styles.assessButton}
                  >
                    New Assessment
                  </button>
                </div>
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
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
  addButton: {
    padding: '0.75rem 1.5rem',
    background: 'linear-gradient(135deg, #27ae60, #2ecc71)',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '500',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
  },
  searchSection: {
    marginBottom: '1.5rem',
  },
  searchBar: {
    position: 'relative',
    marginBottom: '1rem',
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
    padding: '1rem 2.5rem 1rem 3rem',
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
    width: '24px',
    height: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
  },
  filterControls: {
    display: 'flex',
    justifyContent: 'flex-end',
  },
  sortGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    backgroundColor: 'rgba(255,255,255,0.95)',
    padding: '0.5rem',
    borderRadius: '10px',
  },
  sortLabel: {
    fontSize: '0.875rem',
    color: '#666',
    marginLeft: '0.5rem',
  },
  sortSelect: {
    padding: '0.5rem',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '0.875rem',
    cursor: 'pointer',
    backgroundColor: 'white',
  },
  sortOrderButton: {
    padding: '0.5rem',
    border: '1px solid #ddd',
    borderRadius: '6px',
    cursor: 'pointer',
    backgroundColor: 'white',
    fontSize: '1rem',
    minWidth: '40px',
    transition: 'all 0.2s ease',
  },
  resultsSummary: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
    padding: '0.5rem 0',
    color: 'rgba(255,255,255,0.9)',
    fontSize: '0.875rem',
  },
  clearSearchButton: {
    background: 'rgba(255,255,255,0.2)',
    border: 'none',
    color: 'white',
    padding: '0.25rem 0.75rem',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.75rem',
    transition: 'all 0.2s ease',
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
    cursor: 'pointer',
  },
  cardHeader: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '1rem',
  },
  avatar: {
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
    flexShrink: 0,
  },
  cardInfo: {
    flex: 1,
  },
  patientName: {
    margin: '0 0 0.5rem 0',
    fontSize: '1.2rem',
    fontWeight: '600',
    color: '#2c3e50',
  },
  patientDetail: {
    margin: '0.25rem 0',
    fontSize: '0.875rem',
    color: '#666',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  detailIcon: {
    fontSize: '0.875rem',
  },
  cardStats: {
    display: 'flex',
    gap: '1.5rem',
    padding: '1rem 0',
    margin: '1rem 0',
    borderTop: '1px solid #eee',
    borderBottom: '1px solid #eee',
  },
  stat: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: '1.25rem',
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  statLabel: {
    fontSize: '0.75rem',
    color: '#999',
    marginTop: '0.25rem',
  },
  cardActions: {
    display: 'flex',
    gap: '0.75rem',
  },
  viewButton: {
    flex: 1,
    padding: '0.6rem',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '500',
    transition: 'all 0.2s ease',
  },
  historyButton: {
    flex: 1,
    padding: '0.6rem',
    backgroundColor: '#9b59b6',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '500',
    transition: 'all 0.2s ease',
  },
  assessButton: {
    flex: 1,
    padding: '0.6rem',
    backgroundColor: '#27ae60',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '500',
    transition: 'all 0.2s ease',
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
    borderTop: '3px solid #3498db',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '1rem',
  },
  emptyState: {
    textAlign: 'center',
    padding: '3rem',
    backgroundColor: 'white',
    borderRadius: '16px',
    color: '#666',
  },
  emptyIcon: {
    fontSize: '4rem',
    marginBottom: '1rem',
  },
  emptyStateButton: {
    marginTop: '1rem',
    padding: '0.75rem 1.5rem',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '1rem',
    transition: 'all 0.2s ease',
  },
};

// Add keyframes for spinner animation
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
`;
document.head.appendChild(styleSheet);

export default PatientList;