<?php
require 'wp-load.php';

$post_id = 10;
global $post;
$post = get_post($post_id);
setup_postdata($post);

$markup = '<h1 class="wp-block-post-title">Contact</h1>';

$templates = array_merge( 
    get_block_templates( array(), 'wp_template' ), 
    get_block_templates( array(), 'wp_template_part' ) 
);
echo "Templates found: " . count($templates) . "\n";

foreach($templates as $t) {
    if ($t->slug == 'page') {
        echo "Found page template\n";
        $parsed = parse_blocks($t->content);
        
        // Let's do a dummy find
        function my_find_block($parsed_blocks, $target_html) {
            $norm_target = preg_replace( '/\s+/', ' ', trim($target_html) );
            foreach ( $parsed_blocks as $block ) {
                if ( empty( $block['blockName'] ) ) continue;
                $rendered = render_block( $block );
                $norm_rendered = preg_replace( '/\s+/', ' ', trim($rendered) );
                
                $fingerprint_rendered = preg_replace('/<([a-z0-9]+)[^>]*>/i', '<$1>', $norm_rendered);
                $fingerprint_target   = preg_replace('/<([a-z0-9]+)[^>]*>/i', '<$1>', $norm_target);
                
                if (strpos($fingerprint_rendered, $fingerprint_target) !== false) {
                    echo "MATCH! Fingerprint matched: $fingerprint_rendered vs $fingerprint_target \n";
                    return $block;
                }
                
                if ( ! empty( $block['innerBlocks'] ) ) {
                    $found = my_find_block($block['innerBlocks'], $target_html);
                    if ($found) return $found;
                }
            }
            return null;
        }

        $match = my_find_block($parsed, $markup);
        if ($match) {
            echo "MATCH FOUND in template!\n";
            print_r($match['blockName']);
            echo "\n";
        } else {
            echo "NOT FOUND in page template.\n";
            foreach($parsed as $b) {
               // echo "Block: " . $b['blockName'] . "\n";
            }
        }
    }
}
wp_reset_postdata();
