import './globals.css';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';

import type { ReactNode } from 'react';
import { ColorSchemeScript } from '@mantine/core';
import Providers from './providers';

export const metadata = {
  title: 'NoviSlides',
  description: 'Slideshow editor and viewer.'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <ColorSchemeScript />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
