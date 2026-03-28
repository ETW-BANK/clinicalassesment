import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import patientService from '../../services/patientService';
import assessmentService from '../../services/assessmentService';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';

const PatientHistory = () => {
  const { id } = useParams();
  const [patient, setPatient] = useState(null);
  const [allAssessments, setAllAssessments] = useState([]);
  const [filteredAssessments, setFilteredAssessments] = useState([]);
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingReport, setLoadingReport] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilterType, setDateFilterType] = useState('preset');
  const [presetDate, setPresetDate] = useState('all');
  const [singleDate, setSingleDate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadPatientAndAssessments();
  }, [id]);

  useEffect(() => {
    filterAssessments();
  }, [searchTerm, presetDate, singleDate, startDate, endDate, dateFilterType, statusFilter, allAssessments]);

  const loadPatientAndAssessments = async () => {
    try {
      setLoading(true);
      console.log('Loading patient with ID:', id);
      
      const patientData = await patientService.getPatientById(id);
      console.log('Patient data:', patientData);
      setPatient(patientData);
      
      const patientAssessments = await assessmentService.getAssessmentsByPatientId(id);
      console.log(`Found ${patientAssessments.length} assessments for patient ${id}`);
      
      setAllAssessments(patientAssessments);
      setFilteredAssessments(patientAssessments);
      
    } catch (error) {
      console.error('Error loading patient data:', error);
      toast.error('Failed to load patient history');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleString();
    } catch (e) {
      return dateString;
    }
  };

  const replacePatientIdWithName = (text, patientInfo) => {
    if (!text) return text;
    if (!patientInfo || !patientInfo.id) return text;
    
    const patientName = patientInfo.fullName || 
                       `${patientInfo.firstName} ${patientInfo.lastName}` || 
                       'Patient';
    const patientId = patientInfo.id;
    
    let updatedText = text;
    
    // Replace the patient ID with the full name
    if (patientId) {
      const regex = new RegExp(patientId, 'gi');
      updatedText = updatedText.replace(regex, patientName);
    }
    
    // Replace "Patient Identification:" with "Patient Name:"
    updatedText = updatedText.replace(/Patient Identification:/gi, 'Patient Name:');
    updatedText = updatedText.replace(/Patient ID:/gi, 'Patient Name:');
    
    // Replace true/false with Yes/No
    updatedText = updatedText.replace(/\btrue\b/gi, 'Yes');
    updatedText = updatedText.replace(/\bfalse\b/gi, 'No');
    
    return updatedText;
  };

  // Function to clean markdown for copying
  const cleanMarkdownForCopy = (text) => {
    return text
      // Remove bold markdown **text** -> text
      .replace(/\*\*(.*?)\*\*/g, '$1')
      // Remove italic markdown *text* -> text
      .replace(/\*(.*?)\*/g, '$1')
      // Remove heading markers (#, ##, etc.)
      .replace(/^#{1,6}\s+/gm, '')
      // Replace bullet points (* or -) with • symbol
      .replace(/^[\*\-]\s+/gm, '• ')
      // Remove any remaining asterisks
      .replace(/\*/g, '')
      // Replace multiple newlines with double newline
      .replace(/\n{3,}/g, '\n\n')
      // Trim whitespace
      .trim();
  };

  const filterAssessments = () => {
    let filtered = [...allAssessments];
    
    if (searchTerm) {
      filtered = filtered.filter(assessment => 
        assessment.nurseNotes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assessment.vitals?.bloodPressure?.includes(searchTerm) ||
        assessment.respiratory?.lungSounds?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Date filtering
    if (dateFilterType === 'preset') {
      if (presetDate !== 'all') {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const thisWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
        const thisMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        
        filtered = filtered.filter(assessment => {
          const assessmentDate = new Date(assessment.assessmentDate);
          if (presetDate === 'today') return assessmentDate >= today;
          if (presetDate === 'week') return assessmentDate >= thisWeek;
          if (presetDate === 'month') return assessmentDate >= thisMonth;
          return true;
        });
      }
    } else if (dateFilterType === 'single') {
      if (singleDate) {
        const selectedDate = new Date(singleDate);
        const startOfDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
        const endOfDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate() + 1);
        
        filtered = filtered.filter(assessment => {
          const assessmentDate = new Date(assessment.assessmentDate);
          return assessmentDate >= startOfDay && assessmentDate < endOfDay;
        });
      }
    } else if (dateFilterType === 'range') {
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        
        filtered = filtered.filter(assessment => {
          const assessmentDate = new Date(assessment.assessmentDate);
          return assessmentDate >= start && assessmentDate <= end;
        });
      } else if (startDate && !endDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        
        filtered = filtered.filter(assessment => {
          const assessmentDate = new Date(assessment.assessmentDate);
          return assessmentDate >= start;
        });
      } else if (!startDate && endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        
        filtered = filtered.filter(assessment => {
          const assessmentDate = new Date(assessment.assessmentDate);
          return assessmentDate <= end;
        });
      }
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(assessment => {
        const isCritical = 
          (assessment.vitals?.spO2 && assessment.vitals.spO2 < 90) ||
          (assessment.vitals?.pulseRate && assessment.vitals.pulseRate > 120) ||
          (assessment.vitals?.pulseRate && assessment.vitals.pulseRate < 60) ||
          (assessment.vitals?.respiratoryRate && assessment.vitals.respiratoryRate > 24) ||
          (assessment.vitals?.respiratoryRate && assessment.vitals.respiratoryRate < 12);
        
        return statusFilter === 'critical' ? isCritical : !isCritical;
      });
    }
    
    setFilteredAssessments(filtered);
  };

  const handleDateFilterTypeChange = (type) => {
    setDateFilterType(type);
    setPresetDate('all');
    setSingleDate('');
    setStartDate('');
    setEndDate('');
  };

  const clearDateFilters = () => {
    setDateFilterType('preset');
    setPresetDate('all');
    setSingleDate('');
    setStartDate('');
    setEndDate('');
  };

  const handleViewReport = async (assessment) => {
    setLoadingReport(true);
    setShowModal(true);
    try {
      console.log('Fetching report for assessment ID:', assessment.id);
      const report = await assessmentService.getAssessmentReport(assessment.id);
      console.log('Report loaded:', report);
      
      // Store patient info along with the report
      setSelectedAssessment({ 
        ...assessment, 
        report,
        patientInfo: patient // Pass the current patient data
      });
    } catch (error) {
      console.error('Error loading report:', error);
      toast.error('Failed to load assessment report');
      setShowModal(false);
    } finally {
      setLoadingReport(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedAssessment(null);
  };

  const copyReportToClipboard = async () => {
    if (!selectedAssessment?.report?.reportText) {
      toast.error('No report content to copy');
      return;
    }

    try {
      // Get the report text and replace patient ID with name
      let cleanReport = selectedAssessment.report.reportText;
      const patientInfo = selectedAssessment.patientInfo || patient;
      
      // Replace patient ID with name
      if (patientInfo && patientInfo.id) {
        const patientName = patientInfo.fullName || 
                           `${patientInfo.firstName} ${patientInfo.lastName}` || 
                           'Patient';
        const patientId = patientInfo.id;
        const regex = new RegExp(patientId, 'gi');
        cleanReport = cleanReport.replace(regex, patientName);
      }
      
      // Replace "Patient Identification:" with "Patient Name:"
      cleanReport = cleanReport.replace(/Patient Identification:/gi, 'Patient Name:');
      cleanReport = cleanReport.replace(/Patient ID:/gi, 'Patient Name:');
      
      // Replace true/false with Yes/No
      cleanReport = cleanReport.replace(/\btrue\b/gi, 'Yes');
      cleanReport = cleanReport.replace(/\bfalse\b/gi, 'No');
      
      // Clean markdown formatting
      cleanReport = cleanMarkdownForCopy(cleanReport);
      
      // Add header and footer
      const header = `PATIENT CLINICAL ASSESSMENT REPORT\n${'='.repeat(50)}\n\n`;
      const footer = `\n\n${'='.repeat(50)}\nReport generated on: ${new Date().toLocaleString()}\n`;
      
      const finalReport = header + cleanReport + footer;
      
      await navigator.clipboard.writeText(finalReport);
      toast.success('✓ Report copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy:', err);
      toast.error('Failed to copy report. Please try again.');
    }
  };

  const getVitalSignsSummary = (assessment) => {
    if (!assessment.vitals) return 'No vital signs recorded';
    
    const vitals = [];
    if (assessment.vitals.bloodPressure) vitals.push(`BP: ${assessment.vitals.bloodPressure}`);
    if (assessment.vitals.pulseRate && assessment.vitals.pulseRate !== 0) vitals.push(`Pulse: ${assessment.vitals.pulseRate}`);
    if (assessment.vitals.respiratoryRate && assessment.vitals.respiratoryRate !== 0) vitals.push(`RR: ${assessment.vitals.respiratoryRate}`);
    if (assessment.vitals.spO2 && assessment.vitals.spO2 !== 0) vitals.push(`SpO2: ${assessment.vitals.spO2}%`);
    if (assessment.vitals.temperature && assessment.vitals.temperature !== 0) vitals.push(`Temp: ${assessment.vitals.temperature}°C`);
    
    return vitals.length > 0 ? vitals.join(' | ') : 'No vital signs recorded';
  };

  const getSkinSummary = (assessment) => {
    if (!assessment.skin) return 'Not assessed';
    
    const skinConditions = [];
    if (assessment.skin.warm) skinConditions.push('Warm');
    if (assessment.skin.dry) skinConditions.push('Dry');
    if (assessment.skin.pale) skinConditions.push('Pale');
    if (assessment.skin.cool) skinConditions.push('Cool');
    if (assessment.skin.hot) skinConditions.push('Hot');
    if (assessment.skin.flushed) skinConditions.push('Flushed');
    if (assessment.skin.cyanotic) skinConditions.push('Cyanotic');
    if (assessment.skin.clammy) skinConditions.push('Clammy');
    if (assessment.skin.jaundice) skinConditions.push('Jaundice');
    if (assessment.skin.diaphoretic) skinConditions.push('Diaphoretic');
    
    return skinConditions.length > 0 ? skinConditions.join(', ') : 'Normal';
  };

  const getMobilitySummary = (assessment) => {
    if (!assessment.mobility) return 'Not assessed';
    
    const mobility = [];
    if (assessment.mobility.gaitSteady) mobility.push('Steady Gait');
    if (assessment.mobility.usesCane) mobility.push('Cane');
    if (assessment.mobility.usesCrutches) mobility.push('Crutches');
    if (assessment.mobility.usesWheelchair) mobility.push('Wheelchair');
    if (assessment.mobility.bedridden) mobility.push('Bedridden');
    if (assessment.mobility.requiresAssistance) mobility.push('Needs Assistance');
    
    return mobility.length > 0 ? mobility.join(', ') : 'Independent';
  };

  const getStatusBadge = (assessment) => {
    if (!assessment.vitals) return 'neutral';
    
    const hasCritical = 
      (assessment.vitals.spO2 && assessment.vitals.spO2 < 90) ||
      (assessment.vitals.pulseRate && assessment.vitals.pulseRate > 120) ||
      (assessment.vitals.pulseRate && assessment.vitals.pulseRate < 60) ||
      (assessment.vitals.respiratoryRate && assessment.vitals.respiratoryRate > 24) ||
      (assessment.vitals.respiratoryRate && assessment.vitals.respiratoryRate < 12);
    
    return hasCritical ? 'critical' : 'stable';
  };

  const clearFilters = () => {
    setSearchTerm('');
    setDateFilterType('preset');
    setPresetDate('all');
    setSingleDate('');
    setStartDate('');
    setEndDate('');
    setStatusFilter('all');
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
          <p>Loading patient history...</p>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div style={styles.container}>
        <div style={styles.errorContainer}>
          <p>Patient not found</p>
          <button onClick={() => navigate('/patients')} style={styles.backButton}>
            Back to Patients
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={() => navigate('/patients')} style={styles.backButton}>
          ← Back to Patients
        </button>
        <button 
          onClick={() => navigate(`/assessments/new?patientId=${id}`)} 
          style={styles.newAssessmentButton}
        >
          + New Assessment
        </button>
      </div>

      {/* Patient Information Card */}
      <div style={styles.patientCard}>
        <h2 style={styles.patientName}>
          {patient.fullName || `${patient.firstName} ${patient.lastName}` || 'Unnamed Patient'}
        </h2>
        <div style={styles.patientInfo}>
          {patient.dateOfBirth && (
            <span><strong>DOB:</strong> {new Date(patient.dateOfBirth).toLocaleDateString()}</span>
          )}
          {patient.gender && <span><strong>Gender:</strong> {patient.gender}</span>}
          {patient.phone && <span><strong>Phone:</strong> {patient.phone}</span>}
          {patient.email && <span><strong>Email:</strong> {patient.email}</span>}
          <span><strong>Total Assessments:</strong> {allAssessments.length}</span>
        </div>
      </div>

      {/* Dashboard Summary Cards */}
      <div style={styles.dashboardGrid}>
        <div style={styles.dashboardCard}>
          <div style={styles.dashboardIcon}>📊</div>
          <div style={styles.dashboardValue}>{allAssessments.length}</div>
          <div style={styles.dashboardLabel}>Total Assessments</div>
        </div>
        <div style={{...styles.dashboardCard, ...styles.criticalCard}}>
          <div style={styles.dashboardIcon}>⚠️</div>
          <div style={styles.dashboardValue}>
            {allAssessments.filter(a => getStatusBadge(a) === 'critical').length}
          </div>
          <div style={styles.dashboardLabel}>Critical Cases</div>
        </div>
        <div style={{...styles.dashboardCard, ...styles.stableCard}}>
          <div style={styles.dashboardIcon}>✓</div>
          <div style={styles.dashboardValue}>
            {allAssessments.filter(a => getStatusBadge(a) === 'stable').length}
          </div>
          <div style={styles.dashboardLabel}>Stable Cases</div>
        </div>
        <div style={{...styles.dashboardCard, ...styles.todayCard}}>
          <div style={styles.dashboardIcon}>📅</div>
          <div style={styles.dashboardValue}>
            {allAssessments.filter(a => {
              const today = new Date().toDateString();
              return new Date(a.assessmentDate).toDateString() === today;
            }).length}
          </div>
          <div style={styles.dashboardLabel}>Today's Assessments</div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div style={styles.filterBar}>
        <input
          type="text"
          placeholder="Search by notes or vital signs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={styles.searchInput}
        />
        
        <button 
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          style={styles.advancedFilterButton}
        >
          {showAdvancedFilters ? '▼' : '▶'} Advanced Filters
        </button>
        
        {(searchTerm || dateFilterType !== 'preset' || presetDate !== 'all' || singleDate || startDate || endDate || statusFilter !== 'all') && (
          <button onClick={clearFilters} style={styles.clearButton}>
            Clear All Filters
          </button>
        )}
      </div>

      {/* Advanced Filters Section */}
      {showAdvancedFilters && (
        <div style={styles.advancedFilters}>
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Date Filter Type:</label>
            <div style={styles.radioGroup}>
              <label style={styles.radioLabel}>
                <input
                  type="radio"
                  value="preset"
                  checked={dateFilterType === 'preset'}
                  onChange={() => handleDateFilterTypeChange('preset')}
                />
                Preset
              </label>
              <label style={styles.radioLabel}>
                <input
                  type="radio"
                  value="single"
                  checked={dateFilterType === 'single'}
                  onChange={() => handleDateFilterTypeChange('single')}
                />
                Single Date
              </label>
              <label style={styles.radioLabel}>
                <input
                  type="radio"
                  value="range"
                  checked={dateFilterType === 'range'}
                  onChange={() => handleDateFilterTypeChange('range')}
                />
                Date Range
              </label>
            </div>
          </div>

          {dateFilterType === 'preset' && (
            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>Quick Filter:</label>
              <select
                value={presetDate}
                onChange={(e) => setPresetDate(e.target.value)}
                style={styles.filterSelect}
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
              </select>
            </div>
          )}

          {dateFilterType === 'single' && (
            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>Select Date:</label>
              <input
                type="date"
                value={singleDate}
                onChange={(e) => setSingleDate(e.target.value)}
                style={styles.dateInput}
              />
              {singleDate && (
                <div style={styles.filterHint}>
                  Showing assessments from {new Date(singleDate).toLocaleDateString()}
                </div>
              )}
            </div>
          )}

          {dateFilterType === 'range' && (
            <div style={styles.dateRangeGroup}>
              <div style={styles.filterGroup}>
                <label style={styles.filterLabel}>From Date:</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  style={styles.dateInput}
                />
              </div>
              <div style={styles.filterGroup}>
                <label style={styles.filterLabel}>To Date:</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  style={styles.dateInput}
                />
              </div>
              {startDate && !endDate && (
                <div style={styles.filterHint}>Showing assessments from {new Date(startDate).toLocaleDateString()} onward</div>
              )}
              {!startDate && endDate && (
                <div style={styles.filterHint}>Showing assessments up to {new Date(endDate).toLocaleDateString()}</div>
              )}
              {startDate && endDate && (
                <div style={styles.filterHint}>
                  Showing assessments between {new Date(startDate).toLocaleDateString()} and {new Date(endDate).toLocaleDateString()}
                </div>
              )}
            </div>
          )}

          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={styles.filterSelect}
            >
              <option value="all">All Status</option>
              <option value="critical">Critical Only</option>
              <option value="stable">Stable Only</option>
            </select>
          </div>
        </div>
      )}

      {/* Results Summary */}
      <div style={styles.resultsSummary}>
        <span>
          {filteredAssessments.length} {filteredAssessments.length === 1 ? 'assessment' : 'assessments'} found
          {searchTerm && ` matching "${searchTerm}"`}
          {dateFilterType === 'preset' && presetDate !== 'all' && ` (${presetDate})`}
          {dateFilterType === 'single' && singleDate && ` on ${new Date(singleDate).toLocaleDateString()}`}
          {dateFilterType === 'range' && (startDate || endDate) && ' with date range'}
        </span>
        {(searchTerm || dateFilterType !== 'preset' || presetDate !== 'all' || singleDate || startDate || endDate || statusFilter !== 'all') && (
          <button onClick={clearFilters} style={styles.clearSearchButton}>
            Clear all filters
          </button>
        )}
      </div>

      {/* Assessment History Table */}
      <div style={styles.historySection}>
        <h3 style={styles.sectionTitle}>
          Assessment History 
          <span style={styles.badge}>{filteredAssessments.length} / {allAssessments.length}</span>
        </h3>
        
        {filteredAssessments.length === 0 ? (
          <div style={styles.emptyState}>
            <p>No assessments match your filters.</p>
            <button onClick={clearFilters} style={styles.emptyStateButton}>
              Clear Filters
            </button>
          </div>
        ) : (
          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Date</th>
                  <th style={styles.th}>Vital Signs</th>
                  <th style={styles.th}>Skin</th>
                  <th style={styles.th}>Mobility</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssessments.map((assessment) => {
                  const status = getStatusBadge(assessment);
                  return (
                    <tr key={assessment.id} style={styles.tr}>
                      <td style={styles.td}>
                        {formatDate(assessment.assessmentDate)}
                        <div style={{...styles.statusBadge, ...(status === 'critical' ? styles.criticalBadge : styles.stableBadge)}}>
                          {status === 'critical' ? '⚠️ Critical' : '✓ Stable'}
                        </div>
                      </td>
                      <td style={styles.td}>
                        {getVitalSignsSummary(assessment)}
                        <div style={styles.interventions}>
                          <strong>Interventions:</strong>{' '}
                          {assessment.vitals?.oxygenGiven && 'Oxygen '}
                          {assessment.vitals?.ivStarted && 'IV '}
                          {assessment.vitals?.cprPerformed && 'CPR'}
                          {!assessment.vitals?.oxygenGiven && 
                           !assessment.vitals?.ivStarted && 
                           !assessment.vitals?.cprPerformed && 'None'}
                        </div>
                        {assessment.respiratory?.lungSounds && (
                          <div style={styles.interventions}>
                            <strong>Lung Sounds:</strong> {assessment.respiratory.lungSounds}
                          </div>
                        )}
                        {assessment.nurseNotes && (
                          <div style={styles.interventions}>
                            <strong>Notes:</strong> {assessment.nurseNotes.substring(0, 50)}...
                          </div>
                        )}
                      </td>
                      <td style={styles.td}>
                        {getSkinSummary(assessment)}
                      </td>
                      <td style={styles.td}>
                        {getMobilitySummary(assessment)}
                      </td>
                      <td style={styles.td}>
                        <button
                          onClick={() => handleViewReport(assessment)}
                          style={styles.viewButton}
                          disabled={loadingReport}
                        >
                          View AI Report
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Popup for AI Report */}
      {showModal && (
        <div style={styles.modalOverlay} onClick={closeModal}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>
                Clinical Assessment Report
                {selectedAssessment && (
                  <span style={styles.modalSubtitle}>
                    {formatDate(selectedAssessment.assessmentDate)}
                  </span>
                )}
              </h3>
              <button onClick={closeModal} style={styles.modalClose}>
                ×
              </button>
            </div>
            
            <div style={styles.modalBody}>
              {loadingReport ? (
                <div style={styles.modalLoading}>
                  <div style={styles.spinner}></div>
                  <p>Generating report...</p>
                </div>
              ) : selectedAssessment?.report ? (
                <>
                  <div style={styles.modalReportText}>
                    <ReactMarkdown>
                      {replacePatientIdWithName(
                        selectedAssessment.report.reportText,
                        selectedAssessment.patientInfo || patient
                      )}
                    </ReactMarkdown>
                  </div>
                  {selectedAssessment.report.generatedAt && (
                    <div style={styles.modalFooter}>
                      <strong>Generated:</strong> {formatDate(selectedAssessment.report.generatedAt)}
                    </div>
                  )}
                </>
              ) : (
                <div style={styles.modalError}>
                  <p>Failed to load report. Please try again.</p>
                  <button 
                    onClick={() => handleViewReport(selectedAssessment)}
                    style={styles.retryButton}
                  >
                    Retry
                  </button>
                </div>
              )}
            </div>
            
            <div style={styles.modalActions}>
              <button onClick={copyReportToClipboard} style={styles.copyButton}>
                📋 Copy Report
              </button>
              {selectedAssessment?.report && (
                <button 
                  onClick={() => window.print()}
                  style={styles.printButton}
                >
                  🖨️ Print Report
                </button>
              )}
              <button onClick={closeModal} style={styles.modalButton}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Styles remain the same as before
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
    alignItems: 'center',
    marginBottom: '2rem',
  },
  backButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    border: 'none',
    color: 'white',
    cursor: 'pointer',
    padding: '0.5rem 1rem',
    fontSize: '1rem',
    fontWeight: '500',
    borderRadius: '8px',
    backdropFilter: 'blur(10px)',
    transition: 'all 0.3s ease',
  },
  newAssessmentButton: {
    padding: '0.75rem 1.5rem',
    background: 'linear-gradient(135deg, #27ae60, #2ecc71)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '500',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
  },
  patientCard: {
    background: 'white',
    borderRadius: '16px',
    padding: '1.5rem',
    marginBottom: '1.5rem',
    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
  },
  patientName: {
    margin: '0 0 0.5rem 0',
    color: '#2c3e50',
    fontSize: '1.5rem',
  },
  patientInfo: {
    display: 'flex',
    gap: '1.5rem',
    flexWrap: 'wrap',
    color: '#666',
    fontSize: '0.9rem',
  },
  dashboardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '1rem',
    marginBottom: '2rem',
  },
  dashboardCard: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    padding: '1.5rem',
    borderRadius: '16px',
    textAlign: 'center',
    transition: 'transform 0.3s ease',
    cursor: 'pointer',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
  },
  criticalCard: {
    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  },
  stableCard: {
    background: 'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)',
    color: '#2c3e50',
  },
  todayCard: {
    background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    color: '#2c3e50',
  },
  dashboardIcon: {
    fontSize: '2.5rem',
    marginBottom: '0.5rem',
  },
  dashboardValue: {
    fontSize: '2rem',
    fontWeight: 'bold',
    marginBottom: '0.25rem',
  },
  dashboardLabel: {
    fontSize: '0.875rem',
    opacity: 0.9,
  },
  filterBar: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '1rem',
    flexWrap: 'wrap',
  },
  searchInput: {
    flex: 1,
    padding: '0.75rem',
    border: '2px solid rgba(255,255,255,0.2)',
    borderRadius: '8px',
    fontSize: '1rem',
    minWidth: '200px',
    backgroundColor: 'rgba(255,255,255,0.95)',
  },
  advancedFilterButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: 'rgba(255,255,255,0.2)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '1rem',
    transition: 'all 0.3s ease',
  },
  clearButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '1rem',
    transition: 'all 0.3s ease',
  },
  advancedFilters: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: '12px',
    padding: '1.5rem',
    marginBottom: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  filterGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    flexWrap: 'wrap',
  },
  filterLabel: {
    fontWeight: '600',
    color: '#2c3e50',
    minWidth: '120px',
  },
  radioGroup: {
    display: 'flex',
    gap: '1.5rem',
  },
  radioLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    cursor: 'pointer',
    color: '#2c3e50',
  },
  filterSelect: {
    padding: '0.5rem',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '0.9rem',
    backgroundColor: 'white',
    cursor: 'pointer',
  },
  dateInput: {
    padding: '0.5rem',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '0.9rem',
  },
  dateRangeGroup: {
    display: 'flex',
    gap: '1rem',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
  },
  filterHint: {
    fontSize: '0.875rem',
    color: '#666',
    marginTop: '0.5rem',
    fontStyle: 'italic',
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
  historySection: {
    background: 'white',
    borderRadius: '16px',
    padding: '1.5rem',
    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
    overflow: 'hidden',
  },
  sectionTitle: {
    marginTop: 0,
    marginBottom: '1.5rem',
    color: '#2c3e50',
    fontSize: '1.2rem',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  badge: {
    backgroundColor: '#3498db',
    color: 'white',
    padding: '0.25rem 0.5rem',
    borderRadius: '12px',
    fontSize: '0.75rem',
    fontWeight: 'normal',
  },
  tableContainer: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    textAlign: 'left',
    padding: '1rem',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    fontWeight: '600',
    fontSize: '0.875rem',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  td: {
    padding: '1rem',
    borderBottom: '1px solid #eee',
    textAlign: 'left',
    verticalAlign: 'top',
  },
  tr: {
    transition: 'background-color 0.2s',
  },
  statusBadge: {
    fontSize: '0.75rem',
    padding: '0.25rem 0.5rem',
    borderRadius: '4px',
    marginTop: '0.25rem',
    display: 'inline-block',
  },
  criticalBadge: {
    backgroundColor: '#fee',
    color: '#c33',
    border: '1px solid #fcc',
  },
  stableBadge: {
    backgroundColor: '#efe',
    color: '#3c3',
    border: '1px solid #cfc',
  },
  interventions: {
    fontSize: '0.875rem',
    color: '#666',
    marginTop: '0.25rem',
  },
  viewButton: {
    padding: '0.5rem 1rem',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    transition: 'all 0.3s ease',
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
    width: '40px',
    height: '40px',
    border: '3px solid #f3f3f3',
    borderTop: '3px solid #3498db',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '1rem',
  },
  errorContainer: {
    textAlign: 'center',
    padding: '3rem',
    backgroundColor: 'white',
    borderRadius: '16px',
  },
  emptyState: {
    textAlign: 'center',
    padding: '2rem',
    color: '#666',
  },
  emptyStateButton: {
    marginTop: '1rem',
    padding: '0.5rem 1rem',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.9rem',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    backdropFilter: 'blur(5px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    animation: 'fadeIn 0.3s ease',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: '16px',
    width: '90%',
    maxWidth: '900px',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
    animation: 'slideUp 0.3s ease',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1.5rem',
    borderBottom: '2px solid #3498db',
    backgroundColor: '#f8f9fa',
    borderRadius: '16px 16px 0 0',
  },
  modalTitle: {
    margin: 0,
    fontSize: '1.25rem',
    color: '#2c3e50',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  modalSubtitle: {
    fontSize: '0.875rem',
    color: '#666',
    fontWeight: 'normal',
  },
  modalClose: {
    background: 'none',
    border: 'none',
    fontSize: '1.75rem',
    cursor: 'pointer',
    color: '#999',
    padding: '0 0.5rem',
    transition: 'color 0.3s',
    lineHeight: 1,
  },
  modalBody: {
    flex: 1,
    overflowY: 'auto',
    padding: '1.5rem',
    minHeight: '300px',
    maxHeight: 'calc(90vh - 120px)',
  },
  modalReportText: {
    lineHeight: '1.6',
    fontSize: '0.95rem',
    color: '#333',
  },
  modalFooter: {
    marginTop: '1rem',
    paddingTop: '1rem',
    borderTop: '1px solid #eee',
    fontSize: '0.875rem',
    color: '#6c757d',
    textAlign: 'right',
  },
  modalActions: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'flex-end',
    padding: '1rem 1.5rem',
    borderTop: '1px solid #eee',
    backgroundColor: '#f8f9fa',
    borderRadius: '0 0 16px 16px',
  },
  modalButton: {
    padding: '0.5rem 1.5rem',
    backgroundColor: '#95a5a6',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    transition: 'background-color 0.3s',
  },
  copyButton: {
    padding: '0.5rem 1.5rem',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    transition: 'all 0.3s ease',
  },
  printButton: {
    padding: '0.5rem 1.5rem',
    background: 'linear-gradient(135deg, #27ae60, #2ecc71)',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    transition: 'all 0.3s ease',
  },
  modalLoading: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
  },
  modalError: {
    textAlign: 'center',
    padding: '2rem',
    color: '#e74c3c',
  },
  retryButton: {
    marginTop: '1rem',
    padding: '0.5rem 1rem',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
};

// Add keyframes for animations
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes slideUp {
    from {
      transform: translateY(50px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
  
  button:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba(0,0,0,0.15);
  }
  
  tr:hover {
    background-color: #f8f9fa;
  }
  
  .modal-close:hover {
    color: #e74c3c;
    transform: scale(1.1);
  }
`;
document.head.appendChild(styleSheet);

export default PatientHistory;