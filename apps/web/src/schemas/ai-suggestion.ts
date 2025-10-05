import { z } from 'zod';

export const AISuggestionSchema = z.object({
  id: z.string(),
  type: z.enum(['content', 'strategy', 'optimization', 'audience']),
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  confidence: z.number().min(0).max(1),
  status: z.enum(['pending', 'accepted', 'rejected']),
  campaignId: z.string().optional(),
  assignedTo: z.string().optional(),
  createdBy: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  metadata: z.record(z.unknown()).optional(),
});

export const CreateAISuggestionSchema = AISuggestionSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateAISuggestionSchema = AISuggestionSchema.partial().omit({
  id: true,
  createdAt: true,
});

export type AISuggestion = z.infer<typeof AISuggestionSchema>;
export type CreateAISuggestion = z.infer<typeof CreateAISuggestionSchema>;
export type UpdateAISuggestion = z.infer<typeof UpdateAISuggestionSchema>;
