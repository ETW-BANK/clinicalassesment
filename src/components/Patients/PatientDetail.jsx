import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import patientService from '../../services/patientService';
import toast from 'react-hot-toast';

const PatientDetail = () => {
  const { id } = useParams();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadPatient();
  }, [id]);

  const loadPatient = async () => {
    try {
      const data = await patientService.getPatientById(id);
      setPatient(data);
    } catch (error) {
      toast.error('Failed to load patient details');
      navigate('/patients');
    } finally {
      setLoading(false);
    }
  };

  const handleNewAssessment = () => {
    navigate(`/assessments/new?patientId=${id}`);
  };

  if (loading) {
    return <div style={styles.loading}>Loading patient details...</div>;
  }

  if (!patient) {
    return <div style={styles.loading}>Patient not found</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <button onClick={() => navigate('/patients')} style={styles.backButton}>
          ← Back to Patients
        </button>

        <div style={styles.header}>
          <h2 style={styles.name}>
            {[patient.firstName, patient.lastName].filter(Boolean).join(' ') || 'Unnamed Patient'}
          </h2>
          <button onClick={handleNewAssessment} style={styles.assessButton}>
            New Assessment
          </button>
        </div>

        <div style={styles.infoGrid}>
          {patient.dateOfBirth && (
            <div style={styles.infoItem}>
              <strong>Date of Birth:</strong>
              <span>{new Date(patient.dateOfBirth).toLocaleDateString()}</span>
            </div>
          )}
          {patient.gender && (
            <div style={styles.infoItem}>
              <strong>Gender:</strong>
              <span>{patient.gender}</span>
            </div>
          )}
          {patient.phoneNumber && (
            <div style={styles.infoItem}>
              <strong>Phone Number:</strong>
              <span>{patient.phoneNumber}</span>
            </div>
          )}
          {patient.address && (
            <div style={styles.infoItem}>
              <strong>Address:</strong>
              <span>{patient.address}</span>
            </div>
          )}
          {patient.createdAt && (
            <div style={styles.infoItem}>
              <strong>Created:</strong>
              <span>{new Date(patient.createdAt).toLocaleString()}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '2rem',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '2rem',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  backButton: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#3498db',
    cursor: 'pointer',
    padding: '0.5rem 0',
    marginBottom: '1rem',
    fontSize: '1rem',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
  },
  name: {
    margin: 0,
    color: '#2c3e50',
  },
  assessButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#9b59b6',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '1rem',
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '1rem',
  },
  infoItem: {
    padding: '0.75rem',
    backgroundColor: '#f8f9fa',
    borderRadius: '4px',
    display: 'flex',
    justifyContent: 'space-between',
  },
  loading: {
    textAlign: 'center',
    padding: '2rem',
    fontSize: '1.2rem',
  },
};

export default PatientDetail;