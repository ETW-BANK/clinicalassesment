import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import assessmentService from '../../services/assessmentService';
import patientService from '../../services/patientService';
import toast from 'react-hot-toast';
import './AssessmentReport.css';

// ─── SECTION REGISTRY ────────────────────────────────────────────────────────
// All known section headings from BuildDeterministicReport.
// Narrative sections (prose) are identified separately below.
const TABLE_SECTIONS = new Set([
  'Patient & Assessment Metadata',
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
]);

const NARRATIVE_SECTIONS = new Set([
  'Clinical Summary',
  'Clinical Summary (AI)',
  'Nurse Notes (verbatim)',
  'Nurse Notes',
  'Nursing Analytical Note',
]);

const ALL_KNOWN = new Set([...TABLE_SECTIONS, ...NARRATIVE_SECTIONS]);

// ─── PARSER ──────────────────────────────────────────────────────────────────
// Parses the new two-part output:
//   Part 1: aligned table sections (key + value rows)
//   Part 2: prose narrative sections
//
// Returns an array of section objects:
//   { type: 'kv',        title, entries: [{key, value}] }
//   { type: 'diagnoses', title, items: [{category, description, icd10, primary}] }
//   { type: 'narrative', title, text }
const parseReport = (raw) => {
  const text = String(raw || '').replace(/\r\n/g, '\n').trim();
  if (!text) return [];

  const lines = text.split('\n');
  const sections = [];

  let currentTitle = null;
  let currentLines = [];

  const flush = () => {
    if (!currentTitle && currentLines.every((l) => !l.trim())) return;
    sections.push({ title: currentTitle, lines: [...currentLines] });
    currentLines = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();

    // Detect divider lines (── or ─── or ===) — skip them
    if (/^[─═\-]{4,}/.test(trimmed)) continue;

    // Detect a known section heading
    if (ALL_KNOWN.has(trimmed)) {
      flush();
      currentTitle = trimmed;
      continue;
    }

    currentLines.push(line);
  }
  flush();

  // Now interpret each raw section
  return sections
    .map((sec) => {
      const title = sec.title || '';
      const lines = sec.lines;

      // Narrative sections → prose text
      if (NARRATIVE_SECTIONS.has(title) || !title) {
        const text = lines
          .map((l) => String(l).trimEnd())
          .join('\n')
          .trim();
        return { type: 'narrative', title, text };
      }

      // Diagnoses → special card layout
      if (title === 'Diagnoses') {
        return { type: 'diagnoses', title, items: parseDiagnoses(lines) };
      }

      // Everything else → key-value table
      const entries = parseKvLines(lines);
      if (entries.length) return { type: 'kv', title, entries };

      // Fallback: render as narrative
      const text = lines.map((l) => String(l).trimEnd()).join('\n').trim();
      return { type: 'narrative', title, text };
    })
    .filter((s) => {
      if (!s) return false;
      if (s.type === 'kv') return s.entries.length > 0;
      if (s.type === 'diagnoses') return true;
      return Boolean(s.text?.trim());
    });
};

// Parses key-value lines from the new table format:
//   "  Field Name                    Value"   (padded, 2-space indent)
//   "Field: Value"                            (colon format fallback)
const parseKvLines = (lines) => {
  const entries = [];

  for (const line of lines) {
    if (!line.trim()) continue;

    // Skip lines that look like "  Field   Value" header rows
    const noIndent = line.trimStart();
    if (/^field\s+value$/i.test(noIndent.trim())) continue;

    // New padded format: at least 2 spaces of separation between key and value
    // The label column is ~36 chars wide in BuildDeterministicReport
    const paddedMatch = line.match(/^  (.{1,40}?)\s{2,}(.*)$/);
    if (paddedMatch) {
      const key = paddedMatch[1].trimEnd();
      const value = paddedMatch[2].trim();
      if (key && key !== 'Field') {
        entries.push({ key, value: cleanValue(value) });
      }
      continue;
    }

    // Colon-separated fallback: "Key: Value"
    const colonIdx = noIndent.indexOf(':');
    if (colonIdx > 0) {
      const key = noIndent.slice(0, colonIdx).trim();
      const value = noIndent.slice(colonIdx + 1).trim();
      if (key) entries.push({ key, value: cleanValue(value) });
    }
  }

  return entries;
};

// Parses the Diagnoses section which may have multiple diagnosis blocks
const parseDiagnoses = (lines) => {
  const items = [];
  let current = null;

  const push = () => { if (current) items.push(current); };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const colonIdx = trimmed.indexOf(':');
    if (colonIdx < 0) continue;

    const key = trimmed.slice(0, colonIdx).trim().toLowerCase();
    const val = trimmed.slice(colonIdx + 1).trim();

    if (key === 'category') {
      push();
      current = { category: val, description: '', icd10: '', primary: false };
    } else if (key === 'description' && current) {
      current.description = val;
    } else if (key === 'icd-10 code' && current) {
      current.icd10 = val;
    } else if (key === 'primary' && current) {
      current.primary = val.toLowerCase() === 'yes' || val.toLowerCase() === 'true';
    }
  }
  push();
  return items;
};

// Normalises display values
const cleanValue = (v) => {
  if (!v) return '';
  return v
    .replace(/\btrue\b/gi, 'Yes')
    .replace(/\bfalse\b/gi, 'No')
    .replace(/^\(not provided\)$/, '')
    .trim();
};

// ─── TEXT TRANSFORMS ──────────────────────────────────────────────────────────
const replacePatientIdWithName = (text, patientInfo) => {
  if (!text) return text;
  let t = text;

  const patientId = patientInfo?.id;
  const firstName = patientInfo?.firstName || '';
  const lastName = patientInfo?.lastName || '';
  const fallback = (firstName || lastName) ? `${firstName} ${lastName}`.trim() : 'Patient';
  const patientName = patientInfo?.fullName || fallback;

  if (patientId) {
    t = t.replace(new RegExp(patientId, 'gi'), patientName);
  }

  t = t.replace(/Patient Identification:/gi, 'Patient Name:');
  t = t.replace(/Patient ID:/gi, 'Patient Name:');
  t = t.replace(/\btrue\b/gi, 'Yes');
  t = t.replace(/\bfalse\b/gi, 'No');
  t = t.replace(/Clinical Summary\s*\(AI\)/gi, 'Clinical Summary');
  t = t.replace(/^\s*#{1,6}\s*AI\s*Report\s*$/gim, '');
  t = t.replace(/^\s*\*\*AI\s*Report\*\*\s*$/gim, '');
  t = t.replace(/^\s*AI\s*Report\s*$/gim, '');
  t = t.replace(/\n{3,}/g, '\n\n').trim();

  return t;
};

// ─── VALUE CLASSIFIER ────────────────────────────────────────────────────────
// Returns a CSS modifier class based on clinical significance
const getValueClass = (key, value) => {
  const k = (key || '').toLowerCase();
  const v = (value || '').toLowerCase();

  if (!v || v === 'not provided' || v === '—' || v === '') return 'muted';

  // Critical flags
  if (k.includes('spo') && parseFloat(v) < 90) return 'critical';
  if (k.includes('pulse') && (parseFloat(v) < 40 || parseFloat(v) > 120)) return 'critical';
  if (k.includes('pain score') && parseFloat(v) >= 8) return 'critical';
  if (k.includes('prognosis') && v === 'yes') return 'warning';
  if (k.includes('cpr') && v === 'yes') return 'critical';

  // Warning flags
  if (k.includes('spo') && parseFloat(v) < 94) return 'warning';
  if (k.includes('pain score') && parseFloat(v) >= 6) return 'warning';
  if (k.includes('temperature') && parseFloat(v) > 38.3) return 'warning';
  if ((k.includes('crackle') || v.includes('crackle')) ) return 'warning';

  // Positive
  if (k.includes('iv started') && v === 'yes') return 'ok';

  return 'normal';
};

// ─── SECTION ICON MAP ─────────────────────────────────────────────────────────
const SECTION_ICONS = {
  'Vital Signs': '♥',
  'Neurological Status': '◎',
  'Skin Conditions': '◈',
  'Respiratory Assessment': '◉',
  'Mobility Assessment': '△',
  'Gastrointestinal Assessment': '◧',
  'Genitourinary Assessment': '◫',
  'Pain Details': '◆',
  'Diagnoses': '✦',
  'Hospice Eligibility': '◐',
  'Interventions': '✚',
  'Patient & Assessment Metadata': '◻',
  'Patient Identification': '◻',
  'Assessment Metadata': '◻',
  'Clinical Summary': '❡',
  'Nurse Notes (verbatim)': '✎',
  'Nurse Notes': '✎',
};

const getIcon = (title) => SECTION_ICONS[title] || '◈';
const formatTitle = (t) => t?.replace('(verbatim)', '').replace('(AI)', '').trim() || '';

// ─── COMPONENT ────────────────────────────────────────────────────────────────
const AssessmentReport = () => {
  const { id } = useParams();
  const [assessment, setAssessment] = useState(null);
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => { loadAssessmentAndPatient(); }, [id]);

  const loadAssessmentAndPatient = async () => {
    try {
      setLoading(true);
      setError(null);
      const assessmentData = await assessmentService.getAssessmentById(id);
      setAssessment(assessmentData);
      const patientId = assessmentData?.patientId || assessmentData?.patient?.id;
      if (patientId) {
        const patientData = await patientService.getPatientById(patientId);
        setPatient(patientData);
      }
    } catch (err) {
      setError(err);
      toast.error(err.response?.data?.message || 'Failed to load assessment');
    } finally {
      setLoading(false);
    }
  };

  const copyReportToClipboard = async () => {
    const reportText = assessment?.aiReport?.reportText;
    if (!reportText) { toast.error('No report content to copy'); return; }
    try {
      let clean = replacePatientIdWithName(reportText, patient);
      clean = clean.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1')
        .replace(/^#{1,6}\s+/gm, '').replace(/\n{3,}/g, '\n\n').trim();
      const header = `PATIENT CLINICAL ASSESSMENT REPORT\n${'='.repeat(50)}\n\n`;
      const footer = `\n\n${'='.repeat(50)}\nCopied on: ${new Date().toLocaleString()}\n`;
      await navigator.clipboard.writeText(header + clean + footer);
      toast.success('Report copied to clipboard');
    } catch {
      toast.error('Failed to copy report');
    }
  };

  // ── Loading ──
  if (loading) return (
    <div className="ar-container">
      <div className="ar-state-box">
        <div className="ar-spinner" />
        <p className="ar-state-label">Loading assessment report…</p>
      </div>
    </div>
  );

  // ── Error ──
  if (error) return (
    <div className="ar-container">
      <div className="ar-state-box">
        <div className="ar-state-icon">⚠</div>
        <h3 className="ar-state-title">Unable to Load Report</h3>
        <p className="ar-state-msg">{error.response?.data?.message || 'An error occurred while loading the assessment.'}</p>
        <div className="ar-btn-group">
          <button onClick={loadAssessmentAndPatient} className="ar-btn ar-btn--primary">Retry</button>
          <button onClick={() => navigate('/patients')} className="ar-btn ar-btn--ghost">Back to Patients</button>
        </div>
      </div>
    </div>
  );

  if (!assessment) return (
    <div className="ar-container">
      <div className="ar-state-box">
        <p className="ar-state-msg">No report data available.</p>
        <button onClick={() => navigate('/patients')} className="ar-btn ar-btn--ghost">Back to Patients</button>
      </div>
    </div>
  );

  const reportText = assessment?.aiReport?.reportText || '';
  const generatedAt = assessment?.aiReport?.generatedAt;
  const displayText = reportText ? replacePatientIdWithName(reportText, patient) : '';
  const sections = parseReport(displayText);

  // Separate table sections from narrative sections for layout
  const tableSections = sections.filter((s) => s.type === 'kv' || s.type === 'diagnoses');
  const narrativeSections = sections.filter((s) => s.type === 'narrative');

  return (
    <div className="ar-container">
      <div className="ar-shell">

        {/* ── Header bar ── */}
        <div className="ar-header">
          <button onClick={() => navigate('/patients')} className="ar-btn ar-btn--back">
            ← Back
          </button>
          <div className="ar-header-actions ar-no-print">
            <button onClick={copyReportToClipboard} className="ar-btn ar-btn--copy">Copy report</button>
            <button onClick={() => window.print()} className="ar-btn ar-btn--print">Print</button>
          </div>
        </div>

        {/* ── Patient banner ── */}
        {patient && (
          <div className="ar-patient-bar">
            <div className="ar-avatar">
              {(patient.fullName || patient.firstName || 'P').charAt(0).toUpperCase()}
            </div>
            <div className="ar-patient-info">
              <h2 className="ar-patient-name">
                {patient.fullName || `${patient.firstName || ''} ${patient.lastName || ''}`.trim()}
              </h2>
              <div className="ar-patient-meta">
                {patient.email && <span>{patient.email}</span>}
                {patient.phone && <span>{patient.phone}</span>}
                {patient.dateOfBirth && (
                  <span>DOB: {new Date(patient.dateOfBirth).toLocaleDateString()}</span>
                )}
              </div>
            </div>
          </div>
        )}

        {reportText ? (
          <div className="ar-body">

            {/* ══ PART 1: TABLE SECTIONS ══════════════════════════════════ */}
            {tableSections.length > 0 && (
              <div className="ar-part">
                <div className="ar-part-label">Assessment data</div>
                <div className="ar-table-grid">
                  {tableSections.map((sec, i) => (
                    <SectionCard key={`${sec.title}-${i}`} section={sec} index={i} />
                  ))}
                </div>
              </div>
            )}

            {/* ══ PART 2: NARRATIVE SECTIONS ══════════════════════════════ */}
            {narrativeSections.length > 0 && (
              <div className="ar-part">
                <div className="ar-part-label">Clinical summary</div>
                {narrativeSections.map((sec, i) => (
                  <NarrativeCard key={`${sec.title}-${i}`} section={sec} index={i} />
                ))}
              </div>
            )}

          </div>
        ) : (
          <div className="ar-state-box" style={{ margin: '2rem' }}>
            <p className="ar-state-msg">This assessment does not have a report yet.</p>
            <p className="ar-state-hint">Generate it from Patient History using the "Generate report" button.</p>
            <button
              onClick={() => navigate(`/patients/${assessment?.patientId}/history`)}
              className="ar-btn ar-btn--primary"
              disabled={!assessment?.patientId}
            >
              Go to Patient History
            </button>
          </div>
        )}

        {/* ── Footer ── */}
        {generatedAt && (
          <div className="ar-footer">
            Generated: {new Date(generatedAt).toLocaleString()}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── SECTION CARD ─────────────────────────────────────────────────────────────
// Renders a kv or diagnoses section as a card with a table inside
const SectionCard = ({ section, index }) => {
  if (section.type === 'diagnoses') return <DiagnosesCard section={section} index={index} />;

  return (
    <div className="ar-card" style={{ animationDelay: `${index * 40}ms` }}>
      <div className="ar-card-header">
        <span className="ar-card-icon" aria-hidden="true">{getIcon(section.title)}</span>
        <h3 className="ar-card-title">{formatTitle(section.title)}</h3>
      </div>
      <table className="ar-kv-table">
        <tbody>
          {section.entries.map((e, i) => {
            const cls = getValueClass(e.key, e.value);
            const isEmpty = !e.value || e.value === '(not provided)';
            return (
              <tr key={`${e.key}-${i}`} className="ar-kv-row">
                <td className="ar-kv-label">{e.key}</td>
                <td className={`ar-kv-value ar-kv-value--${cls}`}>
                  {isEmpty ? <span className="ar-kv-empty">—</span> : e.value}
                  {cls === 'critical' && <span className="ar-flag ar-flag--crit">critical</span>}
                  {cls === 'warning'  && <span className="ar-flag ar-flag--warn">review</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

// ─── DIAGNOSES CARD ───────────────────────────────────────────────────────────
const DiagnosesCard = ({ section, index }) => (
  <div className="ar-card ar-card--full" style={{ animationDelay: `${index * 40}ms` }}>
    <div className="ar-card-header">
      <span className="ar-card-icon" aria-hidden="true">{getIcon(section.title)}</span>
      <h3 className="ar-card-title">{formatTitle(section.title)}</h3>
    </div>
    {section.items.length ? (
      <div className="ar-dx-grid">
        {section.items.map((item, i) => (
          <div key={i} className={`ar-dx-item ${item.primary ? 'ar-dx-item--primary' : ''}`}>
            <div className="ar-dx-top">
              <span className="ar-dx-category">{item.category || 'Diagnosis'}</span>
              {item.primary && <span className="ar-badge ar-badge--primary">Primary</span>}
            </div>
            {item.description && <p className="ar-dx-desc">{item.description}</p>}
            {item.icd10 && (
              <p className="ar-dx-icd">
                <span className="ar-dx-icd-label">ICD-10</span>
                {item.icd10}
              </p>
            )}
          </div>
        ))}
      </div>
    ) : (
      <p className="ar-kv-empty" style={{ padding: '12px 0' }}>No diagnoses documented.</p>
    )}
  </div>
);

// ─── NARRATIVE CARD ───────────────────────────────────────────────────────────
// Renders the prose clinical summary as an editorial article block
const NarrativeCard = ({ section, index }) => {
  const isNurseNote = section.title?.toLowerCase().startsWith('nurse note');

  // Split into paragraphs respecting the quoted nurse-note block
  const paragraphs = section.text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <div
      className={`ar-narrative ${isNurseNote ? 'ar-narrative--note' : ''}`}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {section.title && (
        <div className="ar-narrative-header">
          <span className="ar-card-icon" aria-hidden="true">{getIcon(section.title)}</span>
          <h3 className="ar-narrative-title">{formatTitle(section.title)}</h3>
        </div>
      )}
      <div className="ar-narrative-body">
        {paragraphs.map((para, i) => {
          // Detect quoted nurse note (starts with " or is wrapped in quotes)
          const isQuote = /^[""]/.test(para) || /^"/.test(para);
          return isQuote
            ? <blockquote key={i} className="ar-quote">{para.replace(/^[""]|[""]$/g, '').replace(/^"|"$/g, '')}</blockquote>
            : <p key={i} className="ar-para">{para}</p>;
        })}
      </div>
    </div>
  );
};

export default AssessmentReport;
