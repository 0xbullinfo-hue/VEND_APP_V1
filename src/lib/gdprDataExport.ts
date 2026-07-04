/**
 * GDPR Data Export Utility
 *
 * Implements GDPR Article 20 right to data portability
 * Allows users to export their personal data in machine-readable format
 */

import * as FileSystem from 'expo-file-system';
import { supabase } from './supabase';

// Sharing will be available on native platforms
const Sharing = require('expo-sharing');

// ─── Type Definitions ──────────────────────────────────────────────────────

export interface UserDataExport {
  exportedAt: string;
  dataFormat: 'json' | 'csv';
  userData: {
    profile: UserProfile;
    preferences: UserPreferences;
    activity: UserActivity;
  };
  summary: {
    totalDataPoints: number;
    dataCategories: string[];
    exportMethod: string;
  };
}

export interface UserProfile {
  id: string;
  phone: string;
  email?: string;
  createdAt: string;
  lastLogin: string;
  accountStatus: 'active' | 'suspended' | 'deleted';
  metadata?: Record<string, unknown>;
}

export interface UserPreferences {
  notifications: {
    enabled: boolean;
    pushNotifications: boolean;
    emailNotifications: boolean;
    smsNotifications: boolean;
  };
  privacy: {
    profileVisibility: string;
    locationTracking: boolean;
    analyticsTracking: boolean;
  };
  language: string;
  theme: string;
}

export interface UserActivity {
  totalSessions: number;
  totalTrips?: number;
  totalVendorListings?: number;
  lastActivityDate: string;
  deviceInfo: {
    lastDeviceType: string;
    lastOSVersion: string;
  };
}

export interface ExportOptions {
  format: 'json' | 'csv';
  includeMetadata: boolean;
  includeSensitiveData: boolean;
}

// ─── Data Export Service ──────────────────────────────────────────────────

class GDPRDataExportService {
  private exportInProgress = false;

  /**
   * Fetch all user data from Supabase
   */
  private async fetchUserData(userId: string): Promise<UserDataExport['userData']> {
    // Fetch user profile
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      throw new Error('Failed to fetch user profile');
    }

    // Fetch user preferences
    const { data: prefs } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Fetch user activity
    const { data: activity } = await supabase
      .from('user_activity')
      .select('*')
      .eq('user_id', userId)
      .single();

    return {
      profile: profile as UserProfile,
      preferences: prefs as UserPreferences,
      activity: activity as UserActivity,
    };
  }

  /**
   * Generate JSON export
   */
  private generateJSONExport(userData: UserDataExport['userData']): string {
    const export_data: UserDataExport = {
      exportedAt: new Date().toISOString(),
      dataFormat: 'json',
      userData,
      summary: {
        totalDataPoints: this.calculateDataPoints(userData),
        dataCategories: [
          'Profile Information',
          'Preferences',
          'Activity History',
        ],
        exportMethod: 'GDPR Data Portability',
      },
    };

    return JSON.stringify(export_data, null, 2);
  }

  /**
   * Generate CSV export (flattened structure)
   */
  private generateCSVExport(userData: UserDataExport['userData']): string {
    const lines: string[] = [];

    // CSV Header
    lines.push(
      'Data Category,Field,Value,Type,Timestamp'
    );

    // Profile data
    const profile = userData.profile;
    lines.push(
      `Profile,ID,"${profile.id}",string,${new Date().toISOString()}`
    );
    lines.push(
      `Profile,Phone,"${profile.phone}",string,${profile.createdAt}`
    );
    if (profile.email) {
      lines.push(
        `Profile,Email,"${profile.email}",string,${profile.createdAt}`
      );
    }
    lines.push(
      `Profile,Account Created,"${profile.createdAt}",datetime,${profile.createdAt}`
    );
    lines.push(
      `Profile,Last Login,"${profile.lastLogin}",datetime,${profile.lastLogin}`
    );
    lines.push(
      `Profile,Account Status,"${profile.accountStatus}",string,${new Date().toISOString()}`
    );

    // Preferences data
    const prefs = userData.preferences;
    lines.push(
      `Preferences,Notifications Enabled,"${prefs.notifications.enabled}",boolean,${new Date().toISOString()}`
    );
    lines.push(
      `Preferences,Push Notifications,"${prefs.notifications.pushNotifications}",boolean,${new Date().toISOString()}`
    );
    lines.push(
      `Preferences,Email Notifications,"${prefs.notifications.emailNotifications}",boolean,${new Date().toISOString()}`
    );
    lines.push(
      `Preferences,SMS Notifications,"${prefs.notifications.smsNotifications}",boolean,${new Date().toISOString()}`
    );
    lines.push(
      `Preferences,Profile Visibility,"${prefs.privacy.profileVisibility}",string,${new Date().toISOString()}`
    );
    lines.push(
      `Preferences,Location Tracking,"${prefs.privacy.locationTracking}",boolean,${new Date().toISOString()}`
    );
    lines.push(
      `Preferences,Analytics Tracking,"${prefs.privacy.analyticsTracking}",boolean,${new Date().toISOString()}`
    );
    lines.push(
      `Preferences,Language,"${prefs.language}",string,${new Date().toISOString()}`
    );
    lines.push(
      `Preferences,Theme,"${prefs.theme}",string,${new Date().toISOString()}`
    );

    // Activity data
    const activity = userData.activity;
    lines.push(
      `Activity,Total Sessions,"${activity.totalSessions}",number,${activity.lastActivityDate}`
    );
    if (activity.totalTrips) {
      lines.push(
        `Activity,Total Trips,"${activity.totalTrips}",number,${activity.lastActivityDate}`
      );
    }
    lines.push(
      `Activity,Last Activity,"${activity.lastActivityDate}",datetime,${activity.lastActivityDate}`
    );
    lines.push(
      `Activity,Last Device Type,"${activity.deviceInfo.lastDeviceType}",string,${activity.lastActivityDate}`
    );

    return lines.join('\n');
  }

  /**
   * Calculate total number of data points
   */
  private calculateDataPoints(userData: UserDataExport['userData']): number {
    let count = 0;

    // Profile fields
    count += Object.keys(userData.profile).length;

    // Preferences (nested objects)
    count += Object.keys(userData.preferences).reduce(
      (acc, key) => {
        const val = userData.preferences[key as keyof UserPreferences];
        if (typeof val === 'object') {
          return acc + Object.keys(val).length;
        }
        return acc + 1;
      },
      0
    );

    // Activity fields
    count += Object.keys(userData.activity).length;

    return count;
  }

  /**
   * Export user data as file
   */
  async exportUserData(
    userId: string,
    options: ExportOptions = { format: 'json', includeMetadata: true, includeSensitiveData: false }
  ): Promise<string> {
    if (this.exportInProgress) {
      throw new Error('Export already in progress');
    }

    try {
      this.exportInProgress = true;
      console.log('[GDPR] Starting data export for user:', userId);

      // Fetch user data
      const userData = await this.fetchUserData(userId);

      // Generate export based on format
      let exportContent: string;
      let fileName: string;

      if (options.format === 'csv') {
        exportContent = this.generateCSVExport(userData);
        fileName = `vend-data-export-${userId}-${Date.now()}.csv`;
      } else {
        exportContent = this.generateJSONExport(userData);
        fileName = `vend-data-export-${userId}-${Date.now()}.json`;
      }

      // Save to file system
      const filePath = `${FileSystem.documentDirectory}${fileName}`;
      await FileSystem.writeAsStringAsync(filePath, exportContent);

      console.log('[GDPR] Data export file created:', filePath);

      // Log export event for audit
      await this.logExportEvent(userId, options.format, filePath);

      return filePath;
    } finally {
      this.exportInProgress = false;
    }
  }

  /**
   * Share exported data file
   */
  async shareExportedData(filePath: string): Promise<void> {
    if (!filePath) {
      throw new Error('No file path provided');
    }

    try {
      if (!(await Sharing.isAvailableAsync())) {
        throw new Error('Sharing is not available on this device');
      }

      await Sharing.shareAsync(filePath, {
        UTI: filePath.endsWith('.json') ? 'public.json' : 'public.comma-separated-values-text',
        mimeType: filePath.endsWith('.json') ? 'application/json' : 'text/csv',
      });

      console.log('[GDPR] Data export shared successfully');
    } catch (error) {
      console.error('[GDPR] Error sharing data export:', error);
      throw error;
    }
  }

  /**
   * Log data export event for compliance audit trail
   */
  private async logExportEvent(
    userId: string,
    format: string,
    filePath: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('gdpr_export_logs')
        .insert({
          user_id: userId,
          export_format: format,
          file_path: filePath,
          exported_at: new Date().toISOString(),
          ip_address: 'mobile-app', // Would be actual IP in production
          user_agent: 'VEND App Mobile',
        });

      if (error) {
        console.warn('[GDPR] Could not log export event:', error);
      }
    } catch (error) {
      console.warn('[GDPR] Error logging export event:', error);
    }
  }

  /**
   * Check if user has pending export requests
   */
  async hasPendingExportRequest(userId: string): Promise<boolean> {
    try {
      const { data } = await supabase
        .from('gdpr_export_requests')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'pending')
        .single();

      return !!data;
    } catch {
      return false;
    }
  }

  /**
   * Create export request (for batch processing)
   */
  async requestDataExport(userId: string): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('gdpr_export_requests')
        .insert({
          user_id: userId,
          status: 'pending',
          requested_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        })
        .select('id')
        .single();

      if (error) {
        throw error;
      }

      console.log('[GDPR] Export request created:', data.id);
      return data.id;
    } catch (error) {
      console.error('[GDPR] Error creating export request:', error);
      throw error;
    }
  }

  /**
   * Get export request status
   */
  async getExportRequestStatus(requestId: string): Promise<{
    status: 'pending' | 'processing' | 'ready' | 'expired' | 'completed';
    downloadUrl?: string;
    createdAt: string;
    expiresAt: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('gdpr_export_requests')
        .select('status, download_url, created_at, expires_at')
        .eq('id', requestId)
        .single();

      if (error) {
        throw error;
      }

      return {
        status: data.status,
        downloadUrl: data.download_url,
        createdAt: data.created_at,
        expiresAt: data.expires_at,
      };
    } catch (error) {
      console.error('[GDPR] Error getting export status:', error);
      throw error;
    }
  }
}

// ─── Singleton Instance ────────────────────────────────────────────────────

export const gdprDataExport = new GDPRDataExportService();

// ─── Convenience Exports ──────────────────────────────────────────────────

export const exportUserData = (userId: string, options?: ExportOptions) =>
  gdprDataExport.exportUserData(userId, options);

export const shareExportedData = (filePath: string) =>
  gdprDataExport.shareExportedData(filePath);

export const requestDataExport = (userId: string) =>
  gdprDataExport.requestDataExport(userId);

export const getExportRequestStatus = (requestId: string) =>
  gdprDataExport.getExportRequestStatus(requestId);

export const hasPendingExportRequest = (userId: string) =>
  gdprDataExport.hasPendingExportRequest(userId);
