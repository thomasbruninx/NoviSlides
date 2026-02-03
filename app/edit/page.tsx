import EditorShell from '@/components/editor/EditorShell';
import ErrorBoundary from '@/components/common/ErrorBoundary';

export default function EditPage() {
  return (
    <ErrorBoundary>
      <EditorShell />
    </ErrorBoundary>
  );
}

export const dynamic = 'force-dynamic';
