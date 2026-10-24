'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { subjectSubmissionSchema } from '@/lib/subjects/helpers/validation';
import type { SubjectSubmission, SubjectSubmissionInput } from '@/lib/subjects/types';
import type { SubjectPickerProps } from './types';
import { submitSubject } from './actions/submit-subject';
import { useRouter } from 'next/navigation';
import { ChevronDown, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export default function SubjectPicker({ subjects, activeId }: SubjectPickerProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { register, handleSubmit, reset, setError, formState: { errors, isSubmitting } } = useForm<SubjectSubmissionInput, unknown, SubjectSubmission>({
    resolver: zodResolver(subjectSubmissionSchema),
    defaultValues: { name: '' },
  });
  const error = errors.name?.message;

  async function create(submission: SubjectSubmission) {
    const [error, subject] = await submitSubject(submission);
    if (error !== null) {
      setError('name', { type: error.code, message: error.message }, { shouldFocus: true });
      return;
    }
    setOpen(false);
    reset();
    router.push(`/?subject=${subject.id}`);
    router.refresh();
  }

  function selectSubject(id: string) {
    if (id !== activeId && window.dispatchEvent(new Event('document-navigation', { cancelable: true }))) {
      router.push(`/?subject=${id}`);
    }
  }

  function openCreation() {
    if (window.dispatchEvent(new Event('document-navigation', { cancelable: true }))) {
      reset();
      setOpen(true);
    }
  }

  function changeOpen(value: boolean) {
    if (!isSubmitting) {
      setOpen(value);
    }
  }
  return <>
    <DropdownMenu>
      <DropdownMenuTrigger aria-label="Switch subject" render={<Button variant="ghost" className="min-h-11 max-w-40 gap-1 text-xs font-normal text-muted-foreground" />}><span className="truncate">{subjects.find(subject => subject.id === activeId)?.name ?? 'Subjects'}</span><ChevronDown className="size-3 shrink-0" /></DropdownMenuTrigger>
      <DropdownMenuContent className="max-h-[70dvh] w-64 overflow-y-auto">
        <DropdownMenuGroup><DropdownMenuLabel>Subject</DropdownMenuLabel><DropdownMenuRadioGroup value={activeId ?? ''} onValueChange={selectSubject}>{subjects.map(subject => <DropdownMenuRadioItem key={subject.id} value={subject.id} closeOnClick className="min-h-11"><span className="break-words">{subject.name}</span></DropdownMenuRadioItem>)}</DropdownMenuRadioGroup></DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="min-h-11" onClick={openCreation}><Plus />Add subject</DropdownMenuItem>
        <p className="px-2 py-2 text-xs leading-5 text-muted-foreground">Separate documents, learning trail and practice for each area of study.</p>
      </DropdownMenuContent>
    </DropdownMenu>
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogTitle>Add subject</DialogTitle>
        <DialogDescription>Give a new area of study its own Learning Documents, learning trail and practice.</DialogDescription>
        <form onSubmit={handleSubmit(create)} className="space-y-4" aria-busy={isSubmitting}>
          <div className="space-y-2"><label htmlFor="subject-name" className="text-sm font-medium">Subject name</label><Input id="subject-name" {...register('name')} disabled={isSubmitting} aria-invalid={!!error} aria-describedby={error ? 'subject-error' : undefined} className="min-h-11" />{error && <p id="subject-error" role="alert" className="text-sm text-destructive">{error}</p>}</div>
          <div className="flex justify-end gap-2"><Button type="button" variant="outline" disabled={isSubmitting} onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving…' : 'Create subject'}</Button></div>
        </form>
      </DialogContent>
    </Dialog>
  </>;
}
