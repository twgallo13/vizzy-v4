import * as admin from 'firebase-admin';

export interface WrikeConfig {
  apiUrl: string;
  accessToken: string;
  refreshToken?: string;
  projectId: string;
  folderId?: string;
}

export interface WrikeProject {
  id: string;
  title: string;
  description: string;
  status: string;
  customFields: Record<string, unknown>;
}

export interface WrikeTask {
  id: string;
  title: string;
  description: string;
  status: string;
  assignees: string[];
  dueDate: string;
  parentId?: string;
}

export class WrikeIntegration {
  private config: WrikeConfig;

  constructor(config: WrikeConfig) {
    this.config = config;
  }

  async syncProject(projectData: Record<string, unknown>): Promise<WrikeProject> {
    try {
      // TODO: Implement actual Wrike API calls
      // For now, return mock data
      const wrikeProject: WrikeProject = {
        id: `wrike_${Date.now()}`,
        title: projectData.title as string,
        description: projectData.description as string,
        status: this.mapStatus(projectData.status as string),
        customFields: this.mapCustomFields(projectData),
      };

      // Store sync record
      await admin.firestore().collection('wrike').add({
        type: 'project_sync',
        projectId: wrikeProject.id,
        syncedAt: admin.firestore.FieldValue.serverTimestamp(),
        data: wrikeProject,
      });

      return wrikeProject;
    } catch (error) {
      console.error('Error syncing project to Wrike:', error);
      throw error;
    }
  }

  async createTask(taskData: Record<string, unknown>): Promise<WrikeTask> {
    try {
      // TODO: Implement actual Wrike API calls
      const wrikeTask: WrikeTask = {
        id: `task_${Date.now()}`,
        title: taskData.title as string,
        description: taskData.description as string,
        status: 'Active',
        assignees: taskData.assignees as string[] || [],
        dueDate: taskData.dueDate as string,
        parentId: taskData.parentId as string,
      };

      // Store task record
      await admin.firestore().collection('wrike').add({
        type: 'task_created',
        taskId: wrikeTask.id,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        data: wrikeTask,
      });

      return wrikeTask;
    } catch (error) {
      console.error('Error creating Wrike task:', error);
      throw error;
    }
  }

  async updateTask(taskId: string, updates: Record<string, unknown>): Promise<WrikeTask> {
    try {
      // TODO: Implement actual Wrike API calls
      // For now, return mock updated task
      const updatedTask: WrikeTask = {
        id: taskId,
        title: updates.title as string || 'Updated Task',
        description: updates.description as string || '',
        status: updates.status as string || 'Active',
        assignees: updates.assignees as string[] || [],
        dueDate: updates.dueDate as string || '',
      };

      // Store update record
      await admin.firestore().collection('wrike').add({
        type: 'task_updated',
        taskId,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updates,
      });

      return updatedTask;
    } catch (error) {
      console.error('Error updating Wrike task:', error);
      throw error;
    }
  }

  async getProject(projectId: string): Promise<WrikeProject | null> {
    try {
      // TODO: Implement actual Wrike API calls
      // For now, return mock data
      return {
        id: projectId,
        title: 'Mock Project',
        description: 'Mock project description',
        status: 'Active',
        customFields: {},
      };
    } catch (error) {
      console.error('Error fetching Wrike project:', error);
      return null;
    }
  }

  async getTasks(projectId: string): Promise<WrikeTask[]> {
    try {
      // TODO: Implement actual Wrike API calls
      // For now, return mock data
      return [
        {
          id: 'task_1',
          title: 'Mock Task 1',
          description: 'Mock task description',
          status: 'Active',
          assignees: ['user1'],
          dueDate: '2024-02-01',
          parentId: projectId,
        },
        {
          id: 'task_2',
          title: 'Mock Task 2',
          description: 'Another mock task',
          status: 'Completed',
          assignees: ['user2'],
          dueDate: '2024-01-15',
          parentId: projectId,
        },
      ];
    } catch (error) {
      console.error('Error fetching Wrike tasks:', error);
      return [];
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      // TODO: Implement actual Wrike API connection test
      // For now, return true for testing
      return true;
    } catch (error) {
      console.error('Wrike connection test failed:', error);
      return false;
    }
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

  private mapCustomFields(data: Record<string, unknown>): Record<string, unknown> {
    const customFields: Record<string, unknown> = {};

    // Map common fields to Wrike custom fields
    if (data.budget) customFields.budget = data.budget;
    if (data.priority) customFields.priority = data.priority;
    if (data.tags) customFields.tags = data.tags;
    if (data.teamId) customFields.teamId = data.teamId;

    return customFields;
  }
}

// Export function for scheduled sync
export const wrikeSync = async (): Promise<void> => {
  try {
    // TODO: Get Wrike config from Firestore or environment
    const config: WrikeConfig = {
      apiUrl: 'https://www.wrike.com/api/v4',
      accessToken: 'mock_token',
      projectId: 'mock_project',
    };

    const wrikeIntegration = new WrikeIntegration(config);

    // Test connection
    const isConnected = await wrikeIntegration.testConnection();
    if (!isConnected) {
      throw new Error('Wrike connection failed');
    }

    // Get campaigns that need syncing
    const campaignsSnapshot = await admin.firestore()
      .collection('campaigns')
      .where('wrikeSyncNeeded', '==', true)
      .limit(10)
      .get();

    console.log(`Found ${campaignsSnapshot.docs.length} campaigns needing Wrike sync`);

    for (const campaignDoc of campaignsSnapshot.docs) {
      try {
        const campaignData = campaignDoc.data();
        
        // Sync campaign to Wrike
        const wrikeProject = await wrikeIntegration.syncProject(campaignData);
        
        // Update campaign with Wrike ID
        await campaignDoc.ref.update({
          wrikeId: wrikeProject.id,
          wrikeSyncNeeded: false,
          lastWrikeSync: admin.firestore.FieldValue.serverTimestamp(),
        });

        console.log(`Synced campaign ${campaignDoc.id} to Wrike project ${wrikeProject.id}`);
      } catch (error) {
        console.error(`Error syncing campaign ${campaignDoc.id}:`, error);
      }
    }

    // Log sync completion
    await admin.firestore().collection('telemetry').add({
      event: 'wrike_sync_completed',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      campaignsProcessed: campaignsSnapshot.docs.length,
    });

  } catch (error) {
    console.error('Wrike sync error:', error);
    
    // Log error
    await admin.firestore().collection('telemetry').add({
      event: 'wrike_sync_error',
      error: error.message,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
};
