import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, CheckCircle, XCircle, Clock, FileText, User, Calendar } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { governanceApi, callables } from '@/lib/api';
import { trackUserAction, trackFeatureUsage } from '@/lib/telemetry';

interface GovernanceItem {
  id: string;
  type: 'campaign_approval' | 'content_review' | 'policy_change';
  title: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedBy: string;
  submittedAt: Date;
  reviewedBy?: string;
  reviewedAt?: Date;
  priority: 'low' | 'medium' | 'high';
  metadata?: Record<string, unknown>;
}

export default function GovernancePage(): JSX.Element {
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const queryClient = useQueryClient();

  // Fetch governance items
  const { data: items = [], isLoading } = useQuery({
    queryKey: ['governance', filter],
    queryFn: () => governanceApi.getAll({ status: filter === 'all' ? undefined : filter }),
    staleTime: 1 * 60 * 1000, // 1 minute
  });

  // Approve item mutation
  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      const result = await callables.approveCampaign({ itemId: id });
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['governance'] });
      trackUserAction('governance_approved');
    },
  });

  // Reject item mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      // TODO: Implement reject callable
      console.log('Rejecting item:', id, reason);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['governance'] });
      trackUserAction('governance_rejected');
    },
  });

  const handleApprove = (id: string): void => {
    approveMutation.mutate(id);
  };

  const handleReject = (id: string): void => {
    const reason = prompt('Reason for rejection:');
    if (reason) {
      rejectMutation.mutate({ id, reason });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return Clock;
      case 'approved':
        return CheckCircle;
      case 'rejected':
        return XCircle;
      default:
        return Clock;
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'pending':
        return 'bg-warning-100 text-warning-800';
      case 'approved':
        return 'bg-success-100 text-success-800';
      case 'rejected':
        return 'bg-danger-100 text-danger-800';
      default:
        return 'bg-secondary-100 text-secondary-800';
    }
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'high':
        return 'bg-danger-100 text-danger-800';
      case 'medium':
        return 'bg-warning-100 text-warning-800';
      case 'low':
        return 'bg-secondary-100 text-secondary-800';
      default:
        return 'bg-secondary-100 text-secondary-800';
    }
  };

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getFilterCount = (status: string): number => {
    return items.filter((item: GovernanceItem) => item.status === status).length;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-secondary-600">Loading governance items...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Governance</h1>
          <p className="text-secondary-600 mt-1">
            Review and approve campaign changes and policy updates
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === status
                ? 'bg-primary-600 text-white'
                : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200'
            }`}
          >
            {status === 'all' ? 'All' : status.replace('_', ' ')}
            {status !== 'all' && (
              <span className="ml-2 px-2 py-1 text-xs bg-white/20 rounded-full">
                {getFilterCount(status)}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Items List */}
      {items.length === 0 ? (
        <div className="text-center py-12">
          <Shield className="h-12 w-12 text-secondary-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-secondary-900 mb-2">
            No {filter === 'all' ? '' : filter} items found
          </h3>
          <p className="text-secondary-600">
            {filter === 'pending' 
              ? 'All items have been reviewed'
              : 'Items will appear here as they are submitted for review'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item: GovernanceItem, index: number) => {
            const StatusIcon = getStatusIcon(item.status);
            
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="card hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-lg bg-primary-100 flex items-center justify-center">
                        <StatusIcon className="h-5 w-5 text-primary-600" />
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="text-lg font-semibold text-secondary-900">
                          {item.title}
                        </h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(item.status)}`}>
                          {item.status}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(item.priority)}`}>
                          {item.priority}
                        </span>
                      </div>
                      
                      <p className="text-secondary-600 text-sm mb-3">
                        {item.description}
                      </p>
                      
                      <div className="flex items-center space-x-4 text-xs text-secondary-500">
                        <div className="flex items-center space-x-1">
                          <User className="h-3 w-3" />
                          <span>{item.submittedBy}</span>
                        </div>
                        
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>Submitted {formatDate(item.submittedAt)}</span>
                        </div>
                        
                        {item.reviewedAt && (
                          <div className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>Reviewed {formatDate(item.reviewedAt)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {item.status === 'pending' && (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleApprove(item.id)}
                        disabled={approveMutation.isPending}
                        className="btn-secondary text-success-600 hover:text-success-700 hover:bg-success-50 flex items-center space-x-1"
                      >
                        <CheckCircle className="h-4 w-4" />
                        <span>Approve</span>
                      </button>
                      
                      <button
                        onClick={() => handleReject(item.id)}
                        disabled={rejectMutation.isPending}
                        className="btn-secondary text-danger-600 hover:text-danger-700 hover:bg-danger-50 flex items-center space-x-1"
                      >
                        <XCircle className="h-4 w-4" />
                        <span>Reject</span>
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="pt-4 border-t border-secondary-200">
                  <button className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center space-x-1">
                    <FileText className="h-4 w-4" />
                    <span>View Details</span>
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary-600">Pending Review</p>
              <p className="text-2xl font-bold text-warning-600">{getFilterCount('pending')}</p>
            </div>
            <Clock className="h-8 w-8 text-warning-600" />
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary-600">Approved</p>
              <p className="text-2xl font-bold text-success-600">{getFilterCount('approved')}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-success-600" />
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary-600">Rejected</p>
              <p className="text-2xl font-bold text-danger-600">{getFilterCount('rejected')}</p>
            </div>
            <XCircle className="h-8 w-8 text-danger-600" />
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary-600">Total Items</p>
              <p className="text-2xl font-bold text-secondary-900">{items.length}</p>
            </div>
            <Shield className="h-8 w-8 text-primary-600" />
          </div>
        </div>
      </div>
    </div>
  );
}
