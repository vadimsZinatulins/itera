import type { z } from 'zod';
import type {
  credentialErrorMessageSchema,
  credentialFormSchema,
  credentialModelSchema,
  credentialMutationResponseSchema,
} from '../helpers/credential-validation';

export type CredentialFormInput = z.input<typeof credentialFormSchema>;
export type CredentialFormSubmission = z.output<typeof credentialFormSchema>;
export type CredentialModel = z.output<typeof credentialModelSchema>;
export type CredentialMutationResponse = z.output<typeof credentialMutationResponseSchema>;
export type CredentialErrorMessage = z.output<typeof credentialErrorMessageSchema>;

export type CredentialMutationError =
  | { code: 'correction'; status: 400 | 413 | 422; message: CredentialErrorMessage }
  | { code: 'reauthenticate'; status: 401; message: CredentialErrorMessage }
  | { code: 'retry'; status: 429 | 502 | 503; message: CredentialErrorMessage };

export type CredentialMutation = { method: 'save'; input: unknown } | { method: 'remove' };
export type CredentialFailureStage = 'authentication' | 'configuration' | 'submission' | 'persistence' | 'provider';
export type CredentialFailureKind = 'unexpected' | 'integration-failure' | 'invalid-response' | 'invalid-configuration';

export type CredentialSubmissionPayload = { input: unknown };
