import React, { useMemo, useState, useEffect } from 'react';
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
  const [showDailyModal, setShowDailyModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingDailyReport, setLoadingDailyReport] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilterType, setDateFilterType] = useState('preset');
  const [presetDate, setPresetDate] = useState('all');
  const [singleDate, setSingleDate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [dailyReportDateKey, setDailyReportDateKey] = useState('');
  const [dailyReportText, setDailyReportText] = useState('');
  const [dailyReportError, setDailyReportError] = useState('');
  const [doneByAssessmentId, setDoneByAssessmentId] = useState({});
  const navigate = useNavigate();

  const doneStorageKey = useMemo(() => {
    const patientId = String(id || '').trim();
    return patientId ? `patient-assessment-frontend:historyDone:${patientId}` : 'patient-assessment-frontend:historyDone:unknown';
  }, [id]);

  useEffect(() => {
    loadPatientAndAssessments();
  }, [id]);

  useEffect(() => {
    filterAssessments();
  }, [searchTerm, presetDate, singleDate, startDate, endDate, dateFilterType, statusFilter, allAssessments]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(doneStorageKey);
      const parsed = raw ? JSON.parse(raw) : {};
      setDoneByAssessmentId(parsed && typeof parsed === 'object' ? parsed : {});
    } catch {
      setDoneByAssessmentId({});
    }
  }, [doneStorageKey]);

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

      setDoneByAssessmentId((prev) => {
        const next = {};
        const current = prev && typeof prev === 'object' ? prev : {};
        patientAssessments.forEach((a) => {
          if (!a?.id) return;
          if (current[a.id]) next[a.id] = true;
        });
        try {
          localStorage.setItem(doneStorageKey, JSON.stringify(next));
        } catch {
          // ignore
        }
        return next;
      });
      
    } catch (error) {
      console.error('Error loading patient data:', error);
      toast.error('Failed to load patient history');
    } finally {
      setLoading(false);
    }
  };

  const isDone = (assessmentId) => Boolean(assessmentId && doneByAssessmentId && doneByAssessmentId[assessmentId]);

  const setDone = (assessmentId, done) => {
    if (!assessmentId) return;
    setDoneByAssessmentId((prev) => {
      const current = prev && typeof prev === 'object' ? prev : {};
      const next = { ...current, [assessmentId]: Boolean(done) };
      if (!done) delete next[assessmentId];
      try {
        localStorage.setItem(doneStorageKey, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleString();
    } catch (e) {
      return dateString;
    }
  };

  const getVitals = (assessment) => assessment?.vitals || assessment?.vitalSigns || assessment?.vitalSignsAssessment || null;
  const getRespiratory = (assessment) => assessment?.respiratory || null;
  const getInterventions = (assessment) => assessment?.interventions || null;
  const getSkin = (assessment) => assessment?.skin || null;
  const getMusculoskeletal = (assessment) => assessment?.musculoskeletal || assessment?.mobility?.musculoskeletal || null;

  const getDateKey = (dateString) => {
    if (!dateString) return null;
    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return null;
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const formatDateKeyForDisplay = (dateKey) => {
    if (!dateKey) return 'N/A';
    const [yyyy, mm, dd] = String(dateKey).split('-');
    const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
    if (Number.isNaN(d.getTime())) return dateKey;
    return d.toLocaleDateString();
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const replacePatientIdWithName = (text, patientInfo) => {
    if (!text) return text;
    if (!patientInfo || !patientInfo.id) return text;
    
    const patientName = patientInfo.fullName || 
                       `${patientInfo.firstName} ${patientInfo.lastName}` || 
                       'Patient';
    const patientId = patientInfo.id;
    
    let updatedText = text;
    
    if (patientId) {
      const regex = new RegExp(patientId, 'gi');
      updatedText = updatedText.replace(regex, patientName);
    }
    
    updatedText = updatedText.replace(/Patient Identification:/gi, 'Patient Name:');
    updatedText = updatedText.replace(/Patient ID:/gi, 'Patient Name:');
    updatedText = updatedText.replace(/\btrue\b/gi, 'Yes');
    updatedText = updatedText.replace(/\bfalse\b/gi, 'No');
    
    return updatedText;
  };

  const cleanMarkdownForCopy = (text) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/^[\*\-]\s+/gm, '• ')
      .replace(/\*/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  };

  const filterAssessments = () => {
    let filtered = [...allAssessments];
    
    if (searchTerm) {
      filtered = filtered.filter(assessment => 
        assessment.nurseNotes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getVitals(assessment)?.bloodPressure?.includes(searchTerm) ||
        String(getRespiratory(assessment)?.lungSounds || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
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
        const vitals = getVitals(assessment);
        const isCritical = 
          (vitals?.spO2 && vitals.spO2 < 90) ||
          (vitals?.pulseRate && vitals.pulseRate > 120) ||
          (vitals?.pulseRate && vitals.pulseRate < 60) ||
          (vitals?.respiratoryRate && vitals.respiratoryRate > 24) ||
          (vitals?.respiratoryRate && vitals.respiratoryRate < 12);
        
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

  const clearFilters = () => {
    setSearchTerm('');
    setDateFilterType('preset');
    setPresetDate('all');
    setSingleDate('');
    setStartDate('');
    setEndDate('');
    setStatusFilter('all');
  };

  const closeDailyModal = () => {
    setShowDailyModal(false);
    setDailyReportDateKey('');
    setDailyReportText('');
    setDailyReportError('');
    setLoadingDailyReport(false);
  };

  const buildDailyCombinedReportMarkdown = ({ patientInfo, dateKey, items }) => {
    const patientName =
      patientInfo?.fullName ||
      `${patientInfo?.firstName || ''} ${patientInfo?.lastName || ''}`.trim() ||
      'Patient';

    const assessments = [...items].sort((a, b) => {
      const aTime = new Date(a.assessment.assessmentDate).getTime();
      const bTime = new Date(b.assessment.assessmentDate).getTime();
      return aTime - bTime;
    });

    const criticalCount = assessments.filter(({ assessment }) => getStatusBadge(assessment) === 'critical').length;

    const numericValues = (val) => (typeof val === 'number' && !Number.isNaN(val) ? val : null);
    const spO2Values = assessments.map(({ assessment }) => numericValues(assessment?.vitals?.spO2)).filter((v) => v !== null);
    const pulseValues = assessments.map(({ assessment }) => numericValues(assessment?.vitals?.pulseRate)).filter((v) => v !== null);
    const rrValues = assessments.map(({ assessment }) => numericValues(assessment?.vitals?.respiratoryRate)).filter((v) => v !== null);
    const tempValues = assessments.map(({ assessment }) => numericValues(assessment?.vitals?.temperature)).filter((v) => v !== null);

    const min = (arr) => (arr.length ? Math.min(...arr) : null);
    const max = (arr) => (arr.length ? Math.max(...arr) : null);

    const lines = [];
    lines.push(`# Daily Clinical Assessment Report`);
    lines.push('');
    lines.push(`**Patient Name:** ${patientName}`);
    lines.push(`**Date:** ${formatDateKeyForDisplay(dateKey)}`);
    lines.push(`**Total Assessments:** ${assessments.length}`);
    lines.push(`**Critical Assessments:** ${criticalCount}`);
    lines.push('');
    lines.push('## Summary');
    lines.push('');
    if (spO2Values.length) lines.push(`- SpO2 range: ${min(spO2Values)}% – ${max(spO2Values)}%`);
    if (pulseValues.length) lines.push(`- Pulse range: ${min(pulseValues)} – ${max(pulseValues)} bpm`);
    if (rrValues.length) lines.push(`- Respiratory rate range: ${min(rrValues)} – ${max(rrValues)} /min`);
    if (tempValues.length) lines.push(`- Temperature range: ${min(tempValues)} – ${max(tempValues)} °C`);
    if (!spO2Values.length && !pulseValues.length && !rrValues.length && !tempValues.length) {
      lines.push('- Vital sign ranges unavailable (not recorded).');
    }
    lines.push('');
    lines.push('## Assessments (Chronological)');

    assessments.forEach(({ assessment, report }, idx) => {
      const status = getStatusBadge(assessment);
      const statusLabel = status === 'critical' ? 'Critical' : 'Stable';
      const timeLabel = formatTime(assessment.assessmentDate) || formatDate(assessment.assessmentDate);

      lines.push('');
      lines.push(`### ${timeLabel} — ${statusLabel}`);
      lines.push('');
      lines.push(`**Vital Signs:** ${getVitalSignsSummary(assessment)}`);
      lines.push(`**Skin:** ${getSkinSummary(assessment)}`);
      lines.push(`**Mobility:** ${getMobilitySummary(assessment)}`);
      if (assessment?.respiratory?.lungSounds) lines.push(`**Lung Sounds:** ${assessment.respiratory.lungSounds}`);
      if (assessment?.nurseNotes) lines.push(`**Nurse Notes:** ${assessment.nurseNotes}`);

      lines.push('');
      lines.push(report?.reportText || '_No AI report text available._');

      if (idx < assessments.length - 1) {
        lines.push('');
        lines.push('---');
      }
    });

    lines.push('');
    lines.push(`_Combined report generated on: ${new Date().toLocaleString()}_`);

    return lines.join('\n');
  };

  const generateDailyCombinedReport = async (dateKey, { keepModalOpen } = {}) => {
    const key = String(dateKey || '').trim();
    if (!key) {
      toast.error('Select a date to generate a daily report');
      return;
    }

    const dayAssessments = allAssessments.filter((a) => getDateKey(a?.assessmentDate) === key);
    if (dayAssessments.length === 0) {
      toast.error('No assessments found for that date');
      return;
    }

    const notDone = dayAssessments.filter((a) => !isDone(a?.id));
    if (notDone.length > 0) {
      toast.error(`Cannot generate daily report: ${notDone.length} assessment(s) not marked Done by the nurse`);
      return;
    }

    setDailyReportDateKey(key);
    setDailyReportError('');
    setDailyReportText('');
    setLoadingDailyReport(true);
    if (!keepModalOpen) setShowDailyModal(true);

    try {
      const items = await Promise.all(
        dayAssessments.map(async (assessment) => {
          const report = await assessmentService.getAssessmentReport(assessment.id);
          return { assessment, report };
        })
      );

      const combinedMarkdown = buildDailyCombinedReportMarkdown({
        patientInfo: patient,
        dateKey: key,
        items,
      });

      setDailyReportText(combinedMarkdown);
      toast.success('Daily report generated');
    } catch (error) {
      console.error('Error generating daily combined report:', error);
      setDailyReportError('Failed to generate daily report. Please try again.');
      toast.error('Failed to generate daily report');
    } finally {
      setLoadingDailyReport(false);
    }
  };

  const copyDailyReportToClipboard = async () => {
    if (!dailyReportText) {
      toast.error('No daily report content to copy');
      return;
    }

    try {
      const rendered = replacePatientIdWithName(dailyReportText, patient);
      const clean = cleanMarkdownForCopy(rendered);
      const header = `DAILY COMBINED ASSESSMENT REPORT\n${'='.repeat(50)}\n\n`;
      const footer = `\n\n${'='.repeat(50)}\nReport generated on: ${new Date().toLocaleString()}\n`;
      await navigator.clipboard.writeText(header + clean + footer);
      toast.success('✓ Daily report copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy daily report:', err);
      toast.error('Failed to copy daily report. Please try again.');
    }
  };

  const saveDailyReportToFile = () => {
    if (!dailyReportText) {
      toast.error('No daily report content to save');
      return;
    }

    try {
      const patientName =
        patient?.fullName ||
        `${patient?.firstName || ''} ${patient?.lastName || ''}`.trim() ||
        'patient';
      const safeName = patientName.replace(/[^a-z0-9\-_ ]/gi, '').trim().replace(/\s+/g, '_') || 'patient';
      const safeDate = (dailyReportDateKey || 'date').replace(/[^0-9\-]/g, '');
      const fileName = `daily_report_${safeName}_${safeDate}.md`;

      const blob = new Blob([dailyReportText], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Daily report saved');
    } catch (err) {
      console.error('Failed to save daily report:', err);
      toast.error('Failed to save daily report');
    }
  };

  const getVitalSignsSummary = (assessment) => {
    const vitalsData = getVitals(assessment);
    if (!vitalsData) return 'No vital signs recorded';
    
    const vitalParts = [];
    if (vitalsData.bloodPressure) vitalParts.push(`BP: ${vitalsData.bloodPressure}`);
    if (vitalsData.pulseRate && vitalsData.pulseRate !== 0) vitalParts.push(`Pulse: ${vitalsData.pulseRate}`);
    if (vitalsData.respiratoryRate && vitalsData.respiratoryRate !== 0) vitalParts.push(`RR: ${vitalsData.respiratoryRate}`);
    if (vitalsData.spO2 && vitalsData.spO2 !== 0) vitalParts.push(`SpO2: ${vitalsData.spO2}%`);
    if (vitalsData.temperature && vitalsData.temperature !== 0) vitalParts.push(`Temp: ${vitalsData.temperature}°C`);
    if (vitalsData.oxygenLitersPerMinute && vitalsData.oxygenLitersPerMinute !== 0) {
      vitalParts.push(`O2: ${vitalsData.oxygenLitersPerMinute} L/min`);
    }
    if (vitalsData.painScore !== undefined && vitalsData.painScore !== null && vitalsData.painScore !== 0) {
      vitalParts.push(`Pain: ${vitalsData.painScore}/10`);
    }
    
    return vitalParts.length > 0 ? vitalParts.join(' | ') : 'No vital signs recorded';
  };

  const getSkinSummary = (assessment) => {
    const skin = getSkin(assessment);
    if (!skin) return 'Not assessed';

    if (Array.isArray(skin.conditions)) {
      const conditions = skin.conditions.filter(Boolean);
      if (skin.otherCondition) conditions.push(skin.otherCondition);
      return conditions.length > 0 ? conditions.join(', ') : 'Normal';
    }
    
    const skinConditions = [];
    if (skin.warm) skinConditions.push('Warm');
    if (skin.dry) skinConditions.push('Dry');
    if (skin.pale) skinConditions.push('Pale');
    if (skin.cool) skinConditions.push('Cool');
    if (skin.hot) skinConditions.push('Hot');
    if (skin.flushed) skinConditions.push('Flushed');
    if (skin.cyanotic) skinConditions.push('Cyanotic');
    if (skin.clammy) skinConditions.push('Clammy');
    if (skin.jaundice) skinConditions.push('Jaundice');
    if (skin.diaphoretic) skinConditions.push('Diaphoretic');
    
    return skinConditions.length > 0 ? skinConditions.join(', ') : 'Normal';
  };

  const getMobilitySummary = (assessment) => {
    const ms = getMusculoskeletal(assessment);
    if (ms) {
      const parts = [];
      if (ms.mobility) parts.push(String(ms.mobility));
      if (Array.isArray(ms.devices) && ms.devices.length > 0) parts.push(`Devices: ${ms.devices.join(', ')}`);
      if (ms.otherDevice) parts.push(`Other device: ${ms.otherDevice}`);
      if (ms.otherMobility) parts.push(`Other: ${ms.otherMobility}`);
      return parts.length > 0 ? parts.join(' | ') : 'Not assessed';
    }

    const mobilityObj = assessment?.mobility;
    if (!mobilityObj) return 'Not assessed';
    
    const mobility = [];
    if (mobilityObj.gaitSteady) mobility.push('Steady Gait');
    if (mobilityObj.usesCane) mobility.push('Cane');
    if (mobilityObj.usesCrutches) mobility.push('Crutches');
    if (mobilityObj.usesWheelchair) mobility.push('Wheelchair');
    if (mobilityObj.bedridden) mobility.push('Bedridden');
    if (mobilityObj.requiresAssistance) mobility.push('Needs Assistance');
    
    return mobility.length > 0 ? mobility.join(', ') : 'Independent';
  };

  const getStatusBadge = (assessment) => {
    const vitals = getVitals(assessment);
    if (!vitals) return 'neutral';
    
    const hasCritical = 
      (vitals.spO2 && vitals.spO2 < 90) ||
      (vitals.pulseRate && vitals.pulseRate > 120) ||
      (vitals.pulseRate && vitals.pulseRate < 60) ||
      (vitals.respiratoryRate && vitals.respiratoryRate > 24) ||
      (vitals.respiratoryRate && vitals.respiratoryRate < 12);
    
    return hasCritical ? 'critical' : 'stable';
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
        <div style={styles.resultsActions}>
          {(searchTerm || dateFilterType !== 'preset' || presetDate !== 'all' || singleDate || startDate || endDate || statusFilter !== 'all') && (
            <button onClick={clearFilters} style={styles.clearSearchButton}>
              Clear all filters
            </button>
          )}
        </div>
      </div>

      {/* Assessment History Table */}
      <div style={styles.historySection}>
        <div style={styles.sectionHeaderRow}>
          <h3 style={styles.sectionTitle}>
            Assessment History 
            <span style={styles.badge}>{filteredAssessments.length} / {allAssessments.length}</span>
          </h3>

          {(() => {
            const selectedKey = String(singleDate || '').trim();
            const dayAssessments = selectedKey
              ? allAssessments.filter((a) => getDateKey(a?.assessmentDate) === selectedKey)
              : [];
            const notDoneCount = dayAssessments.filter((a) => !isDone(a?.id)).length;
            const disabled = !selectedKey || dayAssessments.length === 0 || notDoneCount > 0;
            const label = !selectedKey
              ? 'Select date to generate the report'
              : dayAssessments.length === 0
                ? 'No assessments for date'
                : notDoneCount > 0
                  ? `Mark ${notDoneCount} assessment(s) Done`
                  : 'Generate Daily Report';

            return (
              <div style={styles.dailyReportControls}>
                <input
                  type="date"
                  value={singleDate}
                  onChange={(e) => {
                    setDateFilterType('single');
                    setSingleDate(e.target.value);
                  }}
                  style={styles.dailyReportDateInput}
                  aria-label="Daily report date"
                />
                <button
                  onClick={() => generateDailyCombinedReport(singleDate)}
                  style={{
                    ...styles.dailyReportButton,
                    ...(disabled ? styles.dailyReportButtonDisabled : {}),
                  }}
                  disabled={disabled || loadingDailyReport}
                  title={disabled ? label : 'Combine all assessments for this date'}
                >
                  {loadingDailyReport ? 'Generating...' : `🗓️ ${label}`}
                </button>
              </div>
            );
          })()}
        </div>
        
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
                  <th style={styles.th}>Done</th>
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
                          {getVitals(assessment)?.oxygenGiven && 'Oxygen '}
                          {getInterventions(assessment)?.ivStarted && 'IV '}
                          {getInterventions(assessment)?.cprPerformed && 'CPR'}
                          {!getVitals(assessment)?.oxygenGiven && 
                           !getInterventions(assessment)?.ivStarted && 
                           !getInterventions(assessment)?.cprPerformed && 'None'}
                        </div>
                        {getRespiratory(assessment)?.lungSounds && (
                          <div style={styles.interventions}>
                            <strong>Lung Sounds:</strong> {String(getRespiratory(assessment).lungSounds)}
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
                        <label style={styles.doneLabel}>
                          <input
                            type="checkbox"
                            checked={isDone(assessment.id)}
                            onChange={(e) => setDone(assessment.id, e.target.checked)}
                          />
                          Done
                        </label>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Popup for Daily Combined Report */}
      {showDailyModal && (
        <div style={styles.modalOverlay} onClick={closeDailyModal}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>
                Daily Combined Report
                {dailyReportDateKey && (
                  <span style={styles.modalSubtitle}>
                    {formatDateKeyForDisplay(dailyReportDateKey)}
                  </span>
                )}
              </h3>
              <button onClick={closeDailyModal} style={styles.modalClose}>
                ×
              </button>
            </div>

            <div style={styles.modalBody}>
              {loadingDailyReport ? (
                <div style={styles.modalLoading}>
                  <div style={styles.spinner}></div>
                  <p>Generating daily report...</p>
                </div>
              ) : dailyReportError ? (
                <div style={styles.modalError}>
                  <p>{dailyReportError}</p>
                  <button
                    onClick={() => generateDailyCombinedReport(dailyReportDateKey, { keepModalOpen: true })}
                    style={styles.retryButton}
                  >
                    Retry
                  </button>
                </div>
              ) : dailyReportText ? (
                <div style={styles.modalReportText}>
                  <ReactMarkdown>
                    {replacePatientIdWithName(dailyReportText, patient)}
                  </ReactMarkdown>
                </div>
              ) : (
                <div style={styles.modalError}>
                  <p>No daily report available.</p>
                </div>
              )}
            </div>

            <div style={styles.modalActions}>
              <button
                onClick={copyDailyReportToClipboard}
                style={styles.copyButton}
                disabled={!dailyReportText}
              >
                📋 Copy
              </button>
              <button
                onClick={() => generateDailyCombinedReport(dailyReportDateKey, { keepModalOpen: true })}
                style={styles.printButton}
                disabled={!dailyReportDateKey || loadingDailyReport}
              >
                🔄 Regenerate
              </button>
              <button
                onClick={saveDailyReportToFile}
                style={styles.modalButton}
                disabled={!dailyReportText}
              >
                💾 Save
              </button>
              <button onClick={closeDailyModal} style={styles.modalButton}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

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
  resultsActions: {
    display: 'flex',
    gap: '0.75rem',
    alignItems: 'center',
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
  dailyReportButton: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    border: 'none',
    color: 'white',
    padding: '0.6rem 1rem',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '0.95rem',
    fontWeight: 600,
    transition: 'all 0.2s ease',
    whiteSpace: 'nowrap',
    boxShadow: '0 6px 14px rgba(0,0,0,0.12)',
  },
  dailyReportButtonDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  dailyReportDateInput: {
    padding: '0.55rem 0.75rem',
    borderRadius: '10px',
    border: '1px solid #ddd',
    backgroundColor: '#fff',
    fontSize: '0.95rem',
    height: '40px',
  },
  historySection: {
    background: 'white',
    borderRadius: '16px',
    padding: '1.5rem',
    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
    overflow: 'hidden',
  },
  sectionHeaderRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1rem',
    flexWrap: 'wrap',
    marginBottom: '1.5rem',
  },
  sectionTitle: {
    marginTop: 0,
    marginBottom: 0,
    color: '#2c3e50',
    fontSize: '1.2rem',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  dailyReportControls: {
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'center',
    flexWrap: 'wrap',
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
  doneLabel: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.875rem',
    color: '#2c3e50',
    userSelect: 'none',
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

export default PatientHistory;