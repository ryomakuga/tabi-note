import { useEffect, useState } from 'react';

interface Props {
  value: string[];
  onChange: (urls: string[]) => void;
  placeholder?: string;
}

/**
 * URL を複数登録できる共通入力コンポーネント
 *
 * 動作仕様:
 * - 各 URL ごとに 1 行の input + 右側に削除ボタン
 * - 末尾に「+ URLを追加」ボタン
 * - 空欄も含めて編集中の状態を保持し、保存時に親側で空欄を除外する
 * - value が変わったら内部 state を同期(編集モーダル開き直し時など)
 */
export function UrlListInput({
  value,
  onChange,
  placeholder = 'https://...',
}: Props) {
  // 編集中の URL リスト。空欄も保持して、ユーザーが入力中の状態を維持する
  const [items, setItems] = useState<string[]>(
    value.length > 0 ? value : ['']
  );

  // 親から value が再注入されたとき(別アイテムを編集し始めたとき等)に同期
  useEffect(() => {
    setItems(value.length > 0 ? value : ['']);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.join('|')]);

  const emit = (next: string[]) => {
    setItems(next);
    // 親には空欄を除外したものだけ通知
    onChange(next.map((u) => u.trim()).filter((u) => u.length > 0));
  };

  const handleChange = (idx: number, v: string) => {
    const next = [...items];
    next[idx] = v;
    emit(next);
  };

  const handleAdd = () => {
    emit([...items, '']);
  };

  const handleRemove = (idx: number) => {
    const next = items.filter((_, i) => i !== idx);
    // 全部消えたら 1 つ空欄を残す(UI 上ボタンだけだと寂しいので)
    emit(next.length > 0 ? next : ['']);
  };

  return (
    <div className="space-y-2">
      {items.map((url, idx) => (
        <div key={idx} className="flex items-stretch gap-2">
          <input
            type="url"
            value={url}
            onChange={(e) => handleChange(idx, e.target.value)}
            className="form-input font-mono text-[11px] flex-1"
            placeholder={placeholder}
          />
          <button
            type="button"
            onClick={() => handleRemove(idx)}
            className="px-3 border border-line text-text-sub hover:text-red-700 hover:border-red-700 transition-colors font-serif italic text-[14px] leading-none"
            title="このURLを削除"
            aria-label="このURLを削除"
          >
            ×
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={handleAdd}
        className="w-full py-2.5 border border-dashed border-line text-text-sub hover:text-accent hover:border-accent transition-colors font-serif italic text-[12px] tracking-[0.1em]"
      >
        + URLを追加
      </button>
    </div>
  );
}
