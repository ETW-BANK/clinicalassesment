import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import assessmentService from '../../services/assessmentService';
import patientService from '../../services/patientService';
import toast from 'react-hot-toast';
import './AssessmentReport.css';

const looksLikeMarkdown = (text) => {
  if (!text) return false;
  return /(^|\n)\s*#{1,6}\s+\S/.test(text) || /\*\*[^*]+\*\*/.test(text) || /(^|\n)\s*[-*]\s+\S/.test(text);
};

const parsePlainReportText = (text) => {
  const normalized = String(text || '').replace(/\r\n/g, '\n').trim();
  if (!normalized) return [];

  const KNOWN_SECTION_TITLES = new Set([
    'Assessment',
    'Patient Identification',
    'Assessment Metadata',
    'Vital Signs',
    'Interventions',
    'Neurological Status',
    'Skin Conditions',
    'Skin Condition',
    'Respiratory Assessment',
    'Mobility Assessment',
    'Gastrointestinal Assessment',
    'Genitourinary Assessment',
    'Pain Details',
    'Diagnoses',
    'Hospice Eligibility',
    'Nurse Notes (verbatim)',
    'Clinical Summary (AI)',
    'Clinical Summary',
  ]);

  const isSectionTitle = (line) => KNOWN_SECTION_TITLES.has(String(line || '').trim());
  const isIgnorable = (line) => !String(line || '').trim();

  const lines = normalized.split('\n');

  // Split into sections by known titles.
  const rawSections = [];
  let currentTitle = null;
  let currentLines = [];

  const pushSection = () => {
    const cleaned = currentLines
      .map((l) => String(l ?? '').replace(/\s+$/g, ''))
      .filter((l) => l !== undefined);
    if (cleaned.some((l) => String(l).trim() !== '')) {
      rawSections.push({ title: currentTitle, lines: cleaned });
    }
  };

  for (const line of lines) {
    const trimmed = String(line || '').trim();
    if (isSectionTitle(trimmed)) {
      pushSection();
      currentTitle = trimmed;
      currentLines = [];
      continue;
    }
    currentLines.push(line);
  }
  pushSection();

  const splitInlineKeyValues = (line) => {
    const textLine = String(line || '').trim();
    const matches = [];
    if (!textLine.includes(':')) return matches;

    // Best-effort: parse repeated "Key: Value" segments on the same line.
    // Example: "Blood Pressure: 120/80 Pulse Rate: 15 Respiratory Rate: 14"
    const pattern = /([A-Za-z0-9][A-Za-z0-9\s()≤\/%\-\.]+?):\s*(.*?)(?=\s+[A-Za-z0-9][A-Za-z0-9\s()≤\/%\-\.]+?:|$)/g;
    let m;
    while ((m = pattern.exec(textLine)) !== null) {
      const key = String(m[1] || '').trim();
      const value = String(m[2] || '').trim();
      if (key) matches.push({ key, value });
    }
    return matches;
  };

  const parseEntriesFromLines = (sectionLines) => {
    const cleaned = sectionLines.map((l) => String(l || '')).filter((l) => l !== undefined);
    const entries = [];
    const leftovers = [];

    for (let i = 0; i < cleaned.length; i++) {
      const line = cleaned[i];
      const trimmed = line.trim();
      if (isIgnorable(trimmed)) continue;

      const inlinePairs = splitInlineKeyValues(trimmed);
      if (inlinePairs.length >= 2) {
        entries.push(...inlinePairs);
        continue;
      }

      const colonIdx = trimmed.indexOf(':');
      if (colonIdx > 0) {
        const key = trimmed.slice(0, colonIdx).trim();
        const value = trimmed.slice(colonIdx + 1).trim();
        if (key) entries.push({ key, value });
        continue;
      }

      // Key on one line, value on the next line (your current report format)
      let j = i + 1;
      while (j < cleaned.length && isIgnorable(cleaned[j])) j++;
      const nextTrimmed = j < cleaned.length ? cleaned[j].trim() : '';

      if (nextTrimmed && !isSectionTitle(nextTrimmed)) {
        entries.push({ key: trimmed, value: nextTrimmed });
        i = j;
        continue;
      }

      leftovers.push(trimmed);
    }

    return { entries, leftovers };
  };

  const parseDiagnoses = (sectionLines) => {
    const cleaned = sectionLines.map((l) => String(l || '')).filter((l) => l !== undefined);
    const items = [];
    let current = null;

    const startNew = (category) => {
      current = {
        category: category || 'Diagnosis',
        description: '',
        icd10: '',
        primary: false,
      };
      items.push(current);
    };

    for (let i = 0; i < cleaned.length; i++) {
      const trimmed = cleaned[i].trim();
      if (isIgnorable(trimmed)) continue;

      // Inline "ICD-10: X" line
      if (/^icd-10\s*:/i.test(trimmed)) {
        const val = trimmed.split(':').slice(1).join(':').trim();
        if (!current) startNew('Diagnosis');
        current.icd10 = val;
        continue;
      }

      // Primary line followed by description
      if (trimmed.toLowerCase() === 'primary') {
        if (!current) startNew('Diagnosis');
        current.primary = true;

        let j = i + 1;
        while (j < cleaned.length && isIgnorable(cleaned[j])) j++;
        const nextTrimmed = j < cleaned.length ? cleaned[j].trim() : '';
        if (nextTrimmed && !nextTrimmed.includes(':') && nextTrimmed.toLowerCase() !== 'primary') {
          if (!current.description) current.description = nextTrimmed;
          i = j;
        }
        continue;
      }

      // Anything else without a colon is usually the category name (Cancer / HeartDisease / etc)
      if (!trimmed.includes(':')) {
        const shouldStartNew = !current || current.description || current.icd10 || current.primary;
        if (shouldStartNew) {
          startNew(trimmed);
        } else if (!current.description) {
          current.description = trimmed;
        }
        continue;
      }

      // Generic key:value line inside diagnoses (best-effort)
      const idx = trimmed.indexOf(':');
      if (idx > 0) {
        const key = trimmed.slice(0, idx).trim().toLowerCase();
        const value = trimmed.slice(idx + 1).trim();
        if (!current) startNew('Diagnosis');
        if (key.includes('icd-10')) current.icd10 = value;
        if (key === 'description' && !current.description) current.description = value;
      }
    }

    return items;
  };

  const sections = [];
  rawSections.forEach((raw, idx) => {
    const title = raw.title || 'Assessment';
    const content = (raw.lines || []).filter((l) => l !== undefined);

    if (String(title).toLowerCase() === 'diagnoses') {
      sections.push({ type: 'diagnoses', title, items: parseDiagnoses(content) });
      return;
    }

    // Notes blocks should remain paragraph-like.
    if (String(title).toLowerCase().startsWith('nurse notes') || String(title).toLowerCase().startsWith('clinical summary')) {
      const textBlock = content.map((l) => String(l || '')).join('\n').trim();
      sections.push({ type: 'text', title, text: textBlock });
      return;
    }

    const { entries, leftovers } = parseEntriesFromLines(content);
    if (entries.length) {
      sections.push({ type: 'kv', title, entries });
    } else {
      const textBlock = leftovers.join('\n').trim();
      sections.push({ type: 'text', title: idx === 0 ? title : title, text: textBlock });
    }
  });

  return sections.filter((s) => {
    if (s.type === 'kv') return (s.entries || []).length > 0;
    if (s.type === 'diagnoses') return true;
    return Boolean(String(s.text || '').trim());
  });
};

const AssessmentReport = () => {
  const { id } = useParams();
  const [assessment, setAssessment] = useState(null);
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadAssessmentAndPatient();
  }, [id]);

  const loadAssessmentAndPatient = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching assessment (no AI generation) for ID:', id);
      const assessmentData = await assessmentService.getAssessmentById(id);
      setAssessment(assessmentData);

      const patientId = assessmentData?.patientId || assessmentData?.patient?.id;
      if (patientId) {
        const patientData = await patientService.getPatientById(patientId);
        setPatient(patientData);
      }
    } catch (error) {
      console.error('Error loading report:', error);
      setError(error);
      
      if (error.code === 'ERR_NETWORK') {
        toast.error('Network error. Please check your connection.');
      } else {
        toast.error(error.response?.data?.message || 'Failed to load assessment');
      }
    } finally {
      setLoading(false);
    }
  };

const replacePatientIdWithName = (text, patientInfo) => {
  if (!text) return text;

  let updatedText = text;

  const patientId = patientInfo?.id;
  const firstName = patientInfo?.firstName || '';
  const lastName = patientInfo?.lastName || '';
  const fallbackName = (firstName || lastName) ? `${firstName} ${lastName}`.trim() : 'Patient';
  const patientName = patientInfo?.fullName || fallbackName;

  // Replace the patient ID with the full name (case insensitive)
  if (patientId) {
    const regex = new RegExp(patientId, 'gi');
    updatedText = updatedText.replace(regex, patientName);
  }
  
  // Replace "Patient Identification:" with "Patient Name:"
  updatedText = updatedText.replace(/Patient Identification:/gi, 'Patient Name:');
  updatedText = updatedText.replace(/Patient ID:/gi, 'Patient Name:');
  
  // Replace true/false with Yes/No (case insensitive)
  updatedText = updatedText.replace(/\btrue\b/gi, 'Yes');
  updatedText = updatedText.replace(/\bfalse\b/gi, 'No');

  // Remove AI label from section heading (presentation only)
  updatedText = updatedText.replace(/Clinical Summary\s*\(AI\)/gi, 'Clinical Summary');

  // Remove any top-level label/title like "AI Report" from the generated markdown
  updatedText = updatedText
    .replace(/^\s*#{1,6}\s*AI\s*Report\s*$/gim, '')
    .replace(/^\s*\*\*AI\s*Report\*\*\s*$/gim, '')
    .replace(/^\s*AI\s*Report\s*$/gim, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  
  return updatedText;
};

  const copyReportToClipboard = async () => {
    const reportText = assessment?.aiReport?.reportText;
    if (!reportText) {
      toast.error('No report content to copy');
      return;
    }

    try {
      let cleanReport = replacePatientIdWithName(reportText, patient);

      cleanReport = cleanReport
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/^#{1,6}\s+/gm, '')
        .replace(/^[\*\-]\s+/gm, '• ')
        .replace(/\*/g, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim();

      const header = `PATIENT CLINICAL ASSESSMENT REPORT\n${'='.repeat(50)}\n\n`;
      const footer = `\n\n${'='.repeat(50)}\nCopied on: ${new Date().toLocaleString()}\n`;
      await navigator.clipboard.writeText(header + cleanReport + footer);
      toast.success('✓ Report copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy:', err);
      toast.error('Failed to copy report. Please try again.');
    }
  };

  const handleRetry = () => {
    loadAssessmentAndPatient();
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
          <p>Loading assessment report...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.errorContainer}>
          <div style={styles.errorIcon}>⚠️</div>
          <h3 style={styles.errorTitle}>Unable to Load Report</h3>
          <p style={styles.errorMessage}>
            {error.response?.data?.message || 'An error occurred while loading the assessment.'}
          </p>
          <div style={styles.buttonGroup}>
            <button onClick={handleRetry} style={styles.retryButton}>
              Retry
            </button>
            <button onClick={() => navigate('/patients')} style={styles.backButton}>
              Back to Patients
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div style={styles.container}>
        <div style={styles.errorContainer}>
          <p>No report data available.</p>
          <button onClick={() => navigate('/patients')} style={styles.backButton}>
            Back to Patients
          </button>
        </div>
      </div>
    );
  }

  const reportText = assessment?.aiReport?.reportText || '';
  const generatedAt = assessment?.aiReport?.generatedAt;
  const displayText = reportText ? replacePatientIdWithName(reportText, patient) : '';
  const parsedPlainSections = parsePlainReportText(displayText);
  const usePlain = parsedPlainSections.length > 0;
  const asMarkdown = !usePlain && looksLikeMarkdown(displayText);
  const plainSections = usePlain ? parsedPlainSections : [];
  const formatSectionTitle = (title) => {
    if (!title) return '';
    if (String(title).toLowerCase() === 'clinical summary (ai)') return 'Clinical Summary';
    return title;
  };

  const renderKvValue = (value) => {
    const text = (value ?? '').toString();
    const lowered = text.trim().toLowerCase();
    const isMissing = !text.trim() || lowered === 'not provided' || lowered === '—';
    return <span className={isMissing ? 'assessmentReportMuted' : undefined}>{text.trim() || '—'}</span>;
  };

  return (
    <div style={styles.container}>
      <div style={styles.reportContainer}>
        <div style={styles.header}>
          <button onClick={() => navigate('/patients')} style={styles.backButton}>
            ← Back to Patients
          </button>
            <div style={styles.headerActions} className="assessmentReportNoPrint">
            <button onClick={copyReportToClipboard} style={styles.copyButton}>
              📋 Copy Report
            </button>
            <button onClick={() => window.print()} style={styles.printButton}>
              🖨️ Print Report
            </button>
          </div>
        </div>
        
        {patient && (
          <div style={styles.patientInfoBar}>
            <div style={styles.patientAvatar}>
              {patient.fullName?.charAt(0) || patient.firstName?.charAt(0) || 'P'}
            </div>
            <div>
              <h3 style={styles.patientName}>{patient.fullName || `${patient.firstName} ${patient.lastName}`}</h3>
              <p style={styles.patientDetails}>
                {patient.email && <span>📧 {patient.email}</span>}
                {patient.phone && <span>📞 {patient.phone}</span>}
                {patient.dateOfBirth && <span>🎂 {new Date(patient.dateOfBirth).toLocaleDateString()}</span>}
              </p>
            </div>
          </div>
        )}

        {reportText ? (
          asMarkdown ? (
            <div style={styles.report} className="assessmentReportMarkdown">
              <ReactMarkdown>{displayText}</ReactMarkdown>
            </div>
          ) : (
            <div style={styles.report} className="assessmentReportPlain">
              {plainSections.map((section, idx) => {
                if (section.type === 'kv') {
                  return (
                    <section key={`${section.title}-${idx}`} className="assessmentReportSection">
                      <h2 className="assessmentReportSectionTitle">{formatSectionTitle(section.title)}</h2>
                      <div className="assessmentReportKvGrid">
                        {(section.entries || []).map((e) => (
                          <div key={`${e.key}-${e.value}`} className="assessmentReportKvItem">
                            <div className="assessmentReportKvLabel">{e.key}</div>
                            <div className="assessmentReportKvValue">{renderKvValue(e.value)}</div>
                          </div>
                        ))}
                      </div>
                    </section>
                  );
                }

                if (section.type === 'diagnoses') {
                  return (
                    <section key={`${section.title}-${idx}`} className="assessmentReportSection">
                      <h2 className="assessmentReportSectionTitle">{formatSectionTitle(section.title)}</h2>
                      {(section.items || []).length ? (
                        <div className="assessmentReportCards">
                          {(section.items || []).map((item, itemIdx) => (
                            <div key={`${item.category}-${itemIdx}`} className="assessmentReportCard">
                              <div className="assessmentReportCardTitle">
                                <div className="assessmentReportCardHeading">{item.category || 'Diagnosis'}</div>
                                {item.primary ? (
                                  <span className="assessmentReportBadge">Primary</span>
                                ) : null}
                              </div>

                              <div className="assessmentReportCardBody">
                                {item.description ? (
                                  <p className="assessmentReportCardText">{item.description}</p>
                                ) : null}
                                {item.icd10 ? (
                                  <p className="assessmentReportMeta">
                                    <strong>ICD-10:</strong> {item.icd10}
                                  </p>
                                ) : null}
                                {!item.icd10 && !item.description ? (
                                  <p className="assessmentReportMeta">—</p>
                                ) : null}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="assessmentReportParagraph">No diagnoses documented.</p>
                      )}
                    </section>
                  );
                }

                if (section.type === 'text') {
                  if (!section.title) {
                    return (
                      <p key={`p-${idx}`} className="assessmentReportParagraph">
                        {section.text}
                      </p>
                    );
                  }

                  return (
                    <section key={`${section.title}-${idx}`} className="assessmentReportSection">
                      <h2 className="assessmentReportSectionTitle">{formatSectionTitle(section.title)}</h2>
                      <p className="assessmentReportParagraph">{section.text}</p>
                    </section>
                  );
                }

                return null;
              })}
            </div>
          )
        ) : (
          <div style={styles.errorContainer}>
            <p>This assessment does not have an AI report yet.</p>
            <p style={styles.smallText}>
              Generate the report from Patient History using the "Generate report" button.
            </p>
            <button
              onClick={() => navigate(`/patients/${assessment?.patientId}/history`)}
              style={styles.retryButton}
              disabled={!assessment?.patientId}
            >
              Go to Patient History
            </button>
          </div>
        )}
        
        {generatedAt && (
          <div style={styles.footer}>
            <p style={styles.metadata}>
              <strong>Generated:</strong> {new Date(generatedAt).toLocaleString()}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '1280px',
    margin: '0 auto',
    padding: 'clamp(1rem, 2.5vw, 2.5rem)',
    minHeight: 'calc(100vh - 70px)',
    background: 'transparent',
  },
  reportContainer: {
    backgroundColor: 'white',
    borderRadius: '16px',
    boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
    overflow: 'hidden',
    animation: 'slideUp 0.5s ease',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 2rem',
    backgroundColor: 'var(--white-color)',
    borderBottom: '1px solid var(--border-color)',
  },
  backButton: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#667eea',
    cursor: 'pointer',
    padding: '0.5rem 1rem',
    fontSize: '1rem',
    fontWeight: '500',
    borderRadius: '8px',
    transition: 'all 0.3s ease',
  },
  headerActions: {
    display: 'flex',
    gap: '0.5rem',
  },
  copyButton: {
    padding: '0.5rem 1rem',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    transition: 'all 0.3s ease',
  },
  printButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#27ae60',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    transition: 'all 0.3s ease',
  },
  patientInfoBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '1.5rem 2rem',
    background: 'var(--white-color)',
    borderBottom: '1px solid var(--border-color)',
  },
  patientAvatar: {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: 'white',
  },
  patientName: {
    margin: 0,
    fontSize: '1.25rem',
    color: '#2c3e50',
  },
  patientDetails: {
    margin: '0.25rem 0 0 0',
    fontSize: '0.875rem',
    color: '#666',
    display: 'flex',
    gap: '1rem',
    flexWrap: 'wrap',
  },
  report: {
    padding: 'clamp(1.25rem, 2.5vw, 2.5rem)',
    lineHeight: '1.65',
    fontFamily: "'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif",
  },
  footer: {
    padding: '1rem 2rem',
    backgroundColor: 'var(--white-color)',
    borderTop: '1px solid var(--border-color)',
    fontSize: '0.875rem',
    color: 'var(--gray-color)',
  },
  metadata: {
    margin: 0,
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
    width: '50px',
    height: '50px',
    border: '3px solid #f3f3f3',
    borderTop: '3px solid #667eea',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '1rem',
  },
  smallText: {
    fontSize: '0.875rem',
    color: '#999',
    marginTop: '0.5rem',
  },
  errorContainer: {
    textAlign: 'center',
    padding: '3rem',
    backgroundColor: 'white',
    borderRadius: '16px',
  },
  errorIcon: {
    fontSize: '4rem',
    marginBottom: '1rem',
  },
  errorTitle: {
    color: '#e74c3c',
    marginBottom: '1rem',
  },
  errorMessage: {
    color: '#666',
    marginBottom: '2rem',
  },
  buttonGroup: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'center',
  },
  retryButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '1rem',
    transition: 'all 0.3s ease',
  },
};

export default AssessmentReport;