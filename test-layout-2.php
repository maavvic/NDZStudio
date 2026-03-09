<?php
require_once('/var/www/html/wp-load.php');

$grammar = '<!-- wp:group {"layout":{"type":"flex"},"style":{"spacing":{"padding":{"top":"10px"}}}} -->
<div class="wp-block-group">HELLO</div>
<!-- /wp:group -->';

do_blocks($grammar);

echo "GLOBAL STYLESHEET:\n";
echo wp_get_global_stylesheet( ['types' => ['layout', 'variables']] );
echo "\n\nWP GET CUSTOM CSS:\n";
// Sometimes layout classes are part of the style engine store
if (class_exists('WP_Style_Engine')) {
    echo wp_style_engine_get_stylesheet_from_context('block-supports');
}

echo "\n\nGLOBALS:\n";
// Let's dump any global variable related to block supports
global $_wp_theme_json_root_block_supports;
print_r($_wp_theme_json_root_block_supports);

// Also look into wp_add_inline_style which writes to wp_styles
global $wp_styles;
if(isset($wp_styles->registered['wp-block-library'])) {
    print_r($wp_styles->registered['wp-block-library']->extra);
}
