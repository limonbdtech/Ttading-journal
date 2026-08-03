import React, { useState, useEffect } from 'react';

const INITIAL_STATE = {
  newsEvent: '',
  htfBias: '',
  reasons: [],
  sessionChecks: { mentallyReady: false },
  stage1: { narrative: '', pdArray: [], htfPdArray: [] },
  stage2: { ssmt: [], pspHtf: [], cleanTargets: [] },
  stage3: {
    ssmt90m: false,
    entryWindow: false,
    manipulation: false,
    psp5m: false,
    entryTechnique5m: false,
    riskManagement: {
      onePercent: false,
      stopLossDefined: false,
      targetRatio: false,
      partialsTarget: false
    }
  },
  journalNotes: ''
};

export default function TradingJournal() {
  const [formData, setFormData] = useState(INITIAL_STATE);
  const [loading, setLoading] = useState(false);
  const [googleScriptUrl, setGoogleScriptUrl] = useState('');
  
  // Theme State: Default to 'dark' (Night Mode)
  const [darkMode, setDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('app_theme');
    return savedTheme ? savedTheme === 'dark' : true;
  });

  useEffect(() => {
    const savedUrl = localStorage.getItem('user_google_script_url');
    if (savedUrl) setGoogleScriptUrl(savedUrl);
  }, []);

  // Sync theme with <html> or <body> attribute
  useEffect(() => {
    if (darkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('app_theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('app_theme', 'light');
    }
  }, [darkMode]);

  const toggleTheme = () => {
    setDarkMode(prev => !prev);
  };

  const handleSaveUrl = (url) => {
    setGoogleScriptUrl(url);
    localStorage.setItem('user_google_script_url', url);
  };

  // LOGIC CHECKS
  const isStage1Complete = 
    formData.stage1.narrative !== '' && 
    formData.stage1.pdArray.length > 0 && 
    formData.stage1.htfPdArray.length > 0;

  const isStage2Complete = 
    isStage1Complete && 
    formData.stage2.ssmt.length > 0 &&
    formData.stage2.pspHtf.length > 0 &&
    formData.stage2.cleanTargets.length > 0;

  const isRiskPassed = 
    formData.stage3.riskManagement.onePercent &&
    formData.stage3.riskManagement.stopLossDefined &&
    formData.stage3.riskManagement.targetRatio &&
    formData.stage3.riskManagement.partialsTarget;

  const isTradeQualified = 
    formData.htfBias !== '' &&
    formData.sessionChecks.mentallyReady &&
    isStage1Complete &&
    isStage2Complete &&
    formData.stage3.ssmt90m &&
    formData.stage3.entryWindow &&
    formData.stage3.manipulation &&
    formData.stage3.psp5m &&
    formData.stage3.entryTechnique5m &&
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isTradeQualified) return;

    setLoading(true);

    const payload = {
      timestamp: new Date().toLocaleString(),
      preMarketBias: formData.htfBias,
      preMarketReasons: formData.reasons.join(', '),
      mentallyReady: formData.sessionChecks.mentallyReady ? 'YES' : 'NO',
      htfNarrative: formData.stage1.narrative,
      premiumDiscount: formData.stage1.pdArray.join(', '),
      htfPdArray: formData.stage1.htfPdArray.join(', '),
      stage1SSMT: formData.stage2.ssmt.join(', '),
      pspHtf: formData.stage2.pspHtf.join(', '),
      cleanTargets: formData.stage2.cleanTargets.join(', '),
      ssmt90m: formData.stage3.ssmt90m ? 'YES' : 'NO',
      entryWindow: formData.stage3.entryWindow ? 'YES' : 'NO',
      manipulation930: formData.stage3.manipulation ? 'YES' : 'NO',
      psp5m: formData.stage3.psp5m ? 'YES' : 'NO',
      entryTechnique5m: formData.stage3.entryTechnique5m ? 'YES' : 'NO',
      riskPassed: isRiskPassed ? 'PASSED' : 'FAILED',
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

  return (
    <div className="journal-container">
      
      {/* HEADER WITH THEME TOGGLE BUTTON */}
      <header className="app-header">
        <div>
          <h1 className="app-title">⚡ MECHANICAL TRADING JOURNAL</h1>
          <p className="app-subtitle">ICT / SMC Systematic Execution & Discipline Verification</p>
        </div>
        <div className="header-actions">
          <button type="button" onClick={toggleTheme} className="theme-toggle-btn">
            {darkMode ? '☀️ Light Mode' : '🌙 Night Mode'}
          </button>
          <div className={`status-badge ${isTradeQualified ? 'verified' : 'locked'}`}>
            {isTradeQualified ? "✅ SYSTEM VERIFIED: TRADE ALLOWED" : "🚫 DISCIPLINE LOCK ACTIVE"}
          </div>
        </div>
      </header>

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
            
            <span className="label-title">🏛️ 1ST STAGE SSMT</span>
            <div className="grid-2" style={{ marginBottom: '12px' }}>
              {['WC SSMT', 'DC SSMT'].map(item => (
                <div 
                  key={item}
                  className={`custom-option ${formData.stage2.ssmt.includes(item) ? 'active-indigo' : ''}`}
                  onClick={() => handleArrayToggle('stage2', 'ssmt', item)}
                >
                  {item}
                </div>
              ))}
            </div>

            <span className="label-title">🕰️ PSP HTF</span>
            <div className="grid-3" style={{ marginBottom: '12px' }}>
              {['4H PSP 2:00', '1H PSP 7-8', 'No PSP'].map(item => (
                <div 
                  key={item}
                  className={`custom-option ${formData.stage2.pspHtf.includes(item) ? 'active-indigo' : ''}`}
                  onClick={() => handleArrayToggle('stage2', 'pspHtf', item)}
                >
                  {item}
                </div>
              ))}
            </div>

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
          <h2 className="card-title">3️⃣ STAGE 3: Execution Mechanics & Risk Protocols</h2>
          
          <div className="grid-2">
            <div>
              <span className="label-title">⚡ ENTRY MECHANICS</span>
              {[
                { key: 'ssmt90m', label: '⏱️ 90M SSMT Q2-Q3' },
                { key: 'entryWindow', label: '🚪 Entry 9:30 - 9:50' },
                { key: 'manipulation', label: '🧨 Manipulation 9:30' },
                { key: 'psp5m', label: '📍 5M PSP 9:30' },
                { key: 'entryTechnique5m', label: '🎛️ 5M ENTRY TECHNIQUE' }
              ].map(item => (
                <label key={item.key} className="checkbox-row">
                  <input 
                    type="checkbox" 
                    checked={formData.stage3[item.key]} 
                    onChange={e => setFormData({...formData, stage3: {...formData.stage3, [item.key]: e.target.checked}})} 
                  />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>

            <div>
              <span className="label-title">🛡️ RISK MANAGEMENT (MANDATORY ALL)</span>
              {[
                { key: 'onePercent', label: '1% Risk Limit Compliant' },
                { key: 'stopLossDefined', label: 'Stop Loss Above/Below 90min High/Low' },
                { key: 'targetRatio', label: 'Target Objective 1:2 Minimum' },
                { key: 'partialsTarget', label: 'Partials Targeting 1:4' }
              ].map(item => (
                <label key={item.key} className="checkbox-row">
                  <input 
                    type="checkbox" 
                    checked={formData.stage3.riskManagement[item.key]} 
                    onChange={e => setFormData({
                      ...formData, 
                      stage3: { ...formData.stage3, riskManagement: { ...formData.stage3.riskManagement, [item.key]: e.target.checked } }
                    })} 
                  />
                  <span>{item.label}</span>
                </label>
              ))}
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

      {/* PROFESSIONAL FOOTER */}
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
