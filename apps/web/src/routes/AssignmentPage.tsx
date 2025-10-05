import { useState } from 'react';
import { motion } from 'framer-motion';
import { UserCheck, Plus, Filter, Search, Clock, User, Calendar } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { campaignsApi } from '@/lib/api';
import { trackUserAction, trackFeatureUsage } from '@/lib/telemetry';

interface Assignment {
  id: string;
  title: string;
  description: string;
  assignedTo: string;
  assignedBy: string;
  status: 'pending' | 'in-progress' | 'completed' | 'overdue';
  priority: 'low' | 'medium' | 'high';
  dueDate: Date;
  createdAt: Date;
  campaignId?: string;
}

export default function AssignmentPage(): JSX.Element {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
  const queryClient = useQueryClient();

  // Mock assignments data (in real app, this would come from API)
  const assignments: Assignment[] = [
    {
      id: '1',
      title: 'Review Q1 Campaign Performance',
      description: 'Analyze metrics and provide recommendations for Q2',
      assignedTo: 'John Doe',
      assignedBy: 'Jane Smith',
      status: 'in-progress',
      priority: 'high',
      dueDate: new Date(2024, 0, 20),
      createdAt: new Date(2024, 0, 10),
      campaignId: 'campaign-1',
    },
    {
      id: '2',
      title: 'Create Social Media Content',
      description: 'Develop content calendar for February campaigns',
      assignedTo: 'Mike Johnson',
      assignedBy: 'Sarah Wilson',
      status: 'pending',
      priority: 'medium',
      dueDate: new Date(2024, 0, 25),
      createdAt: new Date(2024, 0, 12),
      campaignId: 'campaign-2',
    },
    {
      id: '3',
      title: 'Design Email Templates',
      description: 'Create responsive email templates for product launch',
      assignedTo: 'Emily Davis',
      assignedBy: 'Tom Brown',
      status: 'completed',
      priority: 'high',
      dueDate: new Date(2024, 0, 18),
      createdAt: new Date(2024, 0, 8),
      campaignId: 'campaign-3',
    },
  ];

  // Filter assignments
  const filteredAssignments = assignments.filter((assignment) => {
    const matchesSearch = assignment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         assignment.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         assignment.assignedTo.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || assignment.status === statusFilter;
    const matchesAssignee = assigneeFilter === 'all' || assignment.assignedTo === assigneeFilter;
    return matchesSearch && matchesStatus && matchesAssignee;
  });

  const handleCreateAssignment = (): void => {
    trackFeatureUsage('assignments', 'create');
    // TODO: Open create assignment modal
    console.log('Create assignment clicked');
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'pending':
        return 'bg-secondary-100 text-secondary-800';
      case 'in-progress':
        return 'bg-primary-100 text-primary-800';
      case 'completed':
        return 'bg-success-100 text-success-800';
      case 'overdue':
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
      year: 'numeric',
    }).format(date);
  };

  const isOverdue = (dueDate: Date): boolean => {
    return dueDate < new Date() && statusFilter !== 'completed';
  };

  // Get unique assignees for filter
  const assignees = Array.from(new Set(assignments.map(a => a.assignedTo)));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Assignments</h1>
          <p className="text-secondary-600 mt-1">
            Manage task assignments and track progress
          </p>
        </div>
        <button
          onClick={handleCreateAssignment}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>New Assignment</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-64">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary-400" />
            <input
              type="text"
              placeholder="Search assignments..."
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
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
        
        <select
          value={assigneeFilter}
          onChange={(e) => setAssigneeFilter(e.target.value)}
          className="input"
        >
          <option value="all">All Assignees</option>
          {assignees.map((assignee) => (
            <option key={assignee} value={assignee}>
              {assignee}
            </option>
          ))}
        </select>
      </div>

      {/* Assignments List */}
      {filteredAssignments.length === 0 ? (
        <div className="text-center py-12">
          <UserCheck className="h-12 w-12 text-secondary-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-secondary-900 mb-2">No assignments found</h3>
          <p className="text-secondary-600 mb-6">
            {searchQuery || statusFilter !== 'all' || assigneeFilter !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Get started by creating your first assignment'
            }
          </p>
          {!searchQuery && statusFilter === 'all' && assigneeFilter === 'all' && (
            <button
              onClick={handleCreateAssignment}
              className="btn-primary"
            >
              Create Assignment
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAssignments.map((assignment, index) => (
            <motion.div
              key={assignment.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`card hover:shadow-md transition-shadow ${
                isOverdue(assignment.dueDate) ? 'border-danger-200 bg-danger-50/30' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="text-lg font-semibold text-secondary-900 truncate">
                      {assignment.title}
                    </h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(assignment.status)}`}>
                      {assignment.status.replace('-', ' ')}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(assignment.priority)}`}>
                      {assignment.priority}
                    </span>
                    {isOverdue(assignment.dueDate) && (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-danger-100 text-danger-800">
                        Overdue
                      </span>
                    )}
                  </div>
                  
                  <p className="text-secondary-600 text-sm mb-3">
                    {assignment.description}
                  </p>
                  
                  <div className="flex items-center space-x-4 text-sm text-secondary-500">
                    <div className="flex items-center space-x-1">
                      <User className="h-4 w-4" />
                      <span>Assigned to {assignment.assignedTo}</span>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>Due {formatDate(assignment.dueDate)}</span>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>Created {formatDate(assignment.createdAt)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  <button className="btn-ghost text-sm">
                    Edit
                  </button>
                  <button className="btn-ghost text-sm text-primary-600 hover:text-primary-700">
                    View Details
                  </button>
                </div>
              </div>
              
              {assignment.campaignId && (
                <div className="pt-4 border-t border-secondary-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-secondary-600">
                      Related to Campaign: {assignment.campaignId}
                    </span>
                    <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                      View Campaign
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary-600">Total Assignments</p>
              <p className="text-2xl font-bold text-secondary-900">{assignments.length}</p>
            </div>
            <UserCheck className="h-8 w-8 text-primary-600" />
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary-600">In Progress</p>
              <p className="text-2xl font-bold text-primary-600">
                {assignments.filter(a => a.status === 'in-progress').length}
              </p>
            </div>
            <Clock className="h-8 w-8 text-primary-600" />
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary-600">Completed</p>
              <p className="text-2xl font-bold text-success-600">
                {assignments.filter(a => a.status === 'completed').length}
              </p>
            </div>
            <User className="h-8 w-8 text-success-600" />
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary-600">Overdue</p>
              <p className="text-2xl font-bold text-danger-600">
                {assignments.filter(a => isOverdue(a.dueDate)).length}
              </p>
            </div>
            <Calendar className="h-8 w-8 text-danger-600" />
          </div>
        </div>
      </div>
    </div>
  );
}
