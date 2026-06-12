import { useEffect, useState } from 'react';

// Safari で開いている時だけ「ホーム画面に追加」を案内する。
// すでにPWA（ホーム画面アプリ）として開いている場合は表示しない。
export function InstallHint() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // PWA（standalone）で開いているか判定
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      // iOS Safari 独自プロパティ
      (window.navigator as any).standalone === true;
    // iOS（iPhone/iPad）かどうか
    const isIOS = /iphone|ipad|ipod/i.test(window.navigator.userAgent);
    // 一度閉じたら記憶（このセッション中は出さない）
    const dismissed = sessionStorage.getItem('install-hint-dismissed') === '1';
    if (!isStandalone && isIOS && !dismissed) {
      setShow(true);
    }
  }, []);

  if (!show) return null;

  return (
    <div
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 60,
        background: '#F5EFE5',
        borderTop: '1px solid rgba(58,47,31,0.15)',
        padding: '16px 20px calc(16px + env(safe-area-inset-bottom))',
        boxShadow: '0 -4px 24px rgba(58,47,31,0.08)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <p
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontStyle: 'italic',
              fontSize: 12,
              letterSpacing: '0.15em',
              color: '#8B7355',
              marginBottom: 4,
            }}
          >
            — add to home screen
          </p>
          <p
            style={{
              fontFamily: "'Noto Serif JP', serif",
              fontWeight: 300,
              fontSize: 13,
              lineHeight: 1.7,
              color: '#3A2F1F',
              letterSpacing: '0.04em',
            }}
          >
            下の <span style={{ fontWeight: 400 }}>共有ボタン</span> から
            「ホーム画面に追加」すると、<br />
            アプリのように快適にお使いいただけます。
          </p>
        </div>
        <button
          onClick={() => {
            sessionStorage.setItem('install-hint-dismissed', '1');
            setShow(false);
          }}
          style={{
            flexShrink: 0,
            background: 'transparent',
            border: 'none',
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 18,
            color: '#A8A293',
            cursor: 'pointer',
            lineHeight: 1,
            padding: '2px 4px',
          }}
          aria-label="閉じる"
        >
          ×
        </button>
      </div>
    </div>
  );
}
