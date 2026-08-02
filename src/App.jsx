import React, { useState, useEffect } from 'react';

const INITIAL_STATE = {
  // Pre market Analysis
  newsEvent: '',
  htfBias: '',
  reasons: [],

  // Market session readiness
  sessionChecks: {
    mentallyReady: false
  },

  // 1st Stage
  stage1: {
    narrative: '', // Bullish / Bearish
    pdArray: [], // PDH, PSH, PDL, PSL
    htfPdArray: [] // 1H FVG, 4H FVG, NWOG/NDOG
  },

  // 2nd Stage
  stage2: {
    ssmt: [], // WC SSMT, DC SSMT
    pspHtf: [], // 4H PSP 2:00, 1H PSP 7-8, No PSP
    cleanTargets: [] // PDH/PDL, Internal liquidity
  },

  // 3rd Stage
  stage3: {
    ssmt90m: false, // ⏱️ 90M SSMT Q2-Q3
    entryWindow: false, // 🚪 Entry 9:30 - 9:50
    manipulation: false, // 🧨 Manipulation 9:30
    psp5m: false, // 📍 5M PSP 9:30
    entryTechnique5m: false, // 🎛️ 5M ENTRY TECHNIQUE
    riskManagement: {
      onePercent: false, // 1%
      stopLossDefined: false, // Stop loss Above/Below 90min high/low
      targetRatio: false, // Target objective 1/2
      partialsTarget: false // Partials targeting 1/4
    }
  },

  // Post Market Notes
  journalNotes: ''
};

export default function TradingJournal() {
  const [formData, setFormData] = useState(INITIAL_STATE);
  const [loading, setLoading] = useState(false);
  
  // Dynamic Google Script URL (Saved in localStorage)
  const [googleScriptUrl, setGoogleScriptUrl] = useState('');

  useEffect(() => {
    const savedUrl = localStorage.getItem('user_google_script_url');
    if (savedUrl) setGoogleScriptUrl(savedUrl);
  }, []);

  const handleSaveUrl = (url) => {
    setGoogleScriptUrl(url);
    localStorage.setItem('user_google_script_url', url);
  };

  // --- LOGIC CHECKS FOR SYSTEM ENFORCEMENT ---

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

  // SYSTEM QUALIFICATION GATE
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

  // Submit to Google Sheet
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
        headers: { 'Content-Type': 'application/json' },
        mode: 'no-cors',
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
    <div style={{ maxWidth: '850px', margin: '0 auto', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ textAlign: 'center' }}>🧠 Daily Trading Journal</h1>

      {/* WEBHOOK URL SETTINGS */}
      <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', border: '1px solid #ddd', marginBottom: '20px' }}>
        <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>
          ⚙️ Target Google Sheet Webhook URL:
        </label>
        <input 
          type="text" 
          placeholder="Paste your Google Apps Script Web App URL here..." 
          value={googleScriptUrl}
          onChange={(e) => handleSaveUrl(e.target.value)}
          style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
        />
        {!googleScriptUrl && (
          <small style={{ color: 'red', display: 'block', marginTop: '5px' }}>
            ⚠️ Enter your Google Apps Script URL above to enable submission.
          </small>
        )}
      </div>

      {/* STATUS INDICATOR */}
      <div style={{
        padding: '12px',
        borderRadius: '6px',
        textAlign: 'center',
        fontWeight: 'bold',
        marginBottom: '20px',
        color: '#fff',
        backgroundColor: isTradeQualified ? '#28a745' : '#dc3545'
      }}>
        {isTradeQualified ? "✅ SYSTEM VERIFIED: TRADE ALLOWED" : "🚫 DISCIPLINE LOCK: COMPLETE REQUIRED STEPS & SET URL"}
      </div>

      <form onSubmit={handleSubmit}>
        
        {/* PRE MARKET ANALYSIS */}
        <fieldset style={sectionStyle}>
          <legend style={legendStyle}>📋 Pre Market Analysis</legend>
          
          <label><b>HTF Bias:</b></label>
          <div style={{ margin: '8px 0' }}>
            <label style={{ marginRight: '15px' }}>
              <input 
                type="radio" 
                name="bias" 
                value="Bullish" 
                checked={formData.htfBias === 'Bullish'} 
                onChange={() => setFormData({...formData, htfBias: 'Bullish'})} 
              /> Bullish
            </label>
            <label>
              <input 
                type="radio" 
                name="bias" 
                value="Bearish" 
                checked={formData.htfBias === 'Bearish'} 
                onChange={() => setFormData({...formData, htfBias: 'Bearish'})} 
              /> Bearish
            </label>
          </div>

          <h4>Reason</h4>
          {['Hunt liquidity', 'Rebalance price P/D', 'Rebalance FVG\'S'].map(r => (
            <label key={r} style={{ display: 'block', marginBottom: '5px' }}>
              <input 
                type="checkbox" 
                checked={formData.reasons.includes(r)} 
                onChange={() => {
                  const updated = formData.reasons.includes(r) ? formData.reasons.filter(i => i !== r) : [...formData.reasons, r];
                  setFormData({...formData, reasons: updated});
                }} 
              /> {r}
            </label>
          ))}
        </fieldset>

        {/* MARKET SESSION READINESS */}
        <fieldset style={sectionStyle}>
          <legend style={legendStyle}>🧠 Market Session Readiness</legend>
          <label style={{ display: 'block' }}>
            <input 
              type="checkbox" 
              checked={formData.sessionChecks.mentallyReady} 
              onChange={e => setFormData({...formData, sessionChecks: {...formData.sessionChecks, mentallyReady: e.target.checked}})} 
            /> <b>I am mentally ready to trade (Mandatory)</b>
          </label>
        </fieldset>

        {/* 1ST STAGE */}
        <fieldset style={sectionStyle}>
          <legend style={legendStyle}>1️⃣ 1ST STAGE</legend>
          
          <h4>🧭 HTF NARRATIVE</h4>
          <label style={{ marginRight: '15px' }}>
            <input 
              type="radio" 
              name="narrative" 
              checked={formData.stage1.narrative === 'Bullish'} 
              onChange={() => setFormData({...formData, stage1: {...formData.stage1, narrative: 'Bullish'}})} 
            /> Bullish
          </label>
          <label>
            <input 
              type="radio" 
              name="narrative" 
              checked={formData.stage1.narrative === 'Bearish'} 
              onChange={() => setFormData({...formData, stage1: {...formData.stage1, narrative: 'Bearish'}})} 
            /> Bearish
          </label>

          <h4>🎯 PREMIUM / DISCOUNT</h4>
          {['PDH', 'PSH', 'PDL', 'PSL'].map(item => (
            <label key={item} style={{ marginRight: '15px', display: 'inline-block' }}>
              <input 
                type="checkbox" 
                checked={formData.stage1.pdArray.includes(item)} 
                onChange={() => handleArrayToggle('stage1', 'pdArray', item)} 
              /> {item}
            </label>
          ))}

          <h4>🗺️ HTF PD ARRAY</h4>
          {['1H FVG', '4H FVG', 'NWOG/NDOG'].map(item => (
            <label key={item} style={{ marginRight: '15px', display: 'inline-block' }}>
              <input 
                type="checkbox" 
                checked={formData.stage1.htfPdArray.includes(item)} 
                onChange={() => handleArrayToggle('stage1', 'htfPdArray', item)} 
              /> {item}
            </label>
          ))}
        </fieldset>

        {/* 2ND STAGE */}
        <fieldset style={{ ...sectionStyle, opacity: isStage1Complete ? 1 : 0.4 }} disabled={!isStage1Complete}>
          <legend style={legendStyle}>2️⃣ 2ND STAGE {!isStage1Complete && "(Complete Stage 1)"}</legend>
          
          <h4>🏛️ 1ST stage SSMT</h4>
          {['WC SSMT', 'DC SSMT'].map(item => (
            <label key={item} style={{ marginRight: '15px', display: 'inline-block' }}>
              <input 
                type="checkbox" 
                checked={formData.stage2.ssmt.includes(item)} 
                onChange={() => handleArrayToggle('stage2', 'ssmt', item)} 
              /> {item}
            </label>
          ))}

          <h4>🕰️ PSP HTF</h4>
          {['4H PSP 2:00', '1H PSP 7-8', 'No PSP'].map(item => (
            <label key={item} style={{ marginRight: '15px', display: 'inline-block' }}>
              <input 
                type="checkbox" 
                checked={formData.stage2.pspHtf.includes(item)} 
                onChange={() => handleArrayToggle('stage2', 'pspHtf', item)} 
              /> {item}
            </label>
          ))}

          <h4>✅ Clean targets?</h4>
          {['PDH/PDL', 'Internal liquidity'].map(item => (
            <label key={item} style={{ marginRight: '15px', display: 'inline-block' }}>
              <input 
                type="checkbox" 
                checked={formData.stage2.cleanTargets.includes(item)} 
                onChange={() => handleArrayToggle('stage2', 'cleanTargets', item)} 
              /> {item}
            </label>
          ))}
        </fieldset>

        {/* 3RD STAGE */}
        <fieldset style={{ ...sectionStyle, opacity: isStage2Complete ? 1 : 0.4 }} disabled={!isStage2Complete}>
          <legend style={legendStyle}>3️⃣ 3RD STAGE {!isStage2Complete && "(Complete Stage 2)"}</legend>

          <label style={checkRowStyle}>
            <input 
              type="checkbox" 
              checked={formData.stage3.ssmt90m} 
              onChange={e => setFormData({...formData, stage3: {...formData.stage3, ssmt90m: e.target.checked}})} 
            /> ⏱️ 90M SSMT Q2-Q3
          </label>

          <label style={checkRowStyle}>
            <input 
              type="checkbox" 
              checked={formData.stage3.entryWindow} 
              onChange={e => setFormData({...formData, stage3: {...formData.stage3, entryWindow: e.target.checked}})} 
            /> 🚪 Entry 9:30 - 9:50
          </label>

          <label style={checkRowStyle}>
            <input 
              type="checkbox" 
              checked={formData.stage3.manipulation} 
              onChange={e => setFormData({...formData, stage3: {...formData.stage3, manipulation: e.target.checked}})} 
            /> 🧨 Manipulation 9:30
          </label>

          <label style={checkRowStyle}>
            <input 
              type="checkbox" 
              checked={formData.stage3.psp5m} 
              onChange={e => setFormData({...formData, stage3: {...formData.stage3, psp5m: e.target.checked}})} 
            /> 📍 5M PSP 9:30
          </label>

          <label style={checkRowStyle}>
            <input 
              type="checkbox" 
              checked={formData.stage3.entryTechnique5m} 
              onChange={e => setFormData({...formData, stage3: {...formData.stage3, entryTechnique5m: e.target.checked}})} 
            /> 🎛️ 5M ENTRY TECHNIQUE
          </label>

          <h4>🛡️ Risk management (MANDATORY ALL)</h4>
          
          <label style={checkRowStyle}>
            <input 
              type="checkbox" 
              checked={formData.stage3.riskManagement.onePercent} 
              onChange={e => setFormData({
                ...formData, 
                stage3: { ...formData.stage3, riskManagement: { ...formData.stage3.riskManagement, onePercent: e.target.checked } }
              })} 
            /> 1%
          </label>

          <label style={checkRowStyle}>
            <input 
              type="checkbox" 
              checked={formData.stage3.riskManagement.stopLossDefined} 
              onChange={e => setFormData({
                ...formData, 
                stage3: { ...formData.stage3, riskManagement: { ...formData.stage3.riskManagement, stopLossDefined: e.target.checked } }
              })} 
            /> Stop loss Above/Below 90min high/low
          </label>

          <label style={checkRowStyle}>
            <input 
              type="checkbox" 
              checked={formData.stage3.riskManagement.targetRatio} 
              onChange={e => setFormData({
                ...formData, 
                stage3: { ...formData.stage3, riskManagement: { ...formData.stage3.riskManagement, targetRatio: e.target.checked } }
              })} 
            /> Target objective 1/2
          </label>

          <label style={checkRowStyle}>
            <input 
              type="checkbox" 
              checked={formData.stage3.riskManagement.partialsTarget} 
              onChange={e => setFormData({
                ...formData, 
                stage3: { ...formData.stage3, riskManagement: { ...formData.stage3.riskManagement, partialsTarget: e.target.checked } }
              })} 
            /> Partials targeting 1/4
          </label>
        </fieldset>

        {/* JOURNAL NOTES */}
        <fieldset style={sectionStyle}>
          <legend style={legendStyle}>📝 Post Market & Journal Notes</legend>
          <textarea 
            placeholder="Write trade reflections or execution notes..." 
            style={{ width: '100%', height: '80px', padding: '8px' }}
            value={formData.journalNotes}
            onChange={e => setFormData({...formData, journalNotes: e.target.value})}
          />
        </fieldset>

        {/* SUBMIT BUTTON */}
        <button 
          type="submit" 
          disabled={!isTradeQualified || loading}
          style={{
            width: '100%',
            padding: '15px',
            fontSize: '18px',
            fontWeight: 'bold',
            color: '#fff',
            backgroundColor: isTradeQualified ? '#28a745' : '#a9a9a9',
            border: 'none',
            borderRadius: '5px',
            cursor: isTradeQualified ? 'pointer' : 'not-allowed',
            marginTop: '20px'
          }}
        >
          {loading ? "Saving to Google Sheet..." : isTradeQualified ? "✅ EXECUTE & SAVE TRADE" : "🚫 COMPLETE ALL RULES TO UNLOCK"}
        </button>

      </form>
    </div>
  );
}

const sectionStyle = {
  border: '1px solid #ccc',
  borderRadius: '8px',
  padding: '15px',
  marginBottom: '20px',
  backgroundColor: '#fff'
};

const legendStyle = {
  fontWeight: 'bold',
  padding: '0 5px'
};

const checkRowStyle = {
  display: 'block',
  marginBottom: '8px',
  fontSize: '15px'
};
