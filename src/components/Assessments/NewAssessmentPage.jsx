import React, { useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import AssessmentTypeSelector from './AssessmentTypeSelector';

const NewAssessmentPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const patientId = searchParams.get('patientId') || '';
  const [selectedType, setSelectedType] = useState('');

  const handleTypeSelect = useCallback(
    (typeId) => {
      setSelectedType(typeId);

      if (!patientId) {
        toast.error('Please open assessment from a patient');
        navigate('/patients');
        return;
      }

      const nextUrl = `/assessments/new/form?patientId=${encodeURIComponent(patientId)}&type=${encodeURIComponent(typeId)}`;
      navigate(nextUrl);
    },
    [navigate, patientId]
  );

  return (
    <AssessmentTypeSelector
      selectedType={selectedType}
      onTypeSelect={handleTypeSelect}
    />
  );
};

export default NewAssessmentPage;
