import React, { useState, useEffect } from 'react';

const INITIAL_STATE = {
  newsEvent: '',
  htfBias: '',
  reasons: [],
  sessionChecks: { mentallyReady: false },
  stage1: { 
    narrative: '', 
    pdArray: [], 
    htfPdArray: []
  },
  stage2: { 
    stage1Smt: [],  // Stage 2: MC SMT, WC SMT, DC SMT, 90M SMT
    psp: [],        // HTF PSP (4H PSP, 1D PSP)
    cleanTargets: []// Clean Target
  },
  stage3: {
    stage2Smt: [],  // Stage 3 SMT
    ltfPsp: [],     // LTF PSP (1H PSP, M15 PSP, M5 PSP)
    entryMechanics: [], // Entry Mechanics
    riskManagement: {
      riskLimit: '', // '0.5%' or '1%'
      stopLossDefined: false,
      targetRatio: false,
      partialsTarget: false
    }
  },
  journalNotes: ''
};

// 📜 GOOGLE APPS SCRIPT CODE FOR USER
const GOOGLE_SCRIPT_CODE = `function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);
    
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "Timestamp", "Pre-Market Bias", "Reasons", "Mentally Ready",
        "HTF Narrative", "Premium/Discount", "HTF PD Array",
        "Stage 1 SMT Label", "Stage 1 SMT", "HTF PSP", "Clean Targets",
        "Stage 2 SMT Label", "Stage 2 SMT", "LTF PSP",
        "Entry Mechanics", "Risk Limit", "StopLoss Defined",
        "Target Ratio", "Partials Target", "Journal Notes"
      ]);
    }

    sheet.appendRow([
      data.timestamp || new Date().toLocaleString(),
      data.preMarketBias || '',
      data.preMarketReasons || '',
      data.mentallyReady || '',
      data.htfNarrative || '',
      data.premiumDiscount || '',
      data.htfPdArray || '',
      data.stage1SMTLabel || '',
      data.stage1SMT || '',
      data.pspHTF || '',
      data.cleanTargets || '',
      data.stage2SMTLabel || '',
      data.stage2SMT || '',
      data.ltfPsp || '',
      data.entryMechanicsSelected || '',
      data.riskLimit || '',
      data.stopLossDefined || '',
      data.targetRatio || '',
      data.partialsTarget || '',
      data.journalNotes || ''
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ "result": "success" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ "result": "error", "error": error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`;

export default function TradingJournal() {
  const [formData, setFormData] = useState(INITIAL_STATE);
  const [loading, setLoading] = useState(false);
  const [googleScriptUrl, setGoogleScriptUrl] = useState('');
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const [darkMode, setDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('app_theme');
    return savedTheme ? savedTheme === 'dark' : true;
  });

  // Load Google Script URL
  useEffect(() => {
    const savedUrl = localStorage.getItem('user_google_script_url');
    if (savedUrl) setGoogleScriptUrl(savedUrl);
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('app_theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('app_theme', 'light');
    }
  }, [darkMode]);

  const toggleTheme = () => setDarkMode(prev => !prev);
  const handleSaveUrl = (url) => {
    setGoogleScriptUrl(url);
    localStorage.setItem('user_google_script_url', url);
  };

  const closeGuideModal = () => {
    setShowGuideModal(false);
  };

  const copyScriptCode = () => {
    navigator.clipboard.writeText(GOOGLE_SCRIPT_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ----------------------------------------------------
  // ⚙️ SMT MAPPING (Stage 2 -> Stage 3)
  // ----------------------------------------------------
  const smtMapping = {
    'WC SMT': 'WC SMT',
    'DC SMT': 'DC SMT',
    '90M SMT': '90M SMT'
  };

  // ----------------------------------------------------
  // 📐 DYNAMIC SMT STAGE LABELS & COUNTS
  // ----------------------------------------------------
  const stage2SmtCount = formData.stage2.stage1Smt.length;

  const stage2BoxLabel = stage2SmtCount > 1 
    ? `${stage2SmtCount} Stage SMT` 
    : '1 Stage SMT';

  const getOrdinalSuffix = (n) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };
  
  const extraManualStage3Count = formData.stage3.stage2Smt.filter(item => {
    const isAutoSyncedFromStage2 = formData.stage2.stage1Smt.some(s => smtMapping[s] === item);
    return !isAutoSyncedFromStage2;
  }).length;

  const totalActiveSmtCount = stage2SmtCount + extraManualStage3Count;
  const calculatedStage3Level = totalActiveSmtCount > 1 ? totalActiveSmtCount : 2;
  const stage3BoxLabel = `${getOrdinalSuffix(calculatedStage3Level)} Stage SMT`;

  const handleStage2SmtToggle = (item) => {
    setFormData(prev => {
      const currentStage2 = prev.stage2.stage1Smt;
      const isCurrentlySelected = currentStage2.includes(item);

      const nextStage2 = isCurrentlySelected 
        ? currentStage2.filter(i => i !== item)
        : [...currentStage2, item];

      return {
        ...prev,
        stage2: { ...prev.stage2, stage1Smt: nextStage2 }
      };
    });
  };

  // ----------------------------------------------------
  // 🔒 SYSTEM LOGIC & LOCK UNLOCK CONDITIONS
  // ----------------------------------------------------
  const isStage1Complete = 
    formData.stage1.narrative !== '' && 
    formData.stage1.pdArray.length > 0 && 
    formData.stage1.htfPdArray.length > 0;

  const isStage2Complete = 
    isStage1Complete && 
    (formData.stage2.stage1Smt.length > 0 || formData.stage2.psp.length > 0) &&
    formData.stage2.cleanTargets.length > 0;

  const hasStage3SmtActive = 
    formData.stage3.stage2Smt.length > 0 || 
    formData.stage2.stage1Smt.some(item => !!smtMapping[item]);

  const isEntryMechanicsUnlocked = 
    formData.stage2.stage1Smt.length > 0 && 
    (hasStage3SmtActive || formData.stage3.ltfPsp.length > 0);

  const isRiskManagementUnlocked = 
    isEntryMechanicsUnlocked && 
    formData.stage3.entryMechanics.length > 0;

  const isRiskPassed = 
    isRiskManagementUnlocked &&
    formData.stage3.riskManagement.riskLimit !== '' &&
    formData.stage3.riskManagement.stopLossDefined &&
    formData.stage3.riskManagement.targetRatio;

  const isTradeQualified = 
    formData.htfBias !== '' &&
    formData.sessionChecks.mentallyReady &&
    isStage1Complete &&
    isStage2Complete &&
    formData.stage3.entryMechanics.length > 0 &&
    isRiskPassed &&
    googleScriptUrl !== '';

  const handleArrayToggle = (stage, field, value) => {
    setFormData(prev => {
      const currentArr = prev[stage][field];
      const updatedArr = currentArr.includes(value)
        ? currentArr.filter(item => item !== value)
        : [...currentArr, value];
      return {
        ...prev,
        [stage]: { ...prev[stage], [field]: updatedArr }
      };
    });
  };

  const handleNestedCheck = (parent, field, value) => {
    setFormData(prev => ({
      ...prev,
      stage3: {
        ...prev.stage3,
        [parent]: {
          ...prev.stage3[parent],
          [field]: value
        }
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isTradeQualified) return;

    setLoading(true);

    const allStage3Smt = Array.from(new Set([
      ...formData.stage3.stage2Smt,
      ...formData.stage2.stage1Smt.map(item => smtMapping[item]).filter(Boolean)
    ]));

    const payload = {
      timestamp: new Date().toLocaleString(),
      preMarketBias: formData.htfBias,
      preMarketReasons: formData.reasons.join(', '),
      mentallyReady: formData.sessionChecks.mentallyReady ? 'YES' : 'NO',
      htfNarrative: formData.stage1.narrative,
      premiumDiscount: formData.stage1.pdArray.join(', '),
      htfPdArray: formData.stage1.htfPdArray.join(', '),
      stage1SMTLabel: stage2BoxLabel,
      stage1SMT: formData.stage2.stage1Smt.join(', ') || 'NONE',
      pspHTF: formData.stage2.psp.join(', ') || 'NONE',
      cleanTargets: formData.stage2.cleanTargets.join(', '),
      stage2SMTLabel: stage3BoxLabel,
      stage2SMT: allStage3Smt.join(', ') || 'NONE',
      ltfPsp: formData.stage3.ltfPsp.join(', ') || 'NONE',
      entryMechanicsSelected: formData.stage3.entryMechanics.join(', '),
      riskLimit: formData.stage3.riskManagement.riskLimit,
      stopLossDefined: formData.stage3.riskManagement.stopLossDefined ? 'YES' : 'NO',
      targetRatio: formData.stage3.riskManagement.targetRatio ? 'YES' : 'NO',
      partialsTarget: formData.stage3.riskManagement.partialsTarget ? 'YES' : 'NO',
      journalNotes: formData.journalNotes
    };

    try {
      await fetch(googleScriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });

      alert("🎉 Trade Execution Journaled Successfully!");
      setFormData(INITIAL_STATE);
    } catch (err) {
      alert("❌ Failed to save trade data.");
    } finally {
      setLoading(false);
    }
  };

  const entryMechanicOptions = [
    'Entry window 9:30 - 9:50',
    'Entry window 9:50 - 10:30',
    'Manipulation 9:30',
    '5M Entry Technique',
    '3M Entry Technique',
    '1M Entry Technique'
  ];

  return (
    <div className="journal-container">
      
      {/* 🎨 ALL REQUIRED STYLES EMBEDDED DIRECTLY */}
      <style>{`
        .custom-option.active-synced {
          background: linear-gradient(135deg, #0284c7 0%, #0d9488 100%) !important;
          color: #ffffff !important;
          border-color: #38bdf8 !important;
          box-shadow: 0 0 10px rgba(56, 189, 248, 0.3);
          cursor: pointer;
        }
        .auto-badge {
          font-size: 10px;
          background: rgba(255, 255, 255, 0.25);
          padding: 2px 6px;
          border-radius: 4px;
          font-weight: bold;
          letter-spacing: 0.5px;
        }
        
        /* 📖 FULLY RESPONSIVE LARGE MODAL POPUP STYLES */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.85);
          backdrop-filter: blur(8px);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 99999;
          padding: 20px;
        }
        .modal-card {
          background: #0f172a;
          color: #f8fafc;
          border: 1px solid #334155;
          border-radius: 16px;
          max-width: 900px;
          width: 95%;
          max-height: 88vh;
          overflow-y: auto;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.85);
          padding: 32px;
          box-sizing: border-box;
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 2px solid #334155;
          padding-bottom: 16px;
          margin-bottom: 24px;
        }
        .modal-title {
          font-size: 1.5rem;
          font-weight: 800;
          color: #38bdf8;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .close-btn {
          background: #1e293b;
          border: 1px solid #475569;
          color: #94a3b8;
          font-size: 1.5rem;
          cursor: pointer;
          line-height: 1;
          width: 38px;
          height: 38px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          flex-shrink: 0;
        }
        .close-btn:hover {
          color: #ffffff;
          background: #ef4444;
          border-color: #ef4444;
        }
        .guide-step {
          background: #1e293b;
          border-left: 5px solid #38bdf8;
          padding: 18px 22px;
          border-radius: 0 12px 12px 0;
          margin-bottom: 18px;
        }
        .guide-step h4 {
          margin: 0 0 10px 0;
          color: #f8fafc;
          font-size: 1.15rem;
          font-weight: 700;
        }
        .guide-step p, .guide-step ol {
          margin: 0;
          font-size: 0.98rem;
          color: #cbd5e1;
          line-height: 1.65;
        }
        .guide-step ol {
          padding-left: 20px;
        }
        .code-box-wrapper {
          position: relative;
          margin-top: 12px;
          background: #020617;
          border: 1px solid #334155;
          border-radius: 8px;
          overflow: hidden;
        }
        .code-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #0f172a;
          padding: 10px 16px;
          border-bottom: 1px solid #1e293b;
          font-size: 0.85rem;
          color: #94a3b8;
          font-weight: bold;
        }
        .copy-btn {
          background: #0284c7;
          color: white;
          border: none;
          padding: 6px 14px;
          border-radius: 6px;
          font-size: 0.8rem;
          cursor: pointer;
          font-weight: bold;
          transition: background 0.2s;
        }
        .copy-btn:hover {
          background: #0369a1;
        }
        .code-content {
          padding: 14px;
          margin: 0;
          font-family: monospace;
          font-size: 0.85rem;
          color: #38bdf8;
          max-height: 220px;
          overflow-y: auto;
          white-space: pre-wrap;
          word-break: break-all;
        }
        .guide-trigger-btn {
          background: #0284c7;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 0.9rem;
          font-weight: bold;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2);
          transition: background 0.2s;
        }
        .guide-trigger-btn:hover {
          background: #0369a1;
        }

        @media (max-width: 640px) {
          .modal-overlay {
            padding: 10px;
          }
          .modal-card {
            padding: 20px 16px;
            max-height: 92vh;
            border-radius: 12px;
          }
          .modal-title {
            font-size: 1.15rem;
          }
          .guide-step {
            padding: 14px 14px;
          }
          .guide-step h4 {
            font-size: 1rem;
          }
          .guide-step p, .guide-step ol {
            font-size: 0.88rem;
          }
          .code-content {
            font-size: 0.75rem;
            max-height: 180px;
          }
        }
      `}</style>

      {/* HEADER */}
      <header className="app-header">
        <div>
          <h1 className="app-title">⚡ MECHANICAL TRADING JOURNAL</h1>
          <p className="app-subtitle">ICT Systematic Execution & Discipline Verification</p>
        </div>
        <div className="header-actions">
          <button type="button" onClick={() => setShowGuideModal(true)} className="guide-trigger-btn">
            ❓ Rules & Guide
          </button>
          <button type="button" onClick={toggleTheme} className="theme-toggle-btn">
            {darkMode ? '☀️ Light' : '🌙 Night'}
          </button>
          <div className={`status-badge ${isTradeQualified ? 'verified' : 'locked'}`}>
            {isTradeQualified ? "✅ VERIFIED" : "🚫 DISCIPLINE LOCK"}
          </div>
        </div>
      </header>

      {/* 📖 LARGE RESPONSIVE GUIDE POPUP MODAL */}
      {showGuideModal && (
        <div className="modal-overlay" onClick={closeGuideModal}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">📖 Setup Guide & Webhook Configuration</span>
              <button className="close-btn" onClick={closeGuideModal}>&times;</button>
            </div>
            
            <div style={{ marginBottom: '24px' }}>
              <div className="guide-step" style={{ borderLeftColor: '#10b981' }}>
                <h4 style={{ color: '#34d399' }}>📊 Step-by-Step Google Sheet Webhook Setup</h4>
                <ol>
                  <li>একটি নতুন <b>Google Sheet</b> খুলুন।</li>
                  <li>মেনু থেকে <b>Extensions</b> &gt; <b>Apps Script</b>-এ যান।</li>
                  <li>সেখানকার ডিফল্ট কোড মুছে নিচের কোডটি কপি করে পেস্ট করুন:</li>
                </ol>

                <div className="code-box-wrapper">
                  <div className="code-header">
                    <span>Google Apps Script Code</span>
                    <button onClick={copyScriptCode} className="copy-btn">
                      {copied ? '✅ Copied!' : '📋 Copy Code'}
                    </button>
                  </div>
                  <pre className="code-content">{GOOGLE_SCRIPT_CODE}</pre>
                </div>

                <ol start="4" style={{ marginTop: '12px' }}>
                  <li>ওপরের ডানপাশের <b>Deploy</b> &gt; <b>New deployment</b>-এ ক্লিক করুন।</li>
                  <li>গিয়ার (⚙️) আইকনে চাপ দিয়ে <b>Web app</b> বেছে নিন।</li>
                  <li><b>Who has access:</b> অপশনটি অবশ্যই <b>`Anyone`</b> সেট করুন।</li>
                  <li><b>Deploy</b> এ চাপ দিয়ে পারমিশন Allow করে দিন এবং প্রাপ্ত <b>Web app URL</b> টি কপি করে অ্যাপের ইনপুট বক্সে পেস্ট করুন।</li>
                </ol>
              </div>

              <div className="guide-step">
                <h4>1️⃣ Pre-Market Setup & Session Readiness</h4>
                <p>
                  Pre-Market Bias সিলেক্ট করুন এবং মানসিক প্রস্তুতি নিশ্চিত করতে <b>Mentally Ready</b> চেক বক্সে টিক দিন।
                </p>
              </div>

              <div className="guide-step">
                <h4>2️⃣ Stage 1 & Stage 2 (Market Alignment)</h4>
                <p>
                  Stage 1 সম্পূর্ণ করার পরেই কেবল Stage 2 আনলক হবে। Stage 2-তে কোনো SMT নির্বাচন করলে তা অটোমেটিকভাবে Stage 3-তে <b>AUTO</b> ট্যাগসহ সিঙ্ক হয়ে যাবে।
                </p>
              </div>

              <div className="guide-step">
                <h4>3️⃣ Dynamic SMT Level Calculation</h4>
                <p>
                  সক্রিয় SMT এর উপর ভিত্তি করে সিস্টেম অটোমেটিকভাবে লেবেল পরিবর্তন করবে (যেমন: <b>1 Stage SMT</b>, <b>2nd Stage SMT</b>, <b>3rd Stage SMT</b>)।
                </p>
              </div>

              <div className="guide-step">
                <h4>4️⃣ Mechanics & Mandatory Risk Lock</h4>
                <p>
                  ট্রেড এক্সিকিউট করতে অবশ্যই অন্তত 2 টি <b>SMT</b>, <b>Entry Mechanics</b> এবং <b>Risk Limit (0.5% / 1%)</b> পূরণ করতে হবে।
                </p>
              </div>
            </div>

            <button 
              onClick={closeGuideModal}
              style={{
                width: '100%',
                padding: '14px',
                background: '#0d9488',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '1rem',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)'
              }}
            >
              বন্ধ করুন (Close Guide)
            </button>
          </div>
        </div>
      )}

      {/* WEBHOOK INPUT */}
      <div className="card">
        <label className="label-title">⚙️ TARGET GOOGLE SHEET WEBHOOK URL</label>
        <input 
          type="text" 
          placeholder="Paste your Google Apps Script Web App URL here..." 
          value={googleScriptUrl}
          onChange={(e) => handleSaveUrl(e.target.value)}
          className="text-input"
        />
      </div>

      <form onSubmit={handleSubmit}>

        {/* PRE MARKET & SESSION READINESS */}
        <div className="grid-2">
          <div className="card">
            <h2 className="card-title">📋 Pre-Market Analysis</h2>
            <span className="label-title">HTF BIAS</span>
            <div className="grid-2">
              <div 
                className={`custom-option ${formData.htfBias === 'Bullish' ? 'active-green' : ''}`}
                onClick={() => setFormData({...formData, htfBias: 'Bullish'})}
              >
                🐂 Bullish
              </div>
              <div 
                className={`custom-option ${formData.htfBias === 'Bearish' ? 'active-red' : ''}`}
                onClick={() => setFormData({...formData, htfBias: 'Bearish'})}
              >
                🐻 Bearish
              </div>
            </div>

            <span className="label-title">REASONS</span>
            <div className="checkbox-group">
              {['Hunt liquidity', 'Rebalance price P/D', 'Rebalance FVG\'S'].map(r => (
                <label key={r} className="checkbox-row">
                  <input 
                    type="checkbox" 
                    checked={formData.reasons.includes(r)} 
                    onChange={() => {
                      const updated = formData.reasons.includes(r) ? formData.reasons.filter(i => i !== r) : [...formData.reasons, r];
                      setFormData({...formData, reasons: updated});
                    }} 
                  />
                  <span>{r}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="card">
            <h2 className="card-title">🧠 Market Session Readiness</h2>
            <p className="readiness-text">
              Mental readiness is mandatory. Ensure you are free from FOMO or emotional trading mindsets.
            </p>
            <label className="checkbox-row" style={{ padding: '16px' }}>
              <input 
                type="checkbox" 
                checked={formData.sessionChecks.mentallyReady} 
                onChange={e => setFormData({...formData, sessionChecks: {...formData.sessionChecks, mentallyReady: e.target.checked}})} 
              />
              <span style={{ fontWeight: 'bold' }}>I am mentally ready to trade (Mandatory)</span>
            </label>
          </div>
        </div>

        {/* STAGE 1 & STAGE 2 */}
        <div className="grid-2">
          
          {/* STAGE 1 */}
          <div className="card">
            <h2 className="card-title">1️⃣ STAGE 1: Narrative & Framework</h2>
            
            <span className="label-title">🧭 HTF NARRATIVE</span>
            <div className="grid-2" style={{ marginBottom: '12px' }}>
              <div 
                className={`custom-option ${formData.stage1.narrative === 'Bullish' ? 'active-indigo' : ''}`}
                onClick={() => setFormData({...formData, stage1: {...formData.stage1, narrative: 'Bullish'}})}
              >
                Bullish
              </div>
              <div 
                className={`custom-option ${formData.stage1.narrative === 'Bearish' ? 'active-indigo' : ''}`}
                onClick={() => setFormData({...formData, stage1: {...formData.stage1, narrative: 'Bearish'}})}
              >
                Bearish
              </div>
            </div>

            <span className="label-title">🎯 PREMIUM / DISCOUNT</span>
            <div className="grid-4" style={{ marginBottom: '12px' }}>
              {['PDH', 'PSH', 'PDL', 'PSL'].map(item => (
                <div 
                  key={item}
                  className={`custom-option ${formData.stage1.pdArray.includes(item) ? 'active-indigo' : ''}`}
                  onClick={() => handleArrayToggle('stage1', 'pdArray', item)}
                >
                  {item}
                </div>
              ))}
            </div>

            <span className="label-title">🗺️ HTF PD ARRAY</span>
            <div className="grid-3">
              {['1H FVG', '4H FVG', 'NWOG/NDOG'].map(item => (
                <div 
                  key={item}
                  className={`custom-option ${formData.stage1.htfPdArray.includes(item) ? 'active-indigo' : ''}`}
                  onClick={() => handleArrayToggle('stage1', 'htfPdArray', item)}
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          {/* STAGE 2 */}
          <div className={`card ${!isStage1Complete ? 'disabled-stage' : ''}`}>
            <h2 className="card-title">2️⃣ STAGE 2: Market Alignment</h2>
            
            {/* 1 STAGE SMT */}
            <span className="label-title">🏛️ {stage2BoxLabel.toUpperCase()}</span>
            <div className="grid-2" style={{ marginBottom: '12px' }}>
              {['MC SMT', 'WC SMT', 'DC SMT', '90M SMT'].map(item => (
                <div 
                  key={item}
                  className={`custom-option ${formData.stage2.stage1Smt.includes(item) ? 'active-indigo' : ''}`}
                  onClick={() => handleStage2SmtToggle(item)}
                >
                  {item}
                </div>
              ))}
            </div>

            {/* HTF PSP - UPDATED OPTIONS */}
            <span className="label-title">🕰️ HTF PSP</span>
            <div className="grid-2" style={{ marginBottom: '12px' }}>
              {['4H PSP', '1D PSP'].map(item => (
                <div 
                  key={item}
                  className={`custom-option ${formData.stage2.psp.includes(item) ? 'active-indigo' : ''}`}
                  onClick={() => handleArrayToggle('stage2', 'psp', item)}
                >
                  {item}
                </div>
              ))}
            </div>

            {/* CLEAN TARGETS */}
            <span className="label-title">✅ CLEAN TARGETS</span>
            <div className="grid-2">
              {['PDH/PDL', 'Internal liquidity'].map(item => (
                <div 
                  key={item}
                  className={`custom-option ${formData.stage2.cleanTargets.includes(item) ? 'active-indigo' : ''}`}
                  onClick={() => handleArrayToggle('stage2', 'cleanTargets', item)}
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* STAGE 3 */}
        <div className={`card ${!isStage2Complete ? 'disabled-stage' : ''}`}>
          <h2 className="card-title">3️⃣ STAGE 3: Alignment Verification & Execution Mechanics</h2>
          
          <div className="grid-2" style={{ marginBottom: '20px' }}>
            {/* STAGE 3 SMT */}
            <div>
              <span className="label-title">⚡ {stage3BoxLabel.toUpperCase()}</span>
              <div className="grid-2">
                {['WC SMT', 'DC SMT', '90M SMT', 'Micro SMT'].map(item => {
                  const isManual = formData.stage3.stage2Smt.includes(item);
                  const isAuto = formData.stage2.stage1Smt.some(s => smtMapping[s] === item);

                  return (
                    <div 
                      key={item}
                      className={`custom-option ${isAuto ? 'active-synced' : isManual ? 'active-indigo' : ''}`}
                      onClick={() => handleArrayToggle('stage3', 'stage2Smt', item)}
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                    >
                      <span>{item}</span>
                      {isAuto && <span className="auto-badge">AUTO</span>}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* LTF PSP - UPDATED OPTIONS */}
            <div>
              <span className="label-title">📍 LTF PSP</span>
              <div className="grid-3">
                {['1H PSP', 'M15 PSP', 'M5 PSP'].map(item => (
                  <div 
                    key={item}
                    className={`custom-option ${formData.stage3.ltfPsp.includes(item) ? 'active-indigo' : ''}`}
                    onClick={() => handleArrayToggle('stage3', 'ltfPsp', item)}
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <hr style={{ borderColor: 'var(--border-color)', marginBottom: '20px' }} />

          <div className="grid-2">
            {/* ENTRY MECHANICS */}
            <div className={!isEntryMechanicsUnlocked ? 'disabled-stage' : ''}>
              <span className="label-title">
                🔑 ENTRY MECHANICS (Select at least 1) {!isEntryMechanicsUnlocked && '🔒'}
              </span>
              <div className="checkbox-group">
                {entryMechanicOptions.map(item => (
                  <label key={item} className="checkbox-row">
                    <input 
                      type="checkbox" 
                      disabled={!isEntryMechanicsUnlocked}
                      checked={formData.stage3.entryMechanics.includes(item)} 
                      onChange={() => handleArrayToggle('stage3', 'entryMechanics', item)} 
                    />
                    <span>{item}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* RISK MANAGEMENT */}
            <div className={!isRiskManagementUnlocked ? 'disabled-stage' : ''}>
              <span className="label-title">
                🛡️ RISK MANAGEMENT {!isRiskManagementUnlocked && '🔒'}
              </span>

              {/* RISK LIMIT */}
              <span className="label-title" style={{ marginTop: '8px' }}>RISK LIMIT (MANDATORY - CHOOSE 1)</span>
              <div className="grid-2" style={{ marginBottom: '12px' }}>
                {['0.5%', '1%'].map(limit => (
                  <div 
                    key={limit}
                    className={`custom-option ${formData.stage3.riskManagement.riskLimit === limit ? 'active-indigo' : ''}`}
                    onClick={() => isRiskManagementUnlocked && handleNestedCheck('riskManagement', 'riskLimit', limit)}
                    style={{ cursor: isRiskManagementUnlocked ? 'pointer' : 'not-allowed' }}
                  >
                    Risk {limit}
                  </div>
                ))}
              </div>

              {/* CHECKS */}
              <div className="checkbox-group">
                <label className="checkbox-row">
                  <input 
                    type="checkbox" 
                    disabled={!isRiskManagementUnlocked}
                    checked={formData.stage3.riskManagement.stopLossDefined} 
                    onChange={e => handleNestedCheck('riskManagement', 'stopLossDefined', e.target.checked)} 
                  />
                  <span>Stop Loss Above/Below 90min High/Low (Mandatory)</span>
                </label>

                <label className="checkbox-row">
                  <input 
                    type="checkbox" 
                    disabled={!isRiskManagementUnlocked}
                    checked={formData.stage3.riskManagement.targetRatio} 
                    onChange={e => handleNestedCheck('riskManagement', 'targetRatio', e.target.checked)} 
                  />
                  <span>Target Objective 1:2 Minimum (Mandatory)</span>
                </label>

                <label className="checkbox-row">
                  <input 
                    type="checkbox" 
                    disabled={!isRiskManagementUnlocked}
                    checked={formData.stage3.riskManagement.partialsTarget} 
                    onChange={e => handleNestedCheck('riskManagement', 'partialsTarget', e.target.checked)} 
                  />
                  <span style={{ opacity: 0.85 }}>Partials Targeting 1:4 (Optional)</span>
                </label>
              </div>

            </div>
          </div>
        </div>

        {/* JOURNAL NOTES */}
        <div className="card">
          <h2 className="card-title">📝 Post Market & Journal Notes</h2>
          <textarea 
            rows="3"
            placeholder="Write trade reflections, psychological state, or execution notes..." 
            value={formData.journalNotes}
            onChange={e => setFormData({...formData, journalNotes: e.target.value})}
            className="text-area"
          />
        </div>

        {/* SUBMIT BUTTON */}
        <button 
          type="submit" 
          disabled={!isTradeQualified || loading}
          className={`submit-btn ${isTradeQualified && !loading ? 'enabled' : 'disabled'}`}
        >
          {loading ? "SAVING TO GOOGLE SHEET..." : isTradeQualified ? "🚀 EXECUTE & SAVE TRADE" : "🚫 COMPLETE ALL RULES TO UNLOCK EXECUTION"}
        </button>

      </form>

      {/* FOOTER */}
      <footer className="app-footer">
        <div className="footer-badge">
          <span>SYSTEM v2.0 • ICT MECHANICAL ENGINE</span>
        </div>
        <p className="footer-dev-text">
          Developed with Precision by <span className="dev-name">Limon</span>
        </p>
      </footer>

    </div>
  );
}
