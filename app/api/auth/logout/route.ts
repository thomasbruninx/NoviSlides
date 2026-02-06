import { cookies } from 'next/headers';
import { buildExpiredEditorSessionCookie } from '@/lib/auth/cookies';
import { EDITOR_SESSION_COOKIE_NAME } from '@/lib/auth/constants';
import { AuthService } from '@/lib/services';
import { fail, ok } from '@/lib/utils/respond';

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(EDITOR_SESSION_COOKIE_NAME)?.value;
    if (token) {
      const service = new AuthService();
      await service.logout(token);
    }

    const response = ok({ loggedOut: true });
    response.cookies.set(buildExpiredEditorSessionCookie());
    return response;
  } catch (error) {
    console.error('POST /api/auth/logout', error);
    return fail('server_error', 'Failed to logout', 500);
  }
}

export const dynamic = 'force-dynamic';
