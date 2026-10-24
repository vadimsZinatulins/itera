'use client';

import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { credentialFormSchema } from '@/lib/openai/settings/helpers/credential-validation';
import type { CredentialFormInput, CredentialFormSubmission, CredentialModel } from '@/lib/openai/settings/types/credentials';
import { submitCredentialMutation } from './actions/submit-credential-mutation';
import type { OpenAISettingsProps, SettingsPendingOperation } from './types';

export default function OpenAISettings({ initial }: OpenAISettingsProps) {
  const [hasKey, setHasKey] = useState(initial.hasKey);
  const [selected, setSelected] = useState(initial.model ?? '');
  const [savedModel, setSavedModel] = useState(initial.model);
  const [models, setModels] = useState<CredentialModel[]>([]);
  const [pending, setPending] = useState<SettingsPendingOperation>('idle');
  const [message, setMessage] = useState('');
  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<CredentialFormInput, unknown, CredentialFormSubmission>({
    resolver: zodResolver(credentialFormSchema),
    defaultValues: { key: '' },
  });
  const key = useWatch({ control, name: 'key' });
  const keyError = errors.key?.message;
  const busy = pending !== 'idle';

  async function updateCredential(method: 'PUT' | 'DELETE', submission?: CredentialFormSubmission) {
    setPending(method === 'DELETE' ? 'remove-key' : 'save-key');
    setMessage('');
    // Clear only after valid submission, immediately and on every outcome.
    reset({ key: '' });
    try {
      const [error, status] = await submitCredentialMutation(method, submission);
      if (error !== null) {
        setMessage(error.message);
        return;
      }
      setHasKey(status.hasKey);
      setSavedModel(status.model);
      setSelected(status.model ?? '');
      setModels(status.models);
      setMessage(method === 'DELETE' ? 'Key removed. Saved work is unchanged.' : 'AI settings saved.');
    } finally {
      reset({ key: '' });
      setPending('idle');
    }
  }

  // Model discovery/selection retain their existing transport and behavior until 06.
  async function updateModels(method: 'PUT' | 'POST', body?: object) {
    setPending('model-update');
    setMessage('');
    reset({ key: '' });
    try {
      const response = await fetch('/api/settings/openai', {
        method, headers: { 'Content-Type': 'application/json' },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      const data = await response.json();
      if (!response.ok) {
        setMessage(data.error ?? 'Could not update AI settings.');
        return;
      }
      if ('hasKey' in data) {
        setHasKey(data.hasKey);
        setSavedModel(data.model);
        setSelected(data.model ?? '');
      }
      setModels(data.models ?? []);
      setMessage(method === 'POST' ? (data.models.length ? 'Available models refreshed.' : 'No supported models are available to this key. Check model access.') : 'AI settings saved.');
    } catch {
      setMessage('Could not reach settings. Check your connection and reload to verify saved state.');
    } finally {
      setPending('idle');
    }
  }

  async function checkModel() {
    setPending('model-check');
    setMessage('');
    try {
      const response = await fetch('/api/settings/openai/check', { method: 'POST' });
      const data = await response.json();
      setMessage(response.ok ? data.message : data.error);
    } catch {
      setMessage('Request interrupted. Retrying may incur another OpenAI charge.');
    } finally {
      setPending('idle');
    }
  }

  return <div className="mt-6 max-w-xl space-y-6">
    <p role="status">{hasKey ? 'An OpenAI key is saved. Its value cannot be displayed.' : 'No OpenAI key saved.'} Selected model: {savedModel ?? 'None — choose explicitly before AI use.'}</p>
    <form className="space-y-3" noValidate aria-busy={pending === 'save-key'} onSubmit={handleSubmit(submission => updateCredential('PUT', submission))}>
      <label htmlFor="openai-key" className="block font-medium">{hasKey ? 'Replace OpenAI API key' : 'OpenAI API key'}</label>
      <Input id="openai-key" type="password" autoComplete="off" spellCheck={false} maxLength={503} {...register('key')} disabled={busy} aria-invalid={!!keyError} aria-describedby={keyError ? 'openai-key-error' : undefined} required />
      {keyError && <p id="openai-key-error" role="alert" className="text-sm text-destructive">{keyError}</p>}
      <Button type="submit" disabled={busy || !key}>{hasKey ? 'Replace key' : 'Save key'}</Button>
    </form>
    <div className="space-y-3">
      <Button variant="outline" disabled={busy || !hasKey} onClick={() => void updateModels('POST')}>Refresh available models</Button>
      <label htmlFor="openai-model" className="block font-medium">Supported OpenAI model</label>
      <select id="openai-model" className="w-full rounded-md border p-2" value={selected} disabled={busy || !models.length} onChange={event => setSelected(event.target.value)}>
        <option value="">Choose a model</option>
        {savedModel && !models.some(model => model.id === savedModel) && <option value={savedModel} disabled>{savedModel} (refresh to check access)</option>}
        {models.map(model => <option key={model.id} value={model.id}>{model.name} — {model.id}</option>)}
      </select>
      <Button disabled={busy || !models.some(model => model.id === selected)} onClick={() => void updateModels('PUT', { model: selected })}>Save model</Button>
    </div>
    <div className="space-y-3">
      <p className="text-sm">Testing sends a small text request to your selected model and may incur an OpenAI API charge. Access listing alone does not prove usable generation quota.</p>
      <Button variant="outline" disabled={busy || !hasKey || !savedModel} onClick={() => void checkModel()}>Test selected model (may incur charge)</Button>
    </div>
    <Button variant="outline" disabled={busy || !hasKey} onClick={() => void updateCredential('DELETE')}>Remove key</Button>
    {(pending === 'save-key' || pending === 'remove-key') && <p role="status">Updating AI settings…</p>}
    {message && <p role="status" className="break-words">{message}</p>}
  </div>;
}
