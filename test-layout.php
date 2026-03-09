<?php
require_once('/var/www/html/wp-load.php');

$grammar = '<!-- wp:group {"align":"full","style":{"color":{"background":"#8b1a00"}},"layout":{"type":"flex","flexWrap":"nowrap","justifyContent":"space-between","verticalAlignment":"center"}} -->
<div class="wp-block-group alignfull has-background" style="background-color:#8b1a00;">HELLO</div>
<!-- /wp:group -->';

echo "RENDERED MARKUP:\n";
$html = do_blocks($grammar);
echo $html;

echo "\n\nSTYLESHEET:\n";
global $wp_styles;
if ( isset( $wp_styles->registered['wp-block-library'] ) ) {
    print_r( $wp_styles->registered['wp-block-library']->extra );
} else {
    echo "NO wp-block-library styles registered.";
}
