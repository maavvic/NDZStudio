<?php
/**
 * WP Studio Wizard - Admin Logic
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

// 2.2 Redirect to Wizard if no projects exist - DEPRECATED for the new menu structure
// add_action( 'admin_init', 'aipg_maybe_redirect_to_wizard' );

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
