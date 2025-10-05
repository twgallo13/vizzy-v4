import { z } from 'zod';

export const CampaignSchema = z.object({
  id: z.string(),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  status: z.enum(['draft', 'in_review', 'approved', 'active', 'completed']),
  owner_id: z.string().optional(),
  assignedTo: z.string().optional(),
  assignedBy: z.string().optional(),
  dueDate: z.union([z.string(), z.number(), z.date(), z.object({
    seconds: z.number(),
    nanoseconds: z.number().optional(),
  })]).optional(),
  createdAt: z.union([z.string(), z.number(), z.date(), z.object({
    seconds: z.number(),
    nanoseconds: z.number().optional(),
  })]).optional(),
  updatedAt: z.union([z.string(), z.number(), z.date(), z.object({
    seconds: z.number(),
    nanoseconds: z.number().optional(),
  })]).optional(),
  budget: z.number().positive().optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()).optional(),
  team_id: z.string().optional(),
  store_id: z.string().optional(),
  governance: z.object({
    hits: z.number(),
    overrides: z.array(z.unknown()),
  }).optional(),
  wrike_task_id: z.string().nullable().optional(),
  schema_version: z.string().optional(),
  suggested_by: z.string().optional(),
});

export const CreateCampaignSchema = CampaignSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateCampaignSchema = CampaignSchema.partial().omit({
  id: true,
  createdAt: true,
});

export type Campaign = z.infer<typeof CampaignSchema>;
export type CreateCampaign = z.infer<typeof CreateCampaignSchema>;
export type UpdateCampaign = z.infer<typeof UpdateCampaignSchema>;
