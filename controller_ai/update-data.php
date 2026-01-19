<?php
require '../config/db.php';
require '../microservice_ai/cache_helper.php';

try {
    $response = [];

    $geoSql = "
    WITH bio_agg AS (
      SELECT
        COALESCE(sm.canonical_name, b.state) AS state,
        COALESCE(
          dm.canonical_name,
          TRIM(REPLACE(b.district,'*',''))
        ) AS district,
        SUM(COALESCE(b.bio_age_0_5,0))  AS b05,
        SUM(COALESCE(b.bio_age_5_17,0)) AS b517
      FROM aadhaar_biometric_updates b
      LEFT JOIN state_master_v2 sm
        ON b.state = sm.raw_name
      LEFT JOIN district_master dm
        ON COALESCE(sm.canonical_name, b.state) = dm.state
       AND TRIM(REPLACE(b.district,'*','')) = dm.raw_name
      GROUP BY state, district
    ),
    demo_agg AS (
      SELECT
        COALESCE(sm.canonical_name, d.state) AS state,
        COALESCE(
          dm.canonical_name,
          TRIM(REPLACE(d.district,'*',''))
        ) AS district,
        SUM(COALESCE(d.demo_age_0_5,0))  AS d05,
        SUM(COALESCE(d.demo_age_5_17,0)) AS d517
      FROM aadhaar_demographic d
      LEFT JOIN state_master_v2 sm
        ON d.state = sm.raw_name
      LEFT JOIN district_master dm
        ON COALESCE(sm.canonical_name, d.state) = dm.state
       AND TRIM(REPLACE(d.district,'*','')) = dm.raw_name
      GROUP BY state, district
    )
    SELECT
      b.state,
      b.district,
      (b.b05 + b.b517) AS total_biometric,
      COALESCE(d.d05 + d.d517,0) AS total_demographic,
      (b.b05 + b.b517 + COALESCE(d.d05,0) + COALESCE(d.d517,0)) AS total_updates
    FROM bio_agg b
    LEFT JOIN demo_agg d
      ON b.state = d.state
     AND b.district = d.district";

    $geoData = $pdo->query($geoSql)->fetchAll(PDO::FETCH_ASSOC);

    $stateMap = [];
    foreach ($geoData as $row) {
        $st = $row['state'];
        if (!isset($stateMap[$st])) {
            $stateMap[$st] = ['state' => $st, 'total_updates' => 0];
        }
        $stateMap[$st]['total_updates'] += (int)$row['total_updates'];
    }

    $stateHeatmap = array_values($stateMap);
    $response['stateHeatmap'] = $stateHeatmap;
    $response['districtHeatmap'] = $geoData;

    $summary = $pdo->query("
    WITH combined AS (
      SELECT
        'bio' AS source,
        SUM(COALESCE(b.bio_age_0_5, 0)) AS age05,
        SUM(COALESCE(b.bio_age_5_17, 0)) AS age517
      FROM aadhaar_biometric_updates b
      GROUP BY source
      UNION ALL
      SELECT
        'demo' AS source,
        SUM(COALESCE(d.demo_age_0_5, 0)) AS age05,
        SUM(COALESCE(d.demo_age_5_17, 0)) AS age517
      FROM aadhaar_demographic d
      GROUP BY source
    )
    SELECT
      SUM(CASE WHEN source = 'bio' THEN (age05 + age517) ELSE 0 END) AS total_biometric,
      SUM(CASE WHEN source = 'demo' THEN (age05 + age517) ELSE 0 END) AS total_demographic,
      SUM(age05) AS age_0_5,
      SUM(age517) AS age_5_17
    FROM combined
    ")->fetch(PDO::FETCH_ASSOC);

    $response['pie'] = [
        'biometric'   => (int)$summary['total_biometric'],
        'demographic' => (int)$summary['total_demographic']
    ];

    $response['ageLine'] = [
        ['age_group' => '0-5',  'total' => (int)$summary['age_0_5']],
        ['age_group' => '5-17', 'total' => (int)$summary['age_5_17']]
    ];


   write_cache(
    "update-data.json",
    $response,
    [
        "type" => "geo + summary",
        "source" => "biometric + demographic"
    ]
);

} catch (PDOException $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
?>