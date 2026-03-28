import React, { useState, useEffect } from 'react';
import assessmentService from '../../services/assessmentService';
import { useNavigate } from 'react-router-dom';

const AssessmentList = () => {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadAssessments();
  }, []);

  const loadAssessments = async () => {
    try {
      const data = await assessmentService.getAllAssessments();
      console.log('All assessments:', data);
      setAssessments(data);
    } catch (error) {
      console.error('Error loading assessments:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={styles.loading}>Loading assessments...</div>;

  return (
    <div style={styles.container}>
      <h2>All Assessments</h2>
      <div style={styles.grid}>
        {assessments.map(assessment => (
          <div key={assessment.id || assessment.assessmentId} style={styles.card}>
            <p><strong>Assessment ID:</strong> {assessment.assessmentId || assessment.id}</p>
            <p><strong>Patient ID:</strong> {assessment.patientId}</p>
            <p><strong>Generated:</strong> {new Date(assessment.generatedAt).toLocaleString()}</p>
            <button 
              onClick={() => navigate(`/assessments/${assessment.assessmentId || assessment.id}/report`)}
              style={styles.button}
            >
              View Report
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '2rem',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '1rem',
  },
  card: {
    border: '1px solid #ddd',
    padding: '1rem',
    borderRadius: '4px',
  },
  button: {
    padding: '0.5rem 1rem',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  loading: {
    textAlign: 'center',
    padding: '2rem',
  },
};

export default AssessmentList;