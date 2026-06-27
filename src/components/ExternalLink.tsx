import type { MouseEvent, ReactNode } from 'react';

type Variant = 'inline' | 'block' | 'compact' | 'list';

interface Props {
  href: string;
  variant?: Variant;
  children?: ReactNode;
  className?: string;
}

export function ExternalLink({ href, variant = 'inline', children, className = '' }: Props) {
  if (!href || !href.trim()) return null;

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    e.stopPropagation();
  };

  const label = children ?? getDomain(href);

  // http(s) が無いURLは相対リンク扱いになりトップに戻るため https:// を補う
  const safeHref = /^https?:\/\//i.test(href.trim())
    ? href.trim()
    : `https://${href.trim()}`;

  const common = {
    href: safeHref,
    target: '_blank',
    rel: 'noopener noreferrer',
    onClick: handleClick,
    title: safeHref,
  };

  if (variant === 'compact') {
    return (
      <a
        {...common}
        className={`inline-flex items-center text-accent hover:text-text transition-colors ${className}`}
      >
        <span className="text-[12px] leading-none">↗</span>
      </a>
    );
  }

  if (variant === 'block') {
    return (
      <a
        {...common}
        className={`inline-flex items-center gap-2 px-4 py-2 border border-accent text-accent hover:bg-accent hover:text-bg transition-colors font-serif text-[10px] tracking-[0.35em] uppercase ${className}`}
      >
        <span>{label}</span>
        <span className="text-[10px] leading-none">↗</span>
      </a>
    );
  }

  if (variant === 'list') {
    return (
      <a
        {...common}
        className={`flex items-baseline gap-2 min-w-0 max-w-full font-serif italic text-[12px] text-accent hover:text-text transition-colors underline decoration-line decoration-1 underline-offset-[3px] ${className}`}
      >
        <span className="truncate">{label}</span>
        <span className="text-[10px] leading-none flex-shrink-0">↗</span>
      </a>
    );
  }

  return (
    <a
      {...common}
      className={`inline-flex items-baseline gap-1 font-serif italic text-[12px] text-accent hover:text-text transition-colors underline decoration-line decoration-1 underline-offset-[3px] ${className}`}
    >
      <span>{label}</span>
      <span className="text-[10px] leading-none">↗</span>
    </a>
  );
}

function getDomain(url: string): string {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, '');
    const path = u.pathname.replace(/\/$/, '');
    const full = path && path !== '/' ? host + path : host;
    const MAX = 48;
    if (full.length > MAX) return full.slice(0, MAX) + '…';
    return full;
  } catch {
    return url;
  }
}
