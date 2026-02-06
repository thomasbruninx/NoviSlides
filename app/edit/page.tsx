import { cookies } from 'next/headers';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import EditorLogin from '@/components/editor/EditorLogin';
import EditorShell from '@/components/editor/EditorShell';
import { EDITOR_SESSION_COOKIE_NAME } from '@/lib/auth/constants';
import { AuthService } from '@/lib/services';

export default async function EditPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(EDITOR_SESSION_COOKIE_NAME)?.value ?? '';
  const authService = new AuthService();
  const isAuthenticated = token ? await authService.isSessionValid(token) : false;

  if (!isAuthenticated) {
    return <EditorLogin />;
  }

  return (
    <ErrorBoundary>
      <EditorShell />
    </ErrorBoundary>
  );
}

export const dynamic = 'force-dynamic';
