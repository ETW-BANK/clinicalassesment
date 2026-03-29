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
    return (
      <div className="patient-detail-loading">
        <div className="spinner"></div>
        <p>Loading patient details...</p>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="patient-detail-not-found">
        <p>Patient not found</p>
        <button onClick={() => navigate('/patients')} className="btn-secondary">Back to Patients</button>
      </div>
    );
  }

  return (
    <div className="patient-detail-container">
      <div className="patient-detail-card">
        <button onClick={() => navigate('/patients')} className="back-button">
          ← Back to Patients
        </button>

        <div className="patient-detail-header">
          <h2 className="patient-detail-name">
            {[patient.firstName, patient.lastName].filter(Boolean).join(' ') || 'Unnamed Patient'}
          </h2>
          <button onClick={handleNewAssessment} className="btn-success">
            New Assessment
          </button>
        </div>

        <div className="patient-detail-info-grid">
          {patient.dateOfBirth && (
            <div className="info-item">
              <strong>Date of Birth:</strong>
              <span>{new Date(patient.dateOfBirth).toLocaleDateString()}</span>
            </div>
          )}
          {patient.gender && (
            <div className="info-item">
              <strong>Gender:</strong>
              <span>{patient.gender}</span>
            </div>
          )}
          {patient.phoneNumber && (
            <div className="info-item">
              <strong>Phone Number:</strong>
              <span>{patient.phoneNumber}</span>
            </div>
          )}
          {patient.address && (
            <div className="info-item">
              <strong>Address:</strong>
              <span>{patient.address}</span>
            </div>
          )}
          {patient.createdAt && (
            <div className="info-item">
              <strong>Created:</strong>
              <span>{new Date(patient.createdAt).toLocaleString()}</span>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .patient-detail-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 2rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: calc(100vh - 70px);
        }

        .patient-detail-card {
          background: white;
          border-radius: 24px;
          padding: 2rem;
          box-shadow: 0 20px 40px rgba(0,0,0,0.1);
          animation: slideUp 0.5s ease;
        }

        .back-button {
          background: transparent;
          border: none;
          color: #667eea;
          cursor: pointer;
          padding: 0.5rem 0;
          margin-bottom: 1rem;
          font-size: 1rem;
          font-weight: 500;
          transition: all 0.3s ease;
        }

        .back-button:hover {
          transform: translateX(-4px);
          color: #5a67d8;
        }

        .patient-detail-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .patient-detail-name {
          margin: 0;
          color: #2c3e50;
          font-size: 1.8rem;
        }

        .patient-detail-info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1rem;
        }

        .info-item {
          padding: 1rem;
          background: #f8f9fa;
          border-radius: 12px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .info-item strong {
          color: #2c3e50;
        }

        .info-item span {
          color: #7f8c8d;
        }

        .patient-detail-loading, .patient-detail-not-found {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          background: white;
          border-radius: 24px;
          margin: 2rem auto;
          max-width: 600px;
          padding: 2rem;
          text-align: center;
        }

        @media (max-width: 768px) {
          .patient-detail-container {
            padding: 1rem;
          }

          .patient-detail-card {
            padding: 1.5rem;
          }

          .patient-detail-name {
            font-size: 1.4rem;
          }

          .info-item {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
};

export default PatientDetail;