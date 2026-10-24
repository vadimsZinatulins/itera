import type { CredentialErrorMessage } from '@/lib/openai/settings/types/credentials';

export type OpenAISettingsProps = { initial: { hasKey: boolean; model: string | null } };
export type SettingsPendingOperation = 'idle' | 'save-key' | 'remove-key' | 'model-update' | 'model-check';
export type CredentialClientError = {
  code: 'correction' | 'reauthenticate' | 'retry';
  message: CredentialErrorMessage | 'Could not update AI settings.' | 'Could not reach settings. Check your connection and reload to verify saved state.';
};
