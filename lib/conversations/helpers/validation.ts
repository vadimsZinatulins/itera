import { z } from 'zod';

// Match the route's established UUID policy, including non-versioned operation IDs.
export const conversationIdSchema = z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);

export const conversationTrailSchema = z.array(z.object({
  id: conversationIdSchema,
  title: z.string(),
  created_at: z.string(),
}));
