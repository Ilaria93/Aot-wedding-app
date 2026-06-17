import type { ReactNode } from 'react';

type PageShellProps = {
  children: ReactNode;
  loading?: boolean;
};

/** Shared layout wrapper for guest-facing app screens (hero + section cards). */
export function PageShell({ children, loading = false }: PageShellProps) {
  if (loading) {
    return <div className="loading-screen">…</div>;
  }

  return (
    <div className="aot-screen">
      <div className="aot-content">{children}</div>
    </div>
  );
}
