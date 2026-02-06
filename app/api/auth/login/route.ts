import { z } from 'zod';
import { buildEditorSessionCookie } from '@/lib/auth/cookies';
import { AuthInvalidCredentialsError, AuthService } from '@/lib/services';
import { fail, ok } from '@/lib/utils/respond';
import { editorLoginSchema } from '@/lib/validation';

export async function POST(request: Request) {
  try {
    const payload = editorLoginSchema.parse(await request.json());
    const service = new AuthService();
    const session = await service.login(payload.password, payload.rememberMe);

    const response = ok({ authenticated: true });
    response.cookies.set(buildEditorSessionCookie(session.token, session.rememberMe));
    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fail('validation_error', 'Invalid login payload', 400, error.flatten());
    }
    if (error instanceof AuthInvalidCredentialsError) {
      return fail(error.code, 'Invalid password', 401);
    }
    console.error('POST /api/auth/login', error);
    return fail('server_error', 'Failed to login', 500);
  }
}

export const dynamic = 'force-dynamic';
