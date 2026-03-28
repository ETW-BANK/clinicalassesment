import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navbar from './components/Layout/Navbar';
import PrivateRoute from './components/Layout/PrivateRoute';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import PatientList from './components/Patients/PatientList';
import PatientForm from './components/Patients/PatientForm';
import PatientDetail from './components/Patients/PatientDetail';
import AssessmentForm from './components/Assessments/AssessmentForm';
import AssessmentReport from './components/Assessments/AssessmentReport';
import PatientHistory from './components/Patients/PatientHistory';
import AssessmentDebug from './components/Assessments/AssessmentDebug';
import AssessmentList from './components/Assessments/AssessmentList';
import './App.css';

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={
          isAuthenticated ? <Navigate to="/patients" /> : <Navigate to="/login" />
        } />
        <Route path="/login" element={
          isAuthenticated ? <Navigate to="/patients" /> : <Login />
        } />
        <Route path="/register" element={
          isAuthenticated ? <Navigate to="/patients" /> : <Register />
        } />
        <Route path="/patients" element={
          <PrivateRoute>
            <PatientList />
          </PrivateRoute>
        } />
        <Route path="/patients/new" element={
          <PrivateRoute>
            <PatientForm />
          </PrivateRoute>
        } />
        <Route path="/patients/:id" element={
          <PrivateRoute>
            <PatientDetail />
          </PrivateRoute>
        } />
        <Route path="/patients/:id/history" element={
          <PrivateRoute>
            <PatientHistory />
          </PrivateRoute>
        } />
        <Route path="/assessments/new" element={
          <PrivateRoute>
            <AssessmentForm />
          </PrivateRoute>
        } />
        <Route path="/assessments/:id/report" element={
          <PrivateRoute>
            <AssessmentReport />
          </PrivateRoute>
        } />
        <Route path="/assessments/debug" element={
          <PrivateRoute>
            <AssessmentDebug />
          </PrivateRoute>
        } />
        <Route path="/assessments" element={
  <PrivateRoute>
    <AssessmentList />
  </PrivateRoute>
} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <Toaster position="top-right" />
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;