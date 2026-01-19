 <?php require_once 'header.php'; ?>

 <div class="container">
<div class="kpi-strip">
  <div class="kpi-card">
    <div class="kpi-header">
      <i class="fa-solid fa-id-card"></i>
      <span>Total Enrollments</span>
    </div>

    <div class="kpi-divider"></div>
    <div class="kpi-value" id="totalEnrollments">0</div>
    <div class="kpi-sub">
      YoY Growth <span class="up" id="enrollment_growth">+0%</span>
    </div>
    <div class="kpi-sparkline"><i class="fa-sharp fa-solid fa-chart-simple"></i><i class="fa-sharp fa-solid fa-chart-simple" style="margin-left:5px; margin-right:5px;"></i></div>
  </div>
  <div class="kpi-card">
    <div class="kpi-header">
      <i class="fa-solid fa-rotate"></i>
      <span>Total Updates</span>
    </div>

    <div class="kpi-divider"></div>

    <div class="kpi-value" id="totalUpdates">0</div>
    <div class="kpi-sub">
      Last 12 Months
    </div>

     <div class="kpi-sparkline"><i class="fa-solid fa-fingerprint" style="margin-left:58px; margin-right:-10px;"></i></div>
  </div>
  <div class="kpi-card">
    <div class="kpi-header">
      <i class="fa-solid fa-arrow-trend-up"></i>
      <span>Update-to-Enroll</span>
    </div>
    <div class="kpi-divider"></div>
    <div class="kpi-value">
      <span class="arrow-up" id="updateRatio"><i class="fa-solid fa-arrow-up"></i>+0%</span>

      <span class="growth" id="updateRatioGrowth">+20%</span>
    </div>
    
        <div class="kpi-sub">
      Last 12 Months
    </div>
        <div class="kpi-sparkline"><i class="fa-solid fa-chart-area" style="margin-left:58px; margin-right:-10px;"></i></div>
  </div>

</div>
 <div id="ai-loading">
        <div class="spinner"></div> 
        <p class="ai-loading-text">Analyzing...</p>
    </div>
  <div class="dashboard">
    <div class="analytics-card">
      <div class="header">
        <div class="header-icon">
        <i class="fa-brands fa-nfc-symbol"></i>
        <h2>Trends & Coverage Analysis</h2></div>
        <select id="stateSelect"></select>
      </div>
      <div class="analytics-grid">
        <div class="state-list">
          <h3>Top Enrollment States</h3>
          <ul id="statesList"></ul>
        </div>
        <div class="pie-chart">
          <h3>Age Group Coverage</h3>
          <div class="chart-wrap">
            <canvas id="ageChart"></canvas>
          </div>
           <div class="custom-legend">
             <div class="legend-item"><span class="dot orange"></span> 0–5</div>
             <div class="legend-item"><span class="dot blue"></span> 5–17</div>
             <div class="legend-item"><span class="dot green"></span> 18+</div>
 </div>
</div>

  <div class="trend-slider-section">

  <div class="chart-slider" id="chartSlider">

    <div class="chart-slide">
      <h3>National Enrollment & Saturation Trend</h3>
      <div class="chart-wrap">
        <canvas id="trendChart"></canvas>
      </div>
    </div>

    <div class="chart-slide">
      <h3>Top Districts (Enrollment)</h3>
      <div class="chart-wrap">
        <canvas id="districtChart"></canvas>
      </div>
    </div>
  </div>

<div class="slider-dots">
    <span class="dot active"></span>
    <span class="dot"></span>
  </div>

</div>
      </div>
    </div>
    <div class="recommendation-card-1">
  <div class="ai-header">
    <span class="ai-dot"></span>
    <span class="ai-title">Intelligent Insights & Trends | Aadhaar AI</span>
</div>
  <div class="ai-insight-body">
    <div class="ai-text"></div>
  </div>
</div>

</div>


<div class="dashboard-2">
    <div class="analytics-card-2">

      <div class="header">
       <div class="header-icon">
        <i class="fa-solid fa-fingerprint"></i>
        <h2>Update Behaviours & Frequency</h2>
       </div>
      </div>


     <div class="analytics-grid-2"> 

  <div class="state-map" id="stateMap">
    <h3 style="margin-bottom: -2px;">Highest Update State</h3>
    <small class="chart-note" style="margin-top: -10px!important; margin-left: 9px;">
        Click on a state to view district
</small>

  </div> 
   <div class="districtMap">
    <h3 id="districtsel" style="margin-bottom: -4px;">Most Active District</h3>
    <small class="chart-note" style="margin-top: -10px!important; margin-left: 9px; font-size: 10px;">
       Drag & Pinch to Explore
</small>
  <div id="districtMap"></div>
  <div class="heatmap-legend-3d">
  <div class="legend-header">
    <span>Update Intensity</span>
    <span class="status-badge">Live</span>
  </div>
  
  <div class="gradient-track">
    <div class="grad-segment" style="--start: #fee5d9; --end: #fcae91;">
      <span class="label">Low</span>
    </div>
    <div class="grad-segment" style="--start: #fb6a4a; --end: #ef3b2c;">
      <span class="label">Mid</span>
    </div>
    <div class="grad-segment" style="--start: #cb181d; --end: #67000d;">
      <span class="label">High</span>
    </div>
  </div>

</div>
</div>
      
  <div class="biovsdem">
  <h3>Bio vs Demo Split</h3>

  <div class="chart-wrapper">
    <canvas id="pieChart"></canvas>
  </div>
</div>

<div class="update-age">
  <h3>Child Update Ratio</h3>

  <div class="chart-wrapper-2">
    <canvas id="ageLineChart"></canvas>
  </div>
</div>


</div>
</div>
    <div class="recommendation-card-3">
        <div class="ai-header">
    <span class="ai-dot"></span>
    <span class="ai-title">Intelligent Decision Insights (AI-Assisted)</span>
</div>
<div id="ai-insights-container" class="ai-insights-wrapper">
  </div>
    </div>
   </div>

<div class="dashboard-3">
  <div class="analytics-card-3">

    <div class="header">
      <div class="header-icon">
        <i class="fa-solid fa-triangle-exclamation"></i>
        <h2>Anomalies & Risk</h2>
      </div>
    </div>

    <div class="analytics-grid-3">

      <div class="stateMap" id="stateMap">
        <h3 style="margin-bottom:-2px;">Highest Update State</h3>
        <small class="chart-note" style="margin-left: 7px;">
          Click on a state to view districts
        </small>

        <div id="indiaMap"></div>
        
      </div>

      <div class="graph-3">
        <h3 id="graphTitle">High-Risk State Disparitie </h3>
        <div class="chart-wrapper-3">
          <canvas id="rkAgeLineChart"></canvas>
        </div>
      </div>

    </div>
  </div>


    <div class="recommendation-card-4">
      <div class="rk-risk-cards" id="rkRiskCards"></div>

    </div>
   </div>
  </div>
 </div>
</div>

<script src="../assets/risk.js" defer></script>
<script src="../assets/script.js" defer></script>
<script src="../assets/decision_ai.js" defer></script>
<script src="../assets/anomalies.js" defer></script>