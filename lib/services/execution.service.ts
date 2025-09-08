import { SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import {
  WorkflowExecution,
  ExecutionLog,
  CreateExecutionDTO,
  ExecutionFilter,
  ExecutionStatus,
  LogLevel,
  ExecutionWithLogs,
  DatabaseResponse,
  PaginatedResponse
} from '@/lib/types/database';

export class ExecutionService {
  private realtimeChannels: Map<string, RealtimeChannel> = new Map();

  constructor(private supabase: SupabaseClient) {}

  /**
   * Start a new workflow execution
   */
  async startExecution(data: CreateExecutionDTO): Promise<DatabaseResponse<WorkflowExecution>> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: execution, error } = await this.supabase
        .from('executions')
        .insert({
          ...data,
          user_id: user.id,
          status: 'pending' as ExecutionStatus,
          started_at: new Date().toISOString()
        })
        .select()
        .single();

      if (execution) {
        // Update workflow's last_run_at
        await this.supabase
          .from('workflows')
          .update({ last_run_at: new Date().toISOString() })
          .eq('id', data.workflow_id);
      }

      return { data: execution, error };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  /**
   * Update execution status
   */
  async updateExecutionStatus(
    executionId: string,
    status: ExecutionStatus,
    outputData?: any,
    errorMessage?: string,
    errorDetails?: any
  ): Promise<DatabaseResponse<WorkflowExecution>> {
    try {
      const updateData: any = { status };

      if (status === 'success' || status === 'failed' || status === 'cancelled') {
        updateData.completed_at = new Date().toISOString();
      }

      if (outputData) updateData.output_data = outputData;
      if (errorMessage) updateData.error_message = errorMessage;
      if (errorDetails) updateData.error_details = errorDetails;

      const { data: execution, error } = await this.supabase
        .from('executions')
        .update(updateData)
        .eq('id', executionId)
        .select()
        .single();

      return { data: execution, error };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  /**
   * Get executions with filtering
   */
  async getExecutions(
    filter?: ExecutionFilter,
    page: number = 1,
    pageSize: number = 20
  ): Promise<PaginatedResponse<WorkflowExecution>> {
    try {
      let query = this.supabase
        .from('executions')
        .select('*', { count: 'exact' })
        .order('started_at', { ascending: false });

      if (filter?.workflowId) {
        query = query.eq('workflow_id', filter.workflowId);
      }

      if (filter?.status) {
        query = query.eq('status', filter.status);
      }

      if (filter?.startDate) {
        query = query.gte('started_at', filter.startDate);
      }

      if (filter?.endDate) {
        query = query.lte('started_at', filter.endDate);
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        data: data || [],
        count: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize)
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get execution with logs
   */
  async getExecutionWithLogs(executionId: string): Promise<DatabaseResponse<ExecutionWithLogs>> {
    try {
      // Get execution
      const { data: execution, error: execError } = await this.supabase
        .from('executions')
        .select('*')
        .eq('id', executionId)
        .single();

      if (execError) throw execError;

      // Get logs
      const { data: logs, error: logsError } = await this.supabase
        .from('execution_logs')
        .select('*')
        .eq('execution_id', executionId)
        .order('timestamp');

      if (logsError) throw logsError;

      return {
        data: {
          ...execution,
          logs
        },
        error: null
      };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  /**
   * Add log entry to execution
   */
  async addExecutionLog(
    executionId: string,
    level: LogLevel,
    message: string,
    data?: any,
    nodeId?: string
  ): Promise<DatabaseResponse<ExecutionLog>> {
    try {
      const { data: log, error } = await this.supabase
        .from('execution_logs')
        .insert({
          execution_id: executionId,
          node_id: nodeId,
          level,
          message,
          data,
          timestamp: new Date().toISOString()
        })
        .select()
        .single();

      return { data: log, error };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  /**
   * Retry a failed execution
   */
  async retryExecution(executionId: string): Promise<DatabaseResponse<WorkflowExecution>> {
    try {
      // Get the original execution
      const { data: original, error: getError } = await this.supabase
        .from('executions')
        .select('*')
        .eq('id', executionId)
        .single();

      if (getError || !original) throw getError || new Error('Execution not found');

      // Check retry count
      if (original.retry_count >= original.max_retries) {
        throw new Error('Maximum retry attempts exceeded');
      }

      // Update retry count and reset status
      const { data: execution, error } = await this.supabase
        .from('executions')
        .update({
          status: 'pending' as ExecutionStatus,
          retry_count: original.retry_count + 1,
          started_at: new Date().toISOString(),
          completed_at: null,
          error_message: null,
          error_details: null
        })
        .eq('id', executionId)
        .select()
        .single();

      return { data: execution, error };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  /**
   * Cancel a running execution
   */
  async cancelExecution(executionId: string): Promise<DatabaseResponse<WorkflowExecution>> {
    try {
      const { data: execution, error } = await this.supabase
        .from('executions')
        .update({
          status: 'cancelled' as ExecutionStatus,
          completed_at: new Date().toISOString()
        })
        .eq('id', executionId)
        .eq('status', 'running')
        .select()
        .single();

      return { data: execution, error };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  /**
   * Subscribe to execution status changes
   */
  subscribeToExecution(
    executionId: string,
    onUpdate: (execution: WorkflowExecution) => void
  ): () => void {
    const channel = this.supabase
      .channel(`execution:${executionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'executions',
          filter: `id=eq.${executionId}`
        },
        (payload) => {
          onUpdate(payload.new as WorkflowExecution);
        }
      )
      .subscribe();

    this.realtimeChannels.set(`execution:${executionId}`, channel);

    // Return unsubscribe function
    return () => {
      this.unsubscribeFromExecution(executionId);
    };
  }

  /**
   * Subscribe to execution logs
   */
  subscribeToExecutionLogs(
    executionId: string,
    onNewLog: (log: ExecutionLog) => void
  ): () => void {
    const channel = this.supabase
      .channel(`execution-logs:${executionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'execution_logs',
          filter: `execution_id=eq.${executionId}`
        },
        (payload) => {
          onNewLog(payload.new as ExecutionLog);
        }
      )
      .subscribe();

    this.realtimeChannels.set(`execution-logs:${executionId}`, channel);

    // Return unsubscribe function
    return () => {
      this.unsubscribeFromExecutionLogs(executionId);
    };
  }

  /**
   * Unsubscribe from execution updates
   */
  private unsubscribeFromExecution(executionId: string): void {
    const channel = this.realtimeChannels.get(`execution:${executionId}`);
    if (channel) {
      this.supabase.removeChannel(channel);
      this.realtimeChannels.delete(`execution:${executionId}`);
    }
  }

  /**
   * Unsubscribe from execution logs
   */
  private unsubscribeFromExecutionLogs(executionId: string): void {
    const channel = this.realtimeChannels.get(`execution-logs:${executionId}`);
    if (channel) {
      this.supabase.removeChannel(channel);
      this.realtimeChannels.delete(`execution-logs:${executionId}`);
    }
  }

  /**
   * Get execution statistics
   */
  async getExecutionStats(workflowId?: string): Promise<DatabaseResponse<{
    total: number;
    success: number;
    failed: number;
    running: number;
    averageDuration: number;
  }>> {
    try {
      let query = this.supabase.from('executions').select('status, duration_ms');
      
      if (workflowId) {
        query = query.eq('workflow_id', workflowId);
      }

      const { data, error } = await query;

      if (error) throw error;

      const stats = {
        total: data?.length || 0,
        success: data?.filter(e => e.status === 'success').length || 0,
        failed: data?.filter(e => e.status === 'failed').length || 0,
        running: data?.filter(e => e.status === 'running').length || 0,
        averageDuration: 0
      };

      const completedExecutions = data?.filter(e => e.duration_ms !== null) || [];
      if (completedExecutions.length > 0) {
        const totalDuration = completedExecutions.reduce((sum, e) => sum + (e.duration_ms || 0), 0);
        stats.averageDuration = Math.round(totalDuration / completedExecutions.length);
      }

      return { data: stats, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  /**
   * Clean up old executions
   */
  async cleanupOldExecutions(daysToKeep: number = 30): Promise<DatabaseResponse<number>> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const { data, error } = await this.supabase
        .from('executions')
        .delete()
        .lt('created_at', cutoffDate.toISOString())
        .select();

      return { data: data?.length || 0, error };
    } catch (error) {
      return { data: 0, error: error as Error };
    }
  }
}