/**
 * 言語コード → 表示名のマッピング
 * F-10: 現地語併記機能で使う
 */

interface LanguageInfo {
  code: string;
  ja: string;       // 日本語名
  local: string;    // その言語自身での表記
}

const LANGUAGES: LanguageInfo[] = [
  { code: 'vi', ja: 'ベトナム語', local: 'Tiếng Việt' },
  { code: 'ko', ja: '韓国語', local: '한국어' },
  { code: 'th', ja: 'タイ語', local: 'ภาษาไทย' },
  { code: 'zh-CN', ja: '中国語（簡体）', local: '中文（简体）' },
  { code: 'zh-TW', ja: '中国語（繁体）', local: '中文（繁體）' },
  { code: 'en', ja: '英語', local: 'English' },
  { code: 'fr', ja: 'フランス語', local: 'Français' },
  { code: 'es', ja: 'スペイン語', local: 'Español' },
  { code: 'de', ja: 'ドイツ語', local: 'Deutsch' },
  { code: 'it', ja: 'イタリア語', local: 'Italiano' },
  { code: 'pt', ja: 'ポルトガル語', local: 'Português' },
  { code: 'id', ja: 'インドネシア語', local: 'Bahasa Indonesia' },
  { code: 'ms', ja: 'マレー語', local: 'Bahasa Melayu' },
  { code: 'tl', ja: 'タガログ語', local: 'Tagalog' },
];

/**
 * 言語コードから日本語名を取得("vi" → "ベトナム語")
 * 未知のコードはそのまま返す
 */
export function getLanguageNameJa(code: string | undefined): string {
  if (!code) return '';
  const lang = LANGUAGES.find((l) => l.code === code);
  return lang?.ja ?? code;
}

/**
 * 言語コードから現地語名を取得("vi" → "Tiếng Việt")
 * 未知のコードは空文字を返す
 */
export function getLanguageNameLocal(code: string | undefined): string {
  if (!code) return '';
  const lang = LANGUAGES.find((l) => l.code === code);
  return lang?.local ?? '';
}

/**
 * 利用可能な言語一覧を返す(セレクトボックス用)
 */
export function getAllLanguages(): LanguageInfo[] {
  return LANGUAGES;
}
