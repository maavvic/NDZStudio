<?php
/**
 * Plugin Name: AI Studio Generator
 * Description: Generates and installs new plugins based on AI prompts via intermediary API.
 * Version: 1.1.4
 * Author: Piotr Grzywacz / NoDevZone
 * Author URI: https://www.nodevzone.com
 * Text Domain: ai-studio-generator
 * License: GPLv2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 */

define( 'AIPG_VERSION', '1.2.4' );

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

// 0. Include Modules
require_once plugin_dir_path( __FILE__ ) . 'inc/admin-wizard.php';

// 1. Plugin Activation - Create Database Table
register_activation_hook( __FILE__, 'aipg_create_database_table' );



function aipg_create_database_table() {
    global $wpdb;
    $table_name = $wpdb->prefix . 'ai_plugins';
    $charset_collate = $wpdb->get_charset_collate();

    $sql = "CREATE TABLE $table_name (
        id mediumint(9) NOT NULL AUTO_INCREMENT,
        slug varchar(100) NOT NULL UNIQUE,
        external_project_id varchar(255) DEFAULT '' NOT NULL,
        active_version_remote_id varchar(255) DEFAULT '' NOT NULL,
        name varchar(255) NOT NULL,
        version varchar(20) DEFAULT '1.0.0',
        description longtext,
        code longtext NOT NULL,
        last_synced_at datetime DEFAULT '0000-00-00 00:00:00' NOT NULL,
        created_at datetime DEFAULT CURRENT_TIMESTAMP,
        modified_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY  (id)
    ) $charset_collate;";

    require_once ABSPATH . 'wp-admin/includes/upgrade.php';
    dbDelta( $sql );

    // Also create projects table
    $table_projects = $wpdb->prefix . 'aipg_projects';
    $sql_projects = "CREATE TABLE $table_projects (
        id mediumint(9) NOT NULL AUTO_INCREMENT,
        time datetime DEFAULT '0000-00-00 00:00:00' NOT NULL,
        name varchar(255) NOT NULL,
        screenshot_url text,
        snapshot longtext NOT NULL,
        PRIMARY KEY  (id)
    ) $charset_collate;";
    dbDelta( $sql_projects );
}

// 2. Admin Menu Setup
add_action( 'admin_menu', 'aipg_add_admin_menu' );

// 2.1 Enqueue Admin Assets
add_action( 'admin_enqueue_scripts', 'aipg_enqueue_admin_assets' );

// 2.2 Redirect to Wizard if no projects exist - Disabled to allow direct access to Features Generator
// add_action( 'admin_init', 'aipg_maybe_redirect_to_wizard' );

function aipg_enqueue_admin_assets( $hook ) {
    // New menu hooks: 
    // Parent/Studio: toplevel_page_nodevzone
    // Features Generator: nodevzone_page_ai-generator
    $is_generator = ( 'nodevzone_page_ai-generator' === $hook );
    $is_wizard    = ( 'toplevel_page_nodevzone' === $hook || strpos($hook, 'nodevzone') !== false );

    if ( ! $is_generator && ! $is_wizard ) {
        return;
    }

    if ( $is_generator ) {
        wp_enqueue_style( 'aipg-admin-style', plugins_url( 'assets/css/admin-style.css', __FILE__ ), [], AIPG_VERSION );
        wp_enqueue_script( 'aipg-admin-script', plugins_url( 'assets/js/admin-script.js', __FILE__ ), [ 'jquery' ], AIPG_VERSION, true );
        
        wp_localize_script( 'aipg-admin-script', 'aipg_vars', [
            'nonce' => wp_create_nonce( 'aipg_ajax_nonce' ),
            'i18n' => [
                'loadingMessages' => [
                    esc_html__( 'Still working on your plugin...', 'ai-studio-generator' ),
                    esc_html__( 'Designing the architecture...', 'ai-studio-generator' ),
                    esc_html__( 'Applying best practices...', 'ai-studio-generator' ),
                    esc_html__( 'Ensuring WordPress compatibility...', 'ai-studio-generator' ),
                    esc_html__( 'Writing clean code for you...', 'ai-studio-generator' ),
                    esc_html__( 'The AI is carefully crafting every line...', 'ai-studio-generator' ),
                    esc_html__( 'Polishing the features...', 'ai-studio-generator' ),
                    esc_html__( 'Almost there, stay tuned!', 'ai-studio-generator' ),
                    esc_html__( 'The AI is deep in thought...', 'ai-studio-generator' ),
                    esc_html__( 'Refining the user interface...', 'ai-studio-generator' ),
                    esc_html__( 'Checking for any potential issues...', 'ai-studio-generator' ),
                    esc_html__( 'Preparing the installation package...', 'ai-studio-generator' ),
                    esc_html__( 'Great things take a little time!', 'ai-studio-generator' ),
                    esc_html__( 'Almost ready to ship!', 'ai-studio-generator' ),
                ],
                'remote' => esc_html__( 'Remote', 'ai-studio-generator' ),
                'install' => esc_html__( 'Install', 'ai-studio-generator' ),
                'history' => esc_html__( 'History', 'ai-studio-generator' ),
                'syncing' => esc_html__( 'Syncing...', 'ai-studio-generator' ),
                'syncFailed' => esc_html__( 'Sync failed: ', 'ai-studio-generator' ),
                'syncServerError' => esc_html__( 'Sync failed due to a server error.', 'ai-studio-generator' ),
                'installing' => esc_html__( 'Installing...', 'ai-studio-generator' ),
                'installFailed' => esc_html__( 'Installation failed: ', 'ai-studio-generator' ),
                'installServerError' => esc_html__( 'Installation failed due to a server error.', 'ai-studio-generator' ),
                'deletePluginTitle' => esc_html__( 'Delete Plugin?', 'ai-studio-generator' ),
                /* translators: %s: Plugin Name */
                'deletePluginMsg' => esc_html__( 'This will deactivate "%s" and remove its files. The project will remain in your AI Hub.', 'ai-studio-generator' ),
                'delete' => esc_html__( 'Delete', 'ai-studio-generator' ),
                'chars' => esc_html__( 'chars', 'ai-studio-generator' ),
                'generating' => esc_html__( 'Generating and installing your plugin...', 'ai-studio-generator' ),
                'startingUp' => esc_html__( 'Starting up...', 'ai-studio-generator' ),
                'modifying' => esc_html__( 'Modifying: ', 'ai-studio-generator' ),
                'noPrevPrompt' => esc_html__( 'No previous prompt stored.', 'ai-studio-generator' ),
                'loadingCode' => esc_html__( 'Loading code...', 'ai-studio-generator' ),
                'error' => esc_html__( 'Error: ', 'ai-studio-generator' ),
                'analyzing' => esc_html__( 'Analyzing request...', 'ai-studio-generator' ),
                'updating' => esc_html__( 'Updating plugin code...', 'ai-studio-generator' ),
                'restored' => esc_html__( 'Successfully restored! Reloading...', 'ai-studio-generator' ),
                'loadingPolicies' => esc_html__( 'Loading policies...', 'ai-studio-generator' ),
                'errorPolicies' => esc_html__( 'Error loading policies: ', 'ai-studio-generator' ),
                'savingPref' => esc_html__( 'Saving your preference...', 'ai-studio-generator' ),
                'loadingHistory' => esc_html__( 'Loading version history...', 'ai-studio-generator' ),
                'noHistory' => esc_html__( 'No history found.', 'ai-studio-generator' ),
                'active' => esc_html__( 'Active', 'ai-studio-generator' ),
                'restore' => esc_html__( 'Restore', 'ai-studio-generator' ),
                'restoreTitle' => esc_html__( 'Restore Version?', 'ai-studio-generator' ),
                'restoreMsg' => esc_html__( 'This will overwrite your current plugin code with the selected version.', 'ai-studio-generator' ),
                'restoring' => esc_html__( 'Restoring...', 'ai-studio-generator' ),
                'deletionFailed' => esc_html__( 'Deletion failed: ', 'ai-studio-generator' ),
                'deletionServerError' => esc_html__( 'Deletion failed due to a server error.', 'ai-studio-generator' ),
                'passed' => esc_html__( 'Passed', 'ai-studio-generator' ),
                'warning' => esc_html__( 'Warning', 'ai-studio-generator' ),
                'failed' => esc_html__( 'Failed', 'ai-studio-generator' )
            ]
        ] );
    }

    if ( $is_wizard ) {
        wp_enqueue_style( 'wp-studio-wizard-style', plugins_url( 'assets/css/wizard-styles.css', __FILE__ ), [], AIPG_VERSION );
        // Change handle to -v3 to force refresh
        wp_enqueue_script( 'wp-studio-wizard-script-v3', plugins_url( 'assets/js/admin-wizard.js', __FILE__ ), [ 'jquery' ], uniqid(), true );

        // Use a new variable name aipg_wizard_data to avoid clashes with any cached aipg_vars
        wp_localize_script( 'wp-studio-wizard-script-v3', 'aipg_wizard_data', [
            'ajax_url'      => admin_url( 'admin-ajax.php' ),
            'nonce'         => wp_create_nonce( 'aipg_ajax_nonce' ),
            'api_url'       => get_option( 'aipg_api_url', 'http://host.docker.internal:8000/' ),
            'cache_bust'    => time()
        ] );
    }
}

/**
 * Enqueue AI Studio Editor Overlay on Frontend
 */
add_action( 'wp_enqueue_scripts', 'aipg_enqueue_studio_editor' );
function aipg_enqueue_studio_editor() {
    if ( ! is_user_logged_in() || ! current_user_can( 'manage_options' ) ) return;
    
    // Use queried object ID for better reliability on front page
    $post_id = get_queried_object_id();
    if ( ! $post_id ) return;

    // Check if this is an AI Studio generated page
    if ( ! get_post_meta( $post_id, '_aipg_studio_page', true ) ) return;

    // Base Editor scripts
    wp_enqueue_style( 'aipg-studio-editor-style', plugin_dir_url( __FILE__ ) . 'assets/css/ai-editor.css', [], AIPG_VERSION );
    wp_enqueue_script( 'aipg-studio-editor-script', plugin_dir_url( __FILE__ ) . 'assets/js/ai-editor-overlay.js', [ 'jquery' ], uniqid(), true );

    // Enqueue CSS Reset if Theme Strategy falls back to Add to Existing
    $theme_strategy = get_option( 'aipg_studio_theme_strategy', 'normalize_css' );
    if ( $theme_strategy === 'normalize_css' ) {
        wp_enqueue_style( 'aipg-studio-normalize', plugin_dir_url( __FILE__ ) . 'assets/css/ai-normalize.css', [], AIPG_VERSION );
    }

    wp_localize_script( 'aipg-studio-editor-script', 'aipg_editor_vars', [
        'ajaxurl'    => admin_url( 'admin-ajax.php' ),
        'nonce'      => wp_create_nonce( 'aipg_editor_nonce' ),
        'post_id'    => $post_id,
        'wizard_url' => admin_url( 'admin.php?page=nodevzone' )
    ]);

    // Diagnostic log in footer for admin
    add_action('wp_footer', function() {
        echo '<!-- AI Studio Editor Active -->';
    }, 999);
}

/**
 * Inject AI Studio Theme Tokens as CSS Variables
 */
add_action( 'wp_head', 'aipg_inject_studio_custom_styles', 100 );
function aipg_inject_studio_custom_styles() {
    $post_id = get_queried_object_id();
    if ( ! $post_id || ! get_post_meta( $post_id, '_aipg_studio_page', true ) ) return;

    $theme_config = get_option( 'aipg_studio_theme_config', [] );
    if ( empty( $theme_config ) ) return;

    $css = ":root {\n";
    
    // 1. Process Color Palette
    if ( isset( $theme_config['settings']['color']['palette'] ) ) {
        foreach ( $theme_config['settings']['color']['palette'] as $color ) {
            $slug = $color['slug'];
            $hex  = $color['color'];
            $css .= "  --wp--preset--color--{$slug}: {$hex} !important;\n";
        }
    }

    // 2. Process Typography (if any)
    if ( isset( $theme_config['settings']['typography']['fontFamilies'] ) ) {
        foreach ( $theme_config['settings']['typography']['fontFamilies'] as $font ) {
            $slug = $font['slug'];
            $fam  = $font['fontFamily'];
            $css .= "  --wp--preset--font-family--{$slug}: {$fam} !important;\n";
        }
    }

    $css .= "}\n";

    // Also inject a helper to ensure blocks use these colors if the theme is stubborn
    $css .= "body.aipg-studio-preview { background-color: var(--wp--preset--color--base, #fff); color: var(--wp--preset--color--contrast, #333); }\n";

    echo "<style id='aipg-studio-dynamic-styles'>\n{$css}\n</style>\n";
}

/**
 * Add body class for AI Studio pages
 */
add_filter( 'body_class', 'aipg_studio_body_class' );
function aipg_studio_body_class( $classes ) {
    $post_id = get_queried_object_id();
    if ( $post_id && get_post_meta( $post_id, '_aipg_studio_page', true ) ) {
        $classes[] = 'aipg-studio-preview';
    }
    return $classes;
}



function aipg_add_admin_menu() {
    $cap = get_option( 'aipg_access_capability', 'manage_options' );
    if ( empty( $cap ) ) {
        $cap = 'manage_options';
    }

    $icon_svg = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTQgNFYyME00IDRMMjAgMjBNMjAgMjBWNCIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+CjxjaXJjbGUgY3g9IjQiIGN5PSI0IiByPSIyIiBmaWxsPSJjdXJyZW50Q29sb3IiLz4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMiIgZmlsbD0iY3VycmVudENvbG9yIi8+Cjwvc3ZnPg==';

    // 1. Parent Menu: NoDevZone
    add_menu_page(
        'NoDevZone',
        'NoDevZone',
        $cap,
        'nodevzone',
        'aipg_render_wizard_page',
        $icon_svg,
        2
    );

    // 2. Submenu 1: AI Studio (Points to parent slug so it is the default landing page)
    add_submenu_page(
        'nodevzone',
        'AI Studio',
        'AI Studio',
        $cap,
        'nodevzone',
        'aipg_render_wizard_page'
    );

    // 3. Submenu 2: AI Features Generator (formerly PL Generator)
    add_submenu_page(
        'nodevzone',
        'AI Features Generator',
        'AI Features Generator',
        $cap,
        'ai-generator',
        'aipg_render_page'
    );
}

// Helper function to initiate an async job
function aipg_initiate_async_job($payload) {
    $license_key = get_option( 'aipg_license_key', '' );
    // DEV-START
    $api_url = get_option( 'aipg_api_url', 'http://host.docker.internal:8000/' );
    // DEV-END
    // PROD-API-URL: $api_url = 'https://app.nodevzone.com/';

    if ( empty( $license_key ) || empty( $api_url ) ) {
        return new WP_Error('config_missing', 'API URL and License Key must be configured.');
    }

    $init_response = wp_remote_post( rtrim( $api_url, '/' ) . '/api/jobs', [
        'method'  => 'POST',
        'body'    => json_encode([ 'prompt' => $payload ]),
        'headers' => [
            'Content-Type' => 'application/json',
            'X-License-Key' => $license_key,
            'X-Plugin-Version' => AIPG_VERSION
        ],
        'timeout' => 15
    ]);

    if ( is_wp_error( $init_response ) ) {
        return $init_response;
    }

    $init_status_code = wp_remote_retrieve_response_code( $init_response );
    $init_body = json_decode( wp_remote_retrieve_body( $init_response ), true );

    if ( $init_status_code >= 400 ) {
        $error_detail = $init_body['detail'] ?? 'Failed to initiate job.';
        if ( $init_status_code === 403 && is_array( $error_detail ) && isset( $error_detail['code'] ) && $error_detail['code'] === 'LEGAL_CONSENT_REQUIRED' ) {
            return new WP_Error( 'legal_consent_required', 'Legal consent required.', $error_detail );
        }
        if ( is_array( $error_detail ) ) {
             $error_detail = json_encode( $error_detail );
        }
        return new WP_Error('job_init_failed', 'API Error (' . $init_status_code . '): ' . $error_detail);
    }

    $job_id = $init_body['job_id'] ?? null;
    if ( ! $job_id ) {
        return new WP_Error('job_id_missing', 'API did not return a job_id.');
    }

    return $job_id;
}

// Helper function to poll job status
function aipg_poll_job_status($job_id) {
    $license_key = get_option( 'aipg_license_key', '' );
    // DEV-START
    $api_url = get_option( 'aipg_api_url', 'http://host.docker.internal:8000/' );
    // DEV-END
    // PROD-API-URL: $api_url = 'https://app.nodevzone.com/';

    $polling_url = rtrim( $api_url, '/' ) . '/api/jobs/' . $job_id;

    $poll_response = wp_remote_get( $polling_url, [
        'timeout' => 30,
        'headers' => [
            'X-License-Key' => $license_key,
            'X-Plugin-Version' => AIPG_VERSION
        ]
    ] );

    if ( is_wp_error( $poll_response ) ) {
        return $poll_response;
    }

    $poll_status_code = wp_remote_retrieve_response_code( $poll_response );
    $poll_body_raw = wp_remote_retrieve_body( $poll_response );
    $poll_body = json_decode( $poll_body_raw, true );

    if ( $poll_status_code !== 200 ) {
        $error_detail = $poll_body['detail'] ?? 'Polling failed with an unexpected status code.';
        if ( is_array( $error_detail ) ) {
             $error_detail = json_encode( $error_detail );
        }
        return new WP_Error('polling_failed', 'API Error (' . $poll_status_code . '): ' . $error_detail);
    }

    return $poll_body;
}

// 3. Check Intermediary API Connection
function aipg_check_api_connection() {
    $license_key = get_option( 'aipg_license_key', '' );
    // DEV-START
    $api_url = get_option( 'aipg_api_url', 'http://host.docker.internal:8000/' );
    // DEV-END
    // PROD-API-URL: $api_url = 'https://app.nodevzone.com/';
    
    if ( empty( $license_key ) ) {
        return array( 'connected' => false, 'message' => 'No License Key configured. Please save a valid key.' );
    }
    if ( empty( $api_url ) ) {
        return array( 'connected' => false, 'message' => 'No API URL configured' );
    }
    
    // Use GET request to the new verification endpoint
    $response = wp_remote_get( rtrim( $api_url, '/' ) . '/api/verify-license', [
        'timeout' => 10,
        'headers' => [
            'X-License-Key' => $license_key,
            'X-Plugin-Version' => AIPG_VERSION
        ]
    ]);

    if ( is_wp_error( $response ) ) {
        $detailed_message = sprintf(
            "Could not connect to the intermediary API server. This is often a network issue.<br><strong>Error Details:</strong> %s",
            esc_html($response->get_error_message())
        );
        return array( 'connected' => false, 'message' => $detailed_message );
    }

    $status_code = wp_remote_retrieve_response_code( $response );
    $response_body = wp_remote_retrieve_body( $response );
    $body = json_decode( $response_body, true );

    // Check for a successful response AND a valid license in the body
    if ( $status_code === 200 && isset($body['valid']) && $body['valid'] === true ) {
        $message = 'License is valid and active.';
        if(isset($body['email'])) {
            $message .= ' Licensed to: ' . esc_html($body['email']);
        }
        // Check for 'available_tokens' (backend preference) or fallback to 'tokens_remaining'
        $tokens = isset($body['available_tokens']) ? intval($body['available_tokens']) : (isset($body['tokens_remaining']) ? intval($body['tokens_remaining']) : null);
        
        // Handle Update Check
        if ( isset( $body['update'] ) && ! empty( $body['update'] ) ) {
            update_option( 'aipg_update_info', $body['update'] );
            // Force refresh WP update cache
            delete_site_transient( 'update_plugins' );
        } else {
            if ( get_option( 'aipg_update_info' ) ) {
                delete_option( 'aipg_update_info' );
                delete_site_transient( 'update_plugins' );
            }
        }

        return array( 'connected' => true, 'message' => $message, 'tokens' => $tokens, 'raw_response' => $response_body );
    } else {
        // Handle various error cases
        $error_from_api = $body['detail'] ?? 'The license key is invalid, expired, or the API returned an unexpected response.';
        if ($status_code === 200 && isset($body['valid']) && $body['valid'] === false) {
             $error_from_api = 'The license key is not active or invalid.';
        }

        // Simplified Error Message for UI
        if ($status_code === 401 || $status_code === 403) {
             $detailed_message = "License verification failed: " . esc_html($error_from_api);
        } else {
             $detailed_message = sprintf(
                "License verification failed (Status: %d): %s",
                $status_code,
                esc_html($error_from_api)
            );
        }
        return array( 'connected' => false, 'message' => $detailed_message, 'tokens' => null );
    }
}
/**
 * Validates user input according to requirements:
 * - Length checks
 * - Word counts
 * - Junk detection (unique character ratio and consecutive repeats)
 */
function aipg_validate_input($text, $type = 'new') {
    $text = trim($text);
    $length = mb_strlen($text);
    $word_count = count(preg_split('/\s+/u', $text, -1, PREG_SPLIT_NO_EMPTY));

    // 1. Minimum Length and Word Count
    if ($type === 'new') {
        if ($length < 100) return "Description is too short. Please provide at least 100 characters.";
        if ($word_count < 10) return "Please provide at least 10 words to describe the plugin.";
    } else {
        if ($length < 50) return "Request is too short. Please provide at least 50 characters.";
        if ($word_count < 5) return "Please provide at least 5 words for the modification request.";
    }

    // 2. Junk Detection: Unique Character Ratio (Spam check)
    if ($length > 50) {
        $chars = preg_split('//u', $text, -1, PREG_SPLIT_NO_EMPTY);
        $unique_chars = count(array_unique($chars));
        $ratio = $unique_chars / $length;

        $is_junk = false;
        if ($length < 300) {
            if ($ratio < 0.05) $is_junk = true;
        } else {
            // For long texts, 2% ratio OR at least 15 unique chars is fine
            if ($ratio < 0.02 && $unique_chars < 15) $is_junk = true;
        }

        if ($is_junk) {
            return "Input looks like junk (too few unique characters). Please write a meaningful description.";
        }
    }

    // 3. Junk Detection: Consecutive Repeats (e.g. "aaaaa")
    if (preg_match('/(.)\1{4,}/u', $text)) {
        return "Input contains too many repeating characters (e.g., 'aaaaa'). Please provide natural text.";
    }

    return true; // Valid
}

/**
 * Checks if the current user has permission to access the AI Generator based on saved settings.
 * Administrators ('manage_options') ALWAYS have access.
 */
function aipg_current_user_can_access() {
    $cap = get_option( 'aipg_access_capability', 'manage_options' );
    return current_user_can( $cap ) || current_user_can( 'manage_options' );
}

/**
 * Checks if the WordPress plugins directory is writable.
 */
function aipg_is_plugins_writable() {
    return wp_is_writable( WP_PLUGIN_DIR );
}

// Helper function to get system info as an array for the AI prompt
function aipg_get_system_info_array() {
    global $wp_version;

    // Get Theme Info
    $current_theme = wp_get_theme();

    // Get Active Plugins
    if ( ! function_exists( 'get_plugins' ) ) {
        require_once ABSPATH . 'wp-admin/includes/plugin.php';
    }
    $active_plugins_list = [];
    $active_plugins = (array) get_option('active_plugins', []);
    $all_plugins = get_plugins();

    foreach ($active_plugins as $plugin_file) {
        if (isset($all_plugins[$plugin_file])) {
            $plugin_data = $all_plugins[$plugin_file];
            $active_plugins_list[] = [
                'name' => $plugin_data['Name'],
                'version' => $plugin_data['Version']
            ];
        }
    }

    // Construct the array
    return [
        'wordpress_version' => $wp_version,
        'php_version' => phpversion(),
        'plugin_version' => AIPG_VERSION,
        'active_theme' => [
            'name' => $current_theme->get('Name'),
            'version' => $current_theme->get('Version')
        ],
        'active_plugins' => $active_plugins_list
    ];
}

// Helper to parse Name and Version from plugin code
function aipg_parse_plugin_headers($code) {
    $headers = [
        'Name' => 'Plugin Name',
        'Version' => 'Version'
    ];
    $data = [];
    foreach ($headers as $key => $regex) {
        if (preg_match('/^[ \t\/*#@]*' . preg_quote($regex, '/') . ':(.*)$/mi', $code, $match) && $match[1]) {
            $data[$key] = trim($match[1]);
        } else {
            $data[$key] = '';
        }
    }
    return $data;
}

// 4. AJAX Handler for Modifying Plugins
add_action( 'wp_ajax_aipg_modify_plugin', 'aipg_ajax_modify_plugin' );
function aipg_ajax_modify_plugin() {
    ob_start();
    if ( ! isset( $_POST['nonce'] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['nonce'] ) ), 'aipg_ajax_nonce' ) ) {
        wp_send_json_error( 'Invalid nonce.' );
    }

    if ( ! aipg_current_user_can_access() ) {
        wp_send_json_error( 'You do not have permission to modify plugins.' );
    }

    if ( ! aipg_is_plugins_writable() ) {
        wp_send_json_error( 'File system is not writable. Cannot update plugin.' );
    }

    $plugin_id = isset( $_POST['plugin_id'] ) ? intval( wp_unslash( $_POST['plugin_id'] ) ) : 0;
    $modification_prompt = isset( $_POST['modification_prompt'] ) ? sanitize_textarea_field( wp_unslash( $_POST['modification_prompt'] ) ) : '';

    // Backend Validation
    $validation_result = aipg_validate_input($modification_prompt, 'mod');
    if ($validation_result !== true) {
        wp_send_json_error($validation_result);
    }
    $license_key = get_option( 'aipg_license_key', '' );
    // DEV-START
    $api_url = get_option( 'aipg_api_url', 'http://host.docker.internal:8000/' );
    // DEV-END
    // PROD-API-URL: $api_url = 'https://app.nodevzone.com/';

    if ( empty( $license_key ) ) {
        wp_send_json_error( 'License Key not configured.' );
    }
    if ( empty( $api_url ) ) {
        wp_send_json_error( 'API URL not configured.' );
    }

    global $wpdb;
    // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
    $plugin = $wpdb->get_row( $wpdb->prepare( "SELECT * FROM {$wpdb->prefix}ai_plugins WHERE id = %d", $plugin_id ) );

    if ( ! $plugin ) {
        wp_send_json_error( 'Plugin not found.' );
    }

    $payload = [
        'system_info' => aipg_get_system_info_array(),
        'request_type' => 'modify_plugin',
        'project_id' => $plugin->external_project_id,
        'existing_code' => $plugin->code,
        'modification_prompt' => $modification_prompt
    ];

    // Use the new async job executor to get job_id
    $job_id_or_error = aipg_initiate_async_job($payload);

    if ( is_wp_error( $job_id_or_error ) ) {
        if ( $job_id_or_error->get_error_code() === 'legal_consent_required' ) {
            $data = $job_id_or_error->get_error_data();
            wp_send_json_error( [
                'code' => 'legal_consent_required',
                'missing' => $data['missing'] ?? []
            ] );
        }
        wp_send_json_error( $job_id_or_error->get_error_message() );
    }

    wp_send_json_success( [
        'job_id' => $job_id_or_error,
        'plugin_id' => $plugin_id,
        'message' => 'Job initiated successfully.'
    ] );
}

add_action( 'wp_ajax_aipg_check_modification_status', 'aipg_ajax_check_modification_status' );
function aipg_ajax_check_modification_status() {
    ob_start();
    if ( ! isset( $_POST['nonce'] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['nonce'] ) ), 'aipg_ajax_nonce' ) ) {
        wp_send_json_error( 'Invalid nonce.' );
    }

    if ( ! aipg_current_user_can_access() ) {
        wp_send_json_error( 'Permission denied.' );
    }

    $job_id = isset( $_POST['job_id'] ) ? sanitize_text_field( wp_unslash( $_POST['job_id'] ) ) : '';
    $plugin_id = isset( $_POST['plugin_id'] ) ? intval( wp_unslash( $_POST['plugin_id'] ) ) : 0;
    
    if ( empty($job_id) || empty($plugin_id) ) {
        wp_send_json_error( 'Missing parameters.' );
    }

    $status_data = aipg_poll_job_status($job_id);

    if ( is_wp_error( $status_data ) ) {
        wp_send_json_error( $status_data->get_error_message() );
    }

    if ( $status_data['status'] === 'PROCESSING' || $status_data['status'] === 'PENDING' ) {
        wp_send_json_success([
            'status' => $status_data['status'],
            'response' => $status_data['response'] ?? '',
            'correction_count' => $status_data['correction_count'] ?? 0
        ]);
    } elseif ( $status_data['status'] === 'FAILED' ) {
        wp_send_json_error( 'Generation failed due to an error on the AI side.' );
    } elseif ( $status_data['status'] === 'COMPLETED' ) {
        global $wpdb;
        // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
        $plugin = $wpdb->get_row( $wpdb->prepare( "SELECT * FROM {$wpdb->prefix}ai_plugins WHERE id = %d", $plugin_id ) );

        if ( ! $plugin ) {
            wp_send_json_error( 'Plugin not found.' );
        }

        $modified_code = isset($status_data['response']) ? html_entity_decode($status_data['response']) : null;
        if ( empty( $modified_code ) ) {
            wp_send_json_error( 'The AI response was received, but no code was found.' );
        }

        require_once ABSPATH . 'wp-admin/includes/file.php';
        WP_Filesystem();
        global $wp_filesystem;

        $plugin_slug = $plugin->slug;
        $file_path = WP_PLUGIN_DIR . '/' . $plugin_slug . '/' . $plugin_slug . '.php';

        if ( ! $wp_filesystem->put_contents( $file_path, $modified_code ) ) {
            wp_send_json_error( 'Could not update plugin file.' );
        }

        $active_version_remote_id = $status_data['version_id'] ?? '';
        $tokens_remaining = $status_data['tokens_remaining'] ?? null;

        $headers = aipg_parse_plugin_headers($modified_code);
        $new_name = !empty($headers['Name']) ? $headers['Name'] : $plugin->name;
        $new_version = !empty($headers['Version']) ? $headers['Version'] : '1.0.0';

        $modification_prompt = isset( $_POST['modification_prompt'] ) ? sanitize_textarea_field( wp_unslash( $_POST['modification_prompt'] ) ) : '';

        // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
        $updated = $wpdb->update(
            "{$wpdb->prefix}ai_plugins",
            [
                'code' => $modified_code,
                'name' => $new_name,
                'version' => $new_version,
                'active_version_remote_id' => $active_version_remote_id,
                'description' => $modification_prompt,
                'modified_at' => current_time( 'mysql' ),
                'last_synced_at' => current_time( 'mysql' )
            ],
            [ 'id' => $plugin_id ]
        );

        ob_get_clean();
        if ( false === $updated ) {
            wp_send_json_error( 'Failed to update plugin details in the database.' );
        }

        wp_send_json_success( [
            'status' => 'COMPLETED',
            'message' => 'Plugin modified successfully! Please reload the page to see changes.',
            'tokens_remaining' => $tokens_remaining
        ] );
    } else {
        wp_send_json_error( 'Unknown status: ' . ($status_data['status'] ?? 'None') );
    }
}
// 5. Ensure database table exists
function aipg_ensure_table_exists() {
    global $wpdb;
    $table_name = $wpdb->prefix . 'ai_plugins';
    
    // Check if table exists
    // phpcs:disable WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.DirectDatabaseQuery.SchemaChange, WordPress.DB.PreparedSQL.InterpolatedNotPrepared, PluginCheck.Security.DirectDB.UnescapedDBParameter
    if ( $wpdb->get_var( "SHOW TABLES LIKE '{$table_name}'" ) !== $table_name ) {
        // phpcs:enable
        aipg_create_database_table();
    } else {
        // Also check projects table
        $table_projects = $wpdb->prefix . 'aipg_projects';
        if ( $wpdb->get_var( "SHOW TABLES LIKE '{$table_projects}'" ) !== $table_projects ) {
            aipg_create_database_table();
        } else {
            // Table exists, check if new columns exist (simple migration check)
            // phpcs:disable WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.DirectDatabaseQuery.SchemaChange, WordPress.DB.PreparedSQL.InterpolatedNotPrepared, PluginCheck.Security.DirectDB.UnescapedDBParameter
            $column = $wpdb->get_results( "SHOW COLUMNS FROM {$table_name} LIKE 'external_project_id'" );
            $column_v = $wpdb->get_results( "SHOW COLUMNS FROM {$table_name} LIKE 'version'" );
            // phpcs:enable
            if ( empty( $column ) || empty( $column_v ) ) {
                aipg_create_database_table();
            }
        }
    }
}

// 5. Render License Screen
function aipg_render_license_screen($message = '') {
    $current_key = get_option( 'aipg_license_key', '' );
    // DEV-START
    $current_api_url = get_option( 'aipg_api_url', 'http://host.docker.internal:8000/' );
    // DEV-END
    ?>
    <style>
        /* Force reset for our container */
        .aipg-license-container {
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            min-height: 80vh !important;
            background: #fbfbfd !important; 
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif !important;
            margin: 0 !important;
            padding: 0 !important;
            position: relative !important;
            z-index: 9999 !important;
        }
        .aipg-license-card {
            background: #ffffff !important;
            padding: 64px 48px !important;
            border-radius: 32px !important;
            box-shadow: 0 10px 40px rgba(0,0,0,0.06) !important;
            width: 100% !important;
            max-width: 440px !important;
            text-align: center !important;
            box-sizing: border-box !important;
            border: 1px solid rgba(0,0,0,0.08) !important;
            margin: auto !important;
        }
        .aipg-license-title {
            font-size: 28px !important;
            font-weight: 400 !important;
            color: #1d1d1f !important;
            margin: 0 0 8px !important;
            letter-spacing: -0.02em !important;
            line-height: 1.2 !important;
        }
        .aipg-license-subtitle {
            font-size: 15px !important;
            color: #86868b !important;
            margin: 0 0 40px !important;
            font-weight: 400 !important;
            line-height: 1.4 !important;
        }
        .aipg-form-group {
            text-align: left !important;
            margin-bottom: 24px !important;
        }
        .aipg-label {
            display: block !important;
            font-size: 10px !important;
            font-weight: 600 !important;
            color: #86868b !important;
            text-transform: uppercase !important;
            letter-spacing: 0.08em !important;
            margin-bottom: 8px !important;
            padding-left: 4px !important;
        }
        .aipg-input-wrapper {
            position: relative !important;
        }
        input.aipg-input {
            width: 100% !important;
            padding: 16px 16px !important;
            font-size: 15px !important;
            color: #1d1d1f !important;
            background: #fbfbfd !important;
            border: 1px solid #d2d2d7 !important;
            border-radius: 12px !important;
            box-sizing: border-box !important;
            transition: all 0.2s ease !important;
            -webkit-appearance: none !important;
            box-shadow: none !important;
            margin: 0 !important;
            height: auto !important;
            line-height: normal !important;
        }
        input.aipg-input:focus {
            border-color: #0071e3 !important;
            background: #ffffff !important;
            outline: none !important;
            box-shadow: 0 0 0 4px rgba(0,113,227,0.12) !important;
        }
        input.aipg-input::placeholder {
            color: #a1a1a6 !important;
        }
        button.aipg-submit-btn {
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            width: 100% !important;
            padding: 16px !important;
            background: #1d1d1f !important;
            color: #ffffff !important;
            font-size: 15px !important;
            font-weight: 500 !important;
            border: none !important;
            border-radius: 12px !important;
            cursor: pointer !important;
            margin-top: 32px !important;
            transition: background 0.2s, transform 0.1s !important;
            text-decoration: none !important;
            height: auto !important;
            line-height: normal !important;
        }
        button.aipg-submit-btn:hover {
            background: #2e2e30 !important;
        }
        button.aipg-submit-btn:active {
            transform: scale(0.98) !important;
        }
        /* Wordpress UI Overrides */
    #wpfooter { display: none !important; }
    .update-nag { display: none !important; }
    
    .aipg-dashboard-wrapper {
        margin: 0 -20px -65px -20px !important;
        padding: 40px !important;
        }
        .aipg-arrow {
            margin-left: 8px !important;
            font-size: 16px !important;
            line-height: 1 !important;
        }
        a.aipg-footer-link {
            display: block !important;
            margin-top: 24px !important;
            font-size: 13px !important;
            color: #6e6e6e !important;
            text-decoration: none !important;
            transition: color 0.1s !important;
            font-weight: 500 !important;
            box-shadow: none !important;
        }
        a.aipg-footer-link:hover {
            color: #1d1d1f !important;
        }
        .aipg-error-msg, .aipg-updated-msg {
            padding: 14px 20px !important;
            border-radius: 12px !important;
            font-size: 14px !important;
            margin-bottom: 24px !important;
            text-align: left !important;
            display: flex !important;
            align-items: center !important; 
            line-height: 1.4 !important;
            border: 1px solid transparent !important;
        }
        .aipg-error-msg {
            background: #fff2f2 !important;
            color: #d70015 !important;
            border-color: #ffd6d6 !important;
        }
        .aipg-updated-msg {
            background: #f2faf2 !important;
            color: #008a00 !important;
            border-color: #d4edda !important;
        }
        /* Hide unwanted WP inputs if they leak */
        .aipg-license-card input[type=checkbox] { display: none !important; }
    </style>
    
    <div class="aipg-license-container">
        <div class="aipg-license-card">
            <h1 class="aipg-license-title"><?php esc_html_e( 'Hello again', 'ai-studio-generator' ); ?></h1>
            <p class="aipg-license-subtitle"><?php esc_html_e( 'Unlock your workspace to continue', 'ai-studio-generator' ); ?></p>
            
            <?php if (!empty($message)) : 
                $clean_message = wp_strip_all_tags($message);
                $is_error = (strpos($message, 'updated') === false && strpos($message, 'saved') === false);
                $msg_class = $is_error ? 'aipg-error-msg' : 'aipg-updated-msg';
                $icon = $is_error ? 'warning' : 'yes';
            ?>
                <div class="<?php echo esc_attr($msg_class); ?>">
                    <span class="dashicons dashicons-<?php echo esc_attr($icon); ?>" style="margin-right: 8px; font-size: 20px; width: 20px; height: 20px; flex-shrink: 0;"></span>
                    <span><?php echo esc_html( $clean_message ); ?></span>
                </div>
            <?php endif; ?>

            <form method="post">
                <?php wp_nonce_field( 'aipg_settings', 'aipg_s_nonce' ); ?>
                
                <div class="aipg-form-group">
                    <label class="aipg-label" for="aipg_license_key"><?php esc_html_e( 'LICENSE KEY', 'ai-studio-generator' ); ?></label>
                    <div class="aipg-input-wrapper">
                        <input type="password" name="aipg_license_key" id="aipg_license_key" class="aipg-input" value="<?php echo esc_attr( $current_key ); ?>" placeholder="<?php esc_attr_e( 'Enter your license key', 'ai-studio-generator' ); ?>" required>
                    </div>
                </div>

                <?php // DEV-START ?>
                <div class="aipg-form-group">
                     <label class="aipg-label" for="aipg_api_url">API URL <span style="font-weight:400; text-transform:none; color: #a1a1a6;">(Optional)</span></label>
                     <div class="aipg-input-wrapper">
                        <input type="url" name="aipg_api_url" id="aipg_api_url" class="aipg-input" value="<?php echo esc_attr( $current_api_url ); ?>" placeholder="http://host.docker.internal:8000/">
                     </div>
                </div>
                <?php // DEV-END ?>

                <button type="submit" name="save_settings" class="aipg-submit-btn">
                    <?php esc_html_e( 'Sign In', 'ai-studio-generator' ); ?> <span class="aipg-arrow">&rarr;</span>
                </button>

                <div style="text-align: center;">
                    <a href="https://app.nodevzone.com" target="_blank" class="aipg-footer-link"><?php esc_html_e( 'Creating a new account? Click here', 'ai-studio-generator' ); ?></a>
                </div>
            </form>
        </div>
    </div>
    <?php
}
// 6. Main Render Function
function aipg_render_page() {
    // Ensure table exists before doing anything
    aipg_ensure_table_exists();
    
    $message = '';
    
    // Handle License Key Saving
    if ( isset( $_POST['save_settings'] ) && isset( $_POST['aipg_s_nonce'] ) && wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['aipg_s_nonce'] ) ), 'aipg_settings' ) ) {
        // DEV-START
        if ( isset( $_POST['aipg_api_url'] ) ) {
            update_option( 'aipg_api_url', esc_url_raw( wp_unslash( $_POST['aipg_api_url'] ) ) );
        }
        // DEV-END
        if ( isset( $_POST['aipg_license_key'] ) ) {
            update_option( 'aipg_license_key', sanitize_text_field( wp_unslash( $_POST['aipg_license_key'] ) ) );
        }
        
        if ( isset( $_POST['aipg_access_capability'] ) ) {
            $new_cap = sanitize_text_field( wp_unslash( $_POST['aipg_access_capability'] ) );
            if ( ! empty( $new_cap ) ) {
                update_option( 'aipg_access_capability', $new_cap );
            }
        }
        $message = 'Settings saved.';
    }

    $current_key = get_option( 'aipg_license_key', '' );
    // DEV-START
    $current_api_url = get_option( 'aipg_api_url', 'http://host.docker.internal:8000/' );
    // DEV-END
    $current_cap = get_option( 'aipg_access_capability', 'manage_options' );

    // If no license key, show license screen
    if ( empty( $current_key ) ) {
        aipg_render_license_screen($message);
        return;
    }

    // Check API connection
    $api_status = aipg_check_api_connection();
    if ( ! $api_status['connected'] ) {
        aipg_render_license_screen( $api_status['message'] );
        return;
    }
    
    $status_text = $api_status['connected'] ? 'Connected' : 'Disconnected';

    // Fetch existing plugins from our custom table
    global $wpdb;
    $table_name = $wpdb->prefix . 'ai_plugins';
    $highlight_id = isset($_GET['highlighted_plugin']) ? intval($_GET['highlighted_plugin']) : 0;
    // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
    $plugins = $wpdb->get_results( $wpdb->prepare(
        "SELECT * FROM {$wpdb->prefix}ai_plugins ORDER BY (CASE WHEN id = %d THEN 1 ELSE 0 END) DESC, created_at DESC",
        $highlight_id
    ) );

    ?>
    <div class="wrap aipg-dashboard-wrapper">
        <div class="aipg-brand-header">
            <h1 class="aipg-page-title"><?php esc_html_e( 'AI Plugin Generator', 'ai-studio-generator' ); ?> <span class="aipg-beta-badge"><?php esc_html_e( 'Beta', 'ai-studio-generator' ); ?></span></h1>
            <div style="display: flex; align-items: center; gap: 24px;">
                <a href="https://app.nodevzone.com" target="_blank" class="aipg-button-secondary" style="border-radius: 10px; font-weight: 600; padding: 8px 16px;"><?php esc_html_e( 'Go to dashboard', 'ai-studio-generator' ); ?></a>
                <a href="https://www.nodevzone.com" target="_blank" class="aipg-brand-link">
                    <img src="<?php echo esc_url( plugins_url( 'logo60px.png', __FILE__ ) ); ?>" class="aipg-brand-logo" alt="<?php esc_attr_e( 'NoDevZone Logo', 'ai-studio-generator' ); ?>">
                    <div class="aipg-brand-name"><span>No</span>Dev<span>Zone</span></div>
                </a>
            </div>
        </div>
        <?php if (!empty($message)) : 
            $clean_message = wp_strip_all_tags($message);
            $is_error = (strpos($message, 'updated') === false && strpos($message, 'saved') === false);
            $msg_class = $is_error ? 'aipg-error-msg' : 'aipg-updated-msg';
            $icon = $is_error ? 'warning' : 'yes';
        ?>
            <div class="<?php echo esc_attr($msg_class); ?>">
                <span class="dashicons dashicons-<?php echo esc_attr($icon); ?>" style="margin-right: 12px; font-size: 24px; width: 24px; height: 24px;"></span>
                <div>
                     <span style="font-size: 14px; font-weight: 500;"><?php echo esc_html( $clean_message ); ?></span>
                </div>
            </div>
        <?php endif; ?>

        <?php if ( ! aipg_is_plugins_writable() ) : ?>
            <div class="aipg-error-msg" style="margin-bottom: 24px; background: #fff2f2; border: 1px solid #ffcccc; color: #d70015; padding: 16px 24px; border-radius: 12px; display: flex; align-items: center;">
                <span class="dashicons dashicons-warning" style="margin-right: 12px; font-size: 24px; width: 24px; height: 24px;"></span>
                <div>
                    <strong style="display: block; font-size: 15px; margin-bottom: 4px;"><?php esc_html_e( 'Filesystem Not Writable', 'ai-studio-generator' ); ?></strong>
                    <?php /* translators: %s: Plugin Directory Path */ ?>
                    <span style="font-size: 13px; opacity: 0.8;"><?php printf( esc_html__( 'The plugin directory (<code>%s</code>) is not writable. Generation and updates are disabled. Please check your server permissions.', 'ai-studio-generator' ), esc_html( WP_PLUGIN_DIR ) ); ?></span>
                </div>
            </div>
        <?php endif; ?>

        <?php 
        $update_info = get_option( 'aipg_update_info' );
        if ( $update_info && version_compare( AIPG_VERSION, $update_info['new_version'], '<' ) ) : 
        ?>
            <div class="aipg-error-msg" style="margin-bottom: 24px; background: #e5f1ff; border: 1px solid #b5d7ff; color: #007aff; padding: 16px 24px; border-radius: 12px; display: flex; align-items: center; justify-content: space-between;">
                <div style="display: flex; align-items: center;">
                    <span class="dashicons dashicons-update" style="margin-right: 12px; font-size: 24px; width: 24px; height: 24px;"></span>
                    <div>
                        <?php /* translators: %s: Version Number */ ?>
                        <strong style="display: block; font-size: 15px; margin-bottom: 4px;"><?php printf( esc_html__( 'Update Available: v%s', 'ai-studio-generator' ), esc_html( $update_info['new_version'] ) ); ?></strong>
                        <span style="font-size: 13px; opacity: 0.8;"><?php esc_html_e( 'A new version of AI Plugin Generator is available. Please update to get the latest features.', 'ai-studio-generator' ); ?></span>
                    </div>
                </div>
                <a href="<?php echo esc_url( admin_url( 'plugins.php' ) ); ?>" class="aipg-button-primary" style="background: #007aff; border-color: #007aff; text-decoration: none;"><?php esc_html_e( 'Update Now', 'ai-studio-generator' ); ?></a>
            </div>
        <?php endif; ?>
        
        <div id="aipg-low-token-warning" style="display: <?php echo ($api_status['connected'] && isset($api_status['tokens']) && $api_status['tokens'] < 2000) ? 'flex' : 'none'; ?>; align-items: center; justify-content: space-between; background: #fff5e5; border: 1px solid #ffebb5; color: #b97a08; padding: 16px 24px; border-radius: 16px; margin-bottom: 24px;">
            <div style="display: flex; align-items: center;">
                <span class="dashicons dashicons-warning" style="font-size: 20px; width: 20px; height: 20px; margin-right: 12px; color: #f5a623;"></span>
                <span style="font-weight: 500; font-size: 14px;"><strong><?php esc_html_e( 'Low Balance:', 'ai-studio-generator' ); ?></strong> <?php esc_html_e( 'You are running low on tokens.', 'ai-studio-generator' ); ?></span>
            </div>
            <a href="https://app.nodevzone.com/tokens" target="_blank" class="aipg-button-primary" style="background: #f5a623; border-color: #f5a623; min-width: auto; padding: 6px 16px; font-size: 13px;"><?php esc_html_e( 'Buy Tokens', 'ai-studio-generator' ); ?></a>
        </div>

        <div class="aipg-connection-card">
            <div class="aipg-connection-main">
                <div style="display: flex; align-items: center;">
                    <span class="aipg-badge <?php echo $api_status['connected'] ? 'success' : 'error'; ?>">
                        <?php echo esc_html( $status_text ); ?>
                    </span>
                    <span style="margin-left: 12px; color: #6e6e73; font-size: 13px;">
                        <?php echo esc_html( $api_status['message'] ); ?>
                    </span>
                </div>
                
                <div style="display: flex; align-items: center; gap: 16px;">
                    <?php if ( $api_status['connected'] && isset($api_status['tokens']) ) : 
                        $is_low = $api_status['tokens'] < 2000;
                        $pill_class = $is_low ? 'aipg-token-pill low-tokens' : 'aipg-token-pill';
                    ?>
                    <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 8px;">
                     <div id="aipg-token-container" class="<?php echo esc_attr($pill_class); ?>">
                             <span class="dashicons dashicons-database" style="font-size: 18px; width: 18px; height: 18px; opacity: 0.6;"></span>
                             <span><span id="aipg-token-count"><?php echo number_format($api_status['tokens']); ?></span> <?php esc_html_e( 'Tokens', 'ai-studio-generator' ); ?></span>
                        </div>
                        <?php if ( $api_status['tokens'] < 5000 ) : ?>
                            <a href="https://app.nodevzone.com" target="_blank" class="aipg-button-primary" style="padding: 6px 12px; font-size: 11px; font-weight: 700; border-radius: 8px; text-transform: uppercase; background: #ff9500; border-color: #ff9500; color: #fff; box-shadow: 0 4px 12px rgba(255, 149, 0, 0.2);"><?php esc_html_e( 'Add new tokens', 'ai-studio-generator' ); ?></a>
                        <?php endif; ?>
                    </div>
                    <?php endif; ?>
                </div>
            </div>
            
            <button type="button" class="aipg-toggle-settings-btn" id="aipg-toggle-settings" title="Toggle Settings">
                <span class="dashicons dashicons-arrow-down-alt2" style="font-size: 16px; width: 16px; height: 16px;"></span>
                <span class="dashicons dashicons-arrow-down-alt2" style="font-size: 16px; width: 16px; height: 16px; margin-top: -8px;"></span>
            </button>
        </div>

        <div id="aipg-settings-panel" class="aipg-settings-panel">
            <form method="post" style="display: flex; align-items: flex-end; gap: 24px; justify-content: space-between;">
                <?php wp_nonce_field( 'aipg_settings', 'aipg_s_nonce' ); ?>
                
                <?php // DEV-START ?>
                <div style="flex-grow: 1;">
                     <label class="aipg-label"><?php esc_html_e( 'API URL', 'ai-studio-generator' ); ?></label>
                     <input type="url" name="aipg_api_url" value="<?php echo esc_attr( $current_api_url ); ?>" class="aipg-input" placeholder="http://host.docker.internal:8000/">
                </div>
                <?php // DEV-END ?>
                
                <div style="flex-grow: 1;">
                     <label class="aipg-label"><?php esc_html_e( 'SaaS License / Gemini Key', 'ai-studio-generator' ); ?></label>
                     <input type="password" name="aipg_license_key" value="<?php echo esc_attr( $current_key ); ?>" class="aipg-input">
                </div>

                <div style="flex-grow: 1;">
                     <label class="aipg-label"><?php esc_html_e( 'Minimum Access Level', 'ai-studio-generator' ); ?></label>
                     <select name="aipg_access_capability" class="aipg-input" style="height: 38px;">
                         <option value="manage_options" <?php selected($current_cap, 'manage_options'); ?>><?php esc_html_e( 'Administrator', 'ai-studio-generator' ); ?></option>
                         <option value="edit_pages" <?php selected($current_cap, 'edit_pages'); ?>><?php esc_html_e( 'Editor', 'ai-studio-generator' ); ?></option>
                         <option value="publish_posts" <?php selected($current_cap, 'publish_posts'); ?>><?php esc_html_e( 'Author', 'ai-studio-generator' ); ?></option>
                     </select>
                </div>
                
                <button type="submit" name="save_settings" class="aipg-button-secondary" style="margin-bottom: 1px;"><?php esc_html_e( 'Save', 'ai-studio-generator' ); ?></button>
            </form>
        </div>
        <div class="aipg-card" style="margin-top: 40px;">
            <h2><?php esc_html_e( 'Generate New Plugin', 'ai-studio-generator' ); ?></h2>
            <form id="aipg-generate-form">
                <div class="aipg-form-group">
                    <textarea name="plugin_prompt" id="plugin_prompt" class="aipg-textarea" placeholder="<?php esc_attr_e( 'Describe your plugin (e.g., \'A plugin that adds a dark mode toggle to the footer\')', 'ai-studio-generator' ); ?>"></textarea>
                    <div id="plugin_prompt_counter" class="aipg-validation-counter">
                        <span class="v-msg"><?php esc_html_e( 'Min. 100 chars, 10 words', 'ai-studio-generator' ); ?></span>
                        <span class="v-stats">0 / 100 chars</span>
                    </div>
                </div>
                <div style="margin-top: 24px; text-align: right;">
                    <input type="submit" id="aipg-generate-submit" name="generate_plugin" class="aipg-button-primary" value="<?php esc_attr_e( 'Generate & Install Plugin', 'ai-studio-generator' ); ?>" <?php disabled( ! aipg_is_plugins_writable() ); ?>>
                </div>
            </form>
            <div id="generation-status" style="margin-top: 20px;"></div>
        </div>

        <div class="aipg-card" id="aipg-plugins-list-card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                <div>
                    <h2 style="margin: 0;"><?php esc_html_e( 'Existing Plugins & Modifications', 'ai-studio-generator' ); ?></h2>
                    <p style="color: #6e6e73; margin: 4px 0 0;"><?php esc_html_e( 'Select a plugin below to view its code and make modifications using AI.', 'ai-studio-generator' ); ?></p>
                </div>
                <button type="button" id="sync-projects-btn" class="aipg-button-secondary">
                    <span class="dashicons dashicons-update" style="margin-right: 8px; font-size: 18px; width: 18px; height: 18px;"></span>
                    <?php esc_html_e( 'Sync from AI Studio', 'ai-studio-generator' ); ?>
                </button>
            </div>
            
            <table class="aipg-table">
                <thead>
                    <tr>
                        <th style="width: 40px;"><input type="checkbox" id="select-all-plugins"></th>
                        <th><?php esc_html_e( 'Plugin Name', 'ai-studio-generator' ); ?></th>
                        <th><?php esc_html_e( 'Status', 'ai-studio-generator' ); ?></th>
                        <th><?php esc_html_e( 'Version', 'ai-studio-generator' ); ?></th>
                        <th><?php esc_html_e( 'Slug', 'ai-studio-generator' ); ?></th>
                        <th><?php esc_html_e( 'Created', 'ai-studio-generator' ); ?></th>
                        <th><?php esc_html_e( 'Modified', 'ai-studio-generator' ); ?></th>
                        <th><?php esc_html_e( 'Actions', 'ai-studio-generator' ); ?></th>
                    </tr>
                </thead>
                <tbody id="aipg-plugins-table-body">
                    <?php if ( empty( $plugins ) ) : ?>
                        <tr id="aipg-no-plugins-row">
                            <td colspan="8" style="padding: 40px; color: #86868b; font-style: italic;"><?php esc_html_e( 'No plugins generated yet. Describe your first plugin above to get started!', 'ai-studio-generator' ); ?></td>
                        </tr>
                    <?php endif; ?>
                    <?php foreach ( $plugins as $plugin ) : 
                        $is_installed = file_exists( WP_PLUGIN_DIR . '/' . $plugin->slug );
                        $row_class = $is_installed ? '' : 'aipg-remote-row';
                        if ($plugin->id == $highlight_id) {
                            $row_class .= ' aipg-row-highlight';
                        }
                    ?>
                    <tr class="<?php echo esc_attr(trim($row_class)); ?>" data-plugin-id="<?php echo esc_attr( $plugin->id ); ?>" data-description="<?php echo esc_attr( $plugin->description ); ?>" data-project-id="<?php echo esc_attr( $plugin->external_project_id ); ?>" data-active-version-id="<?php echo esc_attr( $plugin->active_version_remote_id ); ?>">
                        <td><input type="checkbox" class="plugin-checkbox" value="<?php echo esc_attr( $plugin->id ); ?>"></td>
                        <td><strong style="font-weight: 500; font-size: 15px;"><?php echo esc_html( $plugin->name ); ?></strong></td>
                        <td>
                            <?php if ( $is_installed ) : ?>
                                <span class="aipg-status-badge installed"><?php esc_html_e( 'Installed', 'ai-studio-generator' ); ?></span>
                            <?php else : ?>
                                <span class="aipg-status-badge remote"><?php esc_html_e( 'Remote', 'ai-studio-generator' ); ?></span>
                            <?php endif; ?>
                        </td>
                        <td><span style="background: #f2f2f5; padding: 2px 8px; border-radius: 12px; font-size: 12px; color: #666;"><?php echo esc_html( isset($plugin->version) ? $plugin->version : '1.0.0' ); ?></span></td>
                        <td><code style="background: none; color: #d6336c; font-size: 12px;"><?php echo esc_html( $plugin->slug ); ?></code></td>
                        <td style="color: #6e6e73; font-size: 13px;"><?php echo esc_html( date_format( date_create( $plugin->created_at ), 'M d, Y' ) ); ?></td>
                        <td style="color: #6e6e73; font-size: 13px;"><?php echo esc_html( date_format( date_create( $plugin->modified_at ), 'M d, Y' ) ); ?></td>
                        <td>
                            <?php if ( $is_installed ) : ?>
                                <button type="button" class="aipg-button-secondary view-code-btn" data-plugin-id="<?php echo esc_attr( $plugin->id ); ?>"><?php esc_html_e( 'Code', 'ai-studio-generator' ); ?></button>
                                <button type="button" class="aipg-button-secondary view-history-btn" data-plugin-id="<?php echo esc_attr( $plugin->id ); ?>"><?php esc_html_e( 'History', 'ai-studio-generator' ); ?></button>
                                <button type="button" class="aipg-button-secondary modify-plugin-btn" data-plugin-id="<?php echo esc_attr( $plugin->id ); ?>"><?php esc_html_e( 'Modify', 'ai-studio-generator' ); ?></button>
                                <button type="button" class="aipg-button-danger aipg-delete-generated-plugin-btn" data-plugin-id="<?php echo esc_attr( $plugin->id ); ?>" style="margin-left: 4px;"><?php esc_html_e( 'Delete', 'ai-studio-generator' ); ?></button>
                            <?php else : ?>
                                <button type="button" class="aipg-button-primary install-plugin-btn" data-plugin-id="<?php echo esc_attr( $plugin->id ); ?>"><?php esc_html_e( 'Install', 'ai-studio-generator' ); ?></button>
                                <button type="button" class="aipg-button-secondary view-history-btn" data-plugin-id="<?php echo esc_attr( $plugin->id ); ?>"><?php esc_html_e( 'History', 'ai-studio-generator' ); ?></button>
                            <?php endif; ?>
                        </td>
                    </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </div>

            <!-- Modification Modal -->
            <div id="modification-modal" class="aipg-modal-overlay">
                <div class="aipg-modal">
                    <div class="aipg-modal-header" style="background: #fbfbfd; border-bottom: 1px solid #f0f0f0; padding: 18px 24px;">
                        <div style="display: flex; align-items: center; gap: 40px;">
                            <div class="aipg-window-dots" style="filter: grayscale(1) opacity(0.25);"></div>
                            <h3 class="aipg-modal-title" style="font-size: 14px; font-weight: 600; margin: 0; color: #1d1d1f;"><?php esc_html_e( 'Modify Plugin', 'ai-studio-generator' ); ?></h3>
                        </div>
                        <button type="button" class="aipg-modal-close close-modal" data-target="#modification-modal" style="background: none; border: none; cursor: pointer; color: #86868b; padding: 4px;"><span class="dashicons dashicons-no-alt"></span></button>
                    </div>
                    <div class="aipg-modal-body">
                        <div id="selected-plugin-info" style="margin-bottom: 16px; font-size: 14px;"></div>
                        
                        <div style="background: #f5f5f7; padding: 16px; margin-bottom: 20px; border-radius: 12px;">
                            <strong style="display: block; font-size: 11px; text-transform: uppercase; color: #86868b; letter-spacing: 0.05em; margin-bottom: 8px;"><?php esc_html_e( 'Last Prompt', 'ai-studio-generator' ); ?></strong>
                            <div id="last-prompt-display" style="color: #1d1d1f; font-size: 13px; white-space: pre-wrap; max-height: 100px; overflow-y: auto;"></div>
                        </div>

                        <label for="modification-prompt" class="aipg-label"><?php esc_html_e( 'New Instructions', 'ai-studio-generator' ); ?></label>
                        <textarea id="modification-prompt" class="aipg-textarea" style="height: 120px;" placeholder="<?php esc_attr_e( 'e.g., \'Add a settings page to the admin menu\' or \'Add a shortcode to display recent posts\'', 'ai-studio-generator' ); ?>"></textarea>
                        <div id="modification_prompt_counter" class="aipg-validation-counter">
                            <span class="v-msg"><?php esc_html_e( 'Min. 50 chars, 5 words', 'ai-studio-generator' ); ?></span>
                            <span class="v-stats">0 / 50 chars</span>
                        </div>
                        <div id="modification-status" style="margin-top: 16px;"></div>
                    </div>
                    <div class="aipg-modal-footer">
                        <button type="button" class="aipg-button-secondary close-modal" data-target="#modification-modal" style="margin-right: 8px;"><?php esc_html_e( 'Cancel', 'ai-studio-generator' ); ?></button>
                        <button type="button" class="aipg-button-primary" id="submit-modification" disabled <?php disabled( ! aipg_is_plugins_writable() ); ?>><?php esc_html_e( 'Update Plugin', 'ai-studio-generator' ); ?></button>
                    </div>
                </div>
            </div>
            <!-- Code Viewer Modal -->
            <div id="code-viewer-modal" class="aipg-modal-overlay">
                <div class="aipg-modal" style="max-width: 900px; background: #0f172a; border: 1px solid rgba(255,255,255,0.1); overflow: hidden;">
                    <div class="aipg-modal-header" style="background: rgba(255,255,255,0.03); border-bottom: 1px solid rgba(255,255,255,0.06); padding: 14px 20px;">
                        <div style="display: flex; align-items: center; gap: 50px;">
                            <div class="aipg-window-dots"></div>
                            <h3 class="aipg-modal-title" style="color: #94a3b8; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; margin: 0; font-family: -apple-system, BlinkMacSystemFont, sans-serif;"><?php esc_html_e( 'Plugin Source Code', 'ai-studio-generator' ); ?></h3>
                        </div>
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <button type="button" class="aipg-copy-code-btn" id="aipg-copy-code" title="<?php esc_attr_e( 'Copy to Clipboard', 'ai-studio-generator' ); ?>">
                                <span class="dashicons dashicons-clipboard"></span>
                                <span class="copy-text"><?php esc_html_e( 'Copy', 'ai-studio-generator' ); ?></span>
                            </button>
                            <button type="button" class="aipg-modal-close close-modal" data-target="#code-viewer-modal" style="color: #94a3b8; background: none; border: none; cursor: pointer; padding: 4px;"><span class="dashicons dashicons-no-alt"></span></button>
                        </div>
                    </div>
                    <div class="aipg-modal-body" style="padding: 0; background: transparent; overflow: hidden;">
                        <div id="code-content" class="aipg-code-block" style="border-radius: 0; border: none; max-height: 70vh; background: transparent;"></div>
                    </div>
                    <div class="aipg-modal-footer" style="background: rgba(255,255,255,0.02); border-top: 1px solid rgba(255,255,255,0.06); padding: 16px 24px;">
                        <button type="button" class="aipg-button-primary" id="install-from-code-viewer" style="display: none; margin-right: 8px; background: #38bdf8; color: #0f172a; font-weight: 700;"><?php esc_html_e( 'Install Plugin', 'ai-studio-generator' ); ?></button>
                        <button type="button" class="aipg-button-secondary close-modal" data-target="#code-viewer-modal" style="background: transparent; color: #94a3b8; border-color: rgba(255,255,255,0.1); font-weight: 600;"><?php esc_html_e( 'Close', 'ai-studio-generator' ); ?></button>
                    </div>
                </div>
            </div>

            <!-- History Viewer Modal -->
            <div id="history-viewer-modal" class="aipg-modal-overlay">
                <div class="aipg-modal">
                    <div class="aipg-modal-header" style="background: #fbfbfd; border-bottom: 1px solid #f0f0f0; padding: 18px 24px;">
                        <div style="display: flex; align-items: center; gap: 40px;">
                            <div class="aipg-window-dots" style="filter: grayscale(1) opacity(0.25);"></div>
                            <h3 class="aipg-modal-title" style="font-size: 14px; font-weight: 600; margin: 0; color: #1d1d1f;"><?php esc_html_e( 'Version History', 'ai-studio-generator' ); ?></h3>
                        </div>
                        <button type="button" class="aipg-modal-close close-modal" data-target="#history-viewer-modal" style="background: none; border: none; cursor: pointer; color: #86868b; padding: 4px;"><span class="dashicons dashicons-no-alt"></span></button>
                    </div>
                    <div class="aipg-modal-body">
                        <div id="history-status"></div>
                        <table class="aipg-table" style="margin-top: 0;">
                            <thead>
                                <tr>
                                    <th><?php esc_html_e( 'Version', 'ai-studio-generator' ); ?></th>
                                    <th><?php esc_html_e( 'Prompt', 'ai-studio-generator' ); ?></th>
                                    <th><?php esc_html_e( 'Date', 'ai-studio-generator' ); ?></th>
                                    <th><?php esc_html_e( 'Actions', 'ai-studio-generator' ); ?></th>
                                </tr>
                            </thead>
                            <tbody id="history-content"></tbody>
                        </table>
                    </div>
                    <div class="aipg-modal-footer">
                        <button type="button" class="aipg-button-secondary close-modal" data-target="#history-viewer-modal"><?php esc_html_e( 'Close', 'ai-studio-generator' ); ?></button>
                    </div>
                </div>
            </div>

            <!-- Confirmation Modal -->
            <div id="confirmation-modal" class="aipg-modal-overlay" style="z-index: 100000;">
                <div class="aipg-modal" style="max-width: 400px; text-align: center; border-radius: 24px; overflow: hidden;">
                    <div class="aipg-modal-body" style="padding: 32px;">
                        <div id="confirm-modal-icon-bg" style="background: #fff2f2; width: 48px; height: 48px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px;">
                            <span class="dashicons dashicons-warning" id="confirm-modal-icon" style="color: #d70015; font-size: 24px; width: 24px; height: 24px;"></span>
                        </div>
                        <h3 id="confirm-modal-title" style="font-size: 19px; font-weight: 600; margin: 0 0 8px;"><?php esc_html_e( 'Are you sure?', 'ai-studio-generator' ); ?></h3>
                        <p id="confirm-modal-message" style="color: #86868b; font-size: 13px; margin: 0 0 32px;"><?php esc_html_e( 'This action cannot be undone.', 'ai-studio-generator' ); ?></p>
                        
                        <div style="display: flex; gap: 12px; justify-content: center;">
                            <button type="button" class="aipg-button-secondary close-modal" data-target="#confirmation-modal" style="flex: 1;"><?php esc_html_e( 'Cancel', 'ai-studio-generator' ); ?></button>
                            <button type="button" class="aipg-button-primary" id="confirm-modal-submit" style="flex: 1;"><?php esc_html_e( 'Confirm', 'ai-studio-generator' ); ?></button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Legal Consent Modal -->
            <div id="legal-consent-modal" class="aipg-modal-overlay">
                <div class="aipg-modal" style="max-width: 600px;">
                    <div class="aipg-modal-header" style="background: #fbfbfd; border-bottom: 1px solid #f0f0f0; padding: 18px 24px;">
                        <div style="display: flex; align-items: center; gap: 40px;">
                            <div class="aipg-window-dots" style="filter: grayscale(1) opacity(0.25);"></div>
                            <h3 class="aipg-modal-title" style="font-size: 14px; font-weight: 600; margin: 0; color: #1d1d1f;"><?php esc_html_e( 'Legal Consent Required', 'ai-studio-generator' ); ?></h3>
                        </div>
                    </div>
                    <div class="aipg-modal-body">
                        <p style="margin-bottom: 20px; color: #6e6e73;"><?php esc_html_e( 'To continue using the AI Plugin Generator, please review and accept our latest Terms of Service and Privacy Policy.', 'ai-studio-generator' ); ?></p>
                        
                        <div id="legal-content-container" style="display: flex; flex-direction: column; gap: 20px;">
                            <div id="tos-section" style="display: none;">
                                <h4 style="margin: 0 0 10px;"><?php esc_html_e( 'Terms of Service', 'ai-studio-generator' ); ?> <span class="aipg-beta-badge" id="tos-version"></span></h4>
                                <div id="tos-content" style="max-height: 200px; overflow-y: auto; padding: 15px; background: #fbfbfd; border: 1px solid #d2d2d7; border-radius: 8px; font-size: 13px;"></div>
                                <label style="display: flex; align-items: center; margin-top: 10px; gap: 8px; cursor: pointer;">
                                    <input type="checkbox" id="tos-checkbox" class="legal-checkbox">
                                    <span style="font-size: 14px;"><?php esc_html_e( 'I accept the Terms of Service', 'ai-studio-generator' ); ?></span>
                                </label>
                            </div>

                            <div id="privacy-policy-section" style="display: none;">
                                <h4 style="margin: 0 0 10px;"><?php esc_html_e( 'Privacy Policy', 'ai-studio-generator' ); ?> <span class="aipg-beta-badge" id="pp-version"></span></h4>
                                <div id="pp-content" style="max-height: 200px; overflow-y: auto; padding: 15px; background: #fbfbfd; border: 1px solid #d2d2d7; border-radius: 8px; font-size: 13px;"></div>
                                <label style="display: flex; align-items: center; margin-top: 10px; gap: 8px; cursor: pointer;">
                                    <input type="checkbox" id="pp-checkbox" class="legal-checkbox">
                                    <span style="font-size: 14px;"><?php esc_html_e( 'I accept the Privacy Policy', 'ai-studio-generator' ); ?></span>
                                </label>
                            </div>
                        </div>

                        <div id="legal-status" style="margin-top: 16px;"></div>
                    </div>
                    <div class="aipg-modal-footer">
                        <button type="button" class="aipg-button-secondary close-modal" data-target="#legal-consent-modal" style="margin-right: 8px;"><?php esc_html_e( 'Cancel', 'ai-studio-generator' ); ?></button>
                        <button type="button" class="aipg-button-primary" id="submit-legal-consent" disabled><?php esc_html_e( 'Accept & Continue', 'ai-studio-generator' ); ?></button>
                    </div>
                </div>
            </div>
            <!-- Success Modal -->
            <div id="post-generation-modal" class="aipg-modal-overlay" style="z-index: 100000;">
                <div class="aipg-modal" style="max-width: 700px; text-align: center; border-radius: 24px; overflow: visible;">
                    <div class="aipg-modal-body" style="padding: 40px 48px;">
                        <div style="background: #e1f5fe; width: 56px; height: 56px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px;">
                            <span class="dashicons dashicons-yes-alt" style="color: #03a9f4; font-size: 32px; width: 32px; height: 32px;"></span>
                        </div>
                        <h3 style="font-size: 22px; font-weight: 600; margin: 0 0 12px;"><?php esc_html_e( 'Plugin Generated!', 'ai-studio-generator' ); ?></h3>
                        <p style="color: #6e6e73; font-size: 15px; margin: 0 0 20px; line-height: 1.5;"><?php 
                        /* translators: %s: Name of the plugin. */
                        printf( esc_html__( 'Your new plugin "%s" is ready in your AI Hub.', 'ai-studio-generator' ), '<strong><span id="new-plugin-name-display"></span></strong>' ); 
                        ?></p>
                        
                        <h4 id="aipg-scan-header" style="margin: 0 0 16px; font-size: 13px; font-weight: 600; color: #86868b; text-transform: uppercase; letter-spacing: 0.05em; display: none;"><?php esc_html_e( 'Scan Results', 'ai-studio-generator' ); ?></h4>
                        <div id="aipg-scan-results-container" class="aipg-scan-results" style="display: none; margin-bottom: 32px;"></div>

                        <p style="color: #6e6e73; font-size: 15px; margin: 0 0 32px; line-height: 1.5;"><?php esc_html_e( 'What would you like to do next?', 'ai-studio-generator' ); ?></p>
                        
                        <div style="display: flex; gap: 12px; margin-top: 12px;">
                            <button type="button" class="aipg-button-danger" id="gen-action-install-activate" style="flex: 1.2; height: 52px; font-size: 15px; font-weight: 700; border-radius: 14px; box-shadow: 0 4px 12px rgba(215, 0, 21, 0.15);"><?php esc_html_e( 'Install & Activate', 'ai-studio-generator' ); ?></button>
                            <button type="button" class="aipg-button-primary" id="gen-action-install" style="flex: 1; height: 52px; font-size: 15px; font-weight: 600; border-radius: 14px;"><?php esc_html_e( 'Install Now', 'ai-studio-generator' ); ?></button>
                            <button type="button" class="aipg-button-secondary" id="gen-action-review" style="flex: 1; height: 52px; font-size: 15px; font-weight: 600; border-radius: 14px;"><?php esc_html_e( 'Review Code', 'ai-studio-generator' ); ?></button>
                        </div>
                        <div style="margin-top: 20px;">
                            <button type="button" class="aipg-button-secondary close-modal" data-target="#post-generation-modal" style="border: none; background: transparent; color: #86868b; font-size: 14px; font-weight: 500;"><?php esc_html_e( 'Maybe Later (Close)', 'ai-studio-generator' ); ?></button>
                        </div>
                    </div>
                </div>
            </div>
            <div class="aipg-footer">
                <div class="aipg-footer-copyright">
                    &copy; <?php echo esc_html( date( 'Y' ) ); ?> AI Studio Generator. <?php esc_html_e( 'All rights reserved.', 'ai-studio-generator' ); ?>
                </div>
                <div class="aipg-footer-version">
                    v<?php echo esc_html( AIPG_VERSION ); ?>
                </div>
            </div>
        </div>
    </div>


<?php }
// 7. AJAX Handler for Getting Plugin Code
add_action( 'wp_ajax_aipg_get_plugin_code', 'aipg_get_plugin_code' );
function aipg_get_plugin_code() {
    check_ajax_referer( 'aipg_ajax_nonce', 'nonce' );
    if ( ! aipg_current_user_can_access() ) {
        wp_send_json_error( esc_html__( 'Permission denied.', 'ai-studio-generator' ) );
    }

    $plugin_id = isset( $_POST['plugin_id'] ) ? intval( wp_unslash( $_POST['plugin_id'] ) ) : 0;
    global $wpdb;
    // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
    $plugin = $wpdb->get_row( $wpdb->prepare( "SELECT * FROM {$wpdb->prefix}ai_plugins WHERE id = %d", $plugin_id ) );

    if ( ! $plugin ) {
        wp_send_json_error( esc_html__( 'Plugin not found.', 'ai-studio-generator' ) );
    }

    $code = $plugin->code;

    // If no code in DB, try to fetch from remote latest version
    if ( empty( $code ) && ! empty( $plugin->active_version_remote_id ) ) {
        $license_key = get_option( 'aipg_license_key', '' );
        // DEV-START
        $api_url = get_option( 'aipg_api_url', 'http://host.docker.internal:8000/' );
        // DEV-END
        // PROD-API-URL: $api_url = 'https://app.nodevzone.com/';
        
        $response = wp_remote_get( rtrim( $api_url, '/' ) . "/api/versions/" . $plugin->active_version_remote_id . "/code", [
            'headers' => [ 
                'X-License-Key' => $license_key,
                'X-Plugin-Version' => AIPG_VERSION
            ],
            'timeout' => 15
        ]);
        
        if ( ! is_wp_error( $response ) ) {
            $body = json_decode( wp_remote_retrieve_body( $response ), true );
            $code = $body['code'] ?? '';
        }
    }

    if ( $code ) {
        wp_send_json_success( $code );
    } else {
        wp_send_json_error( esc_html__( 'Code not found locally or remotely.', 'ai-studio-generator' ) );
    }
}

// 8. AJAX Handler for Testing API
add_action( 'wp_ajax_aipg_test_api', 'aipg_ajax_test_api' );
function aipg_ajax_test_api() {
    check_ajax_referer( 'aipg_ajax_nonce', 'nonce' );
    $result = aipg_check_api_connection();
    if ( $result['connected'] ) {
        wp_send_json_success( $result['message'] );
    } else {
        wp_send_json_error( $result['message'] );
    }
}

// 9. AJAX Handler for Generating Plugin
add_action( 'wp_ajax_aipg_generate_plugin', 'aipg_ajax_generate_plugin' );
function aipg_ajax_generate_plugin() {
    ob_start();
    check_ajax_referer( 'aipg_ajax_nonce', 'nonce' );

    if ( ! aipg_current_user_can_access() ) {
        wp_send_json_error( esc_html__( 'Permission denied.', 'ai-studio-generator' ) );
    }

    if ( ! aipg_is_plugins_writable() ) {
        wp_send_json_error( esc_html__( 'Plugins directory is not writable.', 'ai-studio-generator' ) );
    }

    $prompt = isset( $_POST['plugin_prompt'] ) ? sanitize_textarea_field( wp_unslash( $_POST['plugin_prompt'] ) ) : '';
    
    // Server-side validation
    $validation_result = aipg_validate_input($prompt);
    if ($validation_result !== true) {
        wp_send_json_error($validation_result);
    }
    
    $license_key = get_option( 'aipg_license_key', '' );
    // DEV-START
    $api_url = get_option( 'aipg_api_url', 'http://host.docker.internal:8000/' );
    // DEV-END
    // PROD-API-URL: $api_url = 'https://app.nodevzone.com/';

    $payload = [
        'system_info' => aipg_get_system_info_array(),
        'request_type' => 'create_plugin',
        'user_prompt' => $prompt
    ];

    // Use the new async job executor to get job_id
    $job_id_or_error = aipg_initiate_async_job($payload);

    if ( is_wp_error( $job_id_or_error ) ) {
        if ( $job_id_or_error->get_error_code() === 'legal_consent_required' ) {
            $data = $job_id_or_error->get_error_data();
            wp_send_json_error( [
                'code' => 'legal_consent_required',
                'missing' => $data['missing'] ?? []
            ] );
        }
        wp_send_json_error( $job_id_or_error->get_error_message() );
    }

    ob_get_clean();
    wp_send_json_success( [
        'job_id' => $job_id_or_error,
        'message' => 'Job initiated successfully.'
    ] );
}

add_action( 'wp_ajax_aipg_check_generation_status', 'aipg_ajax_check_generation_status' );
function aipg_ajax_check_generation_status() {
    ob_start();
    check_ajax_referer( 'aipg_ajax_nonce', 'nonce' );

    if ( ! aipg_current_user_can_access() ) {
        wp_send_json_error( esc_html__( 'Permission denied.', 'ai-studio-generator' ) );
    }

    $job_id = isset( $_POST['job_id'] ) ? sanitize_text_field( wp_unslash( $_POST['job_id'] ) ) : '';
    $prompt = isset( $_POST['plugin_prompt'] ) ? sanitize_textarea_field( wp_unslash( $_POST['plugin_prompt'] ) ) : '';
    
    if ( empty($job_id) ) {
        wp_send_json_error( 'Missing job_id.' );
    }

    $status_data = aipg_poll_job_status($job_id);

    if ( is_wp_error( $status_data ) ) {
        wp_send_json_error( $status_data->get_error_message() );
    }

    if ( $status_data['status'] === 'PROCESSING' || $status_data['status'] === 'PENDING' ) {
        wp_send_json_success([
            'status' => $status_data['status'],
            'response' => $status_data['response'] ?? '',
            'correction_count' => $status_data['correction_count'] ?? 0
        ]);
    } else if ( $status_data['status'] === 'FAILED' ) {
        wp_send_json_error( 'Generation failed due to an error on the AI side.' );
    } else if ( $status_data['status'] === 'COMPLETED' ) {
        
        $raw_code = isset($status_data['response']) ? html_entity_decode($status_data['response']) : null;
        $project_id = $status_data['project_id'] ?? '';
        $version_id = $status_data['version_id'] ?? '';
        $test_results = $status_data['test_results'] ?? [];
        $tokens_remaining = $status_data['tokens_remaining'] ?? null;

        if ( empty( $raw_code ) ) {
            wp_send_json_error( esc_html__( 'Failed to generate plugin code. The API response was unexpected.', 'ai-studio-generator' ) );
        }

        // Parse headers to get name and version
        $headers = aipg_parse_plugin_headers($raw_code);
        $plugin_name = !empty($headers['Name']) ? $headers['Name'] : 'AI Generated Plugin';
        $plugin_version = !empty($headers['Version']) ? $headers['Version'] : '1.0.0';

        $base_slug = sanitize_title( $plugin_name );
        $plugin_slug = $base_slug;

        global $wpdb;
        $table_name = $wpdb->prefix . 'ai_plugins';
        
        $counter = 1;
        // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
        while ( $wpdb->get_var( $wpdb->prepare( "SELECT id FROM {$wpdb->prefix}ai_plugins WHERE slug = %s", $plugin_slug ) ) ) {
            $plugin_slug = $base_slug . '-' . $counter;
            $counter++;
        }

        // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
        $inserted = $wpdb->insert(
            "{$wpdb->prefix}ai_plugins",
            [
                'slug' => $plugin_slug,
                'external_project_id' => $project_id,
                'active_version_remote_id' => $version_id,
                'name' => $plugin_name,
                'version' => $plugin_version,
                'description' => $prompt,
                'code' => $raw_code,
                'last_synced_at' => current_time( 'mysql' )
            ]
        );

        if ( false === $inserted ) {
            ob_get_clean();
            wp_send_json_error( 'Failed to register the plugin in the database.' );
        }

        $plugin_id = $wpdb->insert_id;

        ob_get_clean();
        wp_send_json_success( [
            'status' => 'COMPLETED',
            'message' => esc_html__( 'Plugin generated successfully!', 'ai-studio-generator' ),
            'plugin_id' => $plugin_id,
            'plugin_name' => $plugin_name,
            'plugin_slug' => $plugin_slug,
            'tokens_remaining' => $tokens_remaining,
            'test_results' => $test_results
        ] );
    } else {
        wp_send_json_error( 'Unknown status: ' . ($status_data['status'] ?? 'None') );
    }
}

// 6. AI Studio - Prototype Generation Handlers
add_action( 'wp_ajax_aipg_generate_studio_prototype', 'aipg_ajax_generate_studio_prototype' );
function aipg_ajax_generate_studio_prototype() {
    check_ajax_referer( 'aipg_ajax_nonce', 'nonce' );
    if ( ! aipg_current_user_can_access() ) wp_send_json_error( 'Permission denied.' );

    $template_name = isset( $_POST['template_name'] ) ? sanitize_text_field( wp_unslash( $_POST['template_name'] ) ) : '';
    $prototype_prompt = isset( $_POST['prototype_prompt'] ) ? sanitize_textarea_field( wp_unslash( $_POST['prototype_prompt'] ) ) : '';
    $palette = isset( $_POST['palette'] ) ? (array) $_POST['palette'] : [];
    $model_tier = isset( $_POST['model_tier'] ) ? sanitize_text_field( wp_unslash( $_POST['model_tier'] ) ) : 'claude_sonnet';

    $api_url = get_option( 'aipg_api_url', 'http://host.docker.internal:8000/' );
    $endpoint = rtrim($api_url, '/') . '/api/ai-studio/generate-prototype';

    $response = wp_remote_post( $endpoint, [
        'headers'     => [ 
            'Content-Type'    => 'application/json'
        ],
        'body'        => wp_json_encode([
            'template_name' => $template_name,
            'prototype_prompt' => $prototype_prompt,
            'palette' => $palette,
            'model_tier' => $model_tier
        ]),
        'timeout'     => 1500, // Increased to 25 minutes (1500s) for giant Claude 3.7 JSON outputs
    ]);

    if ( is_wp_error( $response ) ) {
        error_log('[AI Studio] Connection Error: ' . $response->get_error_message() . ' Endpoint: ' . $endpoint);
        wp_send_json_error( [
            'msg' => 'Backend Connection Failed: ' . $response->get_error_message(),
            'endpoint' => $endpoint,
            'debug' => 'PHP Proxy Error'
        ]);
    }

    $body = wp_remote_retrieve_body( $response );
    error_log('[AI Studio] RAW Response Length: ' . strlen($body));
    
    $data = json_decode( $body, true );

    if ( ! $data || isset($data['detail']) ) {
        error_log('[AI Studio] ERROR: ' . ($data['detail'] ?? 'JSON Decode Failed'));
        wp_send_json_error( $data['detail'] ?? 'Failed to communicate with SaaS' );
    }

    wp_send_json_success( $data );
}

add_action( 'wp_ajax_aipg_install_prototype', 'aipg_ajax_install_prototype' );
function aipg_ajax_install_prototype() {
    check_ajax_referer( 'aipg_ajax_nonce', 'nonce' );
    if ( ! aipg_current_user_can_access() ) wp_send_json_error( 'Permission denied.' );

    $raw_response = isset( $_POST['code'] ) ? wp_unslash( $_POST['code'] ) : ''; // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
    $project_id   = isset( $_POST['project_id'] ) ? sanitize_text_field( wp_unslash( $_POST['project_id'] ) ) : '';
    $theme_strategy = isset( $_POST['theme_strategy'] ) ? sanitize_text_field( wp_unslash( $_POST['theme_strategy'] ) ) : 'normalize_css';
    $data = json_decode( $raw_response, true );

    if ( ! $data || ! isset( $data['pages'] ) ) {
        wp_send_json_error( 'Invalid Gutenberg data received.' );
    }

    $installed_pages = [];
    $home_page_id = 0;

    foreach ( $data['pages'] as $page_data ) {
        $title   = sanitize_text_field( $page_data['title'] );
        $slug    = sanitize_title( $page_data['slug'] );
        $content = $page_data['content']; // Gutenberg blocks

        // Check if page already exists with this slug to avoid duplicates (searching all statuses)
        $existing_pages = get_posts([
            'name'           => $slug,
            'post_type'      => 'page',
            'post_status'    => ['publish', 'draft', 'pending', 'private'],
            'posts_per_page' => 1,
            'suppress_filters' => true
        ]);
        $existing_page = !empty($existing_pages) ? $existing_pages[0] : null;
        
        // GUARDRAIL: Strip any template-part blocks (header/footer) or pure header/footer tags 
        // that the AI might have accidentally included in the page content.
        // Our FSE templates already include these globally.
        $content = preg_replace('/<!--\s*wp:template-part\s*{[^}]*"slug":"(header|footer)"[^}]*}\s*\/-->/i', '', $content);
        $content = preg_replace('/<(header|footer)[^>]*>.*?<\/\1>/is', '', $content);

        $post_args = [
            'post_title'   => $title,
            'post_name'    => $slug,
            'post_content' => trim($content) . "\n<!-- AI Studio Build: " . current_time('mysql') . " -->",
            'post_status'  => 'publish',
            'post_type'    => 'page',
        ];

        if ( $existing_page ) {
            error_log("[AI Studio] Updating existing page: {$slug} (ID: {$existing_page->ID}, Status: {$existing_page->post_status})");
            $post_args['ID'] = $existing_page->ID;
            $post_id = wp_update_post( $post_args );
        } else {
            error_log("[AI Studio] Creating new page: {$slug}");
            $post_id = wp_insert_post( $post_args );
        }

        if ( ! is_wp_error( $post_id ) ) {
            error_log("[AI Studio] SUCCESS: {$slug} (ID: {$post_id}) | Content Length: " . strlen($content));
            $installed_pages[] = [ 'id' => $post_id, 'slug' => $slug ];
            if ( strtolower($slug) === 'home' || $home_page_id === 0 ) {
                $home_page_id = $post_id;
            }
            // Mark as an AI Studio page for the editor overlay
            update_post_meta( $post_id, '_aipg_studio_page', '1' );
            if ( ! empty($project_id) ) {
                update_post_meta( $post_id, '_aipg_project_id', $project_id );
            }
        } else {
            error_log("[AI Studio] ERROR installing page {$slug}: " . $post_id->get_error_message());
        }
    }

    // Set static front page
    if ( $home_page_id > 0 ) {
        update_option( 'show_on_front', 'page' );
        update_option( 'page_on_front', $home_page_id );
    }

    // Install Template Parts (Header / Footer) if present
    if ( isset( $data['template_parts'] ) && is_array( $data['template_parts'] ) ) {
        $active_theme = wp_get_theme()->get_stylesheet();
        error_log("[AI Studio] Found template_parts! Count: " . count($data['template_parts']));
        
        foreach ( $data['template_parts'] as $part_data ) {
            $slug = sanitize_title( $part_data['slug'] );
            $content = $part_data['content'];
            $title = ucfirst($slug);
            error_log("[AI Studio] Processing part slug: {$slug}");

            // Determine the area based on the slug
            $area = 'uncategorized';
            if ( strpos( $slug, 'header' ) !== false ) {
                $area = 'header';
            } elseif ( strpos( $slug, 'footer' ) !== false ) {
                $area = 'footer';
            }

            // Attempt to find existing template part for this theme
            $existing_parts = get_posts([
                'name'           => $slug,
                'post_type'      => 'wp_template_part',
                'post_status'    => 'publish',
                'posts_per_page' => 1,
                'tax_query'      => [
                    [
                        'taxonomy' => 'wp_theme',
                        'field'    => 'name',
                        'terms'    => $active_theme,
                    ],
                ]
            ]);
            $existing_part = !empty($existing_parts) ? $existing_parts[0] : null;

            $part_args = [
                'post_title'   => $title,
                'post_name'    => $slug,
                'post_content' => $content,
                'post_status'  => 'publish',
                'post_type'    => 'wp_template_part',
                'tax_input'    => [
                    'wp_theme' => [ $active_theme ],
                    'wp_template_part_area' => [ $area ]
                ]
            ];

            if ( $existing_part ) {
                error_log("[AI Studio] Updating existing template part: {$slug} (Area: {$area})");
                $part_args['ID'] = $existing_part->ID;
                wp_update_post( $part_args );
                wp_set_object_terms( $existing_part->ID, $area, 'wp_template_part_area' );
            } else {
                error_log("[AI Studio] Creating new template part: {$slug} (Area: {$area})");
                $post_id = wp_insert_post( $part_args );
                if ( ! is_wp_error( $post_id ) ) {
                    wp_set_object_terms( $post_id, $active_theme, 'wp_theme' );
                    wp_set_object_terms( $post_id, $area, 'wp_template_part_area' );
                }
            }
        }
    }

    // Store theme tokens if provided
    if ( isset( $data['theme_json'] ) ) {
        error_log('[AI Studio] Updating theme_config. Palette size: ' . (isset($data['theme_json']['settings']['color']['palette']) ? count($data['theme_json']['settings']['color']['palette']) : '0'));
        update_option( 'aipg_studio_theme_config', $data['theme_json'] );
    } else {
        // Clear if not provided to avoid stale styles
        delete_option( 'aipg_studio_theme_config' );
    }

    if ( ! empty($project_id) ) {
         update_option( 'aipg_studio_active_project', $project_id );
    }

    // Handle Theme Strategy
    update_option( 'aipg_studio_theme_strategy', $theme_strategy );
    
    if ( $theme_strategy === 'blank_theme' ) {
        $theme_dir = get_theme_root() . '/wpgenerator-blank';
        if ( ! file_exists( $theme_dir ) ) {
            wp_mkdir_p( $theme_dir );
            
            // Create style.css
            $style_css = "/*\nTheme Name: WPGenerator Blank\nAuthor: AI Studio\nDescription: A completely blank, FSE-compatible theme designed as a canvas for AI Generator.\nVersion: 1.0\nRequires at least: 6.0\nTested up to: 6.5\n*/\n";
            file_put_contents( trailingslashit($theme_dir) . 'style.css', $style_css );
            
            // Create index.php
            file_put_contents( trailingslashit($theme_dir) . 'index.php', "<?php\n// Silence is golden.\n" );

            // Minimal theme.json to enable FSE
            $theme_json = [
                "version" => 2,
                "settings" => [
                    "appearanceTools" => true,
                    "layout" => [
                        "contentSize" => "800px",
                        "wideSize" => "1200px"
                    ]
                ]
            ];
            file_put_contents( trailingslashit($theme_dir) . 'theme.json', wp_json_encode($theme_json) );

            // Create FSE Templates
            $templates_dir = trailingslashit($theme_dir) . 'templates';
            wp_mkdir_p( $templates_dir );
            
            $index_html = '<!-- wp:template-part {"slug":"header"} /-->
<!-- wp:group {"tagName":"main","align":"full","layout":{"type":"constrained"}} -->
<main class="wp-block-group alignfull">
<!-- wp:post-content {"layout":{"type":"constrained"}} /-->
</main>
<!-- /wp:group -->
<!-- wp:template-part {"slug":"footer"} /-->';
            
            file_put_contents( trailingslashit($templates_dir) . 'index.html', $index_html );
        }
        
        switch_theme( 'wpgenerator-blank' );
        error_log( '[AI Studio] Activated Blank Theme (wpgenerator-blank).' );
    }

    wp_send_json_success([
        'message'     => 'Real Gutenberg pages installed!',
        'preview_url' => add_query_arg( '_aipg_preview', time(), home_url('/') )
    ]);
}

/**
 * Override FSE Template Parts with AI Studio parts
 */
add_filter( 'get_block_template', 'aipg_override_fse_template_parts', 10, 3 );
function aipg_override_fse_template_parts( $block_template, $id, $template_type ) {
    $active_theme = wp_get_theme()->get_stylesheet();

    // 1. Full Page Overrides
    if ( $template_type === 'wp_template' ) {
        // If we are currently querying one of our AI-generated pages
        $post_id = get_queried_object_id();
        $is_ai = $post_id ? get_post_meta( $post_id, '_aipg_studio_page', true ) : false;
        error_log("[AI Studio Template] Checking wp_template override for ID: {$id}. Object ID: " . ($post_id ?: 'NONE') . ". Is AI: " . ($is_ai ? 'YES' : 'NO'));
        
        if ( $post_id && $is_ai ) {
            if ( ! $block_template ) {
                $block_template = new WP_Block_Template();
                $block_template->id = $active_theme . '//aipg-blank';
                $block_template->theme = $active_theme;
                $block_template->slug = 'aipg-blank';
                $block_template->source = 'custom';
                $block_template->type = 'wp_template';
            }
            
            // Serve a blank layout without the disruptive "Front Page" post titles or forced constrained margins
            $block_template->content = '<!-- wp:template-part {"slug":"header"} /-->
<!-- wp:group {"tagName":"main","align":"full","layout":{"type":"default"},"style":{"spacing":{"margin":{"top":"0"}}}} -->
<main class="wp-block-group alignfull" style="margin-top:0">
<!-- wp:post-content {"layout":{"type":"default"}} /-->
</main>
<!-- /wp:group -->
<!-- wp:template-part {"slug":"footer"} /-->';
            
            $block_template->title = 'AI Studio Blank';
            $block_template->status = 'publish';
            $block_template->has_theme_file = false;
            $block_template->is_custom = true;
            return $block_template;
        }
    }

    // 2. Template Part Overrides (Headers/Footers)
    if ( $template_type !== 'wp_template_part' ) {
        return $block_template;
    }
    
    // Extract slug from ID (e.g., 'twentytwentyfour//header' -> 'header')
    $slug = str_replace( $active_theme . '//', '', $id );

    // Normalize slug to catch variations like 'footer-default' or 'header-dark'
    $search_slug = $slug;
    if ( strpos( $slug, 'header' ) !== false ) {
        $search_slug = 'header';
    } elseif ( strpos( $slug, 'footer' ) !== false ) {
        $search_slug = 'footer';
    }

    // Check if we have an AI Studio override for this normalized part
    $ai_parts = get_posts([
        'name'           => $search_slug,
        'post_type'      => 'wp_template_part',
        'post_status'    => 'publish',
        'posts_per_page' => 1,
        'tax_query'      => [
            [
                'taxonomy' => 'wp_theme',
                'field'    => 'name',
                'terms'    => $active_theme,
            ],
        ]
    ]);

    if ( ! empty( $ai_parts ) ) {
        $ai_part = $ai_parts[0];
        
        if ( ! $block_template ) {
            $block_template = new WP_Block_Template();
            $block_template->id = $active_theme . '//' . $slug;
            $block_template->theme = $active_theme;
            $block_template->slug = $slug;
            $block_template->source = 'custom';
            $block_template->type = 'wp_template_part';
        }
        
        $block_template->content = $ai_part->post_content;
        $block_template->title = $ai_part->post_title;
        $block_template->status = 'publish';
        $block_template->has_theme_file = true; 
        $block_template->is_custom = true;
    }
    return $block_template;
}

/**
 * Secondary override: Force render the AI Studio template parts during block rendering
 */
add_filter( 'render_block_core/template-part', 'aipg_force_render_template_part', 10, 2 );
function aipg_force_render_template_part( $block_content, $block ) {
    $slug = isset( $block['attrs']['slug'] ) ? $block['attrs']['slug'] : '';
    if ( empty( $slug ) ) {
        return $block_content;
    }

    $active_theme = wp_get_theme()->get_stylesheet();

    // Normalize slug to catch variations like 'footer-default' or 'header-dark'
    $search_slug = $slug;
    if ( strpos( $slug, 'header' ) !== false ) {
        $search_slug = 'header';
    } elseif ( strpos( $slug, 'footer' ) !== false ) {
        $search_slug = 'footer';
    }

    $ai_parts = get_posts([
        'name'           => $search_slug,
        'post_type'      => 'wp_template_part',
        'post_status'    => 'publish',
        'posts_per_page' => 1,
        'tax_query'      => [
            [
                'taxonomy' => 'wp_theme',
                'field'    => 'name',
                'terms'    => $active_theme,
            ],
        ]
    ]);

    if ( ! empty( $ai_parts ) ) {
        $ai_part = $ai_parts[0];
        return do_blocks( $ai_part->post_content );
    }

    return $block_content;
}

/**
 * AJAX Handler for Saving Studio Projects
 */
add_action( 'wp_ajax_aipg_save_studio_project', 'aipg_ajax_save_studio_project' );
function aipg_ajax_save_studio_project() {
    check_ajax_referer( 'aipg_ajax_nonce', 'nonce' );
    if ( ! aipg_current_user_can_access() ) wp_send_json_error( 'Permission denied.' );

    $name = isset( $_POST['template_name'] ) ? sanitize_text_field( wp_unslash( $_POST['template_name'] ) ) : 'Untitled Project';
    $code = isset( $_POST['code'] ) ? wp_unslash( $_POST['code'] ) : ''; // The JSON response from AI
    
    if ( empty($code) ) wp_send_json_error( 'No content to save.' );

    $projects = get_option( 'aipg_studio_projects', [] );
    $project_id = 'pj_' . substr( md5( $name . time() ), 0, 8 );

    $projects[$project_id] = [
        'id'        => $project_id,
        'name'      => $name,
        'code'      => $code, // Store raw AI JSON
        'timestamp' => time()
    ];

    update_option( 'aipg_studio_projects', $projects );

    wp_send_json_success([
        'message'    => 'Project saved to library!',
        'project_id' => $project_id
    ]);
}

/**
 * AJAX Handler for Listing Studio Projects
 */
add_action( 'wp_ajax_aipg_list_studio_projects', 'aipg_ajax_list_studio_projects' );
function aipg_ajax_list_studio_projects() {
    check_ajax_referer( 'aipg_ajax_nonce', 'nonce' );
    if ( ! aipg_current_user_can_access() ) wp_send_json_error( 'Permission denied.' );

    global $wpdb;
    $table_name = $wpdb->prefix . 'aipg_projects';
    
    $projects = $wpdb->get_results( "SELECT id, name, time as timestamp, snapshot FROM $table_name ORDER BY time DESC", ARRAY_A );

    wp_send_json_success([
        'projects'  => $projects,
        'active_id' => get_option( 'aipg_studio_active_project', '' )
    ]);
}

/**
 * AJAX Handler for Removing a Project (Cleanup)
 */
add_action( 'wp_ajax_aipg_remove_studio_project', 'aipg_ajax_remove_studio_project' );
function aipg_ajax_remove_studio_project() {
    check_ajax_referer( 'aipg_ajax_nonce', 'nonce' );
    if ( ! aipg_current_user_can_access() ) wp_send_json_error( 'Permission denied.' );

    $project_id = isset( $_POST['project_id'] ) ? sanitize_text_field( wp_unslash( $_POST['project_id'] ) ) : '';
    $delete_from_history = isset( $_POST['delete_history'] ) ? (bool) $_POST['delete_history'] : false;

    if ( empty($project_id) ) wp_send_json_error( 'Invalid Project ID.' );

    // 1. Find and delete all posts tagged with this project
    $args = [
        'post_type'      => 'any',
        'posts_per_page' => -1,
        'meta_query'     => [
            [
                'key'   => '_aipg_project_id',
                'value' => $project_id,
            ]
        ]
    ];

    $query = new WP_Query( $args );
    $deactivated_count = 0;

    if ( $query->have_posts() ) {
        while ( $query->have_posts() ) {
            $query->the_post();
            wp_update_post([
                'ID'          => get_the_ID(),
                'post_status' => 'draft'
            ]);
            $deactivated_count++;
        }
        wp_reset_postdata();
    }

    // 2. Clear from library if requested
    if ( $delete_from_history ) {
        $projects = get_option( 'aipg_studio_projects', [] );
        if ( isset($projects[$project_id]) ) {
            unset($projects[$project_id]);
            update_option( 'aipg_studio_projects', $projects );
        }
    }

    // 3. Clear active project if it was this one
    if ( get_option( 'aipg_studio_active_project' ) === $project_id ) {
        delete_option( 'aipg_studio_active_project' );
        // Optionally reset front page to default
        update_option( 'show_on_front', 'posts' );
    }

    wp_send_json_success([
        'message' => sprintf( 'Cleanup complete. %d items moved to drafts.', $deactivated_count )
    ]);
}

/**
 * AJAX Handler for Contextual AI Editing (See-Click-Prompt)
 */
add_action( 'wp_ajax_aipg_studio_contextual_edit', 'aipg_ajax_studio_contextual_edit' );
add_action( 'wp_ajax_nopriv_aipg_studio_contextual_edit', 'aipg_ajax_studio_contextual_edit' );
add_action( 'wp_ajax_aipg_save_as_project', 'aipg_ajax_save_as_project' );
add_action( 'wp_ajax_nopriv_aipg_save_as_project', 'aipg_ajax_save_as_project' );
function aipg_ajax_studio_contextual_edit() {
    check_ajax_referer( 'aipg_editor_nonce', 'nonce' );

    // Allow more time for complex AI requests since GenAI timeout is 90s
    if ( function_exists( 'set_time_limit' ) ) {
        // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged, WordPress.PHP.DiscouragedFunctions.runtime_configuration_set_time_limit
        @set_time_limit( 240 ); 
    }

    if ( ! aipg_current_user_can_access() ) wp_send_json_error( 'Permission denied.' );

    $prompt          = isset( $_POST['prompt'] ) ? sanitize_textarea_field( wp_unslash( $_POST['prompt'] ) ) : '';
    $markup          = isset( $_POST['markup'] ) ? wp_unslash( $_POST['markup'] ) : ''; // Gutenberg block HTML
    $computed_styles = isset( $_POST['computed_styles'] ) ? wp_unslash( $_POST['computed_styles'] ) : '';
    $parent_markup   = isset( $_POST['parent_markup'] ) ? wp_unslash( $_POST['parent_markup'] ) : '';
    $post_id         = isset( $_POST['post_id'] ) ? intval( $_POST['post_id'] ) : 0;
    $model_tier      = isset( $_POST['model_tier'] ) ? sanitize_text_field( wp_unslash( $_POST['model_tier'] ) ) : 'medium';

    if ( empty( $prompt ) || empty( $markup ) || ! $post_id ) {
        wp_send_json_error( 'Incomplete data for AI refinement.' );
    }

    $api_url = get_option( 'aipg_api_url', 'http://host.docker.internal:8000' );
    $license = get_option( 'aipg_license_key', '' );
    $endpoint = rtrim($api_url, '/') . '/api/ai-studio/refine-block';

    // --- BLOCK GRAMMAR DETECTION ---
    $matched_block_node = null;
    $target_post_id = $post_id;
    $is_new_template = false;
    $full_parsed_tree = [];
    $active_template = null;

    global $post;
    $post = get_post($post_id);
    setup_postdata($post);
    
    $search_debug_log = [];

    // 1. Check primary post first
    $full_parsed_tree = parse_blocks( $post->post_content );
    $matched_block_node = aipg_find_block_in_tree( $full_parsed_tree, $markup, $search_debug_log );

    // 2. Scan all Block Templates if not found in primary post
    if ( ! $matched_block_node && function_exists('get_block_templates') ) {
        $templates = array_merge( 
            get_block_templates( array(), 'wp_template' ), 
            get_block_templates( array(), 'wp_template_part' ) 
        );

        // Sort FSE templates so the most specific templates for this post type are checked first
        usort($templates, function($a, $b) use ($post) {
            $scoreA = 0; $scoreB = 0;
            
            if ($post->post_type === 'page') {
                if (in_array($a->slug, ['page', 'front-page', 'singular'])) $scoreA += 10;
                if (in_array($b->slug, ['page', 'front-page', 'singular'])) $scoreB += 10;
            } elseif ($post->post_type === 'post') {
                if (in_array($a->slug, ['single', 'singular'])) $scoreA += 10;
                if (in_array($b->slug, ['single', 'singular'])) $scoreB += 10;
            }

            if ($a->slug === 'index') $scoreA += 5;
            if ($b->slug === 'index') $scoreB += 5;

            return $scoreB <=> $scoreA;
        });
        
        foreach($templates as $t) {
            $test_tree = parse_blocks( $t->content );
            $match = aipg_find_block_in_tree( $test_tree, $markup, $search_debug_log );
            if ( $match ) {
                error_log("[AI Studio] Block found in template: {$t->slug} ({$t->type})");
                $matched_block_node = $match;
                $full_parsed_tree = $test_tree;
                $active_template = $t;
                break;
            }
        }
    }
    
    wp_reset_postdata();

    if ( ! $matched_block_node ) {
        error_log('[AI Studio] Block NOT FOUND in post ID: ' . $post_id . ' or its templates.');
        file_put_contents(__DIR__ . '/search_fail_log.json', json_encode([
            'target' => $markup,
            'scan_log' => $search_debug_log
        ], JSON_PRETTY_PRINT));
        wp_send_json_error( [
            'message' => 'Could not accurately identify the block in the database for replacement.',
            'diagnostics' => [
                'search' => $markup,
                'scan_log' => array_slice($search_debug_log, 0, 100)
            ]
        ] );
    }

    $serialized_target_block = serialize_blocks([$matched_block_node]);
    error_log('[AI Studio] Found Block Grammar. Size: ' . strlen($serialized_target_block));

    // Feature: Transparent Template Part Styling
    // If the user selects a Template Part wrapper, we must unwrap it and send its *inner* content 
    // to the AI so the AI can style the actual elements (like Row, Navigation, etc.) instead of the wrapper.
    $is_template_part_mode = false;
    $template_part_post = null;
    $original_template_part_grammar = $serialized_target_block; // Keep the wrapper for the UI replacement later

    if ( $matched_block_node['blockName'] === 'core/template-part' ) {
        error_log('[AI Studio] Intercepted Template Part. Unwrapping...');
        $attrs = $matched_block_node['attrs'] ?? [];
        $slug = $attrs['slug'] ?? '';
        $theme = $attrs['theme'] ?? wp_get_theme()->get_stylesheet();

        if ( ! empty($slug) ) {
            $template_parts = get_block_templates([], 'wp_template_part');
            foreach($template_parts as $tp) {
                if ($tp->slug === $slug && $tp->theme === $theme) {
                    $template_part_post = $tp;
                    break;
                }
            }

            if ( $template_part_post && ! empty($template_part_post->content) ) {
                $is_template_part_mode = true;
                // Swap the target block payload with the inner contents of the template part
                error_log("[AI Studio] Successfully extracted inner content of Template Part: {$slug}");
                $serialized_target_block = $template_part_post->content;
            } else {
                error_log("[AI Studio] Failed to locate inner content for Template Part: {$slug}");
                wp_send_json_error("Could not load the internal blocks for the {$slug} template part.");
            }
        }
    }

    $response = wp_remote_post( $endpoint, [
        'headers'     => [
            'Content-Type'    => 'application/json',
            'X-License-Key'   => $license
        ],
        'body'        => wp_json_encode([
            'prompt'          => $prompt,
            'markup'          => $markup, // Keep for context
            'computed_styles' => empty(json_decode($computed_styles, true)) ? null : json_decode($computed_styles),
            'parent_markup'   => $parent_markup,
            'model_tier'      => $model_tier,
            'theme_config'    => get_option( 'aipg_studio_theme_config' ) ?: null,
            'dynamic_db_block'=> $serialized_target_block, // Hijacking this variable name to mean "Block Grammar Mode"
        ]),
        'timeout'     => 120,
    ]);

    if ( is_wp_error( $response ) ) {
        error_log('[AI Studio] Refinement API ERROR: ' . $response->get_error_message());
        wp_send_json_error( $response->get_error_message() );
    }

    $body = wp_remote_retrieve_body( $response );
    $data = json_decode( $body, true );
    
    if ( ! $data || ! isset( $data['new_markup'] ) ) {
        $error_detail = isset($data['detail']) ? (is_array($data['detail']) ? json_encode($data['detail']) : $data['detail']) : 'Unknown backend error or missing new_markup';
        error_log('[AI Studio] Refinement Parse Error: ' . $error_detail . ' | Raw body: ' . $body);
        wp_send_json_error( 'AI failed to refine this block. Backend Error: ' . $error_detail );
    }

    try {
        // The API returns the mutated Node Grammar in 'new_markup'
        $new_block_grammar = $data['new_markup'];
        
        $db_diagnostics = [];
        $rendered_markup = '';
        $tree_mutated = false;

        if ( $is_template_part_mode && $template_part_post ) {
            // --- TEMPLATE PART SAVING LOGIC ---
            $tp_db_id = $template_part_post->wp_id;
            
            if ( empty( $tp_db_id ) || 'theme' === $template_part_post->source ) {
                $db_diagnostics[] = "Creating new DB override for Template Part: {$template_part_post->slug}";
                $update_res = wp_insert_post([
                    'post_content' => wp_slash( $new_block_grammar ),
                    'post_name'    => $template_part_post->slug,
                    'post_title'   => $template_part_post->title,
                    'post_type'    => 'wp_template_part',
                    'post_status'  => 'publish',
                ]);
                if ( ! is_wp_error( $update_res ) ) {
                    wp_set_object_terms( $update_res, $template_part_post->theme, 'wp_theme' );
                    // Also need to set the area term if available
                    if ( isset( $template_part_post->area ) ) {
                        wp_set_object_terms( $update_res, $template_part_post->area, 'wp_template_part_area' );
                    }
                }
            } else {
                $db_diagnostics[] = "Updating existing DB Template Part Post ID: {$tp_db_id}";
                $update_res = wp_update_post([
                    'ID'           => $tp_db_id,
                    'post_content' => wp_slash( $new_block_grammar )
                ]);
            }
            
            if ( is_wp_error( $update_res ) ) {
                $err = $update_res->get_error_message();
                error_log('[AI Studio] ERROR updating template part: ' . $err);
                $db_diagnostics[] = "Template Part Update Error: $err";
            } else {
                $db_diagnostics[] = "Successfully saved Template Part DB ID: $update_res";
                $tree_mutated = true; // Flag as successful
            }
            
            // By NOT restoring the $original_template_part_grammar wrapper, 
            // we force a direct render of the new inner blocks, bypassing WP's template cache
            // which guarantees the frontend sees the live update immediately.

        } else {
            // Replace the node in the tree
            $new_parsed_blocks = parse_blocks( $new_block_grammar );
            $updated_tree = aipg_replace_block_in_tree( $full_parsed_tree, $matched_block_node, $new_parsed_blocks );
            
            if ( $updated_tree === $full_parsed_tree ) {
                $err_msg = "[AI Studio] CRITICAL WARNING: \$updated_tree is identical to \$full_parsed_tree! find_block and replace_block array comparison (\$block === \$original_node) FAILED to match!\n";
                error_log($err_msg);
                file_put_contents(__DIR__ . '/debug.log', date('Y-m-d H:i:s') . ' - ' . $err_msg, FILE_APPEND);
            } else {
                error_log('[AI Studio] SUCCESS: Tree successfully mutated.');
                file_put_contents(__DIR__ . '/debug.log', date('Y-m-d H:i:s') . " - SUCCESS: Tree successfully mutated.\n", FILE_APPEND);
                $tree_mutated = true;
            }

            // Re-serialize the entire page / template
            $new_post_content = serialize_blocks( $updated_tree );
            
            // Determine save location
            if ( $active_template ) {
                $db_diagnostics[] = "Matched Template Slug: " . $active_template->slug;
                if ( 'theme' === $active_template->source || empty( $active_template->wp_id ) ) {
                    error_log('[AI Studio] Creating DB override for theme template: ' . $active_template->slug);
                    $is_new_template = true;
                    $target_post_id = wp_insert_post( [
                        'post_content' => wp_slash( $new_post_content ),
                        'post_name'    => $active_template->slug,
                        'post_title'   => $active_template->title,
                        'post_type'    => $active_template->type,
                        'post_status'  => 'publish',
                    ] );
                    if ( is_wp_error( $target_post_id ) ) {
                        $err = $target_post_id->get_error_message();
                        error_log('[AI Studio] ERROR creating template: ' . $err);
                        $db_diagnostics[] = "Insert Error: $err";
                    } else {
                        $term_res = wp_set_object_terms( $target_post_id, $active_template->theme, 'wp_theme' );
                        $term_msg = is_wp_error($term_res) ? $term_res->get_error_message() : json_encode($term_res);
                        error_log('[AI Studio] Created template override ID: ' . $target_post_id . '. Term Status: ' . $term_msg);
                        $db_diagnostics[] = "Inserted ID: $target_post_id. Terms: $term_msg";
                    }
                } else {
                    $target_post_id = $active_template->wp_id;
                    $db_diagnostics[] = "Using existing active_template ID: $target_post_id";
                }
            } else {
                $db_diagnostics[] = "No active_template, updating original post ID: $target_post_id";
            }

            if ( ! $is_new_template ) {
                $update_res = wp_update_post([
                    'ID'           => $target_post_id,
                    'post_content' => wp_slash( $new_post_content )
                ]);
                if ( is_wp_error( $update_res ) ) {
                    $err = $update_res->get_error_message();
                    error_log('[AI Studio] ERROR updating post/template: ' . $err);
                    $db_diagnostics[] = "Update Error: $err";
                } else {
                    error_log('[AI Studio] Successfully updated post/template ID: ' . $update_res);
                    $db_diagnostics[] = "Updated ID: $update_res";
                }
            }
        }

        // Render just the newly designed block to return to the frontend
        $rendered_markup = do_blocks( $new_block_grammar );
        
        // Template parts need custom handling in AJAX contexts because do_blocks 
        // often returns generic wrappers rather than their internal HTML tree.
        if ( strpos($new_block_grammar, 'wp:template-part') !== false ) {
            $parsed_tp = parse_blocks($new_block_grammar);
            if (!empty($parsed_tp[0])) {
                $attrs = $parsed_tp[0]['attrs'] ?? [];
                $slug = $attrs['slug'] ?? '';
                $theme = $attrs['theme'] ?? wp_get_theme()->get_stylesheet();
                $tag = $attrs['tagName'] ?? 'div';
                $class_str = "wp-block-template-part aipg-part-{$slug}";
                
                $style_data = isset($attrs['style']) ? wp_style_engine_get_styles($attrs['style']) : [];
                if (!empty($style_data['class'])) {
                    $class_str .= ' ' . $style_data['class'];
                }
                
                // Directly render the AI's modified inner blocks
                $inner_html = do_blocks( $data['new_markup'] );
                
                // Construct the final HTML wrapper that reflects the block's current styling without forceful inline styles
                // WP 5.9+ FSE themes natively drop most inline 'style' for template-parts on the frontend, so injecting it here hallucinates margins.
                $rendered_markup = "<{$tag} class=\"{$class_str}\">{$inner_html}</{$tag}>";
                
                // Log the final payload for debugging
                $db_diagnostics[] = "Final Template Part HTML Length: " . strlen($rendered_markup);
                file_put_contents(__DIR__ . '/debug.log', date('Y-m-d H:i:s') . " - PAYLOAD OUTPUT: " . substr($rendered_markup, 0, 500) . "...\n", FILE_APPEND);
            }
        }
        
        $new_styles = '';
        if ( function_exists( 'wp_style_engine_get_stylesheet_from_context' ) ) {
            $new_styles = wp_style_engine_get_stylesheet_from_context( 'block-supports' );
        }
        
        // WP 6.1+ often dumps block layout CSS (like .wp-container-... flex gap/justify) directly into the
        // global $wp_styles object instead of the style engine store context returned above.
        // We must extract these and append them to $new_styles so the AJAX live-preview doesn't lose layout tracking.
        global $wp_styles;
        if ( !empty( $wp_styles ) && isset( $wp_styles->registered['wp-block-library'] ) ) {
            $library_extra = $wp_styles->registered['wp-block-library']->extra;
            if ( !empty( $library_extra['after'] ) && is_array( $library_extra['after'] ) ) {
                $new_styles .= "\n/* Layout Styles */\n" . implode("\n", $library_extra['after']);
            }
        }

        // Log everything to file
        file_put_contents(__DIR__ . '/debug.log', date('Y-m-d H:i:s') . " - DB Diags: " . json_encode($db_diagnostics) . "\n", FILE_APPEND);

        wp_send_json_success([
            'new_markup' => $rendered_markup,
            'new_styles' => $new_styles,
            'db_diagnostics' => $db_diagnostics,
            'tree_mutated' => $tree_mutated
        ]);
    } catch ( \Throwable $e ) {
        $err = '[AI Studio] FATAL ERROR during replacement: ' . $e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine();
        error_log( $err );
        file_put_contents(__DIR__ . '/debug.log', date('Y-m-d H:i:s') . ' - ' . $err . "\n", FILE_APPEND);
        wp_send_json_error( 'Fatal error processing replacement: ' . $e->getMessage() );
    }
}

/**
 * AJAX Handler for INSTANT Manual Block Tweaks (Zero AI)
 */
add_action( 'wp_ajax_aipg_studio_manual_edit', 'aipg_ajax_studio_manual_edit' );
add_action( 'wp_ajax_nopriv_aipg_studio_manual_edit', 'aipg_ajax_studio_manual_edit' );
function aipg_ajax_studio_manual_edit() {
    check_ajax_referer( 'aipg_editor_nonce', 'nonce' );
    if ( ! aipg_current_user_can_access() ) wp_send_json_error( 'Permission denied.' );

    $markup          = isset( $_POST['markup'] ) ? wp_unslash( $_POST['markup'] ) : ''; 
    $post_id         = isset( $_POST['post_id'] ) ? intval( $_POST['post_id'] ) : 0;
    
    $width           = isset( $_POST['width'] ) ? sanitize_text_field( $_POST['width'] ) : ''; // 'full', 'constrained', ''
    $padding_top     = isset( $_POST['padding_top'] ) ? sanitize_text_field( $_POST['padding_top'] ) : '';
    $padding_bottom  = isset( $_POST['padding_bottom'] ) ? sanitize_text_field( $_POST['padding_bottom'] ) : '';
    $bg_color        = isset( $_POST['bg_color'] ) ? sanitize_hex_color( $_POST['bg_color'] ) : '';

    if ( empty( $markup ) || ! $post_id ) {
        wp_send_json_error( 'Incomplete data for manual refinement.' );
    }

    $api_url = get_option( 'aipg_api_url', 'http://host.docker.internal:8000' );
    $endpoint = rtrim($api_url, '/') . '/api/ai-studio/manual-tweak';

    $matched_block_node = null;
    $target_post_id = $post_id;
    $is_new_template = false;
    $full_parsed_tree = [];
    $active_template = null;
    $search_debug_log = [];

    global $post;
    $post = get_post($post_id);
    setup_postdata($post);

    // 1. Check primary post
    $full_parsed_tree = parse_blocks( $post->post_content );
    $matched_block_node = aipg_find_block_in_tree( $full_parsed_tree, $markup, $search_debug_log );

    // 2. Scan templates if not found
    if ( ! $matched_block_node && function_exists('get_block_templates') ) {
        $templates = array_merge( get_block_templates( array(), 'wp_template' ), get_block_templates( array(), 'wp_template_part' ) );
        usort($templates, function($a, $b) use ($post) { return 0; }); // Keep simple for manual tweak
        foreach($templates as $t) {
            $test_tree = parse_blocks( $t->content );
            $match = aipg_find_block_in_tree( $test_tree, $markup, $search_debug_log );
            if ( $match ) {
                $matched_block_node = $match;
                $full_parsed_tree = $test_tree;
                $active_template = $t;
                break;
            }
        }
    }
    wp_reset_postdata();

    if ( ! $matched_block_node ) {
        wp_send_json_error( 'Could not identify the block in the database for manual tweaking.' );
    }

    $serialized_target_block = serialize_blocks([$matched_block_node]);

    // Fast call to local python API to modify attributes cleanly via Regex
    $payload = [
        'markup'         => $serialized_target_block,
        'width'          => $width ? $width : null,
        'padding_top'    => $padding_top !== '' ? strval($padding_top) : null,
        'padding_bottom' => $padding_bottom !== '' ? strval($padding_bottom) : null,
        'bg_color'       => $bg_color ? strval($bg_color) : null,
    ];
    // If the user cleared the color, we detect it if they pass the literal string 'CLEAR'
    if (isset($_POST['bg_color']) && $_POST['bg_color'] === 'CLEAR') {
        $payload['bg_color'] = ''; 
    }

    $response = wp_remote_post( $endpoint, [
        'headers' => [ 'Content-Type' => 'application/json' ],
        'body'    => wp_json_encode($payload),
        'timeout' => 15,
    ]);

    if ( is_wp_error( $response ) ) {
        wp_send_json_error( 'Local Tweak API Error: ' . $response->get_error_message() );
    }

    $data = json_decode( wp_remote_retrieve_body( $response ), true );
    if ( ! $data || ! isset( $data['new_markup'] ) ) {
        wp_send_json_error( 'Failed to parse manual tweak response.' );
    }

    $new_block_grammar = $data['new_markup'];
    $updated_tree = aipg_replace_block_in_tree( $full_parsed_tree, $matched_block_node, $new_block_grammar );
    $new_post_content = serialize_blocks( $updated_tree );

    // Determine save location
    if ( $active_template ) {
        if ( 'theme' === $active_template->source || empty( $active_template->wp_id ) ) {
            $is_new_template = true;
            $target_post_id = wp_insert_post( [
                'post_content' => wp_slash( $new_post_content ),
                'post_name'    => $active_template->slug,
                'post_title'   => $active_template->title,
                'post_type'    => $active_template->type,
                'post_status'  => 'publish',
            ] );
            if ( !is_wp_error( $target_post_id ) ) {
                wp_set_object_terms( $target_post_id, $active_template->theme, 'wp_theme' );
            }
        } else {
            $target_post_id = $active_template->wp_id;
        }
    }

    if ( ! $is_new_template ) {
        wp_update_post([ 'ID' => $target_post_id, 'post_content' => wp_slash( $new_post_content ) ]);
    }

    // Render it for the frontend
    $rendered_markup = do_blocks( $new_block_grammar );

    wp_send_json_success([
        'new_markup' => $rendered_markup,
        'new_styles' => function_exists('wp_style_engine_get_stylesheet_from_context') ? wp_style_engine_get_stylesheet_from_context( 'block-supports' ) : '',
    ]);
}

/**
 * AJAX handler to save the current page state as a Project snapshot.
 */
function aipg_ajax_save_as_project() {
    check_ajax_referer( 'aipg_editor_nonce', 'nonce' );
    
    $post_id = isset($_POST['post_id']) ? intval($_POST['post_id']) : 0;
    $project_name = isset($_POST['name']) ? sanitize_text_field($_POST['name']) : 'Untitled Project';
    
    if (!$post_id) wp_send_json_error('Missing Post ID');

    global $wpdb;
    $table_name = $wpdb->prefix . 'aipg_projects';

    // Capture current post content
    $post = get_post($post_id);
    $content = $post->post_content;

    // Capture global styles (theme config)
    $theme_config = get_option( 'aipg_studio_theme_config', [] );

    // Capture active template if FSE
    $snapshot = [
        'post_id' => $post_id,
        'content' => $content,
        'theme_config' => $theme_config,
        'timestamp' => current_time('mysql')
    ];

    $result = $wpdb->insert(
        $table_name,
        [
            'time' => current_time('mysql'),
            'name' => $project_name,
            'snapshot' => wp_json_encode($snapshot)
        ]
    );

    if ($result === false) {
        wp_send_json_error('Database error while saving project: ' . $wpdb->last_error);
    }

    wp_send_json_success('Project "' . $project_name . '" saved successfully!');
}

/**
 * AJAX handler to load a Project snapshot.
 */
add_action( 'wp_ajax_aipg_load_project', 'aipg_ajax_load_project' );
function aipg_ajax_load_project() {
    check_ajax_referer( 'aipg_ajax_nonce', 'nonce' );
    if ( ! aipg_current_user_can_access() ) wp_send_json_error( 'Permission denied.' );

    $project_id = isset($_POST['project_id']) ? intval($_POST['project_id']) : 0;
    if (!$project_id) wp_send_json_error('Missing Project ID');

    global $wpdb;
    $table_name = $wpdb->prefix . 'aipg_projects';
    $project = $wpdb->get_row( $wpdb->prepare( "SELECT * FROM $table_name WHERE id = %d", $project_id ) );

    if (!$project) wp_send_json_error('Project not found');

    $snapshot = json_decode($project->snapshot, true);
    if (!$snapshot) wp_send_json_error('Invalid snapshot data');

    // Restore Post Content
    $post_id = $snapshot['post_id'];
    wp_update_post([
        'ID'           => $post_id,
        'post_content' => $snapshot['content']
    ]);

    // Restore Theme Config
    if (isset($snapshot['theme_config'])) {
        update_option('aipg_studio_theme_config', $snapshot['theme_config']);
    }

    wp_send_json_success([
        'message' => 'Project "' . $project->name . '" restored successfully!',
        'redirect_url' => get_permalink($post_id)
    ]);
}

/**
 * AJAX handler to delete a Project snapshot.
 */
add_action( 'wp_ajax_aipg_delete_project', 'aipg_ajax_delete_project' );
function aipg_ajax_delete_project() {
    check_ajax_referer( 'aipg_ajax_nonce', 'nonce' );
    if ( ! aipg_current_user_can_access() ) wp_send_json_error( 'Permission denied.' );

    $project_id = isset($_POST['project_id']) ? intval($_POST['project_id']) : 0;
    if (!$project_id) wp_send_json_error('Missing Project ID');

    global $wpdb;
    $table_name = $wpdb->prefix . 'aipg_projects';
    $result = $wpdb->delete($table_name, ['id' => $project_id], ['%d']);

    if ($result === false) {
        wp_send_json_error('Database error deleting project.');
    }

    wp_send_json_success('Project deleted successfully.');
}

/**
 * Recursively search a tree of parsed WordPress blocks to find the one that 
 * renders out to the specific HTML payload sent from the frontend overlay.
 * 
 * @param array $parsed_blocks Array of blocks from parse_blocks()
 * @param string $target_html The HTML markup clicked by the user
 * @param array &$debug_log Pass by reference array to collect scanning info
 * @return array|null The matched block array, or null if not found
 */
function aipg_find_block_in_tree( $parsed_blocks, $target_html, &$debug_log = [] ) {
    if ( empty( $parsed_blocks ) ) return null;

    // Helper: Normalize spacing and WP typography (smart quotes, dashes)
    $clean_html = function( $html ) {
        if ( empty( $html ) ) return '';

        // 1. Decode entities so &copy; matches (C)
        $html = html_entity_decode( $html, ENT_QUOTES | ENT_HTML5, 'UTF-8' );
        
        // 2. Map smart quotes and common entities to primitive equivalents
        $search  = array('“', '”', '‘', '’', '—', '–', "\xc2\xa0", '&nbsp;', '·');
        $replace = array('"', '"', "'", "'", '-', '-', ' ', ' ', '.'); // Map middle dot to dot or just leave?
        // Actually mapping dot to dot is risky. Let's map it across both.
        $html = str_replace($search, $replace, $html);

        // 3. Normalize self-closing tags (strip / from <hr />)
        $html = preg_replace( '/\s*\/>/', '>', $html );
        
        // 4. Remove non-functional whitespace
        $html = preg_replace( '/\s+/', ' ', $html );
        
        // Remove spaces between tags or at tag boundaries to minimize formatting noise
        $html = preg_replace( '/\s*(<[^>]+>)\s*/', '$1', $html );
        
        return trim( $html );
    };

    $norm_target = $clean_html( $target_html );
    
    // Gutenberg generates dynamic layout container classes on the fly (e.g., wp-container-5, wp-container-core-group-is-layout-1234)
    // These NEVER match between the JS DOM and the PHP server. We must strip them from both sides to achieve an exact match.
    $strip_volatile_parts = function( $html ) {
        // 1. Strip volatile attributes that WP/Browser might differ on
        $html = preg_replace('/\bdecoding=["\']?[^"\'>\s]*["\']?/i', '', $html);
        $html = preg_replace('/\bloading=["\']?[^"\'>\s]*["\']?/i', '', $html);

        // 2. Normalize and strip dynamic classes
        $html = preg_replace_callback('/class=["\']([^"\']*)["\']/', function($matches) {
            $classes = preg_split('/\s+/', trim($matches[1]), -1, PREG_SPLIT_NO_EMPTY);
            $clean = [];
            foreach($classes as $c) {
                // Filter out volatile layout/container/aipg classes
                if (preg_match('/^wp-container-/i', $c)) continue;
                if (preg_match('/^is-layout-/i', $c)) continue;
                if (preg_match('/-is-layout-/i', $c)) continue;
                if (preg_match('/^aipg-/i', $c)) continue;
                
                $c = trim($c, '-'); // Clean up leftovers
                if ($c) $clean[] = $c;
            }
            sort($clean);
            return $clean ? 'class="' . implode(' ', array_unique($clean)) . '"' : '';
        }, $html);

        // 3. Final whitespace squeeze
        return preg_replace( '/\s+/', ' ', trim($html) );
    };

    // The safest target representation is with dynamic classes stripped
    $stable_target = $strip_volatile_parts( $norm_target );

    foreach ( $parsed_blocks as $block ) {
        if ( empty( $block['blockName'] ) ) continue;

        // 1. Recurse into InnerBlocks FIRST (Bottom-up traversal)
        if ( ! empty( $block['innerBlocks'] ) ) {
            $found_inside = aipg_find_block_in_tree( $block['innerBlocks'], $target_html, $debug_log );
            if ( $found_inside ) return $found_inside;
        }

        $rendered = render_block( $block );
        $norm_rendered = $clean_html( $rendered );
        $stable_rendered = $strip_volatile_parts( $norm_rendered );

        if ( isset( $debug_log ) ) {
            $debug_log[] = [
                'blockName'       => $block['blockName'],
                'stable_rendered' => $stable_rendered,
                'stable_target'   => $stable_target
            ];
        }

        // 2. Direct exact match (Aggressively normalized)
        if ( $stable_rendered === $stable_target ) return $block;
        
        // 3. Robust match: Ignore all inner whitespace (Handy for entity/tag boundary mismatches)
        if ( str_replace(' ', '', $stable_rendered) === str_replace(' ', '', $stable_target) ) return $block;
        
        // 4. Fallback: Typography-normalized partial match
        if ( strpos( $norm_rendered, $norm_target ) !== false ) return $block;
    }

    return null;
}

/**
 * A recursive helper to replace a specific block node within the tree with new content.
 * 
 * @param array $parsed_blocks The current block tree
 * @param array $original_node The reference to the block node to be replaced
 * @param array $new_blocks    An array of pre-parsed blocks to inject as the replacement
 * @return array The updated tree
 */
function aipg_replace_block_in_tree( $parsed_blocks, $original_node, $new_blocks ) {
    if ( empty( $new_blocks ) ) return $parsed_blocks;

    foreach ( $parsed_blocks as $k => $block ) {
        // Strict identical check for the node object
        if ( $block === $original_node ) {
            // Replace the single element with the array of new blocks
            // This allows the AI to split one block into multiple or return a sequence
            array_splice( $parsed_blocks, $k, 1, $new_blocks );
            return $parsed_blocks;
        }
        
        if ( ! empty( $block['innerBlocks'] ) ) {
            $updated_inner = aipg_replace_block_in_tree( $block['innerBlocks'], $original_node, $new_blocks );
            if ( $updated_inner !== $block['innerBlocks'] ) {
                $parsed_blocks[$k]['innerBlocks'] = $updated_inner;
                return $parsed_blocks; // Return early once found and replaced
            }
        }
    }
    
    return $parsed_blocks;
}


// 10. AJAX Handler for Getting Version History
add_action( 'wp_ajax_aipg_get_version_history', 'aipg_ajax_get_version_history' );
function aipg_ajax_get_version_history() {
    check_ajax_referer( 'aipg_ajax_nonce', 'nonce' );
    if ( ! aipg_current_user_can_access() ) {
        wp_send_json_error( esc_html__( 'Permission denied.', 'ai-studio-generator' ) );
    }

    $project_id = isset( $_POST['project_id'] ) ? sanitize_text_field( wp_unslash( $_POST['project_id'] ) ) : '';
    $license_key = get_option( 'aipg_license_key', '' );
    // DEV-START
    $api_url = get_option( 'aipg_api_url', 'http://host.docker.internal:8000/' );
    // DEV-END
    // PROD-API-URL: $api_url = 'https://app.nodevzone.com/';

    $response = wp_remote_get( rtrim( $api_url, '/' ) . "/api/projects/$project_id/versions", [
        'headers' => [ 
            'X-License-Key' => $license_key,
            'X-Plugin-Version' => AIPG_VERSION
        ],
        'timeout' => 15
    ]);

    if ( is_wp_error( $response ) ) {
        wp_send_json_error( $response->get_error_message() );
    }

    $body = json_decode( wp_remote_retrieve_body( $response ), true );
    wp_send_json_success( $body );
}

// 11. AJAX Handler for Rolling back to a version
add_action( 'wp_ajax_aipg_rollback_version', 'aipg_ajax_rollback_version' );
function aipg_ajax_rollback_version() {
    check_ajax_referer( 'aipg_ajax_nonce', 'nonce' );
    if ( ! aipg_current_user_can_access() ) {
         wp_send_json_error( esc_html__( 'Permission denied.', 'ai-studio-generator' ) );
    }

    $plugin_id = isset( $_POST['plugin_id'] ) ? intval( wp_unslash( $_POST['plugin_id'] ) ) : 0;
    $version_id = isset( $_POST['version_id'] ) ? sanitize_text_field( wp_unslash( $_POST['version_id'] ) ) : '';
    $license_key = get_option( 'aipg_license_key', '' );
    // DEV-START
    $api_url = get_option( 'aipg_api_url', 'http://host.docker.internal:8000/' );
    // DEV-END
    // PROD-API-URL: $api_url = 'https://app.nodevzone.com/';

    // Get the code for this version from API
    $response = wp_remote_get( rtrim( $api_url, '/' ) . "/api/versions/$version_id/code", [
        'headers' => [ 
            'X-License-Key' => $license_key,
            'X-Plugin-Version' => AIPG_VERSION
        ],
        'timeout' => 20
    ]);

    if ( is_wp_error( $response ) ) {
        wp_send_json_error( $response->get_error_message() );
    }

    $body = json_decode( wp_remote_retrieve_body( $response ), true );
    $code = isset($body['code']) ? $body['code'] : null;

    if ( ! $code ) {
        wp_send_json_error( esc_html__( 'Could not retrieve code for this version.', 'ai-studio-generator' ) );
    }

    // Update File
    global $wpdb;
    // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
    $plugin = $wpdb->get_row( $wpdb->prepare( "SELECT * FROM {$wpdb->prefix}ai_plugins WHERE id = %d", $plugin_id ) );

    require_once ABSPATH . 'wp-admin/includes/file.php';
    WP_Filesystem();
    global $wp_filesystem;

    $file_path = WP_PLUGIN_DIR . '/' . $plugin->slug . '/' . $plugin->slug . '.php';
    if ( ! $wp_filesystem->put_contents( $file_path, $code ) ) {
        wp_send_json_error( esc_html__( 'Could not update plugin file.', 'ai-studio-generator' ) );
    }

    // Update DB
    $headers = aipg_parse_plugin_headers($code);
    // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
    $wpdb->update(
        "{$wpdb->prefix}ai_plugins",
        [
            'code' => $code,
            'name' => $headers['Name'] ?: $plugin->name,
            'version' => $headers['Version'] ?: '1.0.0',
            'active_version_remote_id' => $version_id,
            'modified_at' => current_time( 'mysql' )
        ],
        [ 'id' => $plugin_id ]
    );

    wp_send_json_success( esc_html__( 'Version restored successfully.', 'ai-studio-generator' ) );
}

// 12. AJAX Handler for Fetching Legal Content
add_action( 'wp_ajax_aipg_get_legal_content', 'aipg_ajax_get_legal_content' );
function aipg_ajax_get_legal_content() {
    check_ajax_referer( 'aipg_ajax_nonce', 'nonce' );
    if ( ! aipg_current_user_can_access() ) {
        wp_send_json_error( esc_html__( 'Permission denied.', 'ai-studio-generator' ) );
    }

    $license_key = get_option( 'aipg_license_key', '' );
    $api_url = get_option( 'aipg_api_url', 'http://host.docker.internal:8000/' );

    $response = wp_remote_get( rtrim( $api_url, '/' ) . '/api/public/legal/latest-content', [
        'headers' => [ 
            'X-License-Key' => $license_key,
            'X-Plugin-Version' => AIPG_VERSION
        ],
        'timeout' => 15
    ]);

    if ( is_wp_error( $response ) ) {
        wp_send_json_error( $response->get_error_message() );
    }

    $body = json_decode( wp_remote_retrieve_body( $response ), true );
    wp_send_json_success( $body );
}

// 13. AJAX Handler for Accepting Legal Terms
add_action( 'wp_ajax_aipg_accept_legal_terms', 'aipg_ajax_accept_legal_terms' );
function aipg_ajax_accept_legal_terms() {
    check_ajax_referer( 'aipg_ajax_nonce', 'nonce' );
    if ( ! aipg_current_user_can_access() ) {
        wp_send_json_error( esc_html__( 'Permission denied.', 'ai-studio-generator' ) );
    }

    $accepted_version_ids = isset($_POST['accepted_version_ids']) ? array_map('intval', $_POST['accepted_version_ids']) : [];
    $marketing_consent_version_id = isset($_POST['marketing_consent_version_id']) ? intval($_POST['marketing_consent_version_id']) : null;

    $license_key = get_option( 'aipg_license_key', '' );
    $api_url = get_option( 'aipg_api_url', 'http://host.docker.internal:8000/' );

    $payload = [
        'accepted_version_ids' => $accepted_version_ids,
        'client_ip' => isset($_SERVER['REMOTE_ADDR']) ? sanitize_text_field(wp_unslash($_SERVER['REMOTE_ADDR'])) : '',
        'user_agent' => isset($_SERVER['HTTP_USER_AGENT']) ? sanitize_text_field(wp_unslash($_SERVER['HTTP_USER_AGENT'])) : '',
        'source' => 'WP-Plugin v' . AIPG_VERSION
    ];

    if ($marketing_consent_version_id) {
        $payload['marketing_consent_version_id'] = $marketing_consent_version_id;
    }

    $response = wp_remote_post( rtrim( $api_url, '/' ) . '/api/public/legal/accept', [
        'headers' => [ 
            'X-License-Key' => $license_key,
            'X-Plugin-Version' => AIPG_VERSION,
            'Content-Type' => 'application/json'
        ],
        'body' => json_encode($payload),
        'timeout' => 15
    ]);

    if ( is_wp_error( $response ) ) {
        wp_send_json_error( $response->get_error_message() );
    }

    $status_code = wp_remote_retrieve_response_code( $response );
    $body = json_decode( wp_remote_retrieve_body( $response ), true );

    if ($status_code >= 400) {
        wp_send_json_error($body['detail'] ?? esc_html__( 'Failed to accept legal terms.', 'ai-studio-generator' ));
    }

    wp_send_json_success( $body );
}


// 14. AJAX Handler for Syncing Remote Projects
add_action( 'wp_ajax_aipg_sync_remote_projects', 'aipg_ajax_sync_remote_projects' );
function aipg_ajax_sync_remote_projects() {
    check_ajax_referer( 'aipg_ajax_nonce', 'nonce' );
    if ( ! aipg_current_user_can_access() ) {
        wp_send_json_error( esc_html__( 'Permission denied.', 'ai-studio-generator' ) );
    }

    $license_key = get_option( 'aipg_license_key', '' );
    // DEV-START: Try localhost instead of host.docker.internal for non-docker setups
    $api_url = get_option( 'aipg_api_url', 'http://host.docker.internal:8000/' );
    // DEV-END
    // PROD-API-URL: $api_url = 'https://app.nodevzone.com/';

    $response = wp_remote_get( rtrim( $api_url, '/' ) . "/api/projects", [
        'headers' => [ 
            'X-License-Key' => $license_key,
            'X-Plugin-Version' => AIPG_VERSION
        ],
        'timeout' => 20
    ]);

    if ( is_wp_error( $response ) ) {
        wp_send_json_error( sprintf( esc_html__( 'Connection error: %s. Please check if your AI Studio Backend is running at %s', 'ai-studio-generator' ), $response->get_error_message(), $api_url ) );
    }

    $status_code = wp_remote_retrieve_response_code( $response );
    $body_raw = wp_remote_retrieve_body( $response );
    $body = json_decode( $body_raw, true );

    if ( $status_code === 403 && isset( $body['code'] ) && $body['code'] === 'legal_consent_required' ) {
        wp_send_json_error( [
            'code' => 'legal_consent_required',
            'missing' => $body['missing'] ?? []
        ] );
    }

    if ( $status_code >= 400 ) {
        $error_msg = $body['detail'] ?? $body['message'] ?? ( ! empty( $body_raw ) ? $body_raw : esc_html__( 'Failed to sync projects (HTTP ' . $status_code . ').', 'ai-studio-generator' ) );
        wp_send_json_error( $error_msg );
    }

    if ( ! is_array( $body ) ) {
        wp_send_json_error( esc_html__( 'Invalid response from API. Raw body: ', 'ai-studio-generator' ) . substr( $body_raw, 0, 200 ) );
    }

    global $wpdb;
    $table_name = $wpdb->prefix . 'ai_plugins';
    $new_count = 0;
    $updated_count = 0;

    foreach ( $body as $project ) {
        $project_id = $project['id'] ?? '';
        if ( empty( $project_id ) ) continue;

        // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
        $existing = $wpdb->get_row( $wpdb->prepare( "SELECT id FROM {$wpdb->prefix}ai_plugins WHERE external_project_id = %s", $project_id ) );

        if ( ! $existing ) {
            // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
            $wpdb->insert(
                "{$wpdb->prefix}ai_plugins",
                [
                    'slug' => $project['slug'] ?? sanitize_title($project['name'] ?? 'ai-plugin'),
                    'external_project_id' => $project_id,
                    'active_version_remote_id' => $project['latest_version_id'] ?? '',
                    'name' => $project['name'] ?? 'AI Plugin',
                    'version' => $project['latest_version'] ?? '1.0.0',
                    'description' => $project['description'] ?? '',
                    'code' => '',
                    'last_synced_at' => current_time( 'mysql' )
                ]
            );
            $new_count++;
        } else {
            // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
            $wpdb->update(
                "{$wpdb->prefix}ai_plugins",
                [
                    'name' => $project['name'] ?? 'AI Plugin',
                    'version' => $project['latest_version'] ?? '1.0.0',
                    'active_version_remote_id' => $project['latest_version_id'] ?? '',
                    'last_synced_at' => current_time( 'mysql' )
                ],
                [ 'external_project_id' => $project_id ]
            );
            $updated_count++;
        }
    }

    /* translators: 1: Number of new projects, 2: Number of updated projects */
    wp_send_json_success( [ 'message' => sprintf( esc_html__( 'Successfully synced projects. %1$s new, %2$s updated.', 'ai-studio-generator' ), $new_count, $updated_count ), 'total' => count($body) ] );
}

// 15. AJAX Handler for Installing Remote Plugin
add_action( 'wp_ajax_aipg_install_remote_plugin', 'aipg_ajax_install_remote_plugin' );
function aipg_ajax_install_remote_plugin() {
    check_ajax_referer( 'aipg_ajax_nonce', 'nonce' );
    if ( ! aipg_current_user_can_access() ) {
        wp_send_json_error( esc_html__( 'Permission denied.', 'ai-studio-generator' ) );
    }
    if ( ! aipg_is_plugins_writable() ) {
        wp_send_json_error( esc_html__( 'Plugins directory is not writable.', 'ai-studio-generator' ) );
    }

    $plugin_id = isset( $_POST['plugin_id'] ) ? intval( wp_unslash( $_POST['plugin_id'] ) ) : 0;
    global $wpdb;
    // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
    $plugin = $wpdb->get_row( $wpdb->prepare( "SELECT * FROM {$wpdb->prefix}ai_plugins WHERE id = %d", $plugin_id ) );

    if ( ! $plugin ) {
        wp_send_json_error( esc_html__( 'Plugin not found in database.', 'ai-studio-generator' ) );
    }

    $version_id = $plugin->active_version_remote_id;
    if ( empty( $version_id ) ) {
        wp_send_json_error( esc_html__( 'No remote version ID found for this plugin.', 'ai-studio-generator' ) );
    }

    $license_key = get_option( 'aipg_license_key', '' );
    // DEV-START
    $api_url = get_option( 'aipg_api_url', 'http://host.docker.internal:8000/' );
    // DEV-END
    // PROD-API-URL: $api_url = 'https://app.nodevzone.com/';

    $response = wp_remote_get( rtrim( $api_url, '/' ) . "/api/versions/$version_id/code", [
        'headers' => [ 
            'X-License-Key' => $license_key,
            'X-Plugin-Version' => AIPG_VERSION
        ],
        'timeout' => 20
    ]);

    if ( is_wp_error( $response ) ) {
        wp_send_json_error( $response->get_error_message() );
    }

    $body = json_decode( wp_remote_retrieve_body( $response ), true );
    $code = isset($body['code']) ? $body['code'] : null;

    if ( ! $code ) {
        wp_send_json_error( esc_html__( 'Could not retrieve code for this plugin.', 'ai-studio-generator' ) );
    }

    require_once ABSPATH . 'wp-admin/includes/file.php';
    WP_Filesystem();
    global $wp_filesystem;

    $plugin_dir = WP_PLUGIN_DIR . '/' . $plugin->slug;
    if ( ! $wp_filesystem->is_dir( $plugin_dir ) ) {
        if ( ! $wp_filesystem->mkdir( $plugin_dir, FS_CHMOD_DIR ) ) {
            wp_send_json_error( esc_html__( 'Could not create plugin directory.', 'ai-studio-generator' ) );
        }
    }

    $file_path = $plugin_dir . '/' . $plugin->slug . '.php';
    if ( ! $wp_filesystem->put_contents( $file_path, $code ) ) {
        wp_send_json_error( esc_html__( 'Could not write plugin file.', 'ai-studio-generator' ) );
    }

    // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
    $wpdb->update(
        "{$wpdb->prefix}ai_plugins",
        [ 'code' => $code, 'last_synced_at' => current_time( 'mysql' ) ],
        [ 'id' => $plugin_id ]
    );

    // Automatic activation if requested
    $activate = isset($_POST['activate']) && sanitize_text_field(wp_unslash($_POST['activate'])) === 'true';
    if ($activate) {
        $plugin_file = $plugin->slug . '/' . $plugin->slug . '.php';
        if (!is_plugin_active($plugin_file)) {
            $result = activate_plugin($plugin_file);
            if (is_wp_error($result)) {
                wp_send_json_success([ 
                    /* translators: %s: Error Message */
                    'message' => sprintf( esc_html__( 'Plugin installed, but activation failed: %s', 'ai-studio-generator' ), $result->get_error_message() ),
                    'activated' => false 
                ]);
            }
        }
        wp_send_json_success([ 
            'message' => esc_html__( 'Plugin installed and activated successfully!', 'ai-studio-generator' ),
            'activated' => true 
        ]);
    }

    wp_send_json_success( [ 'message' => esc_html__( 'Plugin installed successfully!', 'ai-studio-generator' ), 'activated' => false ] );
}

// 16. AJAX Handler for Deleting Plugin
add_action( 'wp_ajax_aipg_remove_plugin_files', 'aipg_ajax_delete_plugin' );
function aipg_ajax_delete_plugin() {
    check_ajax_referer( 'aipg_ajax_nonce', 'nonce' );
    if ( ! aipg_current_user_can_access() ) {
        wp_send_json_error( esc_html__( 'Permission denied.', 'ai-studio-generator' ) );
    }

    $plugin_id = isset( $_POST['plugin_id'] ) ? intval( wp_unslash( $_POST['plugin_id'] ) ) : 0;
    global $wpdb;
    // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
    $plugin = $wpdb->get_row( $wpdb->prepare( "SELECT * FROM {$wpdb->prefix}ai_plugins WHERE id = %d", $plugin_id ) );

    if ( ! $plugin ) {
        wp_send_json_error( esc_html__( 'Plugin not found.', 'ai-studio-generator' ) );
    }

    $plugin_slug = $plugin->slug;
    $plugin_dir = WP_PLUGIN_DIR . '/' . $plugin_slug;
    $main_file = $plugin_slug . '/' . $plugin_slug . '.php';

    // 1. Deactivate if active
    if ( is_plugin_active( $main_file ) ) {
        deactivate_plugins( $main_file );
    }

    // 2. Delete files
    if ( file_exists( $plugin_dir ) ) {
        require_once ABSPATH . 'wp-admin/includes/file.php';
        WP_Filesystem();
        global $wp_filesystem;
        
        if ( ! $wp_filesystem->delete( $plugin_dir, true ) ) {
            wp_send_json_error( esc_html__( 'Could not delete plugin files. Please check permissions.', 'ai-studio-generator' ) );
        }
    }

    // 3. Update DB (clear code, but keep the record)
    // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
    $wpdb->update(
        "{$wpdb->prefix}ai_plugins",
        [ 'code' => '', 'modified_at' => current_time( 'mysql' ) ],
        [ 'id' => $plugin_id ]
    );

    wp_send_json_success( esc_html__( 'Plugin files deleted successfully. It remains available in your Hub.', 'ai-studio-generator' ) );
}
