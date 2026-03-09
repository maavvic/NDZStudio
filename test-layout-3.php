<?php
require_once('/var/www/html/wp-load.php');

$grammar = '<!-- wp:group {"layout":{"type":"flex"},"style":{"spacing":{"padding":{"top":"10px"}}}} -->
<div class="wp-block-group">HELLO</div>
<!-- /wp:group -->';

do_blocks($grammar);

echo "STORE:\n";
if (class_exists('WP_Style_Engine')) {
    $store = WP_Style_Engine::get_store('block-supports');
    print_r($store->get_all_rules());
}
