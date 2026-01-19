<?php
require "../config/db.php";
require "../microservice_ai/cache_helper.php";
$response = [];

$districtAgeSql = "
SELECT
  state,
  district,
  SUM(age_0_5)     AS age_0_5,
  SUM(age_5_17)    AS age_5_17,
  SUM(age_18_plus) AS age_18_plus
FROM (

  /* biometric */
  SELECT
    COALESCE(sm.canonical_name, b.state)     AS state,
    COALESCE(dm.canonical_name, b.district)  AS district,
    b.bio_age_0_5  AS age_0_5,
    b.bio_age_5_17 AS age_5_17,
    0              AS age_18_plus
  FROM aadhaar_biometric_updates b
  LEFT JOIN state_master_v2 sm
    ON sm.raw_name = b.state
  LEFT JOIN district_master dm
    ON dm.raw_name = b.district
   AND dm.state = COALESCE(sm.canonical_name, b.state)
  WHERE b.state REGEXP '[A-Za-z]'
    AND b.district REGEXP '[A-Za-z]'

  UNION ALL

  /* demographic */
  SELECT
    COALESCE(sm.canonical_name, d.state),
    COALESCE(dm.canonical_name, d.district),
    d.demo_age_0_5,
    d.demo_age_5_17,
    0
  FROM aadhaar_demographic d
  LEFT JOIN state_master_v2 sm
    ON sm.raw_name = d.state
  LEFT JOIN district_master dm
    ON dm.raw_name = d.district
   AND dm.state = COALESCE(sm.canonical_name, d.state)
  WHERE d.state REGEXP '[A-Za-z]'
    AND d.district REGEXP '[A-Za-z]'

  UNION ALL

  /* enrolment */
  SELECT
    COALESCE(sm.canonical_name, e.state),
    COALESCE(dm.canonical_name, e.district),
    0,
    0,
    e.age_18_greater
  FROM aadhaar_enrolment e
  LEFT JOIN state_master_v2 sm
    ON sm.raw_name = e.state
  LEFT JOIN district_master dm
    ON dm.raw_name = e.district
   AND dm.state = COALESCE(sm.canonical_name, e.state)
  WHERE e.state REGEXP '[A-Za-z]'
    AND e.district REGEXP '[A-Za-z]'

) z
GROUP BY state, district
";



$response["districtAge"] = $pdo->query($districtAgeSql)->fetchAll(PDO::FETCH_ASSOC);

$velocitySql = "
SELECT
  COALESCE(sm.canonical_name, b.state) AS state,
  COUNT(*) AS recent_updates
FROM aadhaar_biometric_updates b
LEFT JOIN state_master_v2 sm
  ON sm.raw_name = b.state
WHERE b.update_date >= CURDATE() - INTERVAL 7 DAY
  AND b.state REGEXP '[A-Za-z]'
GROUP BY state
";


$response["velocity"] = $pdo->query($velocitySql)->fetchAll(PDO::FETCH_ASSOC);

$stateRankSql = "
SELECT
  state,
  SUM(total_updates) AS total_updates,
  SUM(child_total)   AS child_total,
  SUM(velocity)      AS velocity,
  ROUND(
    (SUM(child_total) * 0.5) +
    (ABS(SUM(total_biometric) - SUM(total_demographic)) * 0.3) +
    (SUM(velocity) * 0.2)
  ) AS risk_score
FROM (

  /* biometric */
  SELECT
    COALESCE(sm.canonical_name, b.state) AS state,
    SUM(b.bio_age_0_5 + b.bio_age_5_17) AS total_biometric,
    0 AS total_demographic,
    SUM(b.bio_age_0_5 + b.bio_age_5_17) AS total_updates,
    COUNT(
      CASE WHEN b.update_date >= CURDATE() - INTERVAL 7 DAY THEN 1 END
    ) AS velocity,
    0 AS child_total
  FROM aadhaar_biometric_updates b
  LEFT JOIN state_master_v2 sm
    ON sm.raw_name = b.state
  WHERE b.state REGEXP '[A-Za-z]'
  GROUP BY state

  UNION ALL

  /* demographic */
  SELECT
    COALESCE(sm.canonical_name, d.state),
    0,
    SUM(d.demo_age_0_5 + d.demo_age_5_17),
    SUM(d.demo_age_0_5 + d.demo_age_5_17),
    0,
    SUM(d.demo_age_0_5 + d.demo_age_5_17)
  FROM aadhaar_demographic d
  LEFT JOIN state_master_v2 sm
    ON sm.raw_name = d.state
  WHERE d.state REGEXP '[A-Za-z]'
  GROUP BY state

) x
GROUP BY state
ORDER BY risk_score DESC
";

$response["stateRank"] = $pdo->query($stateRankSql)->fetchAll(PDO::FETCH_ASSOC);

write_cache(
    "risk.json",
    $response,
    [
        "type" => "risk + risk_score",
        "source" => "risk + age"
    ]
);

exit;
