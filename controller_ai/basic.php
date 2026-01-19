<?php
require '../config/db.php';
header('Content-Type: application/json');

$currentYear = date('Y');
$lastYear = $currentYear - 1;

$totalEnroll = $pdo->query("
  SELECT COUNT(*) 
  FROM aadhaar_enrolment
")->fetchColumn();

$lastEnroll = $pdo->query("
  SELECT COUNT(*) 
  FROM aadhaar_enrolment
  WHERE YEAR(STR_TO_DATE(enrolment_date, '%d-%m-%Y')) = $lastYear
")->fetchColumn();

$totalUpdates = $pdo->query("
  SELECT 
    (
      SELECT COUNT(*) 
      FROM aadhaar_demographic
      WHERE STR_TO_DATE(update_date, '%d-%m-%Y')
            >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
    )
    +
    (
      SELECT COUNT(*) 
      FROM aadhaar_biometric_updates
      WHERE STR_TO_DATE(update_date, '%d-%m-%Y')
            >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
    )
")->fetchColumn();

$growth = $lastEnroll > 0
  ? round((($totalEnroll - $lastEnroll) / $lastEnroll) * 100, 1)
  : 0;

$ratio = $totalEnroll > 0
  ? round($totalUpdates / $totalEnroll, 2)
  : 0;

echo json_encode([
  'total_enrollments' => (int)$totalEnroll,
  'enrollment_growth' => $growth,
  'total_updates' => (int)$totalUpdates,
  'update_ratio' => $ratio . '%'
]);
