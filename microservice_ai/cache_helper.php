<?php

function write_cache($filename, $data, $meta = []) {

    $CACHE_DIR = __DIR__ . "/../data_cache/";
    if (!is_dir($CACHE_DIR)) {
        mkdir($CACHE_DIR, 0775, true);
    }

    $path = $CACHE_DIR . $filename;
    $tmp  = $path . ".tmp";

    file_put_contents(
        $tmp,
        json_encode($data, JSON_PRETTY_PRINT)
    );

    rename($tmp, $path);

    if (!empty($meta)) {
        file_put_contents(
            $CACHE_DIR . str_replace(".json", "_meta.json", $filename),
            json_encode(array_merge([
                "generated_at" => date("Y-m-d H:i:s"),
                "rows" => is_array($data) ? count($data) : null
            ], $meta), JSON_PRETTY_PRINT)
        );
    }
}
