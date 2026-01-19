let rkMap;
let rkCORE = null;
let rkStateLayer;
let rkDistrictLayer = null;
let rkDistrictGeoJSON = null;
const rkSTATE_MASTER = {};
const rkDISTRICT_MASTER = [];
const rkSTATE_UPDATES = {};
const rkSTATE_RISK = {};
let rkDISTRICT_AGE = [];
let rkAgeChart = null;
let rkAgeLineChart = document.getElementById("rkAgeLineChart").getContext("2d");

const rkNormalize = (str = "") =>
  str
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/&/g, "and");

const rkIndiaBounds = [
  [12, 68.1],
  [32, 97.4]
];

function rkInitMap(stateGeo) {
  rkMap = L.map("indiaMap", {
    zoomControl: false,
    attributionControl: false,
    maxBounds: rkIndiaBounds,
    maxBoundsViscosity: 0.6,
    minZoom: 4,
    maxZoom: 8,
    zoomAnimation: true,
    fadeAnimation: true,
    markerZoomAnimation: true
  }).fitBounds(rkIndiaBounds);

  rkStateLayer = L.geoJSON(stateGeo, {
    style: rkStyleState,
    onEachFeature: rkOnEachState
  }).addTo(rkMap);

  rkAddBackButton();
}

Promise.all([
  fetch("../data_cache/update-data.json").then(r => r.json()),
  fetch("../data_cache/risk.json").then(r => r.json()),
  fetch("../maps/mera_pyara_bharat.json").then(r => r.json()),
  fetch("../maps/states_all.json").then(r => r.json()) 
]).then(([core, risk, stateGeo, districtGeo]) => {

  rkDistrictGeoJSON = districtGeo;
  rkCORE = core

  core.stateHeatmap.forEach(s => {
    rkSTATE_UPDATES[s.state] = +s.total_updates || 0;
  });

  risk.stateRank.forEach(r => {
    rkSTATE_RISK[r.state] = r;
  });

  rkDISTRICT_AGE = risk.districtAge || [];

  core.districtMaster = [];
  core.stateMaster = {};

  if (Array.isArray(core.districtHeatmap)) {
    core.districtHeatmap.forEach(d => {
      core.districtMaster.push({
        state: d.state,
        district: d.district,
        biometric: Number(d.total_biometric || 0),
        demographic: Number(d.total_demographic || 0),
        total_updates: Number(d.total_updates || 0)
      });
    });
  }

  core.districtMaster.forEach(d => {
    const key = rkNormalize(d.state);

    if (!core.stateMaster[key]) {
      core.stateMaster[key] = {
        state: d.state,
        biometric: 0,
        demographic: 0,
        total_updates: 0,
        risk_score: 0
      };
    }

    core.stateMaster[key].biometric += d.biometric;
    core.stateMaster[key].demographic += d.demographic;
    core.stateMaster[key].total_updates += d.total_updates;
  });

  risk.stateRank.forEach(r => {
    const key = rkNormalize(r.state);
    if (core.stateMaster[key]) {
      core.stateMaster[key].risk_score = Number(r.risk_score || 0);
    }
  });

Object.keys(rkSTATE_MASTER).forEach(k => delete rkSTATE_MASTER[k]);

Object.entries(core.stateMaster).forEach(([k, v]) => {
  rkSTATE_MASTER[k] = v;
});

  rkRenderIndiaChart();
  rkInitMap(stateGeo);
  rkRenderCountryRiskCards();
});



function rkStyleState(feature) {
  const state = feature.properties.ST_NM;
  const total = rkSTATE_UPDATES[state] || 0;
  const risk = rkSTATE_RISK[state];

  return {
    fillColor: rkGetStateColor(total, risk),
    weight: 1,
    color: "#222",
    fillOpacity: 0.9
  };
}

function rkOnEachState(feature, layer) {
  const stateName = feature.properties.ST_NM;
  const updates = rkSTATE_UPDATES[stateName] || 0;
  const risk = rkSTATE_RISK[stateName];

  layer.bindTooltip(
    `<b>${stateName}</b><br>
     🟢 Updates: ${updates.toLocaleString()}<br>
     🟠 Risk Score: ${risk?.risk_score ?? "N/A"}<br>
     <em>Click to view districts</em>`,
    { sticky: true }
  );

  layer.on("click", () => {
    rkShowDistricts(stateName);
    rkRenderStateChart(stateName);
    rkRenderDistrictRiskCards(stateName);
  });
}

function rkDimStates() {
  rkStateLayer.eachLayer(l => {
    l.setStyle({ fillOpacity: 0, opacity: 0 });
  });
}

function rkRestoreStates() {
  rkStateLayer.eachLayer(l => rkStateLayer.resetStyle(l));
}

function rkShowDistricts(stateName) {
  if (rkDistrictLayer) rkMap.removeLayer(rkDistrictLayer);

  rkDimStates();

  const stats =
  rkCORE && rkCORE.districtMaster && rkCORE.districtMaster.length
    ? rkCORE.districtMaster.filter(
    d => rkNormalize(d.state) === rkNormalize(stateName)
  )
    : rkDISTRICT_AGE.filter(d => d.state === stateName);


const maxVal = Math.max(
  ...stats.map(d =>
    d.biometric !== undefined
      ? d.biometric + d.demographic
      : d.age_0_5 + d.age_5_17 + d.age_18_plus
  ),
  1
);


  rkDistrictLayer = L.geoJSON(rkDistrictGeoJSON, {
    filter: f => f.properties.ST_NM === stateName,
style: f => {
  const dist = f.properties.DISTRICT;
  const row = stats.find(
    d => rkNormalize(d.district) === rkNormalize(dist)
  );

  const value = row
    ? (row.biometric !== undefined
        ? row.biometric + row.demographic
        : row.age_0_5 + row.age_5_17 + row.age_18_plus)
    : 0;

  return {
    fillColor: rkDistrictHeatColor(value, maxVal),
    weight: 1,
    color: "#333",
    fillOpacity: 0.9
  };
},


onEachFeature: (feature, layer) => {
  const dist = feature.properties.DISTRICT;
  const row = stats.find(
    d => rkNormalize(d.district) === rkNormalize(dist)
  );

layer.bindTooltip(
  row
    ? row.biometric !== undefined
      ? `<b>${dist}</b><br>
         🧬 Biometric: ${row.biometric.toLocaleString()}<br>
         👤 Demographic: ${row.demographic.toLocaleString()}<br>
         📊 Total: ${(row.biometric + row.demographic).toLocaleString()}`
      : `<b>${dist}</b><br>
         🟢 Age 0–5: ${row.age_0_5}<br>
         🟢 Age 5–17: ${row.age_5_17}<br>
         🟢 18+: ${row.age_18_plus}`
    : `<b>${dist}</b><br>No data`,
  { sticky: true }
);


  layer.on("click", () => {
    rkRenderDistrictLineChart(dist);
    });
  }
  }).addTo(rkMap);
 

rkMap.fitBounds(rkDistrictLayer.getBounds(), {
  animate: true,
  duration: 0.6
});
}


function rkGetStateColor(total, risk) {
  if (!risk) return "#f5f5f5";

  const MAX_RISK = 300000;
  const MAX_TOTAL = 8000000;

  const intensity =
    (Math.min(risk.risk_score / MAX_RISK, 1) * 0.6) +
    (Math.min(total / MAX_TOTAL, 1) * 0.4);

  return intensity > 0.85 ? "#67000d" :
         intensity > 0.65 ? "#e2353b" :
         intensity > 0.45 ? "#ff9800" :
         intensity > 0.30 ? "#ee950f" :
         intensity > 0.15 ? "#ffca28" :
                            "#ffe082";
}

function rkDistrictHeatColor(value, max) {
  const ratio = value / max;

  return ratio > 0.85 ? "#67000d" :
         ratio > 0.65 ? "#a50f15" :
         ratio > 0.45 ? "#cb181d" :
         ratio > 0.30 ? "#ef3b2c" :
         ratio > 0.15 ? "#fb6a4a" :
                        "#fee5d9";
}

function rkAddBackButton() {
  const btn = L.control({ position: "topright" });

  btn.onAdd = function () {
    const d = L.DomUtil.create("div", "rk-back-btn");
    d.innerHTML = "⬅ Back to India";
    d.style.cssText =
      "background:#fff;padding:6px 10px;cursor:pointer;font-weight:600;border-radius:6px;";

    d.onclick = () => {
      if (rkDistrictLayer) {
        rkMap.removeLayer(rkDistrictLayer);
        rkDistrictLayer = null;
      }
   
      rkRestoreStates();
      rkMap.fitBounds(rkIndiaBounds);
      rkRenderIndiaChart();
      rkRenderCountryRiskCards();
    };
    return d;
  };

  btn.addTo(rkMap);
}
const rkGetTopDisparityStates = () => {

  const useNewMaster =
    typeof rkCORE !== "undefined" &&
    rkCORE.stateMaster &&
    Object.keys(rkCORE.stateMaster).length;

  const source = useNewMaster
    ? Object.values(rkCORE.stateMaster)
    : Object.values(rkSTATE_MASTER);

  return source
    .map(s => {

      let biometric = 0;
      let demographic = 0;

      if (useNewMaster) {
        biometric = s.biometric;
        demographic = s.demographic;
      }

      else {
        const stateKey = rkNormalize(s.state);
        demographic = rkDISTRICT_AGE
          .filter(d => rkNormalize(d.state) === stateKey)
          .reduce(
            (sum, d) =>
              sum +
              Number(d.age_0_5 || 0) +
              Number(d.age_5_17 || 0),
            0
          );

        biometric = Math.max(
          Number(s.total_updates || 0) - demographic,
          0
        );
      }

      return {
        state: s.state,
        biometric,
        demographic,
        risk: Number(s.risk_score || 0),
        disparity: Math.abs(biometric - demographic)
      };
    })
    .sort((a, b) => b.disparity - a.disparity)
    .slice(0, 8);
};


const rkRenderIndiaChart = () => {
  if (rkAgeChart) rkAgeChart.destroy();

  const data = rkGetTopDisparityStates();

    document.getElementById("graphTitle").innerText =
    `High-Risk State Disparities`;

  rkAgeChart = new Chart(rkAgeLineChart, {
    type: "bar",
    data: {
      labels: data.map(d => d.state),
      datasets: [
        {
          label: "Biometric",
          data: data.map(d => d.biometric),
          backgroundColor: "#e1ca19"
        },
        {
          label: "Demographic",
          data: data.map(d => d.demographic),
          backgroundColor: "#1e88e5"
        },
        {
          label: "Risk Score",
          data: data.map(d => d.risk),
          backgroundColor: "#fb0000"
        }
      ]
    },
    options: {
      responsive: true,
      plugins: { legend: { position: "bottom" } },
      scales: { y: { beginAtZero: true } }
    }
  });
};


const rkRenderStateChart = (stateName) => {
  if (rkAgeChart) rkAgeChart.destroy();

  const stateKey = rkNormalize(stateName);
  const stateMaster = rkSTATE_MASTER[stateKey];
  if (!stateMaster) return;

  const totalStateActivity = Math.max(stateMaster.total_updates || 1, 1);

  const useNewMaster =
    typeof rkCORE !== "undefined" &&
    rkCORE.districtMaster &&
    rkCORE.districtMaster.length;

  const rows = useNewMaster
    ? rkCORE.districtMaster.filter(
        d => rkNormalize(d.state) === stateKey
      )
    : rkDISTRICT_AGE.filter(
        d => rkNormalize(d.state) === stateKey
      );

  if (!rows.length) return;

  document.getElementById("graphTitle").innerText =
    `High-Risk District Disparities – ${stateName}`;

  let districts = rows.map(r => {

    let biometric = 0;
    let demographic = 0;

    if (useNewMaster) {
      biometric = r.biometric;
      demographic = r.demographic;
    } else {
      demographic =
        Number(r.age_0_5 || 0) +
        Number(r.age_5_17 || 0);
      biometric = Number(r.age_18_plus || 0);
    }

    const risk =
      ((biometric + demographic) / totalStateActivity) *
      (stateMaster.risk_score || 0);

    return {
      district: r.district,
      biometric,
      demographic,
      risk
    };
  });

  districts.sort(
    (a, b) =>
      (b.biometric + b.demographic) -
      (a.biometric + a.demographic)
  );

  const visibleDistricts = districts.slice(4, 12);

  rkAgeChart = new Chart(rkAgeLineChart, {
    type: "bar",
    data: {
      labels: visibleDistricts.map(d => d.district),
      datasets: [
        {
          label: "Biometric",
          data: visibleDistricts.map(d => d.biometric),
          backgroundColor: "#e53935"
        },
        {
          label: "Demographic",
          data: visibleDistricts.map(d => d.demographic),
          backgroundColor: "#1e88e5"
        },
        {
          label: "Risk (derived)",
          data: visibleDistricts.map(d => Math.round(d.risk)),
          backgroundColor: "#fb8c00"
        }
      ]
    },
    options: {
      responsive: true,
      plugins: { legend: { position: "bottom" } },
      scales: { y: { beginAtZero: true } }
    }
  });
};


const rkRenderDistrictLineChart = (districtName) => {
  if (rkAgeChart) rkAgeChart.destroy();

  const useNewMaster =
    typeof rkCORE !== "undefined" &&
    rkCORE.districtMaster &&
    rkCORE.districtMaster.length;

  const row = useNewMaster
    ? rkCORE.districtMaster.find(
        d => rkNormalize(d.district) === rkNormalize(districtName)
      )
    : rkDISTRICT_AGE.find(
        d => rkNormalize(d.district) === rkNormalize(districtName)
      );

  if (!row) return;

  const stateKey = rkNormalize(row.state);
  const stateMaster = rkSTATE_MASTER[stateKey];
  if (!stateMaster) return;

  const demographic = useNewMaster
    ? row.demographic
    : Number(row.age_0_5 || 0) + Number(row.age_5_17 || 0);

  const biometric = useNewMaster
    ? row.biometric
    : Number(row.age_18_plus || 0);

  const risk =
    ((biometric + demographic) /
      Math.max(stateMaster.total_updates || 1, 1)) *
    (stateMaster.risk_score || 0);

  document.getElementById("graphTitle").innerText =
    `District Profile – ${districtName}`;

  rkAgeChart = new Chart(rkAgeLineChart, {
    type: "line",
    data: {
      labels: ["Demographic", "Biometric", "Risk"],
      datasets: [
        {
          data: [
            Math.round(demographic),
            Math.round(biometric),
            Math.round(risk)
          ],
          borderColor: "#673ab7",
          backgroundColor: "rgba(103,58,183,0.15)",
          fill: true,
          tension: 0.4
        }
      ]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true } }
    }
  });
};
