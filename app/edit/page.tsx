import ErrorBoundary from '@/components/common/ErrorBoundary';
import EditorShell from '@/components/editor/EditorShell';

export default function EditPage() {
  return (
    <ErrorBoundary>
      <EditorShell />
    </ErrorBoundary>
  );
}

export const dynamic = 'force-dynamic';
