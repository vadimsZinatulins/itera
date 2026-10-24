import { authConfig } from '@/lib/auth/config';
import { readDocuments } from '@/lib/documents/actions/read-documents';
import { saveDocument } from '@/lib/documents/actions/save-document';
import { documentReadErrorResponse } from '@/lib/documents/helpers/failures';

const reply = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

export async function GET(request: Request) {
  const [error, documents] = await readDocuments(new URL(request.url).searchParams.get('subject'));
  if (error !== null) {
    return documentReadErrorResponse(error);
  }
  return reply(documents);
}

export async function POST(request: Request) {
  if (request.headers.get('origin') !== authConfig().origin) {
    return reply({ error: 'Request not allowed.' }, 403);
  }
  const [error, document] = await saveDocument(request);
  if (error !== null) {
    return reply({ error: error.message }, error.status);
  }
  return reply(document);
}
