<?php
if (php_sapi_name() !== 'cli') {
    http_response_code(403);
    exit("CLI only");
}

echo "Cache build started...\n";

require_once __DIR__ . "/update-data.php";
require_once __DIR__ . "/risk.php";
require_once __DIR__ . "/insight_ai.php";
require_once __DIR__ . "/basic.php";
require_once __DIR__ . "/api.php";

echo "Cache build completed\n";
