// ============================================
// Tabi Note - 設定メニュー
// 要件定義書 8.2:データ消失リスクへの対策
// - エクスポート(JSON ダウンロード)
// - インポート(JSON 読み込み)
// - 今すぐロック(セッション即時無効化)
// ============================================

import { useRef, useState } from 'react';
import { downloadExportFile, importDataFromJson } from '../lib/data-export';
import type { ImportResult } from '../lib/data-export';
import { useAuthStore } from '../lib/auth-store';
import { useTripsStore } from '../lib/trips-store';

interface Props {
  onClose: () => void;
}

type Status =
  | { kind: 'idle' }
  | { kind: 'busy'; message: string }
  | { kind: 'success'; message: string }
  | { kind: 'error'; message: string };

export function SettingsMenu({ onClose }: Props) {
  const { lock, changePin } = useAuthStore();
  const { loadTrips } = useTripsStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const [confirmImport, setConfirmImport] = useState<File | null>(null);

  // PIN変更モーダル用
  const [showChangePin, setShowChangePin] = useState(false);
  const [curPin, setCurPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [newPin2, setNewPin2] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [pinBusy, setPinBusy] = useState(false);

  const resetPinForm = () => {
    setShowChangePin(false);
    setCurPin(''); setNewPin(''); setNewPin2('');
    setPinError(null); setPinBusy(false);
  };

  const handleChangePin = async () => {
    setPinError(null);
    if (!/^\d{4}$/.test(curPin) || !/^\d{4}$/.test(newPin)) {
      setPinError('PIN は 4 桁の数字で入力してください'); return;
    }
    if (newPin !== newPin2) {
      setPinError('新しい PIN が一致しません'); return;
    }
    if (newPin === curPin) {
      setPinError('現在と異なる PIN を設定してください'); return;
    }
    setPinBusy(true);
    const ok = await changePin(curPin, newPin);
    if (ok) {
      resetPinForm();
      setStatus({ kind: 'success', message: 'PIN を変更しました' });
      setTimeout(() => setStatus({ kind: 'idle' }), 2500);
    } else {
      setPinBusy(false);
      setPinError('現在の PIN が正しくありません');
    }
  };

  /* ───── エクスポート ───── */
  const handleExport = async () => {
    setStatus({ kind: 'busy', message: 'バックアップを書き出し中…' });
    try {
      await downloadExportFile();
      setStatus({ kind: 'success', message: 'バックアップを保存しました' });
      setTimeout(() => setStatus({ kind: 'idle' }), 2500);
    } catch (err) {
      console.error('Export failed:', err);
      setStatus({ kind: 'error', message: '書き出しに失敗しました' });
    }
  };

  /* ───── インポート(ファイル選択) ───── */
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setConfirmImport(file);
    // input をリセット(同じファイルを再選択できるよう)
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  /* ───── インポート実行 ───── */
  const handleImportConfirm = async () => {
    if (!confirmImport) return;
    setStatus({ kind: 'busy', message: '読み込み中…' });
    try {
      const text = await confirmImport.text();
      const result: ImportResult = await importDataFromJson(text);
      await loadTrips();
      const total =
        result.trips + result.flights + result.hotels + result.spots + result.meals + result.photos;
      setStatus({
        kind: 'success',
        message: `${total} 件のデータを復元しました(旅行 ${result.trips} · 写真 ${result.photos})`,
      });
      setConfirmImport(null);
      setTimeout(() => setStatus({ kind: 'idle' }), 4000);
    } catch (err) {
      console.error('Import failed:', err);
      const msg = err instanceof Error ? err.message : '復元に失敗しました';
      setStatus({ kind: 'error', message: msg });
      setConfirmImport(null);
    }
  };

  /* ───── 今すぐロック ───── */
  const handleLock = () => {
    lock();
    onClose();
  };

  const isBusy = status.kind === 'busy';

  return (
    <div
      className="fixed inset-0 z-50 bg-text/40 backdrop-blur-sm flex items-end justify-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[420px] bg-bg border-t border-line rounded-t-lg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="px-7 pt-8 pb-6 border-b border-line text-center relative">
          <p
            className="font-serif italic text-[11px] tracking-[0.4em] text-accent uppercase mb-2"
          >
            — Settings
          </p>
          <h2 className="font-serif font-light text-[28px] text-text tracking-tight">
            Settings
          </h2>
          <p className="font-serif-ja text-[12px] text-text-sub tracking-wide mt-1">設定</p>

          <button
            onClick={onClose}
            className="absolute top-6 right-6 text-text-sub font-serif italic text-[14px]"
            aria-label="閉じる"
          >
            ×
          </button>
        </div>

        {/* メニュー項目 */}
        <div className="px-7 py-2">

          {/* バックアップ書き出し */}
          <MenuItem
            label="EXPORT"
            labelJa="バックアップを書き出す"
            description="全データを JSON ファイルとして保存。クラウド等に手動バックアップ推奨。"
            onClick={handleExport}
            disabled={isBusy}
          />

          {/* バックアップ読み込み */}
          <MenuItem
            label="IMPORT"
            labelJa="バックアップを読み込む"
            description="JSON ファイルから旅を読み込みます。既存の旅は残り、同じ旅は最新の内容に更新されます。"
            onClick={() => fileInputRef.current?.click()}
            disabled={isBusy}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* PIN を変更 */}
          <MenuItem
            label="CHANGE PIN"
            labelJa="PIN を変更"
            description="アプリのロック解除に使う 4 桁の PIN を変更します。"
            onClick={() => setShowChangePin(true)}
            disabled={isBusy}
          />

          {/* 今すぐロック */}
          <MenuItem
            label="LOCK NOW"
            labelJa="今すぐロック"
            description="セッションを即時無効化。次回起動時に PIN を再要求します。"
            onClick={handleLock}
            disabled={isBusy}
            danger
          />

        </div>

        {/* ステータス表示 */}
        {status.kind !== 'idle' && (
          <div className="px-7 py-5 border-t border-line">
            <p
              className={`font-serif-ja text-[12px] leading-relaxed tracking-wide ${
                status.kind === 'error'
                  ? 'text-red-700'
                  : status.kind === 'success'
                  ? 'text-olive'
                  : 'text-text-sub italic'
              }`}
            >
              {status.kind === 'success' && '✓ '}
              {status.kind === 'error' && '⚠ '}
              {status.message}
            </p>
          </div>
        )}

        {/* フッタースペース */}
        <div className="h-6" />
      </div>

      {/* PIN変更モーダル */}
      {showChangePin && (
        <div
          className="fixed inset-0 z-[60] bg-text/60 flex items-center justify-center px-6"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-bg max-w-[360px] w-full p-7 border border-line shadow-2xl">
            <p className="font-serif italic text-[11px] tracking-[0.3em] text-accent uppercase mb-3">
              — Change PIN
            </p>
            <h3 className="font-serif text-[22px] text-text mb-5 tracking-tight">
              PIN を変更
            </h3>

            <div className="space-y-4">
              <div>
                <label className="font-serif-ja text-[11px] text-text-sub block mb-1">現在の PIN</label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={curPin}
                  onChange={(e) => setCurPin(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full py-2 px-3 border border-line bg-bg-alt text-text tracking-[0.5em] text-center text-[18px]"
                />
              </div>
              <div>
                <label className="font-serif-ja text-[11px] text-text-sub block mb-1">新しい PIN(4桁)</label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full py-2 px-3 border border-line bg-bg-alt text-text tracking-[0.5em] text-center text-[18px]"
                />
              </div>
              <div>
                <label className="font-serif-ja text-[11px] text-text-sub block mb-1">新しい PIN(確認)</label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={newPin2}
                  onChange={(e) => setNewPin2(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full py-2 px-3 border border-line bg-bg-alt text-text tracking-[0.5em] text-center text-[18px]"
                />
              </div>
            </div>

            {pinError && (
              <p className="font-serif-ja text-[12px] text-red-700 mt-4">⚠ {pinError}</p>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={resetPinForm}
                disabled={pinBusy}
                className="flex-1 py-3 border border-line font-serif italic text-[12px] tracking-[0.2em] uppercase text-text-sub hover:bg-bg-alt"
              >
                Cancel
              </button>
              <button
                onClick={handleChangePin}
                disabled={pinBusy}
                className="flex-1 py-3 bg-text text-bg font-serif italic text-[12px] tracking-[0.2em] uppercase hover:opacity-90"
              >
                {pinBusy ? '変更中…' : 'Change'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* インポート確認ダイアログ */}
      {confirmImport && (
        <div
          className="fixed inset-0 z-[60] bg-text/60 flex items-center justify-center px-6"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-bg max-w-[360px] w-full p-7 border border-line shadow-2xl">
            <p className="font-serif italic text-[11px] tracking-[0.3em] text-accent uppercase mb-3">
              — Confirm
            </p>
            <h3 className="font-serif text-[22px] text-text mb-3 tracking-tight">
              バックアップを読み込みます
            </h3>
            <p className="font-serif-ja text-[12px] text-text-sub leading-relaxed mb-6">
              「{confirmImport.name}」を読み込みます。
              <br />
              既存の旅は消えません。同じ旅があれば最新の内容に更新し、新しい旅は追加します。続行しますか?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmImport(null)}
                className="flex-1 py-3 border border-line font-serif italic text-[12px] tracking-[0.2em] uppercase text-text-sub hover:bg-bg-alt"
              >
                cancel
              </button>
              <button
                onClick={handleImportConfirm}
                className="flex-1 py-3 bg-accent text-bg font-serif italic text-[12px] tracking-[0.2em] uppercase"
              >
                restore
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ───────── メニュー項目 ───────── */
function MenuItem({
  label,
  labelJa,
  description,
  onClick,
  disabled,
  danger,
}: {
  label: string;
  labelJa: string;
  description: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full text-left py-5 border-b border-line last:border-b-0 disabled:opacity-40 hover:bg-bg-alt transition-colors"
    >
      <p
        className={`font-serif italic text-[10px] tracking-[0.35em] uppercase mb-1 ${
          danger ? 'text-red-700' : 'text-accent'
        }`}
      >
        — {label}
      </p>
      <p className="font-serif-ja text-[14px] text-text mb-1 tracking-wide">{labelJa}</p>
      <p className="font-serif-ja text-[11px] text-text-sub leading-relaxed">
        {description}
      </p>
    </button>
  );
}
