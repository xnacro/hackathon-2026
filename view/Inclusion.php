<?php require_once 'header.php'; ?>
<style>
.container {
  margin-left: 10px;
  margin-right: 10px;
}
.dashboard {
    display: flex; 
    flex:1;
    flex-direction: column;
    gap: 10px;
    padding: 15px;
    overflow: hidden;
}
.analytics-grid {
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

<div class="dashboard">
    <div class="analytics-card">
      <div class="header">
        <div class="header-icon">
        <i class="fa-brands fa-nfc-symbol"></i>
        <h2>Inclusion & Coverage Analysis</h2></div>
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

  <div class="recommendation-container">
    <div class="recommendation-card-1">
<div class="ai-card">
  <div class="ai-header">
    <span class="ai-dot"></span>
    <span class="ai-title">Key Insight ( Advance AI )</span>
  </div>

  <div class="ai-body">

    <div class="ai-text">
  
</div>
    </div>
  </div>
</div>

    <div class="recommendation-card-2">
        <div class="ai-header">
    <span class="ai-dot"></span>
    <span class="ai-title">Key Insight ( Advance AI )</span>
  </div>

    </div>
   </div>
  </div>

<script src="../assets/script.js" defer></script>