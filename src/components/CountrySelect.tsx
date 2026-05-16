import { useEffect, useRef, useState } from 'react';
import { COUNTRY_OPTIONS, findCountryByCode, getTimezoneOffsetShort } from '../lib/timezones';
import type { CountryOption } from '../lib/timezones';

interface CountrySelectProps {
  value?: string; // 選択中の country code
  onChange: (option: CountryOption | undefined) => void;
  disabled?: boolean;
}

export function CountrySelect({ value, onChange, disabled }: CountrySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selected = findCountryByCode(value);

  // 検索フィルタ:日本語ラベル、英語ラベル、code いずれかにマッチ
  const filtered = COUNTRY_OPTIONS.filter((c) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (
      c.labelJa.toLowerCase().includes(q) ||
      c.labelEn.toLowerCase().includes(q) ||
      c.code.toLowerCase().includes(q)
    );
  });

  // 開いたら検索窓にフォーカス
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // 外側クリックで閉じる
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  function handleSelect(option: CountryOption) {
    onChange(option);
    setIsOpen(false);
    setSearch('');
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation();
    onChange(undefined);
  }

  return (
    <div ref={wrapperRef} className="relative">
      {/* トリガーボタン */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className="w-full px-3 py-2 bg-bg-alt border border-text-sub/20 rounded-sm font-serif-ja text-left text-text hover:border-accent focus:outline-none focus:border-accent transition-colors flex items-center justify-between disabled:opacity-50"
      >
        <span className={selected ? 'text-text' : 'text-text-sub/40'}>
          {selected ? selected.labelJa : '国を選択...'}
        </span>
        <span className="flex items-center gap-2">
          {selected && (
            <span className="text-[10px] tracking-wider text-text-sub">
              {getTimezoneOffsetShort(selected.timezone)}
            </span>
          )}
          {selected && !disabled && (
            <span
              onClick={handleClear}
              className="text-text-sub hover:text-text px-1 cursor-pointer"
              role="button"
              aria-label="クリア"
            >
              ×
            </span>
          )}
          <span className="text-text-sub text-xs">▼</span>
        </span>
      </button>

      {/* ドロップダウン */}
      {isOpen && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-bg border border-text-sub/20 rounded-sm shadow-lg max-h-72 overflow-hidden flex flex-col">
          {/* 検索窓 */}
          <div className="p-2 border-b border-text-sub/10">
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="検索(例: ベトナム / vietnam)"
              className="w-full px-2 py-1.5 bg-bg-alt border border-text-sub/15 rounded-sm font-serif-ja text-sm text-text placeholder:text-text-sub/40 focus:outline-none focus:border-accent"
            />
          </div>

          {/* リスト */}
          <div className="overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-3 py-4 text-center font-serif-ja text-sm text-text-sub/60">
                該当する国が見つかりません
              </div>
            ) : (
              filtered.map((c) => {
                const isSelected = c.code === value;
                return (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => handleSelect(c)}
                    className={`w-full px-3 py-2 text-left flex items-center justify-between hover:bg-bg-alt transition-colors ${
                      isSelected ? 'bg-bg-alt' : ''
                    }`}
                  >
                    <span className="font-serif-ja text-sm text-text">
                      {isSelected && <span className="text-accent mr-1">·</span>}
                      {c.labelJa}
                    </span>
                    <span className="text-[10px] tracking-wider text-text-sub">
                      {getTimezoneOffsetShort(c.timezone)}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
