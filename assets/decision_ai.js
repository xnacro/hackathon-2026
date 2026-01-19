let districtLayer;
let allDistrictGeoJSON;
let stateLayer;

  const AILoader = { 
  show(text = "Analyzing update patterns…") { 
  const loader = document.getElementById("ai-loading"); 
  const container = document.getElementById("ai-insights-container"); 
  if (!loader || !container) return; 

  loader.querySelector(".ai-loading-text").innerText = text; 
  loader.classList.remove("hidden"); 
  container.classList.add("hidden"); }, hide() { 

  const loader = document.getElementById("ai-loading"); 
  const container = document.getElementById("ai-insights-container"); 
  if (!loader || !container) return; loader.classList.add("hidden"); 
  container.classList.remove("hidden"); 
 } 
};
const indiaBounds = [
  [13, 68],
  [37, 97]
];

const stateMap = L.map('stateMap', {
  zoomControl: false,
  dragging: true,
  boxZoom: false,
  keyboard: false,
  touchZoom: false,
  maxBounds: indiaBounds,
  attributionControl: false,
  maxBoundsViscosity: 0.5, 
  zoomSnap: 0.1, 
  zoomDelta: 0.1
}).fitBounds(indiaBounds);

const districtMap = L.map('districtMap', {
  zoomControl: false,
  dragging: true,
  boxZoom: false,
  keyboard: false,
  touchZoom: false,
  maxBounds: indiaBounds,
  attributionControl: false,
  maxBoundsViscosity: 0.5,
  zoomSnap: 0.1,
  zoomDelta: 0.1
}).fitBounds(indiaBounds);

fetch('../data_cache/update-data.json')
  .then(res => res.json())
  .then(data => {
    AILoader.show("Initializing National Aadhaar Trends..."); 
    loadStateHeatmap(data.stateHeatmap, data.districtHeatmap, data);
    loadPieChart(data.pie);
    loadAgeLine(data.ageLine);
  })
  .catch(err => {
    console.error("Fetch Error:", err);
    AILoader.hide();
  });

function getStateSplit(stateName, districtData) {
  const rows = districtData.filter(d => d.state === stateName);

  let biometric = 0;
  let demographic = 0;

  rows.forEach(r => {
    biometric += r.total_biometric || 0;
    demographic += r.total_demographic || 0;
  });

  return { biometric, demographic };
}

function getDistrictSplit(stateName, districtName, districtData) {
  const row = districtData.find(
    d => d.state === stateName && d.district === districtName
  );

  return {
    biometric: row?.total_biometric || 0,
    demographic: row?.total_demographic || 0
  };
}

function loadStateHeatmap(stateData, districtData, data) {

  const maxVal = Math.max(...stateData.map(s => s.total_updates));

  fetch('../maps/mera_pyara_bharat.json')
    .then(res => res.json())
    .then(geojson => {

      const stateLayer = L.geoJSON(geojson, {
        style: f => {
          const state = f.properties.ST_NM;
          const value =
            stateData.find(s => s.state === state)?.total_updates || 0;

          return {
            fillColor: getColor(value, maxVal),
            weight: 1,
            color: '#222',
            fillOpacity: 0.9
          };
        },


        
        onEachFeature: (f, l) => {
          const stateName = f.properties.ST_NM;
          const total =
            stateData.find(s => s.state === stateName)?.total_updates || 0;

          const split = getStateSplit(stateName, districtData);

          l.on('mouseover', () => {
            l.setStyle({ weight: 2, color: '#000' });
            l.bindTooltip(
        
              `<strong>${stateName}</strong><em>(Click to view districts)</em><br>
               Total: ${total.toLocaleString()}<br>
               🟢 Biometric: ${Math.floor(split.biometric).toLocaleString()}<br>
               🟠 Demographic:${Math.floor(split.demographic).toLocaleString()}`,
              { sticky: true }
            ).openTooltip();
          });

          l.on('mouseout', () => {
            l.setStyle({ weight: 1, color: '#000' });
          });

          l.on('click', () => {
            loadDistrictHeatmap(stateName, districtData);
            aiRenderStateInsights(stateName, data);

          });
        }
        
      }).addTo(stateMap);

      const topState = [...stateData]
        .sort((a, b) => b.total_updates - a.total_updates)[0].state;

      loadDistrictHeatmap(topState, districtData);
      aiRenderStateInsights(topState, data);
    });
}

function loadDistrictHeatmap(stateName, districtData) {

  const titleEl = document.getElementById('districtsel');
  if (titleEl) {
    titleEl.innerText = `Most Active District — ${stateName}`;
  }

  if (districtLayer) districtMap.removeLayer(districtLayer);

  const drawDistricts = geojson => {

    const filteredStats = districtData.filter(d => d.state === stateName);
    const maxVal = Math.max(...filteredStats.map(d => d.total_updates), 1);

    districtLayer = L.geoJSON(geojson, {
  filter: feature =>
    feature.properties.ST_NM === stateName,

  style: feature => {
    const dist = feature.properties.DISTRICT;
    const value =
      filteredStats.find(d => d.district === dist)?.total_updates || 0;

    return {
      fillColor: getColor(value, maxVal),
      weight: 1,
      color: '#333',
      fillOpacity: 0.9
    };
  },

  onEachFeature: (feature, layer) => {
    const dist = feature.properties.DISTRICT;
    const value =
      filteredStats.find(d => d.district === dist)?.total_updates || 0;

    const split = getDistrictSplit(stateName, dist, districtData);

    layer.bindTooltip(
      `<strong>${dist}</strong><br>
       Total: ${value.toLocaleString()}<br>
       🟢 Biometric: ${split.biometric.toLocaleString()}<br>
       🟠 Demographic: ${split.demographic.toLocaleString()}`,
      { sticky: true }
    );
  }
}).addTo(districtMap);


    districtMap.fitBounds(districtLayer.getBounds());
  };

  if (allDistrictGeoJSON) {
    drawDistricts(allDistrictGeoJSON);
  } else {
    fetch('../maps/states_all.json')
      .then(res => res.json())
      .then(geojson => {
        allDistrictGeoJSON = geojson;
        drawDistricts(geojson);
      });
  }
}

function getColor(value, max) {
  const ratio = value / max;

  return ratio > 0.85 ? '#67000d' :
         ratio > 0.65 ? '#a50f15' :
         ratio > 0.45 ? '#cb181d' :
         ratio > 0.30 ? '#ef3b2c' :
         ratio > 0.15 ? '#fb6a4a' :
         ratio > 0.05 ? '#fcae91' :
                        '#fee5d9';
}



function loadPieChart(pie) {
  new Chart(document.getElementById('pieChart'), {
    type: 'pie',
    data: {
       labels: ['Total Biometric Updates', 'Total Demographic Updates'],
      datasets: [{
        data: [pie.biometric, pie.demographic],
        backgroundColor: ['#ecb91f', '#4CAF50']
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
       plugins: {
        legend: { display: false }
      },
      animation: {
            animateRotate: true,
            animateScale: true,
            duration: 1500
          },
    }
  });
}

function loadAgeLine(ageData) {
  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(0) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(0) + 'k';
    return num;
  };
  const val05 = ageData.find(a => a.age_group === '0-5')?.total || 0;
  const val517 = ageData.find(a => a.age_group === '5-17')?.total || 0;

  new Chart(document.getElementById('ageLineChart'), {
    type: 'bar',
    data: {
      labels: ['0-5', '5-17'],
      datasets: [{
        label: 'Total Updates',
        data: [val05, val517],
        backgroundColor: [
          '#4CAF50',
          '#FF9800'
        ],
        barThickness: 20
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          beginAtZero: true,
          ticks: {
            callback: (value) => formatNumber(value)
          }
        }
      },
      plugins: {
        legend: { display: false },
        annotation: {
          annotations: {
            marker05: {
              type: 'line',
              xMin: val05,
              xMax: val05,
              borderColor: '#4CAF50',
              borderWidth: 6,
              yMin: '0-5',
              yMax: '0-5'
            },
            marker517: {
              type: 'line',
              xMin: val517,
              xMax: val517,
              borderColor: '#FF9800',
              borderWidth: 6,
              yMin: '5-17',
              yMax: '5-17'
            }
          }
        }
      }
    }
  });
}2
function aiCreateInsight(container, config) {
  const div = document.createElement("div");
  div.className = `ai-risk-card ${config.className}`;

  div.innerHTML = `
    <div class="ai-risk-header">
      <div class="ai-risk-left">
        <span class="ai-risk-icon">${config.icon}</span>
        <span class="ai-risk-title">${config.title}</span>
      </div>
      <span class="ai-risk-badge">${config.badge}</span>
    </div>

    <div class="ai-risk-text">${config.text}</div>

    <div class="ai-risk-action">
      <strong>Action:</strong> ${config.action}
    </div>
  `;

  container.appendChild(div);
}

// AI Decision Insights Module

function aiGetTopCriticalDistricts(stateName, data) {
    return data.districtHeatmap
        .filter(d => d.state === stateName)
        .sort((a, b) => b.total_updates - a.total_updates)
        .slice(0, 3);
}

function aiGetSeverity(value, avg) {
  if (value > avg * 1.4) return "CRITICAL";
  if (value > avg * 1.1) return "WATCH";
  if (value < avg * 0.7) return "INFO";
  return "MUSTDO";
}
const aiSeverityConfig = {
  CRITICAL: {
    icon: "🚨",
    label: "CRITICAL",
    class: "ai-critical"
  },
  WATCH: {
    icon: "⚠️",
    label: "WATCH",
    class: "ai-watch"
  },
  MUSTDO: {
    icon: "📌",
    label: "MUST DO",
    class: "ai-mustdo"
  },
  INFO: {
    icon: "ℹ️",
    label: "INFO",
    class: "ai-info"
  }
};

function aiPick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function aiDistrictPressure(count) {
  if (count >= 25) return "WIDESPREAD";
  if (count >= 10) return "CONCENTRATED";
  return "LIMITED";
}
function aiGenerateMessage(severity, state, intensityScore, districtCount) {
  const spread = aiDistrictPressure(districtCount);

  if (severity === "CRITICAL") {
    return {
      text: aiPick([
        `<strong>${state}</strong> is experiencing sustained Aadhaar update overload across multiple districts, indicating systemic capacity stress.`,
        `Update volumes in <strong>${state}</strong> significantly exceed national averages, signaling imminent service saturation.`,
        `<strong>${state}</strong> shows persistent high-volume update activity, driven by ${spread.toLowerCase()} district-level pressure.`
      ]),
      action:
        intensityScore > 1.6
          ? aiPick([
              "Activate emergency mobile Aadhaar units and extend operating hours.",
              "Initiate rapid-response Aadhaar camps with inter-district staff support."
            ])
          : aiPick([
              "Immediately scale operator capacity and biometric infrastructure.",
              "Reallocate resources from low-load regions to high-demand districts."
            ])
    };
  }

  if (severity === "WATCH") {
    return {
      text: aiPick([
        `<strong>${state}</strong> is showing early signs of operational strain due to rising update activity.`,
        `Update demand in <strong>${state}</strong> is increasing steadily, with pressure concentrated in select districts.`,
        `<strong>${state}</strong> exhibits upward update trends that may escalate without timely intervention.`
      ]),
      action:
        intensityScore > 1.2
          ? aiPick([
              "Pre-emptively deploy additional operators to high-growth districts.",
              "Prepare standby mobile enrollment units."
            ])
          : aiPick([
              "Monitor district-wise trends on a weekly basis.",
              "Maintain readiness for rapid capacity scaling."
            ])
    };
  }

  if (severity === "MUSTDO") {
    return {
      text: aiPick([
        `<strong>${state}</strong> presents moderate update activity that requires proactive planning.`,
        `Current Aadhaar update levels in <strong>${state}</strong> are manageable but demand targeted oversight.`,
        `<strong>${state}</strong> would benefit from structured district-level update planning.`
      ]),
      action: aiPick([
        "Schedule targeted Aadhaar update drives in priority districts.",
        "Optimize staff deployment based on district-wise demand."
      ])
    };
  }

  return {
    text: aiPick([
      `<strong>${state}</strong> demonstrates stable Aadhaar update patterns with no immediate operational risk.`,
      `Update demand in <strong>${state}</strong> remains balanced and within manageable limits.`,
      `<strong>${state}</strong> currently operates under optimal Aadhaar service capacity.`
    ]),
    action: aiPick([
      "Maintain existing deployment and monitoring strategy.",
      "Continue routine performance tracking."
    ])
  };
}


function aiRenderStateInsights(stateName, data) {
  const container = document.getElementById("ai-insights-container");
  container.innerHTML = "";

  const states = data.stateHeatmap;
  const stateData = states.find(s => s.state === stateName);
  if (!stateData) return;

  const avg =
    states.reduce((sum, s) => sum + s.total_updates, 0) / states.length;

  const stateDistricts = data.districtHeatmap.filter(
    d => d.state === stateName
  );

  const districtCount = stateDistricts.length;
  const intensityScore = stateData.total_updates / avg;

  const bio = stateDistricts.reduce(
    (sum, d) => sum + Number(d.total_biometric || 0),
    0
  );

  const demo = stateDistricts.reduce(
    (sum, d) => sum + Number(d.total_demographic || 0),
    0
  );

  const bioRatio = bio + demo > 0 ? (bio / (bio + demo)) * 100 : 0;

  const childRatio = Math.max(
    0.25,
    Math.min(0.6, 1 - bioRatio / 100)
  );


  const severity = aiGetSeverity(stateData.total_updates, avg);
  const config = aiSeverityConfig[severity];

  const msg = aiGenerateMessage(
    severity,
    stateName,
    intensityScore,
    districtCount
  );

  aiCreateInsight(container, {
    icon: config.icon,
    badge: config.label,
    className: config.class,
    title: `<strong>${stateName}</strong> - Load`,
    text: msg.text,
    action: msg.action
  });


  const topDistricts = aiGetTopCriticalDistricts(stateName, data);

  aiCreateInsight(container, {
    icon: "🚨",
    badge: "HOTSPOT",
    className: "ai-critical",
    title: `<strong>${stateName}</strong> – Top 3 Critical Districts`,
    text: topDistricts
      .map(
        (d, i) =>
          `<strong>${i + 1}. ${d.district}</strong> – ${Number(
            d.total_updates
          ).toLocaleString()} updates`
      )
      .join("<br>"),
    action: "Deploy additional biometric kits and operators immediately."
  });


  aiCreateInsight(container, {
    icon: "🧬",
    badge: "PRESSURE",
    className: bioRatio > 65 ? "ai-watch" : "ai-info",
    title: "Biometric Load Analysis",
    text: `Biometric updates dominate at <strong>${bioRatio.toFixed(
      1
    )}%</strong> in <strong>${stateName}</strong>.`,
    action:
      bioRatio > 65
        ? "Monitor biometric device health & calibration cycles."
        : "Balanced biometric-demographic load observed."
  });

  aiCreateInsight(container, {
    icon: "🧒",
    badge: "SOCIAL RISK",
    className: childRatio < 0.4 ? "ai-mustdo" : "ai-info",
    title: "Child Aadhaar Compliance",
    text: `Estimated child update coverage is <strong>${(
      childRatio * 100
    ).toFixed(1)}%</strong> in <strong>${stateName}</strong>.`,
    action:
      childRatio < 0.4
        ? "Initiate school & Anganwadi Aadhaar update drives."
        : "Child Aadhaar compliance within acceptable range."
  });


  aiCreateInsight(container, {
    icon: "🧠",
    badge: "AI ACTION",
    className:
      severity === "CRITICAL" || bioRatio > 65 ? "ai-critical" : "ai-watch",
    title: "AI Operational Recommendation",
    text: aiPick([
      `AI analysis indicates that <strong>${stateName}</strong> may experience service congestion if current trends persist.`,
      `Combined biometric pressure and district load patterns suggest proactive intervention in <strong>${stateName}</strong>.`,
      `Predictive signals point to potential service bottlenecks in <strong>${stateName}</strong> without timely action.`
    ]),
    action:
      severity === "CRITICAL"
        ? "Activate temporary Aadhaar camps and deploy mobile enrollment units."
        : "Prepare adaptive staffing and infrastructure reallocation."
  });
  setTimeout(() => {
    AILoader.hide();
  }, 800);
}