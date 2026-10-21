'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export default function SubjectPicker({ subjects, activeId }: { subjects: { id: string; name: string }[]; activeId?: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function create(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    if (!name.trim()) { setError('Enter a Subject name.'); return; }
    setBusy(true);
    try {
      const response = await fetch('/api/subjects', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) });
      const result = await response.json();
      if (!response.ok) { setError(result.error); return; }
      setOpen(false); setName('');
      router.push(`/?subject=${result.id}`);
      router.refresh();
    } catch { setError('Could not save the Subject. Check your connection and try again.'); }
    finally { setBusy(false); }
  }
  return <>
    <DropdownMenu>
      <DropdownMenuTrigger aria-label="Switch subject" render={<Button variant="ghost" className="min-h-11 max-w-40 gap-1 text-xs font-normal text-muted-foreground" />}><span className="truncate">{subjects.find(subject => subject.id === activeId)?.name ?? 'Subjects'}</span><ChevronDown className="size-3 shrink-0" /></DropdownMenuTrigger>
      <DropdownMenuContent className="max-h-[70dvh] w-64 overflow-y-auto">
        <DropdownMenuGroup><DropdownMenuLabel>Subject</DropdownMenuLabel><DropdownMenuRadioGroup value={activeId ?? ''} onValueChange={id => router.push(`/?subject=${id}`)}>{subjects.map(subject => <DropdownMenuRadioItem key={subject.id} value={subject.id} closeOnClick className="min-h-11"><span className="break-words">{subject.name}</span></DropdownMenuRadioItem>)}</DropdownMenuRadioGroup></DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="min-h-11" onClick={() => { setName(''); setError(''); setOpen(true); }}><Plus />Add subject</DropdownMenuItem>
        <p className="px-2 py-2 text-xs leading-5 text-muted-foreground">Separate documents, learning trail and practice for each area of study.</p>
      </DropdownMenuContent>
    </DropdownMenu>
    <Dialog open={open} onOpenChange={value => { if (!busy) setOpen(value); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogTitle>Add subject</DialogTitle>
        <DialogDescription>Give a new area of study its own Learning Documents, learning trail and practice.</DialogDescription>
        <form onSubmit={create} className="space-y-4">
          <div className="space-y-2"><label htmlFor="subject-name" className="text-sm font-medium">Subject name</label><Input id="subject-name" value={name} onChange={event => setName(event.target.value)} disabled={busy} aria-invalid={!!error} aria-describedby={error ? 'subject-error' : undefined} className="min-h-11" />{error && <p id="subject-error" role="alert" className="text-sm text-destructive">{error}</p>}</div>
          <div className="flex justify-end gap-2"><Button type="button" variant="outline" disabled={busy} onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Create subject'}</Button></div>
        </form>
      </DialogContent>
    </Dialog>
  </>;
}
