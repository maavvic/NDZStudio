<?php
/**
 * WP Studio Wizard - Admin Logic
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Redirect to Wizard if no projects exist
 */
function aipg_maybe_redirect_to_wizard() {
    if ( ! is_admin() || ( defined( 'DOING_AJAX' ) && DOING_AJAX ) || ( defined( 'REST_REQUEST' ) && REST_REQUEST ) ) {
        return;
    }

    // Extra safety for REST and system requests
    if ( isset( $_SERVER['REQUEST_URI'] ) ) {
        $uri = $_SERVER['REQUEST_URI'];
        if ( strpos( $uri, '/wp-json/' ) !== false || strpos( $uri, 'wp-admin/admin-ajax.php' ) !== false || strpos( $uri, 'rest_route=' ) !== false ) {
            return;
        }
    }
    
    // Don't redirect if we are saving settings or already on the wizard page
    if ( isset($_GET['page']) && $_GET['page'] === 'ai-generator' && ! isset($_GET['skip_wizard']) && ! isset($_POST['save_settings']) ) {
        global $wpdb;
        $table_name = $wpdb->prefix . 'ai_plugins';
        // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
        $count = $wpdb->get_var( "SELECT COUNT(*) FROM $table_name" );
        if ( $count == 0 ) {
            wp_redirect( admin_url( 'admin.php?page=ai-studio-wizard' ) );
            exit;
        }
    }
}

/**
 * Render the WP Studio Onboarding Wizard
 */
function aipg_render_wizard_page() {
    aipg_ensure_table_exists();

    $message = '';
    
    // Handle License Key Saving
    if ( isset( $_POST['save_settings'] ) && isset( $_POST['aipg_s_nonce'] ) && wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['aipg_s_nonce'] ) ), 'aipg_settings' ) ) {
        if ( isset( $_POST['aipg_api_url'] ) ) {
            update_option( 'aipg_api_url', esc_url_raw( wp_unslash( $_POST['aipg_api_url'] ) ) );
        }
        if ( isset( $_POST['aipg_license_key'] ) ) {
            update_option( 'aipg_license_key', sanitize_text_field( wp_unslash( $_POST['aipg_license_key'] ) ) );
        }
        $message = 'Settings saved.';
    }
    
    $current_key = get_option( 'aipg_license_key', '' );
    if ( empty( $current_key ) ) {
        aipg_render_license_screen($message);
        return;
    }

    $api_status = aipg_check_api_connection();
    if ( ! $api_status['connected'] ) {
        aipg_render_license_screen( $api_status['message'] );
        return;
    }

    ?>
    <div class="wrap" id="aipg-wizard-container">
        <div id="wp-studio-wizard-root">
            <div class="aipg-wizard-loading">
                <div class="aipg-spinner"></div>
                <p><?php esc_html_e( 'Initializing Studio Wizard...', 'ai-studio-generator' ); ?></p>
            </div>
        </div>
    </div>
    <?php
}
