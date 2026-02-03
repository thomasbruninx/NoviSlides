import nextDynamic from 'next/dynamic';
import ErrorBoundary from '@/components/common/ErrorBoundary';

const EditorShell = nextDynamic(() => import('@/components/editor/EditorShell'), { ssr: false });

export default function EditPage() {
  return (
    <ErrorBoundary>
      <EditorShell />
    </ErrorBoundary>
  );
}

export const dynamic = 'force-dynamic';
