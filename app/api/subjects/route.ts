import { authConfig } from '@/lib/auth/config';
import { createSubject } from '@/lib/subjects/actions/create-subject';
import { subjectCreationErrorResponse } from '@/lib/subjects/helpers/failures';

export async function POST(request: Request) {
  if (request.headers.get('origin') !== authConfig().origin) {
    return Response.json({ error: 'Request not allowed.' }, {
      status: 403,
      headers: { 'Cache-Control': 'no-store' },
    });
  }

  const [error, subject] = await createSubject(request);
  if (error !== null) {
    return subjectCreationErrorResponse(error);
  }
  return Response.json(subject, { status: 201, headers: { 'Cache-Control': 'no-store' } });
}
