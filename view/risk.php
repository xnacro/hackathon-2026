<?php require 'header.php'; ?>
<style>
.container {
  margin-left: 10px;
  margin-right: 10px;
}
</style>
<div class="container">
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
</div>
<script src="../assets/risk.js" defer></script>
<script src="../assets/anomalies.js" defer></script>