import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { OpenBlockEditorProps } from './types';

export default function OpenBlockEditor({ index, markdown, onChange, onSave, onCancel }: OpenBlockEditorProps) {
  return <div className="space-y-3">
    <label className="grid gap-2">Block {index + 1} Markdown<Textarea autoFocus className="min-h-48 font-mono" value={markdown} onChange={event => onChange(event.target.value)} onKeyDown={event => {
      if (event.key === 'Enter' && (event.ctrlKey || event.metaKey) && !event.nativeEvent.isComposing && event.keyCode !== 229) {
        event.preventDefault();
        onSave();
      }
    }} /></label>
    <Button onClick={onSave}>Save block</Button> <Button variant="outline" onClick={onCancel}>Cancel</Button>
  </div>;
}
