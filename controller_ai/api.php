<?php
require '../config/db.php';
header('Content-Type: application/json');

$state = $_GET['state'] ?? null;


$topStates = $pdo->query("
    SELECT 
        state,
        SUM(age_0_5 + age_5_17 + age_18_greater) AS total
    FROM aadhaar_enrolment
    GROUP BY state
    ORDER BY total DESC
    LIMIT 6
")->fetchAll(PDO::FETCH_ASSOC);

$response = [
    'topStates'     => $topStates,
    'topDistricts' => [],
    'ageGroups'    => [],
    'trend'        => []
];

if ($state) {

    $stmt = $pdo->prepare("
        SELECT 
            district,
            SUM(age_0_5 + age_5_17 + age_18_greater) AS total
        FROM aadhaar_enrolment
        WHERE state = ?
        GROUP BY district
        ORDER BY total DESC
        LIMIT 7
    ");
    $stmt->execute([$state]);
    $response['topDistricts'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $stmt = $pdo->prepare("
        SELECT 
            COALESCE(SUM(age_0_5),0) AS age_0_5,
            COALESCE(SUM(age_5_17),0) AS age_5_17,
            COALESCE(SUM(age_18_greater),0) AS age_18_plus
        FROM aadhaar_enrolment
        WHERE state = ?
    ");
    $stmt->execute([$state]);
    $response['ageGroups'] = $stmt->fetch(PDO::FETCH_ASSOC);

$stmt = $pdo->prepare("
    SELECT SUM(age_0_5 + age_5_17 + age_18_greater)
    FROM aadhaar_enrolment
    WHERE state = ?
");
$stmt->execute([$state]);
$current = (int) $stmt->fetchColumn();

$trendModel = [
    2021 => ['factor' => 0.38, 'gap' => 1.29],
    2022 => ['factor' => 0.52, 'gap' => 1.31],
    2023 => ['factor' => 0.68, 'gap' => 1.16],
    2024 => ['factor' => 0.83, 'gap' => 1.25],
    2025 => ['factor' => 1.00, 'gap' => 1.35]
];

$response['trend'] = [];

foreach ($trendModel as $year => $model) {
    $enrolled = round($current * $model['factor']);
    $expected = round($enrolled * $model['gap']);

    $response['trend'][] = [
        'year' => $year,
        'enrolled' => $enrolled,
        'expected_population' => $expected
    ];
}

}


echo json_encode($response);


