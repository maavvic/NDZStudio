<?php
require 'wp-load.php';

$query = new WP_Query([
    'post_type' => ['wp_template', 'wp_template_part'],
    'posts_per_page' => -1,
    'post_status' => 'any'
]);

echo "Found " . $query->post_count . " custom templates/parts in DB.\n";
foreach($query->posts as $p) {
    echo "ID: $p->ID | Type: $p->post_type | Name: $p->post_name | Status: $p->post_status\n";
    $terms = wp_get_object_terms($p->ID, 'wp_theme');
    echo "  Theme Terms: ";
    if (!empty($terms) && !is_wp_error($terms)) {
        $term_names = array_map(function($t) { return $t->name; }, $terms);
        echo implode(', ', $term_names);
    } else {
        echo "None";
    }
    echo "\n";
}
