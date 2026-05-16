// ============================================
// Tabi Note - 国 / タイムゾーンマスター
// 日本人がビジネス・旅行で行く主要 50 か国・地域
// ============================================

export interface CountryOption {
  code: string;       // 内部キー
  labelJa: string;    // 表示ラベル(日本語)
  labelEn: string;    // 検索用(英語)
  timezone: string;   // IANA タイムゾーン
  region: 'asia' | 'oceania' | 'north_america' | 'south_america' | 'europe' | 'middle_east' | 'africa';
}

export const COUNTRY_OPTIONS: CountryOption[] = [
  // ─── アジア(日本人渡航の中心) ───
  { code: 'japan',       labelJa: '日本',                  labelEn: 'Japan',         timezone: 'Asia/Tokyo',           region: 'asia' },
  { code: 'korea',       labelJa: '韓国',                  labelEn: 'Korea',         timezone: 'Asia/Seoul',           region: 'asia' },
  { code: 'taiwan',      labelJa: '台湾',                  labelEn: 'Taiwan',        timezone: 'Asia/Taipei',          region: 'asia' },
  { code: 'china',       labelJa: '中国',                  labelEn: 'China',         timezone: 'Asia/Shanghai',        region: 'asia' },
  { code: 'hongkong',    labelJa: '香港',                  labelEn: 'Hong Kong',     timezone: 'Asia/Hong_Kong',       region: 'asia' },
  { code: 'macau',       labelJa: 'マカオ',                labelEn: 'Macau',         timezone: 'Asia/Macau',           region: 'asia' },
  { code: 'mongolia',    labelJa: 'モンゴル',              labelEn: 'Mongolia',      timezone: 'Asia/Ulaanbaatar',     region: 'asia' },
  { code: 'vietnam',     labelJa: 'ベトナム',              labelEn: 'Vietnam',       timezone: 'Asia/Ho_Chi_Minh',     region: 'asia' },
  { code: 'thailand',    labelJa: 'タイ',                  labelEn: 'Thailand',      timezone: 'Asia/Bangkok',         region: 'asia' },
  { code: 'cambodia',    labelJa: 'カンボジア',            labelEn: 'Cambodia',      timezone: 'Asia/Phnom_Penh',      region: 'asia' },
  { code: 'laos',        labelJa: 'ラオス',                labelEn: 'Laos',          timezone: 'Asia/Vientiane',       region: 'asia' },
  { code: 'myanmar',     labelJa: 'ミャンマー',            labelEn: 'Myanmar',       timezone: 'Asia/Yangon',          region: 'asia' },
  { code: 'malaysia',    labelJa: 'マレーシア',            labelEn: 'Malaysia',      timezone: 'Asia/Kuala_Lumpur',    region: 'asia' },
  { code: 'singapore',   labelJa: 'シンガポール',          labelEn: 'Singapore',     timezone: 'Asia/Singapore',       region: 'asia' },
  { code: 'indonesia',   labelJa: 'インドネシア(バリ)',   labelEn: 'Indonesia Bali',timezone: 'Asia/Makassar',        region: 'asia' },
  { code: 'jakarta',     labelJa: 'インドネシア(ジャカルタ)', labelEn: 'Indonesia Jakarta', timezone: 'Asia/Jakarta',  region: 'asia' },
  { code: 'philippines', labelJa: 'フィリピン',            labelEn: 'Philippines',   timezone: 'Asia/Manila',          region: 'asia' },
  { code: 'india',       labelJa: 'インド',                labelEn: 'India',         timezone: 'Asia/Kolkata',         region: 'asia' },
  { code: 'srilanka',    labelJa: 'スリランカ',            labelEn: 'Sri Lanka',     timezone: 'Asia/Colombo',         region: 'asia' },
  { code: 'nepal',       labelJa: 'ネパール',              labelEn: 'Nepal',         timezone: 'Asia/Kathmandu',       region: 'asia' },

  // ─── 中東 ───
  { code: 'uae',         labelJa: 'アラブ首長国連邦(ドバイ)', labelEn: 'UAE Dubai',  timezone: 'Asia/Dubai',           region: 'middle_east' },
  { code: 'qatar',       labelJa: 'カタール',              labelEn: 'Qatar',         timezone: 'Asia/Qatar',           region: 'middle_east' },
  { code: 'turkey',      labelJa: 'トルコ',                labelEn: 'Turkey',        timezone: 'Europe/Istanbul',      region: 'middle_east' },
  { code: 'israel',      labelJa: 'イスラエル',            labelEn: 'Israel',        timezone: 'Asia/Jerusalem',       region: 'middle_east' },

  // ─── オセアニア ───
  { code: 'australia_e', labelJa: 'オーストラリア(シドニー)', labelEn: 'Australia Sydney', timezone: 'Australia/Sydney', region: 'oceania' },
  { code: 'australia_w', labelJa: 'オーストラリア(パース)',   labelEn: 'Australia Perth',  timezone: 'Australia/Perth',  region: 'oceania' },
  { code: 'newzealand',  labelJa: 'ニュージーランド',      labelEn: 'New Zealand',   timezone: 'Pacific/Auckland',     region: 'oceania' },
  { code: 'guam',        labelJa: 'グアム',                labelEn: 'Guam',          timezone: 'Pacific/Guam',         region: 'oceania' },
  { code: 'saipan',      labelJa: 'サイパン',              labelEn: 'Saipan',        timezone: 'Pacific/Saipan',       region: 'oceania' },
  { code: 'fiji',        labelJa: 'フィジー',              labelEn: 'Fiji',          timezone: 'Pacific/Fiji',         region: 'oceania' },

  // ─── 北米 ───
  { code: 'hawaii',      labelJa: 'ハワイ',                labelEn: 'Hawaii',        timezone: 'Pacific/Honolulu',     region: 'north_america' },
  { code: 'los_angeles', labelJa: 'アメリカ(ロサンゼルス)',labelEn: 'USA Los Angeles', timezone: 'America/Los_Angeles',region: 'north_america' },
  { code: 'san_francisco', labelJa: 'アメリカ(サンフランシスコ)', labelEn: 'USA San Francisco', timezone: 'America/Los_Angeles', region: 'north_america' },
  { code: 'las_vegas',   labelJa: 'アメリカ(ラスベガス)', labelEn: 'USA Las Vegas',  timezone: 'America/Los_Angeles',  region: 'north_america' },
  { code: 'seattle',     labelJa: 'アメリカ(シアトル)',   labelEn: 'USA Seattle',   timezone: 'America/Los_Angeles',  region: 'north_america' },
  { code: 'chicago',     labelJa: 'アメリカ(シカゴ)',     labelEn: 'USA Chicago',   timezone: 'America/Chicago',      region: 'north_america' },
  { code: 'new_york',    labelJa: 'アメリカ(ニューヨーク)',labelEn: 'USA New York',  timezone: 'America/New_York',     region: 'north_america' },
  { code: 'boston',      labelJa: 'アメリカ(ボストン)',   labelEn: 'USA Boston',    timezone: 'America/New_York',     region: 'north_america' },
  { code: 'washington_dc', labelJa: 'アメリカ(ワシントンDC)', labelEn: 'USA Washington DC', timezone: 'America/New_York', region: 'north_america' },
  { code: 'miami',       labelJa: 'アメリカ(マイアミ)',   labelEn: 'USA Miami',     timezone: 'America/New_York',     region: 'north_america' },
  { code: 'canada_e',    labelJa: 'カナダ(トロント)',     labelEn: 'Canada Toronto',timezone: 'America/Toronto',      region: 'north_america' },
  { code: 'canada_w',    labelJa: 'カナダ(バンクーバー)', labelEn: 'Canada Vancouver', timezone: 'America/Vancouver',region: 'north_america' },
  { code: 'mexico',      labelJa: 'メキシコ',              labelEn: 'Mexico',        timezone: 'America/Mexico_City',  region: 'north_america' },

  // ─── 南米 ───
  { code: 'brazil',      labelJa: 'ブラジル(サンパウロ)', labelEn: 'Brazil Sao Paulo', timezone: 'America/Sao_Paulo', region: 'south_america' },
  { code: 'argentina',   labelJa: 'アルゼンチン',          labelEn: 'Argentina',     timezone: 'America/Argentina/Buenos_Aires', region: 'south_america' },
  { code: 'peru',        labelJa: 'ペルー',                labelEn: 'Peru',          timezone: 'America/Lima',         region: 'south_america' },

  // ─── ヨーロッパ ───
  { code: 'london',      labelJa: 'イギリス(ロンドン)',   labelEn: 'UK London',     timezone: 'Europe/London',        region: 'europe' },
  { code: 'paris',       labelJa: 'フランス(パリ)',       labelEn: 'France Paris',  timezone: 'Europe/Paris',         region: 'europe' },
  { code: 'germany',     labelJa: 'ドイツ',                labelEn: 'Germany',       timezone: 'Europe/Berlin',        region: 'europe' },
  { code: 'italy',       labelJa: 'イタリア',              labelEn: 'Italy',         timezone: 'Europe/Rome',          region: 'europe' },
  { code: 'spain',       labelJa: 'スペイン',              labelEn: 'Spain',         timezone: 'Europe/Madrid',        region: 'europe' },
  { code: 'portugal',    labelJa: 'ポルトガル',            labelEn: 'Portugal',      timezone: 'Europe/Lisbon',        region: 'europe' },
  { code: 'netherlands', labelJa: 'オランダ',              labelEn: 'Netherlands',   timezone: 'Europe/Amsterdam',     region: 'europe' },
  { code: 'switzerland', labelJa: 'スイス',                labelEn: 'Switzerland',   timezone: 'Europe/Zurich',        region: 'europe' },
  { code: 'austria',     labelJa: 'オーストリア',          labelEn: 'Austria',       timezone: 'Europe/Vienna',        region: 'europe' },
  { code: 'belgium',     labelJa: 'ベルギー',              labelEn: 'Belgium',       timezone: 'Europe/Brussels',      region: 'europe' },
  { code: 'sweden',      labelJa: 'スウェーデン',          labelEn: 'Sweden',        timezone: 'Europe/Stockholm',     region: 'europe' },
  { code: 'finland',     labelJa: 'フィンランド',          labelEn: 'Finland',       timezone: 'Europe/Helsinki',      region: 'europe' },
  { code: 'norway',      labelJa: 'ノルウェー',            labelEn: 'Norway',        timezone: 'Europe/Oslo',          region: 'europe' },
  { code: 'denmark',     labelJa: 'デンマーク',            labelEn: 'Denmark',       timezone: 'Europe/Copenhagen',    region: 'europe' },
  { code: 'czech',       labelJa: 'チェコ',                labelEn: 'Czech',         timezone: 'Europe/Prague',        region: 'europe' },
  { code: 'greece',      labelJa: 'ギリシャ',              labelEn: 'Greece',        timezone: 'Europe/Athens',        region: 'europe' },
  { code: 'russia',      labelJa: 'ロシア(モスクワ)',     labelEn: 'Russia Moscow', timezone: 'Europe/Moscow',        region: 'europe' },

  // ─── アフリカ ───
  { code: 'egypt',       labelJa: 'エジプト',              labelEn: 'Egypt',         timezone: 'Africa/Cairo',         region: 'africa' },
  { code: 'south_africa', labelJa: '南アフリカ',           labelEn: 'South Africa',  timezone: 'Africa/Johannesburg',  region: 'africa' },
  { code: 'morocco',     labelJa: 'モロッコ',              labelEn: 'Morocco',       timezone: 'Africa/Casablanca',    region: 'africa' },
];

/**
 * IANA タイムゾーン名 → 国オプション逆引き
 * 同じタイムゾーンを持つ国/都市が複数ある場合、最初に見つかったものを返す
 */
export function findCountryByTimezone(timezone?: string): CountryOption | undefined {
  if (!timezone) return undefined;
  return COUNTRY_OPTIONS.find((c) => c.timezone === timezone);
}

/**
 * code から逆引き
 */
export function findCountryByCode(code?: string): CountryOption | undefined {
  if (!code) return undefined;
  return COUNTRY_OPTIONS.find((c) => c.code === code);
}

/**
 * 日本との時差を「日本より N時間遅れ」「日本より N時間進み」「日本と同じ」で返す
 */
export function getTimezoneOffsetText(timezone?: string): string {
  if (!timezone) return '';
  try {
    const now = new Date();
    const jstOffset = getOffsetMinutes(now, 'Asia/Tokyo');
    const targetOffset = getOffsetMinutes(now, timezone);
    const diffMin = targetOffset - jstOffset;

    if (diffMin === 0) return '日本と同じ時刻';
    const absH = Math.abs(diffMin) / 60;
    const formatted = Number.isInteger(absH) ? `${absH}` : absH.toFixed(1);
    return diffMin < 0 ? `日本より ${formatted}時間遅れ` : `日本より ${formatted}時間進み`;
  } catch {
    return '';
  }
}

/**
 * 短縮形(検索ドロップダウン用):「−2h」「±0」「+1h」
 */
export function getTimezoneOffsetShort(timezone?: string): string {
  if (!timezone) return '';
  try {
    const now = new Date();
    const jstOffset = getOffsetMinutes(now, 'Asia/Tokyo');
    const targetOffset = getOffsetMinutes(now, timezone);
    const diffMin = targetOffset - jstOffset;

    if (diffMin === 0) return '±0';
    const absH = Math.abs(diffMin) / 60;
    const formatted = Number.isInteger(absH) ? `${absH}` : absH.toFixed(1);
    return diffMin < 0 ? `−${formatted}h` : `+${formatted}h`;
  } catch {
    return '';
  }
}

// 指定タイムゾーンでのUTCオフセット(分)を取得
function getOffsetMinutes(date: Date, timezone: string): number {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
  const parts = dtf.formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  const asUTC = Date.UTC(
    get('year'), get('month') - 1, get('day'),
    get('hour'), get('minute'), get('second')
  );
  return Math.round((asUTC - date.getTime()) / 60000);
}
