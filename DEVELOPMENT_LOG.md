
---

## Step 10 — F-03 フライト + 時差表示 + 編集機能(Phase 2 / 2026-05-16)

### 完成した機能
- **F-03 フライト情報管理**:flights-store.ts, FlightFormModal.tsx, TripDetail にフライトセクション
- **時差表示**:Trip に timezone フィールド、timezones.ts(65か国マスター)、章扉に「日本より N時間遅れ」表示
- **国セレクター**:CountrySelect.tsx(検索つきプルダウン)
- **編集機能**:TripFormModal.tsx を新規/編集両対応に拡張、TripDetail に「edit ✎」ボタン追加

### 新規ファイル
- src/lib/flights-store.ts (89行)
- src/lib/timezones.ts (168行、65か国)
- src/components/FlightFormModal.tsx (344行)
- src/components/CountrySelect.tsx (143行)

### 変更ファイル
- src/lib/types.ts — Trip に timezone?, Flight に airline / memo 追加
- src/components/TripFormModal.tsx — trip? prop で編集対応、Country フィールド追加
- src/components/TripDetail.tsx — 時差表示、edit ボタン、フライトセクション
- src/components/TripsHome.tsx — coverPhotoId バグ修正

### 障害と復旧
- cat ヒアドキュメント書き換え時に EOF 衝突で TripDetail.tsx が 0 バイトに
- ターミネータを __TABI_NOTE_END__ に変更して復旧成功

### 次回
- 要件定義書 V1.6:PIN認証 UX(初回 2 回入力)
- F-04 ホテル情報管理

---

## TODO / 将来のアイデア(2026-05-16 追記)

### タイムライン空白警告機能(F-07 タイムライン実装時に検討)
- ホテルチェックアウト後 → 次のフライト出発まで に大きな空白(例:6時間以上)があったら、控えめに「この時間は宿泊先がありません」と表示
- ダナン旅行の実例:6/30 12:00 シェラトンチェックアウト → 7/1 01:10 VN336出発 = 約13時間の空白
- 案:アイコンや控えめなアラート1行で気づける程度の表示。Kinfolk風を保つため、警告色は使わずベージュ系で控えめに

---

## Step 11 — F-04 ホテル + F-05a スポット(候補/確定リスト)(2026-05-16 夜)

### 完成した機能
- **F-04 ホテル情報管理**:hotels-store.ts, HotelFormModal.tsx, TripDetail に Stay セクション(chapter two)
- **F-05a 観光スポット管理(リスト版)**:spots-store.ts, SpotFormModal.tsx, TripDetail に Places セクション(chapter three)
- **候補/確定タブ切替**:All/Draft/Confirmed フィルター(日本語「すべて/候補/確定」)
- **ステータス切替**:モーダル内のボタン式トグル(候補=text色、確定=olive色)
- **UI日本語化**:タブ・カード内ステータス・モーダルボタンすべて日本語化(明朝体)

### 新規ファイル
- src/lib/hotels-store.ts (69行)
- src/components/HotelFormModal.tsx (231行)
- src/lib/spots-store.ts (78行)
- src/components/SpotFormModal.tsx (221行)

### 変更ファイル
- src/components/TripDetail.tsx — Stay + Places セクション、対応する state/useEffect/サブコンポーネント追加(309行)

### 登録済みデータ(動作確認OK)
- フライト:VN337(往路)/ VN336(復路)
- ホテル:シェラトン グランド ダナン ビーチ リゾート&スパ(6/28 15:00 → 6/30 12:00)
- スポット:任意(動作確認時に登録)

### 次回
- F-05b 地図表示(Leaflet + OpenStreetMap、緯度経度入力)
- または F-06 食事予定管理(F-05 と似たパターン)
- または F-07 タイムライン表示(全予定統合)
- 要件定義書 V1.6:PIN認証 UX(初回 2 回入力)

---

## 2026-05-16〜17:Step 12 + Step 13 完了

### Step 12: F-06 食事予定管理(MVP)実装

**新規ファイル:**
- `src/lib/meals-store.ts`(85行) - Spot store と同構造、ソートのみ違う(confirmed+scheduledAt 順、その他は createdAt 順)
- `src/components/MealFormModal.tsx`(313行) - ジャンル21種プリセット + 自由入力、scheduledAt(確定時のみ)、mapUrl、UrlListInput

**TripDetail.tsx 拡張:**
- chapter four (Meals / 食事) セクション追加
- サブコンポーネント追加:MealFilterTabs / MealList / MealCard / formatMealTime
- 5つのモーダル(Flight / Trip / Hotel / Spot / Meal)が揃った
- 行数:317 → 430行

**MealCard デザインの差別化:**
- 左ボーダーが secondary(グレージュ)= Spot の olive/secondary と区別
- ジャンルは枠線つきバッジ表示
- scheduledAt は確定時のみ「29 Jun · 18:00」形式で表示
- URL は ExternalLink list 形式で統一

### Step 13: URL 入力 UI の共通化

**新規ファイル:**
- `src/components/UrlListInput.tsx`(87行) - 共通 URL 入力部品。input + ✕ + 「+ URLを追加」破線ボタン
- `src/components/ExternalLink.tsx`(87行) - 外部リンク表示、4 variants(inline / block / compact / list)、stopPropagation で親クリック抑制

**横展開:**
- SpotFormModal / MealFormModal / HotelFormModal すべて UrlListInput に統一
- types.ts に Hotel.urls フィールド追加
- TripDetail.tsx の HotelCard に mapUrl + urls 統合表示
- TripDetail.tsx の SpotCard / MealCard で ExternalLink list 形式に置換

**長い URL の表示改善:**
- getDomain → ドメイン + パス(最大48文字)、超過時は `…` で省略
- list variant の className に `min-w-0 max-w-full` 追加
- urls 表示 div に `overflow-hidden` 追加
- grid 構造の 1fr 列(MealCard)に `min-w-0` 追加
- → Google Maps の長い URL が `google.com/maps/place/Nhà+hàng+Madame+Lân/@16.0814114…` のように整形表示

### トラブルメモ(次回参考)

- **chr(60) 戦法**:cat ヒアドキュメント・Python ワンライナーで `<a` タグが消える現象が出たら、`chr(60) + 'a'` で動的構築する
- **assert で止めると複数ファイルの変更が中途半端になる**:中規模の置換は if/else にして部分成功を許容する
- **CSS Grid の子要素には min-width: auto が暗黙設定される**:長いコンテンツがあると列ごと拡張する。`min-w-0` を明示的に付ける必要あり
- **truncate が効かない時のチェック順**:(1) 親に min-w-0、(2) flex 子なら自身に min-w-0、(3) grid 子なら親 grid-template + 自身 min-w-0

### Phase 進捗

- Phase 1:✅ 完了
- Phase 2:F-03、F-04、F-05a、F-06 完了。残り F-05b(地図)、F-07(タイムライン)
- Phase 3 以降:未着手

### 現状の問題タブ

- エラー:0
- 警告:3(未使用変数など軽微)

### 次回の選択肢

- A. F-05b 地図表示(Leaflet + OpenStreetMap)
- B. F-07 タイムライン表示(全予定統合) ← おすすめ、Phase 2 フィナーレ
- C. UI の細かい調整(警告解消等)


---

## 2026-05-17:Step 14 完了 — F-07 タイムライン表示(Phase 2 フィナーレ)

### Step 14: F-07 タイムライン表示の実装

**新規ファイル:**
- `src/lib/timeline-utils.ts`(192行) - 全エンティティ → TimelineItem 変換 + 日付グルーピング + ソート
  - 型: `TimelineCategory`, `TimelineItem`, `TimelineDay`
  - 関数: `buildTimelineItems`, `groupByDay`, `formatDayLabel`, `formatTime`
  - Spot/Meal は「確定 + scheduledAt あり」のみタイムライン表示

**TripDetail.tsx 拡張:**
- chapter five (Timeline / 旅程) セクション追加(行 145〜163)
- サブコンポーネント追加: `TimelineSection` / `TimelineDayBlock` / `TimelineEntry`
- ヘルパー: `getCategoryBorderColor` / `getCategoryLabel`
- 行数:430 → 632行

**デザイン:**
- timeline_day01.html モックを忠実再現
- Day ヘッダー: 「Day 01」(Cormorant Garamond) + 「28 June · Sunday」
- 時刻表示: 09:30 / → 12:25(フライトの場合)
- カテゴリ別の左縦線色: flight=gold, hotel-in/out=olive, spot=accent, meal=secondary
- カードタップで該当エンティティの編集モーダルが開く

### トラブルと修正

**問題1: formatTime 関数の二重定義(SyntaxError)**
- 既存 TripDetail.tsx 237行に `function formatTime` があった
- timeline-utils.ts でも `export function formatTime` を作って import
- → ブラウザで画面が真っ白に
- 修正:import 時に `formatTime as formatTimelineTime` でエイリアス

**問題2: タイムゾーンずれ(UTC vs JST)**
- MealFormModal/FlightFormModal は `new Date(local).toISOString()` で **UTC 化**保存
- timeline-utils の `groupByDay` で `.slice(0, 10)` を使うと **UTC の日付**でグループ化
- 症状:
  - VN336(7/1 01:10 JST = 6/30 16:10 UTC)が Day 03 に出る
  - マダムラン(6/29 18:00 JST = 6/29 09:00 UTC)が Day 02 と Day 03 の両方に出る現象
- 修正:`groupByDay` の日付抽出を **`getFullYear/getMonth/getDate`(ローカルタイム基準)**に変更
- → 全予定が正しい日付グループに、重複も解消

### 次回参考のトラブルメモ追加

- **関数名の衝突**:同名関数が複数定義されると JS は SyntaxError で死ぬ。import エイリアス(`as`)で回避
- **UTC vs ローカルタイムの罠**:`toISOString()` は UTC を返す。日付グループ化はローカルタイム基準(`getFullYear/getMonth/getDate`)で
- **TypeScript エラーが 0 でもブラウザでクラッシュ**:JS 実行時エラーは Chrome 開発者ツールの Console タブで確認

### Phase 進捗

- Phase 1:✅ 完了
- Phase 2:✅ F-03, F-04, F-05a, F-06, **F-07 完了!**(F-05b 地図のみ未実装、Phase 3 と並列で OK)
- Phase 3 以降:未着手

### 現状の問題タブ

- エラー:0
- 警告:既存のみ(F-07 追加で新エラーなし)

### 次回の選択肢

- A. F-05b 地図表示(Leaflet + OpenStreetMap)
- B. Phase 3 へ:F-08 写真ボックス、F-10 現地語併記、F-11 オフライン対応
- C. UI の細かい調整、警告解消

