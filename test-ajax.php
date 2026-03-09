<?php
$url = 'http://localhost:9200/wp-admin/admin-ajax.php';
$data = array(
    'action' => 'aipg_studio_contextual_edit',
    'nonce' => 'fake_nonce',
    'prompt' => 'test test',
    'markup' => '<div>test</div>',
    'post_id' => 1
);

$options = array(
    'http' => array(
        'header'  => "Content-type: application/x-www-form-urlencoded\r\n",
        'method'  => 'POST',
        'content' => http_build_query($data)
    )
);
$context  = stream_context_create($options);
$result = @file_get_contents($url, false, $context);
$headers = $http_response_header;

echo "Response Body: " . $result . "\n";
echo "Response Headers:\n";
print_r($headers);
