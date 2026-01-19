<?php
require '../config/db.php';
require '../microservice_ai/cache_helper.php';

$states = $pdo->query("
  SELECT DISTINCT state
  FROM aadhaar_enrolment
")->fetchAll(PDO::FETCH_COLUMN);

foreach ($states as $state) {

  $stmt = $pdo->prepare("
    SELECT COUNT(*) 
    FROM aadhaar_enrolment
    WHERE state = ?
  ");
  $stmt->execute([$state]);
  $totalStateEnroll = (int)$stmt->fetchColumn();

  $nationalTotal = (int)$pdo
    ->query("SELECT COUNT(*) FROM aadhaar_enrolment")
    ->fetchColumn();

  $stateShare = ($nationalTotal > 0)
    ? round(($totalStateEnroll / $nationalTotal) * 100, 2)
    : 0;

  $stmt = $pdo->prepare("
    SELECT district, COUNT(*) AS total
    FROM aadhaar_enrolment
    WHERE state = ?
    GROUP BY district
    ORDER BY total DESC
    LIMIT 1
  ");
  $stmt->execute([$state]);
  $topDistrict = $stmt->fetch(PDO::FETCH_ASSOC);

  $topDistrictName  = $topDistrict['district'] ?? null;
  $topDistrictTotal = (int)($topDistrict['total'] ?? 0);

  $districtShare = ($topDistrictTotal > 0 && $totalStateEnroll > 0)
    ? round(($topDistrictTotal / $totalStateEnroll) * 100, 1)
    : 0;

  $stmt = $pdo->prepare("
    SELECT 
      COALESCE(SUM(age_0_5),0) AS a0_5,
      COALESCE(SUM(age_5_17),0) AS a5_17,
      COALESCE(SUM(age_18_greater),0) AS a18
    FROM aadhaar_enrolment
    WHERE state = ?
  ");
  $stmt->execute([$state]);
  $age = $stmt->fetch(PDO::FETCH_ASSOC);

  $totalAge = array_sum($age);

  $agePerc = [
    '0_5'  => $totalAge > 0 ? round(($age['a0_5'] / $totalAge) * 100, 1) : 0,
    '5_17' => $totalAge > 0 ? round(($age['a5_17'] / $totalAge) * 100, 1) : 0,
    '18+'  => $totalAge > 0 ? round(($age['a18'] / $totalAge) * 100, 1) : 0,
  ];

  $currentYear = date('Y');
  $lastYear = $currentYear - 1;

  $stmt = $pdo->prepare("
    SELECT COUNT(*) 
    FROM aadhaar_enrolment
    WHERE state = ? AND RIGHT(enrolment_date,4) = ?
  ");

  $stmt->execute([$state, (string)$currentYear]);
  $currentYearCount = (int)$stmt->fetchColumn();

  $stmt->execute([$state, (string)$lastYear]);
  $lastYearCount = (int)$stmt->fetchColumn();

  $growth = ($lastYearCount > 0)
    ? round((($currentYearCount - $lastYearCount) / $lastYearCount) * 100, 1)
    : 0;

  $riskLevel = 'low';
  if ($districtShare > 40) $riskLevel = 'high';
  elseif ($districtShare > 25) $riskLevel = 'moderate';

  write_cache(
    "state_insights/" . str_replace(' ', '_', strtolower($state)) . ".json",
    [
      'state' => $state,
      'metrics' => [
        'total_enrollments' => $totalStateEnroll,
        'state_share_percent' => $stateShare,
        'top_district' => [
          'name' => $topDistrictName,
          'share_percent' => $districtShare
        ],
        'age_distribution_percent' => $agePerc,
        'yoy_growth_percent' => $growth,
        'risk_level' => $riskLevel
      ]
    ]
  );
}
