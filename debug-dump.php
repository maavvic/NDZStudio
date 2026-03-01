<?php
require_once('wp-load.php');
if (!is_user_logged_in() && !defined('AIPG_DEBUG_ALLOW')) {
    // die('Access denied');
}

$pages = get_posts([
    'post_type' => 'page',
    'meta_key' => '_aipg_studio_page',
    'posts_per_page' => -1
]);

echo "--- AI Studio Pages Content Dump ---\n\n";

foreach ($pages as $page) {
    echo "ID: " . $page->ID . "\n";
    echo "Title: " . $page->post_title . "\n";
    echo "Slug: " . $page->post_name . "\n";
    echo "Content:\n";
    echo "====================================\n";
    echo $page->post_content . "\n";
    echo "====================================\n\n";
}
