import { cookies } from 'next/headers';
import { z } from 'zod';
import { buildEditorSessionCookie, buildExpiredEditorSessionCookie } from '@/lib/auth/cookies';
import { EDITOR_SESSION_COOKIE_NAME } from '@/lib/auth/constants';
import { AuthService, AuthUnauthorizedError } from '@/lib/services';
import { fail, ok } from '@/lib/utils/respond';
import { updateEditorPasswordSchema } from '@/lib/validation';

export async function PUT(request: Request) {
  try {
    const payload = updateEditorPasswordSchema.parse(await request.json());
    const cookieStore = await cookies();
    const token = cookieStore.get(EDITOR_SESSION_COOKIE_NAME)?.value;
    if (!token) {
      return fail('unauthorized', 'Authentication required', 401);
    }

    const service = new AuthService();
    const session = await service.updatePassword(token, payload.password);
    const response = ok({ updated: true });
    response.cookies.set(buildExpiredEditorSessionCookie());
    response.cookies.set(buildEditorSessionCookie(session.token, session.rememberMe));
    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fail('validation_error', 'Invalid password payload', 400, error.flatten());
    }
    if (error instanceof AuthUnauthorizedError) {
      return fail(error.code, 'Authentication required', 401);
    }
    console.error('PUT /api/auth/password', error);
    return fail('server_error', 'Failed to update password', 500);
  }
}

export const dynamic = 'force-dynamic';
