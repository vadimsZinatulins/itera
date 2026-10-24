import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { documentStatus, searchable } from '../../helpers/documents';
import type { DocumentListProps } from './types';

export default function DocumentList({ documents, loading, error, query, filter, onQueryChange, onFilterChange, onCreate, onOpen }: DocumentListProps) {
  const visibleDocuments = documents.filter(document => {
    const matchesFilter = filter === 'all' || (filter === 'practice' ? !!document.practice_version : filter === 'draft' ? !document.practice_version : documentStatus(document) === 'Draft revision');
    const content = `${searchable(document)} ${document.practice_version ? searchable(document.practice_version) : ''}`;
    return matchesFilter && content.toLowerCase().includes(query.toLowerCase());
  });

  return <section className="mt-8 space-y-5" aria-label="Learning Documents">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="text-2xl font-semibold">Learning Documents</h2>
      <Button disabled={loading} onClick={onCreate}>New Learning Document</Button>
    </div>
    <Input aria-label="Search Learning Documents" placeholder="Search titles and content…" value={query} onChange={event => onQueryChange(event.target.value)} />
    {error && <p role="alert">{error}</p>}
    {loading && <p role="status">Loading documents…</p>}
    <div className="flex flex-wrap gap-2" aria-label="Filter documents">
      {[['all', 'All'], ['draft', 'Drafts'], ['revision', 'Draft revisions'], ['practice', 'Available for practice']].map(([value, label]) => <Button key={value} variant={filter === value ? 'secondary' : 'ghost'} aria-pressed={filter === value} onClick={() => onFilterChange(value)}>{label}</Button>)}
    </div>
    <p className="text-xs text-muted-foreground">Only approved Practice versions are eligible. Draft revisions are excluded while the previous Practice version remains available.</p>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {visibleDocuments.map(document => <button key={document.id} className="min-w-0 space-y-2 rounded-xl border p-5 text-left hover:bg-muted focus-visible:ring-2" aria-label={`Open ${document.title || 'Untitled Learning Document'}`} onClick={() => onOpen(document)}>
        <h3 className="break-words font-medium">{document.title || 'Untitled Learning Document'}</h3>
        <p className="break-words text-sm text-muted-foreground">{document.description}</p>
        <p className="text-xs">{documentStatus(document)} · {document.blocks.length} blocks{documentStatus(document) === 'Draft revision' ? ' · approved version available for practice' : ''}</p>
      </button>)}
    </div>
    {!loading && !error && !documents.length && <p>No Learning Documents yet. Create a Draft to capture study material.</p>}
  </section>;
}
