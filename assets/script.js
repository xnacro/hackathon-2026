// first kpi
let districtChart, ageChart, trendChart;
const districtCtx = document.getElementById('districtChart');
const ageCtx = document.getElementById('ageChart');
const trendCtx = document.getElementById('trendChart');
const stateSelect = document.getElementById('stateSelect');

Chart.defaults.animation.duration = 1200;
Chart.defaults.animation.easing = 'easeOutQuart';

function loadDashboard(state) {

  document.querySelectorAll('.analytics-grid > div').forEach(el => {
    el.style.animation = 'none';
    el.offsetHeight;
    el.style.animation = '';
  });

  fetch(`../controller_ai/api.php?state=${encodeURIComponent(state)}`)
    .then(r => r.json())
    .then(data => {

      const ul = document.getElementById('statesList');
      ul.innerHTML = '';
      data.topStates.forEach(s => {
        ul.innerHTML += `
          <li>
            <span>${s.state}</span>
            <span>${(s.total / 1e6).toFixed(2)}M</span>
          </li>`;
      });

      if (districtChart) districtChart.destroy();

      districtChart = new Chart(districtCtx, {
        type: 'bar',
        data: {
          labels: data.topDistricts.map(d => d.district),
          datasets: [{
            data: data.topDistricts.map(d => d.total),
            backgroundColor: [
              '#5B8CFF',
              '#5B8CFF',
              '#5B8CFF',
              '#3e8bf6',
              '#4d90d9'
            ],
            barThickness: 28,
            maxBarThickness: 34
          }]
        },
       options: {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { 
      grid: { display: false } 
    },
    y: {
      beginAtZero: true,
      grid: { color: 'rgba(0,0,0,0.05)' },
      ticks: {
        maxTicksLimit: 4,
        callback: function(value) {
          if (value >= 1000000) return (value / 1000000) + 'M';
          if (value >= 1000) return (value / 1000) + 'K';
          return value;
        }
      }
    }
  }
}
      });

      if (ageChart) ageChart.destroy();

      const donutCtx = ageCtx.getContext('2d');

const redGrad = donutCtx.createRadialGradient(150,150,40,150,150,140);
redGrad.addColorStop(0, '#f17923ff');
redGrad.addColorStop(1, '#e64a19');

const blueGrad = donutCtx.createRadialGradient(150,150,40,150,150,140);
blueGrad.addColorStop(0, '#0685d4ff');
blueGrad.addColorStop(1, '#196fd2ff');

const greenGrad = donutCtx.createRadialGradient(150,150,40,150,150,140);
greenGrad.addColorStop(0, '#31f117ff'); 
greenGrad.addColorStop(1, '#26c203ff');


      ageChart = new Chart(ageCtx, {
        type: 'doughnut',
        data: {
          labels: ['0–5', '5–17', '18+'],
          datasets: [{
            data: [
              data.ageGroups.age_0_5,
              data.ageGroups.age_5_17,
              data.ageGroups.age_18_plus
            ],
            backgroundColor: [redGrad, blueGrad, greenGrad],
            borderWidth: 0,
            hoverOffset: 18
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '48%',
          rotation: 0,         
          circumference: 360, 
          animation: {
            animateRotate: true,
            animateScale: true,
            duration: 1500
          },
          plugins: {
            legend: {
              display: false
            }
          }
        }
      });

      if (trendChart) trendChart.destroy();

      trendChart = new Chart(trendCtx, {
        type: 'line',
        data: {
          labels: data.trend.map(t => t.year),
          datasets: [
            {
              label: 'Total Enrolments',
              data: data.trend.map(t => t.enrolled),
              borderColor: '#f6c23e',
              backgroundColor: 'rgba(246,194,62,0.15)',
              tension: 0.35,
              fill: true,
              pointRadius: 4
            },
            {
              label: 'Estimated Expected Population',
              data: data.trend.map(t => t.expected_population),
              borderColor: '#4e73df',
              backgroundColor: 'rgba(78,115,223,0.10)',
              tension: 0.35,
              fill: true,
              pointRadius: 4
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animations: {
            x: {
              type: 'number',
              easing: 'easeOutQuart',
              duration: 1200
            },
            y: {
              easing: 'easeOutQuart',
              duration: 1200
            }
          },
          plugins: {
            legend: { position: 'bottom' }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                maxTicksLimit: 4,
                callback: v =>
                  v >= 1_000_000 ? (v/1_000_000)+'M' :
                  v >= 1_000 ? (v/1_000)+'K' : v
              }
            },
            x: { grid: { display: false } }
          }
        }
      });
    })
    .catch(err => console.error('Dashboard load error:', err));
}

fetch('../controller_ai/api.php')
  .then(r => r.json())
  .then(data => {
    stateSelect.innerHTML = '';
    data.topStates.forEach(s => {
      stateSelect.innerHTML += `<option value="${s.state}">${s.state}</option>`;
    });
    loadDashboard(stateSelect.value);
    loadInsights(stateSelect.value);
  });

stateSelect.addEventListener('change', () => {
  loadDashboard(stateSelect.value);
  loadInsights(stateSelect.value);
});

const slider = document.getElementById('chartSlider');
const dots = document.querySelectorAll('.slider-dots .dot');

let currentSlide = 0;
const totalSlides = dots.length;
const SLIDE_INTERVAL = 4000;

function goToSlide(index) {
  currentSlide = index;

  slider.style.transform = `translateX(-${index * 50}%)`;

  dots.forEach((dot, i) => {
    dot.classList.toggle('active', i === index);
  });
}

dots.forEach((dot, index) => {
  dot.addEventListener('click', () => {
    goToSlide(index);
  });
});


fetch('../controller_ai/basic.php')
  .then(res => res.json())
  .then(data => {

    animateNumber(
      document.getElementById('totalEnrollments'),
      data.total_enrollments
    );

    animateNumber(
      document.getElementById('totalUpdates'),
      data.total_updates
    );
    animateNumber(
      document.getElementById('enrollment_growth').innerText =data.enrollment_growth
    );

    document.getElementById('updateRatio').innerText = data.update_ratio;

    const growthEl = document.getElementById('enrollment_growth');
    growthEl.innerText = (data.enrollment_growth >= 0 ? '+' : '') + data.enrollment_growth + '%';
    growthEl.className = 'kpi-growth ' + (data.enrollment_growth >= 0 ? 'up' : 'down');
  });

function animateNumber(el, target) {
  let current = 0;
  const step = Math.max(1, Math.floor(target / 60));

  const interval = setInterval(() => {
    current += step;
    if (current >= target) {
      el.innerText = target.toLocaleString();
      clearInterval(interval);
    } else {
      el.innerText = current.toLocaleString();
    }
  }, 16);
}

// Ai_insight section

function generateNaturalInsights(data) {
  const { state, metrics } = data;
  const {
    state_share_percent,
    top_district,
    age_distribution_percent,
    yoy_growth_percent,
    risk_level
  } = metrics;

  const insights = [];

  insights.push(
    pick([
      `**${state}** contributes **${state_share_percent}%** of Aadhaar enrollments nationwide.`,
      `Nationally, **${state}** accounts for nearly **${state_share_percent}%** of total Aadhaar enrollments.`,
      `With a **${state_share_percent}%** share, **${state}** plays a significant role in Aadhaar coverage.`
    ])
  );

  if (top_district?.name) {
    insights.push(
      pick([
        `**${top_district.name}** is the most active district, contributing **${top_district.share_percent}%** of the state’s enrollments.`,
        `Enrollment activity is highest in **${top_district.name}**, accounting for **${top_district.share_percent}%** of the state total.`,
        `District-wise data shows **${top_district.name}** leading with a **${top_district.share_percent}%** share.`
      ])
    );
  }

  const dominantAge = Object.entries(age_distribution_percent)
    .sort((a, b) => b[1] - a[1])[0];

  const ageMap = {
    '0_5': 'children aged 0–5',
    '5_17': 'individuals aged 5–17',
    '18+': 'adults above 18'
  };

  insights.push(
    pick([
      `Enrollment is primarily driven by **${ageMap[dominantAge[0]]}**, forming **${dominantAge[1]}%** of the total.`,
      `The largest share of Aadhaar enrollments comes from **${ageMap[dominantAge[0]]}** at **${dominantAge[1]}%**.`,
      `**${ageMap[dominantAge[0]]}** dominate Aadhaar registrations with a **${dominantAge[1]}%** share.`
    ])
  );
  if (yoy_growth_percent > 5) {
    insights.push(
      pick([
        `Enrollment activity shows strong year-on-year growth of **${yoy_growth_percent}%**.`,
        `A healthy **${yoy_growth_percent}%** increase in enrollments is observed compared to last year.`
      ])
    );
  } else if (yoy_growth_percent > 0) {
    insights.push(
      pick([
        `Enrollment levels remain stable with a **${yoy_growth_percent}%** year-on-year increase.`,
        `A modest growth of **${yoy_growth_percent}%** is recorded compared to the previous year.`
      ])
    );
  } else {
    insights.push(
      pick([
        `A decline in enrollments is observed, with year-on-year change at **${yoy_growth_percent}%**.`,
        `Enrollment momentum has slowed compared to last year.`
      ])
    );
  }

  const riskText = {
    low: `Enrollment distribution is **well balanced**, indicating **low concentration risk**.`,
    moderate: `Some districts dominate enrollment activity, suggesting **moderate concentration risk**.`,
    high: `Enrollments are heavily clustered in select districts, indicating **high concentration risk**.`
  };
  insights.push(riskText[risk_level] || riskText.low);

  const suggestions = {
    low: `**Suggestion:** Maintain the current outreach strategy while monitoring emerging district-level trends.`,
    moderate: `**Suggestion:** Increase enrollment drives in underperforming districts to reduce imbalance.`,
    high: `**Suggestion:** Prioritize targeted enrollment campaigns in low-performing districts to improve equity.`
  };
  insights.push(suggestions[risk_level] || suggestions.low);

  return insights;
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

let typingTimer = null;

function typeLine(element, text, speed = 26, callback) {
  let i = 0;
  element.innerHTML = '';

  const boldTokens = [];
  const parsed = text.replace(/\*\*(.*?)\*\*/g, (_, boldText) => {
    boldTokens.push(boldText);
    return `%%BOLD${boldTokens.length - 1}%%`;
  });

  typingTimer = setInterval(() => {
    element.innerHTML += parsed.charAt(i++);
    if (i >= parsed.length) {
      clearInterval(typingTimer);
      typingTimer = null;

      let html = element.innerHTML;
      boldTokens.forEach((txt, idx) => {
        html = html.replace(`%%BOLD${idx}%%`, `<strong>${txt}</strong>`);
      });
      element.innerHTML = html;

      if (callback) callback();
    }
  }, speed);
}


function stateToFile(state) {
  return state.toLowerCase().trim().replace(/\s+/g, '_');
}


function loadInsights(state) {
  const aiText = document.querySelector('.ai-text');
  const aiDot  = document.querySelector('.ai-dot');

  if (!state || !aiText || !aiDot) return;

  aiText.innerHTML = '';
  aiDot.classList.add('thinking');

  const thinking = document.createElement('div');
  thinking.className = 'ai-thinking';
  thinking.innerHTML = '<em>AI is analyzing enrollment patterns…</em>';
  aiText.appendChild(thinking);

  const file = stateToFile(state);

  fetch(`../data_cache/state_insights/${file}.json`)
    .then(r => r.json())
    .then(data => {
      const insights = generateNaturalInsights(data);
      thinking.remove();
      writeInsights(aiText, insights, aiDot);
    })
    .catch(() => {
      thinking.innerText = 'Unable to load insights.';
      aiDot.classList.remove('thinking');
    });
}

function writeInsights(container, insights, aiDot) {
  let index = 0;

  function writeNext() {
    if (index >= insights.length) {
      aiDot.classList.remove('thinking');
      return;
    }

    const group = document.createElement('div');
    group.className = 'insight-group';
    container.appendChild(group);

    requestAnimationFrame(() => group.classList.add('active'));

    const p = document.createElement('p');
    group.appendChild(p);

    typeLine(p, insights[index], 26, () => {
      index++;
      setTimeout(writeNext, 350);
    });
  }

  writeNext();
}






















