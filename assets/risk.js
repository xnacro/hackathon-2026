function rkComputeDistrictRisk(stateName) {
  if (!rkCORE || !rkCORE.districtMaster) return [];

  const rows = rkCORE.districtMaster.filter(
    d => rkNormalize(d.state) === rkNormalize(stateName)
  );

  if (!rows.length) return [];

  const maxTotal = Math.max(
    ...rows.map(r => r.biometric + r.demographic),
    1
  );

  const maxDisparity = Math.max(
    ...rows.map(r => Math.abs(r.biometric - r.demographic)),
    1
  );

  return rows.map(r => {
    const total = r.biometric + r.demographic || 1;

    const bioRatio = r.biometric / total;
    const demoRatio = r.demographic / total;
    const disparity = Math.abs(r.biometric - r.demographic);

    const bioFactor = Math.abs(bioRatio - 0.5) * 2;
    const volumeFactor = total / maxTotal;
    const disparityFactor = disparity / maxDisparity;

    const riskScore = Math.round(
      (bioFactor * 0.45 +
        disparityFactor * 0.35 +
        volumeFactor * 0.2) * 100
    );

    let level = "LOW";
    if (riskScore >= 70) level = "CRITICAL";
    else if (riskScore >= 40) level = "MODERATE";

    return {
      district: r.district,
      biometric: r.biometric,
      demographic: r.demographic,
      bioPct: Math.round(bioRatio * 100),
      demoPct: Math.round(demoRatio * 100),
      disparity,
      riskScore,
      level
    };
  }).sort((a, b) => b.riskScore - a.riskScore);
}


function rkSelectBalancedDistricts(districts) {
  const critical = districts.filter(d => d.level === "RISKY ZONE").slice(0, 2);
  const low = districts.filter(d => d.level === "LOW").slice(0, 2);
  const moderate = districts.filter(d => d.level === "MODERATE").slice(0, 2);

  const selected = [...critical, ...moderate, ...low];

  if (selected.length < 6) {
    const remaining = districts.filter(d => !selected.includes(d));
    selected.push(...remaining.slice(0, 6 - selected.length));
  }

  return selected;
}

function rkGenerateAISentence(d, scope = "district") {
  const label = scope === "state" ? "This state" : "This district";

  if (d.level === "CRITICAL") {
    if (d.bioPct >= 75)
      return `${label} shows overwhelming biometric dominance, indicating abnormal enrollment pressure.`;
    if (d.demoPct >= 65)
      return `${label} has unusually high demographic updates, suggesting delayed or bulk corrections.`;
    return `${label} exhibits a severe imbalance between update types, marking it as a high-risk anomaly zone.`;
  }

  if (d.level === "MODERATE") {
    return `${label} shows noticeable imbalance but remains within a controllable range.`;
  }

  return `${label} demonstrates stable and well-balanced enrollment activity.`;
}

function rkRenderCountryRiskCards() {
  const container = document.getElementById("rkRiskCards");
  if (!container) return;

  container.innerHTML = "";

  const states = Object.values(rkSTATE_MASTER);
  if (!states.length) return;

  const maxTotal = Math.max(
    ...states.map(s => s.biometric + s.demographic),
    1
  );

  const maxDisparity = Math.max(
    ...states.map(s => Math.abs(s.biometric - s.demographic)),
    1
  );

  states
    .map(s => {
      const total = s.biometric + s.demographic || 1;
      const bioRatio = s.biometric / total;
      const demoRatio = s.demographic / total;
      const disparity = Math.abs(s.biometric - s.demographic);

      const riskScore = Math.round(
        ((Math.abs(bioRatio - 0.5) * 2) * 0.45 +
          (disparity / maxDisparity) * 0.35 +
          (total / maxTotal) * 0.2) * 100
      );

      let level = "LOW";
      if (riskScore >= 70) level = "CRITICAL";
      else if (riskScore >= 40) level = "MODERATE";

      return {
        state: s.state,
        bioPct: Math.round(bioRatio * 100),
        demoPct: Math.round(demoRatio * 100),
        disparity,
        riskScore,
        level
      };
    })
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 6)
    .forEach(s => {
      const card = document.createElement("div");
      card.className = `rk-risk-card ${s.level.toLowerCase()}`;

      card.innerHTML = `
        <div class="rk-risk-header">
          <div>
            <div class="rk-risk-title">${s.state}</div>
            <div class="rk-risk-level">${s.level}</div>
          </div>
          <div class="rk-risk-score">${s.riskScore}%</div>
        </div>

        <div class="rk-risk-metrics">
          🧬 Biometric: ${s.bioPct}%<br>
          👤 Demographic: ${s.demoPct}%<br>
          ⚠️ Disparity: ${s.disparity.toLocaleString()}
        </div>

        <div class="rk-risk-bar">
          <span style="width:${s.riskScore}%"></span>
        </div>

        <div class="rk-risk-ai">
          🧠 ${rkGenerateAISentence(s, "state")}
        </div>
      `;

      card.onclick = () => {
        rkShowDistricts(s.state);
        rkRenderStateChart(s.state);
        rkRenderDistrictRiskCards(s.state);
      };

      container.appendChild(card);
    });
}


function rkRenderDistrictRiskCards(stateName) {
  const container = document.getElementById("rkRiskCards");
  if (!container) return;

  container.innerHTML = "";

  const allDistricts = rkComputeDistrictRisk(stateName);
  if (!allDistricts.length) return;

  const districts = rkSelectBalancedDistricts(allDistricts);

  districts.forEach(d => {
    const card = document.createElement("div");
    card.className = `rk-risk-card ${d.level.toLowerCase()}`;

    card.innerHTML = `
      <div class="rk-risk-header">
        <div>
          <div class="rk-risk-title">${d.district}</div>
          <div class="rk-risk-level">${d.level}</div>
        </div>
        <div class="rk-risk-score">${d.riskScore}%</div>
      </div>

      <div class="rk-risk-metrics">
        🧬 Biometric: ${d.bioPct}%<br>
        👤 Demographic: ${d.demoPct}%<br>
        ⚠️ Disparity: ${d.disparity.toLocaleString()}
      </div>

      <div class="rk-risk-bar">
        <span style="width:${d.riskScore}%"></span>
      </div>

      <div class="rk-risk-ai">
        🧠 ${rkGenerateAISentence(d, "district")}
      </div>
    `;

    card.onclick = () => rkRenderDistrictLineChart(d.district);
    container.appendChild(card);
  });
}
