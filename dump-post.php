<?php
require 'wp-load.php';

$post = get_post(38);
if ($post) {
    echo "========= POST ID 38: " . $post->post_name ." =========\n";
    echo $post->post_content;
    echo "\n=============================================\n";
} else {
    echo "Post 38 not found.\n";
}
