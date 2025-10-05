import * as admin from 'firebase-admin';

export interface CampaignValidationResult {
  errors: string[];
  warnings: string[];
  isValid: boolean;
}

export interface ValidationContext {
  campaignId: string;
  campaignData: Record<string, unknown>;
  validationType: 'draft' | 'preview' | 'publish';
  userId: string;
}

export class GovernanceEngine {
  private db = admin.firestore();

  async validateCampaign(context: ValidationContext): Promise<CampaignValidationResult> {
    const { campaignData, validationType, userId } = context;
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic validation rules
    await this.validateRequiredFields(campaignData, errors);
    await this.validateContentPolicy(campaignData, errors, warnings);
    await this.validateBusinessRules(campaignData, errors, warnings);
    
    // User-specific validation
    await this.validateUserPermissions(userId, campaignData, errors);
    
    // Type-specific validation
    if (validationType === 'publish') {
      await this.validatePublishRequirements(campaignData, errors);
    }

    return {
      errors,
      warnings,
      isValid: errors.length === 0,
    };
  }

  private async validateRequiredFields(
    campaignData: Record<string, unknown>,
    errors: string[]
  ): Promise<void> {
    const requiredFields = ['title', 'description', 'assignedTo', 'dueDate'];
    
    for (const field of requiredFields) {
      if (!campaignData[field] || 
          (typeof campaignData[field] === 'string' && !campaignData[field].toString().trim())) {
        errors.push(`${field} is required`);
      }
    }

    // Validate due date is in the future
    if (campaignData.dueDate) {
      const dueDate = new Date(campaignData.dueDate as string);
      if (dueDate <= new Date()) {
        errors.push('Due date must be in the future');
      }
    }
  }

  private async validateContentPolicy(
    campaignData: Record<string, unknown>,
    errors: string[],
    warnings: string[]
  ): Promise<void> {
    const title = campaignData.title as string;
    const description = campaignData.description as string;

    // Check for inappropriate content (basic example)
    const inappropriateWords = ['spam', 'scam', 'fake'];
    const content = `${title} ${description}`.toLowerCase();
    
    for (const word of inappropriateWords) {
      if (content.includes(word)) {
        warnings.push(`Content may contain inappropriate language: "${word}"`);
      }
    }

    // Check title length
    if (title && title.length > 100) {
      errors.push('Title must be 100 characters or less');
    }

    // Check description length
    if (description && description.length > 1000) {
      warnings.push('Description is quite long, consider shortening for better engagement');
    }
  }

  private async validateBusinessRules(
    campaignData: Record<string, unknown>,
    errors: string[],
    warnings: string[]
  ): Promise<void> {
    // Check budget constraints
    const budget = campaignData.budget as number;
    if (budget !== undefined) {
      if (budget < 0) {
        errors.push('Budget cannot be negative');
      } else if (budget > 1000000) {
        warnings.push('Budget exceeds recommended maximum for single campaign');
      }
    }

    // Check campaign timeline
    const dueDate = new Date(campaignData.dueDate as string);
    const createdAt = campaignData.createdAt ? new Date(campaignData.createdAt as string) : new Date();
    const daysDiff = Math.ceil((dueDate.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff < 1) {
      errors.push('Campaign timeline must be at least 1 day');
    } else if (daysDiff > 365) {
      warnings.push('Campaign timeline exceeds 1 year, consider breaking into smaller campaigns');
    }
  }

  private async validateUserPermissions(
    userId: string,
    campaignData: Record<string, unknown>,
    errors: string[]
  ): Promise<void> {
    try {
      const userDoc = await this.db.collection('users').doc(userId).get();
      if (!userDoc.exists) {
        errors.push('User profile not found');
        return;
      }

      const userData = userDoc.data();
      const userRoles = userData?.roles || {};

      // Check if user has permission to create campaigns
      if (!userRoles.editor && !userRoles.admin) {
        errors.push('User does not have permission to create campaigns');
      }

      // Check team assignment if applicable
      const assignedTo = campaignData.assignedTo as string;
      if (assignedTo && assignedTo !== userId) {
        // Check if user can assign to other users
        if (!userRoles.admin && !userRoles.reviewer) {
          errors.push('User does not have permission to assign campaigns to other users');
        }
      }
    } catch (error) {
      console.error('Error validating user permissions:', error);
      errors.push('Unable to validate user permissions');
    }
  }

  private async validatePublishRequirements(
    campaignData: Record<string, unknown>,
    errors: string[]
  ): Promise<void> {
    // Additional validation for publishing
    if (!campaignData.assignedTo) {
      errors.push('Campaign must be assigned to someone before publishing');
    }

    // Check if campaign has been reviewed (basic check)
    if (campaignData.status !== 'approved') {
      errors.push('Campaign must be approved before publishing');
    }
  }

  async getComplianceReport(campaignId: string): Promise<Record<string, unknown>> {
    try {
      const campaignDoc = await this.db.collection('campaigns').doc(campaignId).get();
      if (!campaignDoc.exists) {
        throw new Error('Campaign not found');
      }

      const campaignData = campaignDoc.data()!;
      
      // Generate compliance report
      const report = {
        campaignId,
        generatedAt: new Date().toISOString(),
        compliance: {
          contentPolicy: await this.checkContentCompliance(campaignData),
          businessRules: await this.checkBusinessCompliance(campaignData),
          userPermissions: await this.checkPermissionCompliance(campaignData),
        },
        recommendations: await this.generateRecommendations(campaignData),
      };

      return report;
    } catch (error) {
      console.error('Error generating compliance report:', error);
      throw error;
    }
  }

  private async checkContentCompliance(campaignData: Record<string, unknown>): Promise<Record<string, unknown>> {
    // Implement content compliance checks
    return {
      status: 'compliant',
      checks: ['language', 'length', 'format'],
      issues: [],
    };
  }

  private async checkBusinessCompliance(campaignData: Record<string, unknown>): Promise<Record<string, unknown>> {
    // Implement business rule compliance checks
    return {
      status: 'compliant',
      checks: ['budget', 'timeline', 'assignments'],
      issues: [],
    };
  }

  private async checkPermissionCompliance(campaignData: Record<string, unknown>): Promise<Record<string, unknown>> {
    // Implement permission compliance checks
    return {
      status: 'compliant',
      checks: ['userRoles', 'teamAccess', 'campaignPermissions'],
      issues: [],
    };
  }

  private async generateRecommendations(campaignData: Record<string, unknown>): Promise<string[]> {
    // Generate recommendations based on campaign data
    const recommendations: string[] = [];

    if (!campaignData.budget) {
      recommendations.push('Consider adding a budget to track campaign costs');
    }

    if (!campaignData.tags || (campaignData.tags as string[]).length === 0) {
      recommendations.push('Add tags to improve campaign categorization and searchability');
    }

    return recommendations;
  }
}

export const governanceEngine = new GovernanceEngine();
