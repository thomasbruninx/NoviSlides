import './edit.css';

import type { ReactNode } from 'react';

export default function EditLayout({ children }: { children: ReactNode }) {
  return <div className="editor-scope">{children}</div>;
}
