import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

interface PageLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  back?: string | (() => void);
  rightAction?: ReactNode;
  noPadding?: boolean;
}

export function PageLayout({ children, title, subtitle, back, rightAction, noPadding }: PageLayoutProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (!back) return;
    if (typeof back === 'string') navigate(back);
    else back();
  };

  return (
    <div className="min-h-screen bg-forest-950 flex flex-col max-w-lg mx-auto">
      {(title || back || rightAction) && (
        <header className="bg-forest-900 border-b border-gold-500/20 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
          {back && (
            <button
              onClick={handleBack}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/10 active:scale-95 transition-all -ml-1"
              aria-label="Back"
            >
              <svg className="w-5 h-5 text-cream/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <div className="flex-1 min-w-0">
            {title && (
              <h1 className="text-base font-semibold text-cream truncate">{title}</h1>
            )}
            {subtitle && (
              <p className="text-xs text-cream/50 truncate">{subtitle}</p>
            )}
          </div>
          {rightAction && <div className="flex-shrink-0">{rightAction}</div>}
        </header>
      )}
      <main className={noPadding ? 'flex-1 flex flex-col' : 'flex-1 flex flex-col p-4 gap-4'}>
        {children}
      </main>
    </div>
  );
}
