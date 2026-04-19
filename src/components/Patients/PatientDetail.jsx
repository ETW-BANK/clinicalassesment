import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import patientService from '../../services/patientService';
import toast from 'react-hot-toast';

const createPatientFormData = (patient = null) => ({
  firstName: patient?.firstName || '',
  lastName: patient?.lastName || '',
  dateOfBirth: patient?.dateOfBirth ? String(patient.dateOfBirth).slice(0, 10) : '',
  gender: patient?.gender || '',
  phoneNumber: patient?.phoneNumber || '',
  address: patient?.address || '',
});

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

const PatientDetail = () => {
  const { id } = useParams();
  const [patient, setPatient] = useState(null);
  const [formData, setFormData] = useState(createPatientFormData());
  const [errors, setErrors] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadPatient();
  }, [id]);

  const loadPatient = async () => {
    try {
      const data = await patientService.getPatientById(id);
      setPatient(data);
      setFormData(createPatientFormData(data));
    } catch (error) {
      toast.error('Failed to load patient details');
      navigate('/patients');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validateForm = () => {
    const nextErrors = {};

    if (!String(formData.firstName || '').trim()) nextErrors.firstName = 'First name is required';
    if (!String(formData.lastName || '').trim()) nextErrors.lastName = 'Last name is required';
    if (!String(formData.dateOfBirth || '').trim()) nextErrors.dateOfBirth = 'Date of birth is required';
    if (!String(formData.gender || '').trim()) nextErrors.gender = 'Gender is required';

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleStartEdit = () => {
    setFormData(createPatientFormData(patient));
    setErrors({});
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setFormData(createPatientFormData(patient));
    setErrors({});
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setIsSaving(true);

      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        phoneNumber: formData.phoneNumber,
        address: formData.address,
      };

      const updatedPatient = await patientService.updatePatient(id, payload);
      const nextPatient = updatedPatient && typeof updatedPatient === 'object'
        ? { ...patient, ...updatedPatient }
        : {
            ...patient,
            ...payload,
            dateOfBirth: payload.dateOfBirth ? `${payload.dateOfBirth}T00:00:00` : patient?.dateOfBirth,
          };

      setPatient(nextPatient);
      setFormData(createPatientFormData(nextPatient));
      setIsEditing(false);
      toast.success('Patient details updated');
    } catch (error) {
      console.error('Failed to update patient:', error);
      toast.error('Failed to update patient details');
    } finally {
      setIsSaving(false);
    }
  };

  const patientAge = getPatientAge(isEditing ? formData.dateOfBirth : patient?.dateOfBirth);

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
            {isEditing
              ? [formData.firstName, formData.lastName].filter(Boolean).join(' ') || 'Edit Patient'
              : [patient.firstName, patient.lastName].filter(Boolean).join(' ') || 'Unnamed Patient'}
          </h2>
          <div className="patient-detail-actions">
            {isEditing ? (
              <>
                <button onClick={handleCancelEdit} className="btn-secondary" disabled={isSaving}>
                  Cancel
                </button>
                <button onClick={handleSave} className="btn-success" disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
              </>
            ) : (
              <button onClick={handleStartEdit} className="btn-success">
                Edit Patient
              </button>
            )}
          </div>
        </div>

        <div className="patient-detail-info-grid">
          <div className="info-item">
            <strong>First Name:</strong>
            {isEditing ? (
              <div className="info-edit-group">
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className={`info-input ${errors.firstName ? 'error' : ''}`}
                />
                {errors.firstName && <span className="field-error">{errors.firstName}</span>}
              </div>
            ) : (
              <span>{patient.firstName}</span>
            )}
          </div>
          <div className="info-item">
            <strong>Last Name:</strong>
            {isEditing ? (
              <div className="info-edit-group">
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className={`info-input ${errors.lastName ? 'error' : ''}`}
                />
                {errors.lastName && <span className="field-error">{errors.lastName}</span>}
              </div>
            ) : (
              <span>{patient.lastName}</span>
            )}
          </div>
          <div className="info-item">
            <strong>Date of Birth:</strong>
            {isEditing ? (
              <div className="info-edit-group">
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  className={`info-input ${errors.dateOfBirth ? 'error' : ''}`}
                />
                {patientAge !== null && <span className="patient-age-detail">Age: {patientAge}</span>}
                {errors.dateOfBirth && <span className="field-error">{errors.dateOfBirth}</span>}
              </div>
            ) : (
              <div className="info-value-group">
                <span>{new Date(patient.dateOfBirth).toLocaleDateString()}</span>
                {patientAge !== null && <span className="patient-age-detail">Age: {patientAge}</span>}
              </div>
            )}
          </div>
          <div className="info-item">
            <strong>Gender:</strong>
            {isEditing ? (
              <div className="info-edit-group">
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className={`info-input ${errors.gender ? 'error' : ''}`}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
                {errors.gender && <span className="field-error">{errors.gender}</span>}
              </div>
            ) : (
              <span>{patient.gender}</span>
            )}
          </div>
          <div className="info-item">
            <strong>Phone Number:</strong>
            {isEditing ? (
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                className="info-input"
              />
            ) : (
              <span>{patient.phoneNumber || 'N/A'}</span>
            )}
          </div>
          <div className="info-item info-item-address">
            <strong>Address:</strong>
            {isEditing ? (
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="info-textarea"
                rows="3"
              />
            ) : (
              <span>{patient.address || 'N/A'}</span>
            )}
          </div>
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
          background: transparent;
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

        .patient-detail-actions {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
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

        .info-edit-group {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 0.35rem;
          min-width: 220px;
        }

        .info-input,
        .info-textarea {
          width: 100%;
          padding: 0.7rem 0.9rem;
          border: 1px solid #d6dce5;
          border-radius: 10px;
          font: inherit;
          color: #2c3e50;
          background: white;
        }

        .info-input.error,
        .info-textarea.error {
          border-color: #e74c3c;
        }

        .field-error {
          font-size: 0.75rem;
          color: #e74c3c;
          font-weight: 600;
        }

        .info-value-group {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 0.2rem;
        }

        .patient-age-detail {
          font-size: 0.85rem;
          font-weight: 600;
          color: #5d6d7e;
        }

        .info-item-address {
          align-items: flex-start;
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

          .info-edit-group,
          .info-value-group {
            align-items: flex-start;
            min-width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default PatientDetail;