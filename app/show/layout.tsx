import 'reveal.js/dist/reveal.css';
import 'reveal.js/dist/theme/black.css';

import type { ReactNode } from 'react';

export default function ShowLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
