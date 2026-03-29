import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';

const NewAssessmentPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const patientId = searchParams.get('patientId') || '';

  useEffect(() => {
    if (!patientId) {
      toast.error('Please open New Assessment from a patient');
      navigate('/patients');
      return;
    }

    navigate(`/assessments/new/form?patientId=${encodeURIComponent(patientId)}`);
  }, [navigate, patientId]);

  return null;
};

export default NewAssessmentPage;
