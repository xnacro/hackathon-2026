<?php require_once 'header.php'; ?>

<style>
.container {
  margin-left: 10px;
  margin-right: 10px;
}
.dashboard-2 {
    display: flex; 
    flex:1;
    flex-direction: column;
    gap: 10px;
    padding: 15px;
    overflow: hidden;
}
.analytics-grid-2 {
    height: 530px;
}
#stateMap {
    margin: 0 auto;
    min-height: 530px!important;
}
#districtMap {
    margin: 0 auto;
    min-height: 400px;
    width: 100%;
}
.ai-card {
    box-shadow: inset 6px 6px 12px #d1d9e6, inset -6px -6px 12px #ffffff;
    padding:10px 10px 17px 10px;
}
   </style>
 <div class="container">  
     <div id="ai-loading">
        <div class="spinner"></div> 
        <p class="ai-loading-text">Analyzing...</p>
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
    <h3 id="districtsel" style="margin-bottom: -2px;">Most Active District </h3>
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
      <div class="ai-card">
        <div class="ai-header">
    <span class="ai-dot"></span>
    <span class="ai-title">Intelligent Decision Insights (AI-Assisted)</span>
</div>
<div id="ai-insights-container" class="ai-insights-wrapper">
  </div>
</div>
    </div>
   </div>
</div>


<script src="../assets/decision_ai.js"></script>

 