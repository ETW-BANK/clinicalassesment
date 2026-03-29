import React, { useState } from 'react';
import patientService from '../../services/patientService';

const PatientForm = ({ onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
    phoneNumber: '',
    address: '',
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.firstName?.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!formData.lastName?.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = 'Date of birth is required';
    }
    if (!formData.gender) {
      newErrors.gender = 'Gender is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const dateOfBirthDateTime = `${formData.dateOfBirth}T00:00:00`;
      const patientData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        dateOfBirth: dateOfBirthDateTime,
        gender: formData.gender,
        phoneNumber: formData.phoneNumber?.trim() || null,
        address: formData.address?.trim() || null,
      };
      
      console.log('Sending patient data:', patientData);
      
      const response = await patientService.createPatient(patientData);
      
      console.log('Patient created:', response);
      
      setFormData({
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        gender: '',
        phoneNumber: '',
        address: '',
      });
      
      if (onSuccess) {
        onSuccess(response);
      }
      
    } catch (error) {
      console.error('Error creating patient:', error);

      const responseData = error?.response?.data;
      if (responseData) {
        console.error('Backend response:', responseData);
      }
      
      if (error.response?.data?.errors) {
        const backendErrors = error.response.data.errors;
        const formattedErrors = {};
        
        Object.keys(backendErrors).forEach(key => {
          const formField = key.charAt(0).toLowerCase() + key.slice(1);
          formattedErrors[formField] = backendErrors[key][0];
        });
        
        setErrors(formattedErrors);
      } else if (typeof error.response?.data === 'string') {
        setErrors({ submit: error.response.data });
      } else if (error.response?.data?.title) {
        setErrors({ submit: error.response.data.title });
      } else {
        setErrors({ submit: 'Failed to create patient. Please try again.' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="patient-form-wrapper">
      <form onSubmit={handleSubmit} className="patient-form">
        {errors.submit && (
          <div className="error-message">{errors.submit}</div>
        )}
        
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">First Name *</label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              className={`form-input ${errors.firstName ? 'error' : ''}`}
            />
            {errors.firstName && <span className="error-text">{errors.firstName}</span>}
          </div>
          
          <div className="form-group">
            <label className="form-label">Last Name *</label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              className={`form-input ${errors.lastName ? 'error' : ''}`}
            />
            {errors.lastName && <span className="error-text">{errors.lastName}</span>}
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Date of Birth *</label>
            <input
              type="date"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleChange}
              className={`form-input ${errors.dateOfBirth ? 'error' : ''}`}
            />
            {errors.dateOfBirth && <span className="error-text">{errors.dateOfBirth}</span>}
          </div>
          
          <div className="form-group">
            <label className="form-label">Gender *</label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className={`form-select ${errors.gender ? 'error' : ''}`}
            >
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
            {errors.gender && <span className="error-text">{errors.gender}</span>}
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Phone Number</label>
            <input
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              className="form-input"
              placeholder="(555) 123-4567"
            />
            {errors.phoneNumber && <span className="error-text">{errors.phoneNumber}</span>}
          </div>
          
          <div className="form-group">
            <label className="form-label">Address</label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="form-textarea"
              rows="3"
              placeholder="Enter full address"
            />
            {errors.address && <span className="error-text">{errors.address}</span>}
          </div>
        </div>
        
        <div className="form-actions">
          {onCancel && (
            <button type="button" onClick={onCancel} className="btn-secondary">
              Cancel
            </button>
          )}
          <button type="submit" disabled={isSubmitting} className="btn-primary">
            {isSubmitting ? 'Creating...' : 'Create Patient'}
          </button>
        </div>
      </form>

      <style>{`
        .patient-form-wrapper {
          max-width: 800px;
          margin: 0 auto;
          background: white;
          border-radius: 24px;
          padding: 2rem;
          box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }

        .patient-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .form-row {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-input, .form-select, .form-textarea {
          width: 100%;
          padding: 0.875rem 1rem;
          border: 2px solid #e0e0e0;
          border-radius: 12px;
          font-size: 1rem;
          transition: all 0.3s ease;
          outline: none;
          font-family: inherit;
        }

        .form-input:focus, .form-select:focus, .form-textarea:focus {
          border-color: #667eea;
          box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
          transform: translateY(-1px);
        }

        .form-input.error, .form-select.error, .form-textarea.error {
          border-color: #e74c3c;
        }

        .error-text {
          color: #e74c3c;
          font-size: 0.75rem;
        }

        .error-message {
          background: #fde8e8;
          color: #e74c3c;
          padding: 0.75rem 1rem;
          border-radius: 12px;
          font-size: 0.875rem;
        }

        .form-actions {
          display: flex;
          gap: 1rem;
          margin-top: 1rem;
        }

        .btn-primary, .btn-secondary {
          flex: 1;
          padding: 0.875rem;
          border: none;
          border-radius: 12px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }

        .btn-secondary {
          background: #f0f0f0;
          color: #666;
        }

        .btn-secondary:hover {
          background: #e0e0e0;
          transform: translateY(-1px);
        }

        @media (max-width: 768px) {
          .patient-form-wrapper {
            padding: 1.5rem;
          }

          .form-row {
            grid-template-columns: 1fr;
            gap: 1rem;
          }

          .form-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};

export default PatientForm;