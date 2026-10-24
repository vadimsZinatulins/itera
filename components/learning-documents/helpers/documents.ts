import type { DocumentSnapshot, LearningDocument } from '@/lib/documents/types';
import type { SessionEdits } from '../types';

export function documentStatus(document: LearningDocument) {
  if (!document.practice_version) {
    return 'Draft';
  }
  return document.practice_version.revision === document.revision ? 'Available for practice' : 'Draft revision';
}

export function searchable(document: DocumentSnapshot) {
  return `${document.title} ${document.description} ${document.blocks.map(block => block.markdown).join(' ')}`;
}

export function assembled(document: DocumentSnapshot) {
  return [`# ${document.title.trim() || 'Untitled Learning Document'}`, document.description, ...document.blocks.map(block => block.markdown)].filter(Boolean).join('\n\n') + '\n';
}

export function hasUnsavedEdits(session: SessionEdits) {
  return !!session.draft && (Object.keys(session.editing).length > 0 || JSON.stringify(session.draft) !== JSON.stringify(session.saved));
}
