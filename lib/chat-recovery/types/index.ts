import type { z } from 'zod';
import type { chatOperationSchema, chatRecoverySchema } from '../helpers/validation';

export type ChatOperation = z.infer<typeof chatOperationSchema>;
export type ChatRecovery = z.infer<typeof chatRecoverySchema>;
export type ChatRecoveryRead = { status: 'absent' } | { status: 'recovered'; recovery: ChatRecovery };
export type ChatRecoveryError = { code: 'corrupt' | 'unavailable'; message: string };
