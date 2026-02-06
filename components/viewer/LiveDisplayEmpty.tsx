'use client';

import { useCallback } from 'react';
import { useDisplayMountEvents } from '@/lib/hooks/useDisplayMountEvents';
import ViewerEmpty from './ViewerEmpty';

type LiveDisplayEmptyProps = {
  displayName: string;
  title: string;
  description: string;
};

export default function LiveDisplayEmpty({
  displayName,
  title,
  description
}: LiveDisplayEmptyProps) {
  const handleMountChange = useCallback(() => {
    window.location.reload();
  }, []);

  useDisplayMountEvents({
    displayName,
    onMountChange: handleMountChange
  });

  return <ViewerEmpty title={title} description={description} />;
}
