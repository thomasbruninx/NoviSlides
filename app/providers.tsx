'use client';

import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';

export default function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1
          }
        }
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <MantineProvider
        theme={{
          fontFamily: '"Noto Sans", sans-serif',
          headings: { fontFamily: '"Noto Sans", sans-serif' }
        }}
        defaultColorScheme="dark"
      >
        <Notifications position="bottom-left" />
        {children}
      </MantineProvider>
    </QueryClientProvider>
  );
}
