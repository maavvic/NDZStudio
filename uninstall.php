<?php
/**
 * Fired when the plugin is uninstalled.
 */

// If uninstall not called from WordPress, then exit.
if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}

// 1. Delete Table
global $wpdb;

$aipg_table_name = $wpdb->prefix . 'ai_plugins';

// We have to use a direct query here for dropping tables on uninstall, but WPCS dislikes string interpolation.
// phpcs:disable WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.DirectDatabaseQuery.SchemaChange, WordPress.DB.PreparedSQL.InterpolatedNotPrepared, PluginCheck.Security.DirectDB.UnescapedDBParameter
$wpdb->query( "DROP TABLE IF EXISTS {$aipg_table_name}" );
// phpcs:enable

// 2. Delete Options
$aipg_options = array(
	'aipg_license_key',
	'aipg_api_url',
	'aipg_access_capability',
	'aipg_update_info',
    'aipg_is_dev'
);

foreach ( $aipg_options as $aipg_option_name ) {
	delete_option( $aipg_option_name );
}

