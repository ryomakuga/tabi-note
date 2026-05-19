// ============================================
// Tabi Note - ロック画面
// 要件定義書 9.6 に準拠
// Kinfolk風デザイン:プロトタイプ lock_screen_v2.html ベース
// ============================================

import { useState, useEffect } from 'react';
import { useAuthStore } from '../lib/auth-store';

export function LockScreen() {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);

  const { isPinSet, failedAttempts, lockoutUntil, setupPin, unlock } = useAuthStore();

  const isLockedOut = lockoutUntil !== null && Date.now() < lockoutUntil;
  const remainingMinutes = isLockedOut
    ? Math.ceil((lockoutUntil! - Date.now()) / 60000)
    : 0;

  useEffect(() => {
    if (pin.length === 4) {
      handleSubmit();
    }
  }, [pin]);

  const handleSubmit = async () => {
    if (isLockedOut) return;

    try {
      if (!isPinSet) {
        await setupPin(pin);
        return;
      }

      const success = await unlock(pin);
      if (!success) {
        setError(`PINが正しくありません(${failedAttempts + 1}/5)`);
        setIsShaking(true);
        setTimeout(() => {
          setPin('');
          setIsShaking(false);
        }, 600);
      }
    } catch (e) {
      const msg = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
      setError(`ERROR: ${msg}`);
      setPin('');
    }
  };

  const handleNumberPress = (num: string) => {
    if (isLockedOut) return;
    if (pin.length < 4) {
      setPin(pin + num);
      setError(null);
    }
  };

  const handleDelete = () => {
    if (isLockedOut) return;
    setPin(pin.slice(0, -1));
    setError(null);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-8 bg-bg">
      {/* ロゴ・タイトル */}
      <div className="text-center mb-16">
        <div
          className="text-xs tracking-widest text-accent uppercase mb-2"
          style={{ fontFamily: '"Cormorant Garamond", serif', letterSpacing: '0.45em' }}
        >
          Tabi Note
        </div>
        <div
          className="text-sm text-text-sub"
          style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic' }}
        >
          {isPinSet ? '— please enter your pin —' : '— set your pin —'}
        </div>
      </div>

      {/* PIN入力ドット */}
      <div
        className={`flex gap-5 mb-12 ${isShaking ? 'animate-shake' : ''}`}
      >
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-full border transition-all duration-150 ${
              pin.length > i
                ? 'bg-text border-text'
                : 'bg-transparent'
            }`}
            style={{
              borderColor: pin.length > i ? '#3A2F1F' : 'rgba(58, 47, 31, 0.3)',
            }}
          />
        ))}
      </div>

      {/* エラー/ロックアウト表示 */}
      <div className="h-6 mb-8 text-center">
        {isLockedOut ? (
          <p className="text-sm text-accent">
            5回失敗しました。あと約{remainingMinutes}分お待ちください
          </p>
        ) : error ? (
          <p className="text-sm text-accent">{error}</p>
        ) : null}
      </div>

      {/* テンキー */}
      <div className="grid grid-cols-3 gap-x-12 gap-y-6 mb-8">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
          <button
            key={num}
            onClick={() => handleNumberPress(num)}
            disabled={isLockedOut}
            className="w-16 h-16 rounded-full flex items-center justify-center text-2xl text-text border border-line transition-all hover:bg-bg-alt disabled:opacity-30"
            style={{ fontFamily: '"Cormorant Garamond", serif', fontWeight: 300 }}
          >
            {num}
          </button>
        ))}

        <div /> {/* 左下スペース */}

        <button
          onClick={() => handleNumberPress('0')}
          disabled={isLockedOut}
          className="w-16 h-16 rounded-full flex items-center justify-center text-2xl text-text border border-line transition-all hover:bg-bg-alt disabled:opacity-30"
          style={{ fontFamily: '"Cormorant Garamond", serif', fontWeight: 300 }}
        >
          0
        </button>

        <button
          onClick={handleDelete}
          disabled={isLockedOut || pin.length === 0}
          className="w-16 h-16 flex items-center justify-center text-xs text-text-sub disabled:opacity-30"
          style={{
            fontFamily: '"Cormorant Garamond", serif',
            fontStyle: 'italic',
            letterSpacing: '0.15em',
          }}
        >
          delete
        </button>
      </div>

      {/* フッター */}
      <div
        className="text-xs text-text-sub mt-8 tracking-wider"
        style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic' }}
      >
        — a quiet companion for your travels —
      </div>

      {/* シェイクアニメーション用CSS */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-8px); }
          75% { transform: translateX(8px); }
        }
        .animate-shake {
          animation: shake 0.4s ease-in-out;
        }
      `}</style>
    </div>
  );
}