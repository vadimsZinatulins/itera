import type { z } from 'zod';
import type { settingsStatusSchema } from '../helpers/validation';

export type SettingsStatus = z.output<typeof settingsStatusSchema>;

export type SettingsReadError =
  | { code: 'reauthenticate'; message: 'Sign in to manage AI settings.' }
  | { code: 'retry'; message: 'Could not read AI settings. Try again.' | 'AI settings are temporarily unavailable. Try again.' };

export type SettingsReadFailureStage = 'authentication' | 'configuration' | 'persistence';
export type SettingsReadFailureKind = 'unexpected' | 'integration-failure' | 'invalid-response' | 'invalid-configuration';
