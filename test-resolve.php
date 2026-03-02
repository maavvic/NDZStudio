<?php
require 'wp-load.php';

$post_id = 10; // The post ID the user is editing
$post = get_post($post_id);

echo "Finding templates for post_type: " . $post->post_type . "\n\n";

if (function_exists('get_block_templates')) {
    $templates = get_block_templates( array(), 'wp_template' );
    foreach($templates as $t) {
        if (strpos($t->content, 'core/post-title') !== false) {
            echo "- Contains Title: " . $t->slug . " (Source: " . $t->source . ")\n";
        }
    }
}
