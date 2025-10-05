import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Filter, Search, Calendar, User, Clock } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { campaignsApi } from '@/lib/api';
import { trackUserAction, trackFeatureUsage } from '@/lib/telemetry';
import { formatShort, coalesceDate, AnyDate } from '@/lib/dateSafe';

interface Campaign {
  id: string;
  title: string;
  description?: string;
  status: 'draft' | 'in_review' | 'approved' | 'active' | 'completed';
  owner_id?: string;
  assignedTo?: string;
  dueDate?: AnyDate;
  createdAt?: AnyDate;
  updatedAt?: AnyDate;
}

export default function PlannerPage(): JSX.Element {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const queryClient = useQueryClient();

  // Fetch campaigns
  const { data: campaigns = [], isLoading, error } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => campaignsApi.getAll(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Create campaign mutation
  const createCampaignMutation = useMutation({
    mutationFn: (data: Omit<Campaign, 'id'>) => campaignsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      trackUserAction('campaign_created');
    },
  });

  // Filter campaigns
  const filteredCampaigns = campaigns.filter((campaign: Campaign) => {
    const matchesSearch = campaign.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (campaign.description && campaign.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreateCampaign = (): void => {
    trackFeatureUsage('planner', 'create_campaign');
    // TODO: Open create campaign modal
    console.log('Create campaign clicked');
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'draft':
        return 'bg-secondary-100 text-secondary-800';
      case 'in-review':
        return 'bg-warning-100 text-warning-800';
      case 'approved':
        return 'bg-success-100 text-success-800';
      case 'active':
        return 'bg-primary-100 text-primary-800';
      case 'completed':
        return 'bg-secondary-100 text-secondary-600';
      default:
        return 'bg-secondary-100 text-secondary-800';
    }
  };

  // Remove the old formatDate function - we'll use formatShort from dateSafe

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-secondary-600">Loading campaigns...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <p className="text-danger-600 mb-4">Failed to load campaigns</p>
          <button 
            onClick={() => window.location.reload()}
            className="btn-primary"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Campaign Planner</h1>
          <p className="text-secondary-600 mt-1">
            Manage and track your marketing campaigns
          </p>
        </div>
        <button
          onClick={handleCreateCampaign}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>New Campaign</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary-400" />
            <input
              type="text"
              placeholder="Search campaigns..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10"
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-secondary-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="in_review">In Review</option>
            <option value="approved">Approved</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Campaign Grid */}
      {filteredCampaigns.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 text-secondary-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-secondary-900 mb-2">No campaigns found</h3>
          <p className="text-secondary-600 mb-6">
            {searchQuery || statusFilter !== 'all' 
              ? 'Try adjusting your search or filters'
              : 'Get started by creating your first campaign'
            }
          </p>
          {!searchQuery && statusFilter === 'all' && (
            <button
              onClick={handleCreateCampaign}
              className="btn-primary"
            >
              Create Campaign
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCampaigns.map((campaign: Campaign, index: number) => (
            <motion.div
              key={campaign.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="card hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-semibold text-secondary-900 line-clamp-2">
                  {campaign.title}
                </h3>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(campaign.status)}`}>
                  {campaign.status.replace('-', ' ')}
                </span>
              </div>
              
              {campaign.description && (
                <p className="text-secondary-600 text-sm mb-4 line-clamp-3">
                  {campaign.description}
                </p>
              )}
              
              <div className="space-y-2 text-sm text-secondary-500">
                {(campaign.assignedTo || campaign.owner_id) && (
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span>{campaign.assignedTo || campaign.owner_id}</span>
                  </div>
                )}
                
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4" />
                  <span>Due {formatShort(campaign.dueDate)}</span>
                </div>
                
                {campaign.updatedAt && (
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4" />
                    <span>Updated {formatShort(campaign.updatedAt)}</span>
                  </div>
                )}
              </div>
              
              <div className="mt-4 pt-4 border-t border-secondary-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-secondary-500">
                    Created {formatShort(campaign.createdAt)}
                  </span>
                  <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                    View Details
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary-600">Total Campaigns</p>
              <p className="text-2xl font-bold text-secondary-900">{campaigns.length}</p>
            </div>
            <Calendar className="h-8 w-8 text-primary-600" />
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary-600">In Review</p>
              <p className="text-2xl font-bold text-warning-600">
                {campaigns.filter((c: Campaign) => c.status === 'in_review').length}
              </p>
            </div>
            <Clock className="h-8 w-8 text-warning-600" />
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary-600">Active</p>
              <p className="text-2xl font-bold text-success-600">
                {campaigns.filter((c: Campaign) => c.status === 'active').length}
              </p>
            </div>
            <User className="h-8 w-8 text-success-600" />
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary-600">Completed</p>
              <p className="text-2xl font-bold text-secondary-600">
                {campaigns.filter((c: Campaign) => c.status === 'completed').length}
              </p>
            </div>
            <Calendar className="h-8 w-8 text-secondary-600" />
          </div>
        </div>
      </div>
    </div>
  );
}
