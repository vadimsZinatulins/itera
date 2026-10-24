import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { assembled } from '../../helpers/documents';
import Markdown from '../markdown';
import type { DocumentOutputProps } from './types';

export default function DocumentOutput({ output, saved, busy, dirty, onClose, onApprove, onStatus }: DocumentOutputProps) {
  const selected = output === 'practice' ? saved?.practice_version : saved;
  const markdown = selected ? assembled(selected) : '';
  const title = output === 'practice' ? 'Approved practice version' : output === 'approve' ? 'Review saved version for practice' : output === 'preview' ? 'Document preview' : 'Final Markdown';
  const description = output === 'practice' ? 'Only this approved snapshot is eligible. Draft revisions are excluded.' : output === 'approve' ? 'Approve this complete saved snapshot only after review. Approval means material encountered, not demonstrated understanding.' : 'Saved Draft only, in block order. Unsaved edits are excluded. Exporting does not approve material and is not an account backup.';

  async function copyMarkdown() {
    try {
      await navigator.clipboard.writeText(markdown);
      onStatus(`${output === 'practice' ? 'Practice version' : 'Saved Draft'} Markdown copied.`);
    } catch {
      onStatus('Clipboard unavailable. Select text in Final Markdown to copy.');
    }
  }

  function downloadMarkdown() {
    const url = URL.createObjectURL(new Blob([markdown], { type: 'text/markdown;charset=utf-8' }));
    const anchor = window.document.createElement('a');
    anchor.href = url;
    anchor.download = (selected?.title.replace(/[^a-z0-9-]+/gi, '-') || 'learning-document') + '.md';
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return <Dialog open={!!output} onOpenChange={value => {
    if (!value && !busy) {
      onClose();
    }
  }}>
    <DialogContent className="flex max-h-[90dvh] flex-col sm:max-w-4xl">
      <DialogTitle>{title}</DialogTitle>
      <DialogDescription>{description}</DialogDescription>
      <div className="min-h-0 overflow-auto">
        {output !== 'markdown' ? <Markdown>{markdown}</Markdown> : <pre className="whitespace-pre-wrap break-words">{markdown}</pre>}
      </div>
      <div className="flex flex-wrap gap-2">
        {output === 'approve' && <Button disabled={busy || dirty} onClick={onApprove}>{busy ? 'Approving…' : 'Approve saved version'}</Button>}
        <Button variant="outline" onClick={copyMarkdown}>Copy Markdown</Button>
        <Button onClick={downloadMarkdown}>Download .md</Button>
      </div>
    </DialogContent>
  </Dialog>;
}
