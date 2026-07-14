/**
 * GDPR Account Deletion Utility
 *
 * Implements GDPR Article 17 right to be forgotten
 * Allows users to request complete account deletion
 */

import { supabase } from './supabase';
import { errorReporter } from './errorReporting';

// ─── Type Definitions ──────────────────────────────────────────────────────

export type DeletionReason =
  | 'user_request'
  | 'inactive_account'
  | 'compliance'
  | 'other';

export interface DeletionRequest {
  id: string;
  userId: string;
  reason: DeletionReason;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  requestedAt: string;
  completedAt?: string;
  error?: string;
  confirmationCode?: string;
  confirmed: boolean;
}

export interface DeletionCheckpoint {
  step: string;
  completed: boolean;
  completedAt?: string;
  error?: string;
}

// ─── Deletion Service ──────────────────────────────────────────────────────

class AccountDeletionService {
  private deletionInProgress: Set<string> = new Set();

  /**
   * Step 1: Create deletion request (requires user confirmation)
   */
  async createDeletionRequest(
    userId: string,
    reason: DeletionReason = 'user_request'
  ): Promise<DeletionRequest> {
    try {
      console.log('[GDPR] Creating account deletion request for user:', userId);

      // Generate confirmation code (6 digits)
      const confirmationCode = String(Math.floor(Math.random() * 1000000)).padStart(6, '0');

      const { data, error } = await supabase
        .from('account_deletion_requests')
        .insert({
          user_id: userId,
          reason,
          status: 'pending',
          confirmation_code: confirmationCode,
          confirmed: false,
          requested_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        })
        .select('*')
        .single();

      if (error) {
        throw error;
      }

      // Log deletion request for audit
      errorReporter.captureMessage(
        `Account deletion request created for user ${userId}`,
        'INFO' as any,
        {
          userId,
          feature: 'account_deletion',
          action: 'create_deletion_request',
          metadata: { reason, requestId: data.id },
        }
      );

      return {
        id: data.id,
        userId: data.user_id,
        reason: data.reason,
        status: data.status,
        requestedAt: data.requested_at,
        confirmationCode: data.confirmation_code,
        confirmed: false,
      };
    } catch (error) {
      console.error('[GDPR] Error creating deletion request:', error);
      errorReporter.captureException(error as Error, {
        userId,
        feature: 'account_deletion',
        action: 'create_deletion_request',
      });
      throw error;
    }
  }

  /**
   * Step 2: Confirm deletion with code sent via SMS/email
   */
  async confirmDeletion(
    deletionRequestId: string,
    confirmationCode: string,
    userId: string
  ): Promise<boolean> {
    try {
      console.log('[GDPR] Confirming account deletion:', deletionRequestId);

      // Fetch the deletion request
      const { data: request, error: fetchError } = await supabase
        .from('account_deletion_requests')
        .select('*')
        .eq('id', deletionRequestId)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      // Verify user ID matches
      if (request.user_id !== userId) {
        throw new Error('User ID mismatch');
      }

      // Verify confirmation code
      if (request.confirmation_code !== confirmationCode) {
        throw new Error('Invalid confirmation code');
      }

      // Verify not already confirmed
      if (request.confirmed) {
        throw new Error('Deletion already confirmed');
      }

      // Check expiration (30 days)
      const requestedTime = new Date(request.requested_at).getTime();
      const expiryTime = requestedTime + 30 * 24 * 60 * 60 * 1000;
      if (Date.now() > expiryTime) {
        throw new Error('Confirmation code expired');
      }

      // Update deletion request as confirmed
      const { error: updateError } = await supabase
        .from('account_deletion_requests')
        .update({
          confirmed: true,
          confirmed_at: new Date().toISOString(),
        })
        .eq('id', deletionRequestId);

      if (updateError) {
        throw updateError;
      }

      console.log('[GDPR] Account deletion confirmed:', deletionRequestId);

      errorReporter.captureMessage(
        `Account deletion confirmed for user ${userId}`,
        'INFO' as any,
        {
          userId,
          feature: 'account_deletion',
          action: 'confirm_deletion',
          metadata: { deletionRequestId },
        }
      );

      return true;
    } catch (error) {
      console.error('[GDPR] Error confirming deletion:', error);
      errorReporter.captureException(error as Error, {
        userId,
        feature: 'account_deletion',
        action: 'confirm_deletion',
      });
      throw error;
    }
  }

  /**
   * Step 3: Execute account deletion (cannot be undone)
   */
  async executeAccountDeletion(userId: string, deletionRequestId: string): Promise<void> {
    if (this.deletionInProgress.has(userId)) {
      throw new Error('Deletion already in progress for this user');
    }

    this.deletionInProgress.add(userId);

    try {
      console.log('[GDPR] Executing account deletion for user:', userId);

      // Verify deletion is confirmed
      const { data: request, error: fetchError } = await supabase
        .from('account_deletion_requests')
        .select('*')
        .eq('id', deletionRequestId)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      if (!request.confirmed) {
        throw new Error('Deletion not confirmed');
      }

      if (request.status === 'completed') {
        throw new Error('Account already deleted');
      }

      // Start deletion process
      await this.updateDeletionStatus(deletionRequestId, 'processing');

      // Delete in order: non-critical first, then critical
      const steps = [
        { name: 'delete_activity_logs', fn: () => this.deleteActivityLogs(userId) },
        { name: 'delete_preferences', fn: () => this.deletePreferences(userId) },
        { name: 'delete_sessions', fn: () => this.deleteSessions(userId) },
        { name: 'anonymize_profile', fn: () => this.anonymizeProfile(userId) },
      ];

      for (const step of steps) {
        try {
          console.log(`[GDPR] Executing deletion step: ${step.name}`);
          await step.fn();
          await this.logDeletionCheckpoint(deletionRequestId, step.name, true);
        } catch (stepError) {
          console.error(`[GDPR] Error in deletion step ${step.name}:`, stepError);
          await this.logDeletionCheckpoint(deletionRequestId, step.name, false, stepError);
          // Continue with next step even if one fails
        }
      }

      // Finally, mark user account as deleted
      await this.markAccountDeleted(userId);

      // Update deletion request as completed
      await this.updateDeletionStatus(deletionRequestId, 'completed');

      console.log('[GDPR] Account deletion completed for user:', userId);

      errorReporter.captureMessage(
        `Account deletion completed for user ${userId}`,
        'INFO' as any,
        {
          userId,
          feature: 'account_deletion',
          action: 'execute_deletion',
          metadata: { deletionRequestId },
        }
      );
    } catch (error) {
      console.error('[GDPR] Error executing account deletion:', error);

      // Update status to failed
      try {
        await this.updateDeletionStatus(deletionRequestId, 'failed', String(error));
      } catch (updateError) {
        console.error('[GDPR] Could not update deletion status:', updateError);
      }

      errorReporter.captureException(error as Error, {
        userId,
        feature: 'account_deletion',
        action: 'execute_deletion',
      });

      throw error;
    } finally {
      this.deletionInProgress.delete(userId);
    }
  }

  /**
   * Delete user activity logs
   */
  private async deleteActivityLogs(userId: string): Promise<void> {
    const { error } = await supabase
      .from('user_activity')
      .delete()
      .eq('user_id', userId);

    if (error) {
      throw error;
    }
  }

  /**
   * Delete user preferences
   */
  private async deletePreferences(userId: string): Promise<void> {
    const { error } = await supabase
      .from('user_preferences')
      .delete()
      .eq('user_id', userId);

    if (error) {
      throw error;
    }
  }

  /**
   * Delete user sessions
   */
  private async deleteSessions(userId: string): Promise<void> {
    const { error } = await supabase
      .from('user_sessions')
      .delete()
      .eq('user_id', userId);

    if (error) {
      throw error;
    }
  }

  /**
   * Anonymize user profile (required for compliance audit trail)
   */
  private async anonymizeProfile(userId: string): Promise<void> {
    const { error } = await supabase
      .from('users')
      .update({
        phone: `[DELETED-${Date.now()}]`,
        email: null,
        name: '[DELETED]',
        profile_picture_url: null,
      })
      .eq('id', userId);

    if (error) {
      throw error;
    }
  }

  /**
   * Mark account as deleted
   */
  private async markAccountDeleted(userId: string): Promise<void> {
    const { error } = await supabase
      .from('users')
      .update({
        account_status: 'deleted',
        deleted_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) {
      throw error;
    }
  }

  /**
   * Update deletion request status
   */
  private async updateDeletionStatus(
    deletionRequestId: string,
    status: DeletionRequest['status'],
    errorMsg?: string
  ): Promise<void> {
    const update: any = {
      status,
    };

    if (status === 'completed' || status === 'failed') {
      update.completed_at = new Date().toISOString();
    }

    if (errorMsg) {
      update.error = errorMsg;
    }

    const { error } = await supabase
      .from('account_deletion_requests')
      .update(update)
      .eq('id', deletionRequestId);

    if (error) {
      throw error;
    }
  }

  /**
   * Log deletion checkpoint for audit trail
   */
  private async logDeletionCheckpoint(
    deletionRequestId: string,
    step: string,
    completed: boolean,
    error?: unknown
  ): Promise<void> {
    try {
      await supabase
        .from('deletion_checkpoints')
        .insert({
          deletion_request_id: deletionRequestId,
          step,
          completed,
          completed_at: completed ? new Date().toISOString() : null,
          error: !completed ? String(error) : null,
        });
    } catch (err) {
      console.warn('[GDPR] Could not log deletion checkpoint:', err);
    }
  }

  /**
   * Get deletion request status
   */
  async getDeletionStatus(
    deletionRequestId: string,
    userId: string
  ): Promise<DeletionRequest> {
    try {
      const { data, error } = await supabase
        .from('account_deletion_requests')
        .select('*')
        .eq('id', deletionRequestId)
        .eq('user_id', userId)
        .single();

      if (error) {
        throw error;
      }

      return {
        id: data.id,
        userId: data.user_id,
        reason: data.reason,
        status: data.status,
        requestedAt: data.requested_at,
        completedAt: data.completed_at,
        error: data.error,
        confirmed: data.confirmed,
      };
    } catch (error) {
      console.error('[GDPR] Error getting deletion status:', error);
      throw error;
    }
  }

  /**
   * Cancel deletion request (only if not completed)
   */
  async cancelDeletion(deletionRequestId: string, userId: string): Promise<void> {
    try {
      // Verify request exists and belongs to user
      const { data: request, error: fetchError } = await supabase
        .from('account_deletion_requests')
        .select('*')
        .eq('id', deletionRequestId)
        .eq('user_id', userId)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      if (request.status === 'completed') {
        throw new Error('Cannot cancel completed deletion');
      }

      // Update status to cancelled
      const { error: updateError } = await supabase
        .from('account_deletion_requests')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
        })
        .eq('id', deletionRequestId);

      if (updateError) {
        throw updateError;
      }

      console.log('[GDPR] Account deletion cancelled:', deletionRequestId);

      errorReporter.captureMessage(
        `Account deletion cancelled for user ${userId}`,
        'INFO' as any,
        {
          userId,
          feature: 'account_deletion',
          action: 'cancel_deletion',
          metadata: { deletionRequestId },
        }
      );
    } catch (error) {
      console.error('[GDPR] Error cancelling deletion:', error);
      errorReporter.captureException(error as Error, {
        userId,
        feature: 'account_deletion',
        action: 'cancel_deletion',
      });
      throw error;
    }
  }
}

// ─── Singleton Instance ────────────────────────────────────────────────────

export const accountDeletion = new AccountDeletionService();

// ─── Convenience Exports ──────────────────────────────────────────────────

export const createDeletionRequest = (userId: string, reason?: DeletionReason) =>
  accountDeletion.createDeletionRequest(userId, reason);

export const confirmDeletion = (deletionRequestId: string, code: string, userId: string) =>
  accountDeletion.confirmDeletion(deletionRequestId, code, userId);

export const executeAccountDeletion = (userId: string, deletionRequestId: string) =>
  accountDeletion.executeAccountDeletion(userId, deletionRequestId);

export const getDeletionStatus = (deletionRequestId: string, userId: string) =>
  accountDeletion.getDeletionStatus(deletionRequestId, userId);

export const cancelDeletion = (deletionRequestId: string, userId: string) =>
  accountDeletion.cancelDeletion(deletionRequestId, userId);
