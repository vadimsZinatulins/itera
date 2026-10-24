'use client';

import { useEffect, useState } from 'react';
import DocumentWorkspace from './components/document-workspace';
import { hasUnsavedEdits } from './helpers/documents';
import type { LearningDocumentsProps, SessionEdits } from './types';

// Lives only in the account's mounted page, not browser storage. Subject history
// navigation can remount an editor without destroying its outstanding buffers.
export default function LearningDocuments({ subjectId }: LearningDocumentsProps) {
  const [sessions] = useState(() => new Map<string, SessionEdits>());
  useEffect(() => {
    const hasEdits = () => [...sessions.values()].some(hasUnsavedEdits);
    const unload = (event: BeforeUnloadEvent) => {
      if (hasEdits()) {
        event.preventDefault();
      }
    };
    const navigation = (event: Event) => {
      if (!hasEdits()) {
        return;
      }
      if ([...sessions.values()].some(session => session.busy) || !window.confirm('Discard unsaved document edits in all Subjects and leave? Cancel to return and save your Drafts.')) {
        event.preventDefault();
        return;
      }
      for (const [id, session] of sessions) {
        sessions.set(id, { ...session, draft: session.saved, editing: {} });
      }
      window.dispatchEvent(new Event('document-discard'));
    };
    window.addEventListener('beforeunload', unload);
    window.addEventListener('document-navigation', navigation);
    return () => {
      window.removeEventListener('beforeunload', unload);
      window.removeEventListener('document-navigation', navigation);
    };
  }, [sessions]);
  return <DocumentWorkspace key={subjectId} subjectId={subjectId} sessions={sessions} />;
}
