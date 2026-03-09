<?php
require_once('/var/www/html/wp-load.php');

$templates = get_block_templates( array(), 'wp_template_part' );
foreach($templates as $t) {
    echo "ID: {$t->wp_id} | Slug: {$t->slug} | Area: {$t->area}\n";
    if ($t->slug === 'footer') {
        echo "--- CONTENT ---\n";
        echo $t->content;
        echo "\n----------------\n";
    }
}
