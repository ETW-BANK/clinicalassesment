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
  const [sortBy, setSortBy] = useState('name');
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
      
      const patientsData = await patientService.getAllPatients();
      console.log('Loaded patients:', patientsData);
      
      const allAssessments = await assessmentService.getAllAssessments();
      console.log('All assessments:', allAssessments);
      
      const assessmentCountMap = {};
      allAssessments.forEach(assessment => {
        const patientId = assessment.patientId;
        assessmentCountMap[patientId] = (assessmentCountMap[patientId] || 0) + 1;
      });
      
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
    
    if (searchTerm) {
      filtered = filtered.filter(patient => {
        const fullName = (patient.fullName || `${patient.firstName} ${patient.lastName}` || patient.name || '').toLowerCase();
        const email = (patient.email || '').toLowerCase();
        const phone = (patient.phone || '').toLowerCase();
        const search = searchTerm.toLowerCase();
        
        return fullName.includes(search) || email.includes(search) || phone.includes(search);
      });
    }
    
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
      <div className="patient-list-container">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading patients...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="patient-list-container">
      <div className="patient-list-header">
        <div>
          <h1 className="patient-list-title">Patients</h1>
          <p className="patient-list-subtitle">Manage and view all patient records</p>
        </div>
        <button onClick={() => navigate('/patients/new')} className="btn-success add-patient-btn">
          + Add New Patient
        </button>
      </div>

      <div className="patient-list-search-section">
        <div className="search-bar">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search by name, email, or phone number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          {searchTerm && (
            <button onClick={clearSearch} className="clear-search-btn">
              ✕
            </button>
          )}
        </div>
        
        <div className="filter-controls">
          <div className="sort-group">
            <label className="sort-label">Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="sort-select"
            >
              <option value="name">Name</option>
              <option value="date">Date Added</option>
              <option value="assessments">Assessments</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="sort-order-btn"
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>
      </div>

      <div className="patient-list-results-summary">
        <span>
          {filteredPatients.length} {filteredPatients.length === 1 ? 'patient' : 'patients'} found
          {searchTerm && ` matching "${searchTerm}"`}
        </span>
        {searchTerm && (
          <button onClick={clearSearch} className="clear-filters-btn">
            Clear search
          </button>
        )}
      </div>

      {filteredPatients.length === 0 ? (
        <div className="patient-list-empty-state">
          {searchTerm ? (
            <>
              <div className="empty-icon">🔍</div>
              <h3>No patients found</h3>
              <p>No patients match "{searchTerm}". Try a different search term.</p>
              <button onClick={clearSearch} className="btn-primary">Clear Search</button>
            </>
          ) : (
            <>
              <div className="empty-icon">👥</div>
              <h3>No patients yet</h3>
              <p>Get started by adding your first patient.</p>
              <button onClick={() => navigate('/patients/new')} className="btn-primary">
                Add New Patient
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="patient-list-grid">
          {filteredPatients.map((patient) => {
            const patientName = patient.fullName || `${patient.firstName} ${patient.lastName}` || patient.name || 'Unnamed Patient';
            const initials = getInitials(patientName);
            const assessmentCount = patient.assessmentCount || 0;
            
            return (
              <div key={patient.id} className="patient-card">
                <div className="patient-card-header">
                  <div className="patient-avatar">
                    {initials}
                  </div>
                  <div className="patient-info">
                    <h3 className="patient-name">{patientName}</h3>
                    {patient.email && (
                      <p className="patient-detail">
                        <span className="detail-icon">📧</span> {patient.email}
                      </p>
                    )}
                    {patient.phone && (
                      <p className="patient-detail">
                        <span className="detail-icon">📞</span> {patient.phone}
                      </p>
                    )}
                    {patient.dateOfBirth && (
                      <p className="patient-detail">
                        <span className="detail-icon">🎂</span> {new Date(patient.dateOfBirth).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="patient-card-stats">
                  <div className="stat">
                    <span className="stat-value">{assessmentCount}</span>
                    <span className="stat-label">Assessments</span>
                  </div>
                  {patient.gender && (
                    <div className="stat">
                      <span className="stat-value">{patient.gender}</span>
                      <span className="stat-label">Gender</span>
                    </div>
                  )}
                </div>
                
                <div className="patient-card-actions">
                  <button
                    onClick={() => handleViewPatient(patient.id)}
                    className="btn-view"
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => handleViewHistory(patient.id)}
                    className="btn-history"
                  >
                    View History
                  </button>
                  <button
                    onClick={() => handleNewAssessment(patient.id)}
                    className="btn-assess"
                  >
                    New Assessment
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        .patient-list-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 2rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: calc(100vh - 70px);
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          background-color: white;
          border-radius: 16px;
          padding: 2rem;
        }

        .spinner {
          width: 50px;
          height: 50px;
          border: 3px solid #f3f3f3;
          border-top: 3px solid #3498db;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 1rem;
        }

        .patient-list-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 2rem;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .patient-list-title {
          margin: 0;
          font-size: 2rem;
          color: white;
          font-weight: bold;
        }

        .patient-list-subtitle {
          margin: 0.5rem 0 0 0;
          font-size: 0.9rem;
          color: rgba(255,255,255,0.8);
        }

        .add-patient-btn {
          padding: 0.75rem 1.5rem;
          background: linear-gradient(135deg, #27ae60, #2ecc71);
          color: white;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          font-size: 1rem;
          font-weight: 500;
          transition: all 0.3s ease;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }

        .patient-list-search-section {
          margin-bottom: 1.5rem;
        }

        .search-bar {
          position: relative;
          margin-bottom: 1rem;
        }

        .search-icon {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          font-size: 1.2rem;
          color: #999;
        }

        .search-input {
          width: 100%;
          padding: 1rem 2.5rem 1rem 3rem;
          border: 2px solid rgba(255,255,255,0.2);
          border-radius: 12px;
          font-size: 1rem;
          background-color: rgba(255,255,255,0.95);
          transition: all 0.3s ease;
          outline: none;
        }

        .clear-search-btn {
          position: absolute;
          right: 1rem;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          font-size: 1.2rem;
          cursor: pointer;
          color: #999;
        }

        .filter-controls {
          display: flex;
          justify-content: flex-end;
        }

        .sort-group {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background-color: rgba(255,255,255,0.95);
          padding: 0.5rem;
          border-radius: 10px;
        }

        .sort-label {
          font-size: 0.875rem;
          color: #666;
          margin-left: 0.5rem;
        }

        .sort-select {
          padding: 0.5rem;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 0.875rem;
          cursor: pointer;
          background-color: white;
        }

        .sort-order-btn {
          padding: 0.5rem;
          border: 1px solid #ddd;
          border-radius: 6px;
          cursor: pointer;
          background-color: white;
          font-size: 1rem;
          min-width: 40px;
        }

        .patient-list-results-summary {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          padding: 0.5rem 0;
          color: rgba(255,255,255,0.9);
          font-size: 0.875rem;
        }

        .clear-filters-btn {
          background: rgba(255,255,255,0.2);
          border: none;
          color: white;
          padding: 0.25rem 0.75rem;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.75rem;
        }

        .patient-list-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
          gap: 1.5rem;
        }

        .patient-card {
          background-color: white;
          border-radius: 16px;
          padding: 1.5rem;
          box-shadow: 0 10px 25px rgba(0,0,0,0.1);
          transition: all 0.3s ease;
        }

        .patient-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 15px 35px rgba(0,0,0,0.15);
        }

        .patient-card-header {
          display: flex;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .patient-avatar {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          font-weight: bold;
          color: white;
          flex-shrink: 0;
        }

        .patient-info {
          flex: 1;
        }

        .patient-name {
          margin: 0 0 0.5rem 0;
          font-size: 1.2rem;
          font-weight: 600;
          color: #2c3e50;
        }

        .patient-detail {
          margin: 0.25rem 0;
          font-size: 0.875rem;
          color: #666;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .detail-icon {
          font-size: 0.875rem;
        }

        .patient-card-stats {
          display: flex;
          gap: 1.5rem;
          padding: 1rem 0;
          margin: 1rem 0;
          border-top: 1px solid #eee;
          border-bottom: 1px solid #eee;
        }

        .stat {
          display: flex;
          flex-direction: column;
          align-items: center;
          flex: 1;
        }

        .stat-value {
          font-size: 1.25rem;
          font-weight: bold;
          color: #2c3e50;
        }

        .stat-label {
          font-size: 0.75rem;
          color: #999;
          margin-top: 0.25rem;
        }

        .patient-card-actions {
          display: flex;
          gap: 0.75rem;
        }

        .btn-view, .btn-history, .btn-assess {
          flex: 1;
          padding: 0.6rem;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.875rem;
          font-weight: 500;
          transition: all 0.2s ease;
        }

        .btn-view {
          background-color: #3498db;
          color: white;
        }

        .btn-history {
          background-color: #9b59b6;
          color: white;
        }

        .btn-assess {
          background-color: #27ae60;
          color: white;
        }

        .btn-primary {
          padding: 0.75rem 1.5rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 1rem;
          font-weight: 500;
          transition: all 0.3s ease;
        }

        .patient-list-empty-state {
          text-align: center;
          padding: 3rem;
          background-color: white;
          border-radius: 16px;
          color: #666;
        }

        .empty-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .patient-list-container {
            padding: 1rem;
          }

          .patient-list-grid {
            grid-template-columns: 1fr;
          }

          .patient-card-actions {
            flex-direction: column;
          }

          .sort-group {
            width: 100%;
            justify-content: space-between;
          }
        }
      `}</style>
    </div>
  );
};

export default PatientList;