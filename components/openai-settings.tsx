'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Model = { id: string; name: string };
export default function OpenAISettings({ initial }: { initial: { hasKey: boolean; model: string | null } }) {
  const [hasKey, setHasKey] = useState(initial.hasKey);
  const [selected, setSelected] = useState(initial.model ?? '');
  const [savedModel, setSavedModel] = useState(initial.model);
  const [models, setModels] = useState<Model[]>([]);
  const [key, setKey] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  async function update(method: 'PUT' | 'POST' | 'DELETE', body?: object) {
    setBusy(true); setMessage('');
    // Clear the transient password field immediately, including on failure.
    setKey('');
    try {
      const response = await fetch('/api/settings/openai', {
        method, headers: { 'Content-Type': 'application/json' },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      const data = await response.json();
      if (!response.ok) { setMessage(data.error ?? 'Could not update AI settings.'); return; }
      if ('hasKey' in data) { setHasKey(data.hasKey); setSavedModel(data.model); setSelected(data.model ?? ''); }
      setModels(data.models ?? []);
      setMessage(method === 'DELETE' ? 'Key removed. Saved work is unchanged.' : method === 'POST' ? (data.models.length ? 'Available models refreshed.' : 'No supported models are available to this key. Check model access.') : 'AI settings saved.');
    } catch { setMessage('Could not reach settings. Check your connection and reload to verify saved state.'); }
    finally { setBusy(false); }
  }
  async function checkModel() {
    setBusy(true); setMessage('');
    try {
      const response = await fetch('/api/settings/openai/check', { method: 'POST' });
      const data = await response.json();
      setMessage(response.ok ? data.message : data.error);
    } catch { setMessage('Request interrupted. Retrying may incur another OpenAI charge.'); }
    finally { setBusy(false); }
  }
  return <div className="mt-6 max-w-xl space-y-6">
    <p role="status">{hasKey ? 'An OpenAI key is saved. Its value cannot be displayed.' : 'No OpenAI key saved.'} Selected model: {savedModel ?? 'None — choose explicitly before AI use.'}</p>
    <form className="space-y-3" onSubmit={event => { event.preventDefault(); void update('PUT', { key }); }}>
      <label htmlFor="openai-key" className="block font-medium">{hasKey ? 'Replace OpenAI API key' : 'OpenAI API key'}</label>
      <Input id="openai-key" type="password" autoComplete="off" spellCheck={false} maxLength={503} value={key} disabled={busy} onChange={event => setKey(event.target.value)} required />
      <Button type="submit" disabled={busy || !key}>{hasKey ? 'Replace key' : 'Save key'}</Button>
    </form>
    <div className="space-y-3">
      <Button variant="outline" disabled={busy || !hasKey} onClick={() => void update('POST')}>Refresh available models</Button>
      <label htmlFor="openai-model" className="block font-medium">Supported OpenAI model</label>
      <select id="openai-model" className="w-full rounded-md border p-2" value={selected} disabled={busy || !models.length} onChange={event => setSelected(event.target.value)}>
        <option value="">Choose a model</option>
        {savedModel && !models.some(model => model.id === savedModel) && <option value={savedModel} disabled>{savedModel} (refresh to check access)</option>}
        {models.map(model => <option key={model.id} value={model.id}>{model.name} — {model.id}</option>)}
      </select>
      <Button disabled={busy || !models.some(model => model.id === selected)} onClick={() => void update('PUT', { model: selected })}>Save model</Button>
    </div>
    <div className="space-y-3">
      <p className="text-sm">Testing sends a small text request to your selected model and may incur an OpenAI API charge. Access listing alone does not prove usable generation quota.</p>
      <Button variant="outline" disabled={busy || !hasKey || !savedModel} onClick={() => void checkModel()}>Test selected model (may incur charge)</Button>
    </div>
    <Button variant="outline" disabled={busy || !hasKey} onClick={() => void update('DELETE')}>Remove key</Button>
    {message && <p role="status" className="break-words">{message}</p>}
  </div>;
}
