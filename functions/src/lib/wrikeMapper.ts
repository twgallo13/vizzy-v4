export interface WrikeMappingOptions {
  campaign: Record<string, unknown>;
  exportType: 'campaign' | 'tasks' | 'timeline';
  includeMetadata?: boolean;
}

export interface WrikeData {
  title: string;
  description: string;
  status: string;
  dueDate: string;
  assignees: string[];
  customFields: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export class WrikeMapper {
  private fieldMappings: Record<string, string> = {
    title: 'title',
    description: 'description',
    status: 'status',
    dueDate: 'dueDate',
    assignedTo: 'assignees',
    budget: 'budget',
    tags: 'tags',
    priority: 'priority',
  };

  async mapCampaignToWrike(options: WrikeMappingOptions): Promise<WrikeData> {
    const { campaign, exportType, includeMetadata = true } = options;

    // Base mapping
    const wrikeData: WrikeData = {
      title: this.mapField(campaign, 'title') as string,
      description: this.mapField(campaign, 'description') as string,
      status: this.mapStatus(campaign.status as string),
      dueDate: this.formatDate(campaign.dueDate as string),
      assignees: this.mapAssignees(campaign.assignedTo as string),
      customFields: this.mapCustomFields(campaign),
    };

    // Add metadata if requested
    if (includeMetadata) {
      wrikeData.metadata = {
        source: 'vizzy',
        campaignId: campaign.id,
        exportType,
        exportedAt: new Date().toISOString(),
        originalData: campaign,
      };
    }

    // Type-specific mapping
    switch (exportType) {
      case 'tasks':
        return this.mapToTasks(wrikeData, campaign);
      case 'timeline':
        return this.mapToTimeline(wrikeData, campaign);
      default:
        return wrikeData;
    }
  }

  private mapField(campaign: Record<string, unknown>, fieldName: string): unknown {
    const mapping = this.fieldMappings[fieldName];
    if (mapping && campaign[fieldName] !== undefined) {
      return campaign[fieldName];
    }
    return null;
  }

  private mapStatus(status: string): string {
    const statusMap: Record<string, string> = {
      'draft': 'Draft',
      'in-review': 'In Progress',
      'approved': 'Approved',
      'active': 'Active',
      'completed': 'Completed',
    };

    return statusMap[status] || 'Draft';
  }

  private formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0]; // YYYY-MM-DD format
    } catch (error) {
      console.error('Error formatting date:', error);
      return new Date().toISOString().split('T')[0];
    }
  }

  private mapAssignees(assignedTo: string): string[] {
    if (!assignedTo) return [];
    
    // Handle both single assignee and multiple assignees
    if (Array.isArray(assignedTo)) {
      return assignedTo;
    }
    
    return [assignedTo];
  }

  private mapCustomFields(campaign: Record<string, unknown>): Record<string, unknown> {
    const customFields: Record<string, unknown> = {};

    // Map budget
    if (campaign.budget !== undefined) {
      customFields.budget = campaign.budget;
    }

    // Map tags
    if (campaign.tags && Array.isArray(campaign.tags)) {
      customFields.tags = campaign.tags;
    }

    // Map priority
    if (campaign.priority) {
      customFields.priority = campaign.priority;
    }

    // Map team information
    if (campaign.teamId) {
      customFields.teamId = campaign.teamId;
    }

    return customFields;
  }

  private mapToTasks(wrikeData: WrikeData, campaign: Record<string, unknown>): WrikeData {
    // Add task-specific fields
    return {
      ...wrikeData,
      customFields: {
        ...wrikeData.customFields,
        taskType: 'Campaign Task',
        estimatedHours: campaign.estimatedHours || 8,
        dependencies: campaign.dependencies || [],
      },
    };
  }

  private mapToTimeline(wrikeData: WrikeData, campaign: Record<string, unknown>): WrikeData {
    // Add timeline-specific fields
    return {
      ...wrikeData,
      customFields: {
        ...wrikeData.customFields,
        timelineType: 'Campaign Timeline',
        milestones: campaign.milestones || [],
        startDate: campaign.startDate || campaign.createdAt,
      },
    };
  }

  async syncFromWrike(wrikeId: string): Promise<Record<string, unknown>> {
    // TODO: Implement Wrike API integration to fetch updated data
    // For now, return mock data
    return {
      id: wrikeId,
      title: 'Synced from Wrike',
      status: 'active',
      lastSync: new Date().toISOString(),
    };
  }

  async validateWrikeConnection(): Promise<boolean> {
    // TODO: Implement actual Wrike API connection validation
    // For now, return true for testing
    return true;
  }
}

export const wrikeMapper = new WrikeMapper();
