
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



---

## 2026-05-17:Step 15 中間セーブ — F-08 写真ボックス(途中)

### 完了部分(Step 15-1, 15-2)

**新規ファイル(コミット済み・動作未確認):**
- src/lib/photos-store.ts(189行)
  - Zustand ストア(usePhotosStore)
  - 公開 API: loadPhotos, addPhotos, toggleFavorite, removePhoto
  - EXIF パーサ内蔵(JPEG DateTimeOriginal 抽出、失敗時は File.lastModified)
- src/components/PhotoBoxSection.tsx(252行)
  - メインコンポーネント PhotoBoxSection
  - サブ:EmptyState, PhotoGrid(不均等グリッド), PhotoCell, PhotoDetailModal
  - 写真追加、お気に入り切替、削除、全画面プレビュー
  - Blob → URL.createObjectURL で表示

**TypeScript エラー: 0(両ファイルともクリーン)**

### 未完了部分(Step 15-3、次回再開時に実施)

TripDetail.tsx への組み込みが残っている。下記の手順で chapter six (Memories) セクションを追加する:

1. `import { PhotoBoxSection } from "./PhotoBoxSection";` を追加
2. chapter five (TimelineSection) の `</section>` の直後に chapter six セクションを追加
   - 構造: section > div(label/heading/title-ja/title-en) > PhotoBoxSection tripId={trip.id}
   - chapter four, five と同じパターンで OK

### 組み込み後の動作確認

- ブラウザハードリロード(Cmd + Shift + R)
- 一番下までスクロール → chapter six 表示確認
- 「+ add photos」で写真追加 → グリッド表示
- 写真タップ → 全画面プレビュー
- お気に入り切替 + 削除

### Step 15 完了後の予定(攻略プラン)

- Step 16: F-05b 地図表示(Leaflet + OpenStreetMap)
- Step 17: F-10 現地語併記
- Step 18: F-11 オフライン対応

---

## 2026-05-17:Step 15 完了 — F-08 写真ボックス

### Step 15-3: TripDetail への組み込み完了

chapter four(Memories)セクションを TripDetail に追加。コミット 027a415。

### Step 15-bonus: PhotoGalleryModal を独立化

PhotoBoxSection 内の PhotoDetailModal を `PhotoGalleryModal.tsx` として独立コンポーネント化。3 つのビュー(Grid / Timeline / Favorites)に対応:

- **Grid view**: 不均等グリッド、お気に入りに金ドット
- **Timeline view**: 日付ヘッダー + 写真ロウ(featured + 3-up 等)
- **Favorites view**: 大判 1 枚ずつ、メタ情報付き + ムービー生成への動線

### Step 15 完成版

- `src/lib/photos-store.ts`(189 行、EXIF 自動ソート)
- `src/components/PhotoBoxSection.tsx`(295 行)
- `src/components/PhotoGalleryModal.tsx`(341 行、3 ビュー)
- TripDetail に Memories セクション組み込み

### コミット

- 33ac58e wip: F-08 写真ボックス Step 15-1,15-2
- d52db1b docs: Step 15 中間セーブメモ
- 027a415 feat: F-08 写真ボックス完成、Step 15 完了

### トラブルメモ

- スクショ画像が誤って git に追加された → df3e56a で削除、`.gitignore` 追記(44b731e)

---

## 2026-05-17:Step 16 完了 — F-10 現地語併記強化

### 目的

要件 F-10「現地語併記」を強化。ホテル住所の現地語コピー機能と言語ヘルパー基盤を整備。

### 実装

- `src/lib/languages.ts`(54 行、新規)
  - 対応言語マップ:vi、ko、th、en、zh-CN、zh-TW、ja
  - getLanguageName(code): コード → 言語名
  - getLanguageDirection(code): rtl/ltr 判定の基盤
- HotelFormModal / 詳細表示
  - 住所をクリック → 現地語住所をクリップボードにコピー
  - 「コピーしました」フィードバック表示

### コミット

bc64db0 feat: F-10 現地語併記強化、Step 16 完了

---

## 2026-05-17:Step 17 完了 — データエクスポート/インポート(要件 8.2)

### 目的

要件 8.2「データ消失リスクへの対策」を実装。エクスポート/インポート機能でスマホ故障時の復旧を可能に。

### 実装

- `src/lib/data-export.ts`(212 行、新規)
  - exportAllData(): trips, travelers, flights, hotels, spots, meals, photos を JSON にまとめてダウンロード
  - importAllData(file): JSON を読み取って IndexedDB に復元
  - 写真は Blob → Base64 で変換(IndexedDB の Blob は直接 JSON 化できない)
  - スキーマバージョン埋め込み(将来の互換性)
- `src/components/SettingsMenu.tsx`(253 行、新規)
  - 設定モーダル:エクスポート / インポート / 今すぐロック / PIN 変更 / データ全削除
  - 危険な操作には確認ダイアログ
- TripsHome の右上「⋯」から呼び出し

### コミット

572f913 feat: データエクスポート/インポート機能、Step 17 完了(要件 8.2 対策)

---

## 2026-05-17:Step 18 完了 — F-05b 地図表示

### 目的

要件 F-05「観光スポット管理」の地図ビュー実装。スポット・ホテルを Leaflet + OpenStreetMap で地図上にピン表示。

### 実装

#### Step 18-1: パッケージ導入
`main.tsx` に `import 'leaflet/dist/leaflet.css'` 追加。

#### Step 18-2: SpotMapView 新規作成(186 行)

`src/components/SpotMapView.tsx`:

- MapContainer + TileLayer(OpenStreetMap)+ Marker + Popup
- カスタムピン:
  - 確定スポット = 緑(#5C7548)の丸
  - 候補スポット = 茶(#8B7355)の丸
  - ホテル = 金(#C49B5C)のひし形
- FitBoundsToMarkers コンポーネントで自動ズーム
- デフォルト中心:ダナン市街地 [16.0544, 108.2022]
- 座標は Spot.lat / lng から、ホテルは mapUrl から正規表現で抽出

#### Step 18-3: SpotFormModal に COORDINATES UI

- 緯度・経度の数値入力フィールド
- 「Google マップ URL から自動取得」ボタン(クリップボードから)
- extractCoordsFromMapsUrl():3 パターンの URL に対応
  - `@lat,lng`
  - `?q=lat,lng`
  - `!3dlat!4dlng`

#### Step 18-4: TripDetail に List / Map トグル追加

Places セクションに List / Map 切替を追加(`spotView: 'list' | 'map'`)。

### コミット

8d793e4 feat: F-05b 地図表示完成、Step 18 完了(Leaflet + OpenStreetMap でスポット地図ビュー)

### トラブルメモ

- **react-leaflet@4 と React 19 の peer 不一致** → v5 で解決
- **zsh の `==`/`#` 詰まり問題が頻発** → クォート付きヒアドキュメント `<<'TAB_END'` で全部リテラル化
- **chr(60) 戦法**:cat ヒアドキュメントで `<a` タグが消える → `chr(60) + 'a'` で動的構築(回避策)

---

## 2026-05-17:Step 18-bonus 完了 — Popup 改善 + Leaflet z-index 修正

### 目的

Step 18 完了後の UX 改善 3 点。

### 1. COORDINATES UI を 2 ステップガイドに改善

SpotFormModal の座標入力欄を、ガイド枠付きの 2 ステップ UI に再設計:

- **STEP 01**: 「Google マップで {name} を検索」(name から動的 URL 生成、bg-text text-bg の目立つボタン)
- **STEP 02**: 「クリップボードから座標を取得」(border-2 border-accent の枠線強調ボタン)
- 「✓ 座標が設定されています」olive 色フィードバック
- 手動入力は「— coordinates(or manual)」として格下げ

### 2. Popup に Google マップリンク追加(Option B 採用)

ピンクリックで Popup のみ表示(編集モーダルは開かない)。Popup 内に「Google マップで開く →」リンク:

- URL: `https://www.google.com/maps/search/?api=1&query={lat},{lng}`
- スポット用は茶色(#8B7355)、ホテル用は金色(#C49B5C)

### 3. Leaflet z-index 問題修正

Leaflet のデフォルト z-index(400〜700)がモーダル(z-50)を覆い隠す問題。`src/index.css` 末尾に追記:

```css
.leaflet-container { z-index: 0 !important; }
.leaflet-pane, .leaflet-control, .leaflet-top, .leaflet-bottom { z-index: 1 !important; }
```

### コミット

9decdac feat: Popup に Google マップリンク + Leaflet z-index 修正(モーダル背面に配置)

### トラブルメモ:`<a` タグ消失問題

cat ヒアドキュメントを Python で処理中、`<a` タグの開始だけが消失する問題が複数回発生(SpotFormModal、SpotMapView の 2 ファイル合計 3 箇所)。

**対処パッチ:**

```python
# href= がある行の手前に <a を再挿入するパッチ
for line in lines:
    if 'href={...maps/search...' in line:
        prev = lines[i-1]
        if '<a' not in prev:
            lines.insert(i, indent + '<a\n')
```

検出パターン: `grep -cE "^\s*<a$" file.tsx` でカウント。

---

## 2026-05-18:Step 19 完了 — 地図に食事ピン統合

### 目的

Places の地図ビューに食事(Meal)のピンも表示できるようにする。「五行山の近くで食事できる店」が一目で分かる体験を実現。

### 設計判断

**Option A: 統合 + フィルタ付き** を採用(将来 Step 19-3 で All/Places/Meals フィルタを追加予定)。

**食事ピン色:** テラコッタ橙(#C97C5D)の四角(12×12px)
- 既存の緑(確定スポット)・茶(候補)・金ひし形(ホテル)とぶつからない暖色
- 四角はプレート(食器)のイメージで食事と直感的に結びつく

### Step 19-1: Meal 型 + COORDINATES UI

- `types.ts`: Meal に `lat?: number` `lng?: number` を追加(後方互換)
- `MealFormModal.tsx`(313 → 421 行):
  - useState で lat, lng, coordsError を追加
  - handleSubmit data に lat/lng 追加
  - extractCoordsFromMapsUrl ヘルパー(SpotFormModal と同じパターン)
  - COORDINATES フィールドを MAP URL の直後に挿入(2 ステップ UI)

コミット:a7b090d

### Step 19-2: SpotMapView に Meals 対応

`SpotMapView.tsx`(186 → 244 行):

- import に Meal 型追加
- mealIcon を定義(`#C97C5D` 四角)
- Props に `meals?: Meal[]` と `onMealClick?` 追加
- mealsWithCoords を計算(座標がある meal だけフィルタ)
- FitBoundsToMarkers に meals 渡し(全ピンが収まる自動ズーム)
- Marker レンダリングに meals を追加、Popup に Google マップリンク

Popup の表示内容:
### Step 19-4: TripDetail から meals を渡す

```tsx
<SpotMapView
  spots={...}
  hotels={...}
  meals={allMeals.filter((m) => m.tripId === trip.id)}
  onSpotClick={...}
  onMealClick={(m) => { setEditingMeal(m); setIsMealModalOpen(true); }}
/>
```

### コミット

- a7b090d feat: Meal 型に lat/lng 追加 + MealFormModal に COORDINATES UI(Step 19-1)
- b6a0c17 feat: 地図に食事ピン追加(テラコッタ橙の四角)+ Popup から Google マップへ(Step 19-2/19-4)

### 動作確認(2026-05-18)

ダナンの旅でマダムラン(16.0814, 108.2232)を登録し、地図にテラコッタ橙の四角ピンが表示されることを確認 ✅
- ピンクリックで Popup 表示
- 「Google マップで開く →」で Google Maps が起動
- スポット(緑)+ ホテル(金ひし形)+ 食事(橙四角)の 3 種共存

### トラブルメモ

#### Vite ポート競合(5173 vs 5174)

開発中に何度か Vite を kill/restart した結果、5173 番ポートが解放されないまま 5174 に逃げる事態が発生。IndexedDB は **ポート単位で別ストレージ** のため、5174 でアクセスすると「空のアプリ」に見えてデータ消失と勘違いしやすい。

**対処:**
```bash
lsof -ti:5173 | xargs kill -9
lsof -ti:5174 | xargs kill -9
sleep 2
npm run dev  # 5173 で起動
```

#### `<a` タグ消失問題(再発)

Step 19-1(MealFormModal)、Step 19-2(SpotMapView)で再発。同じ Python パッチで `<a` 復活で全て対処済み。

### Step 19 後の地図ビュー

| ピン | 色 | 形 | 対象 |
|------|-----|-----|------|
| 🟢 | #5C7548 | 丸 | 確定スポット |
| 🟤 | #8B7355 | 丸 | 候補スポット |
| 🟡 | #C49B5C | ひし形 | ホテル |
| 🟧 | #C97C5D | 四角 | 食事 |

### Phase 進捗

- Phase 1:✅ 完了
- Phase 2:✅ フィナーレ達成
- Phase 3:🔄 進行中
  - ✅ F-08 写真ボックス(Step 15)
  - ✅ F-10 現地語併記(Step 16)
  - ✅ データ消失対策(Step 17)
  - ✅ F-05b 地図表示(Step 18 + 18-bonus + 19)
  - ⏳ F-11 オフライン対応(PWA)

### 次回の選択肢

- A. F-11 PWA オフライン対応(旅行中の電波弱対策、必須機能)
- B. Step 19-3 フィルタタブ(All / Places / Meals)
- C. Phase 4 へ:F-12 共同編集・F-13 共有用 PIN

出発まで:あと 41 日

---

## Step 20:PWA 化(2026/05/18)

### 概要

Tabi Note を PWA(Progressive Web App)として動作させる対応を完了。要件定義書 4.4「PWA として実装、ホーム画面に追加でネイティブアプリ風に使用可」を達成。これで「次回の選択肢 A:F-11 PWA オフライン対応」を消化。

### 実施内容

**Step 20-1〜20-5(導入・ビルド)**
- `vite-plugin-pwa` を導入
- `vite.config.ts` に PWA プラグイン設定を追加(manifest 定義、Service Worker 自動生成)
- `index.html` に favicon と apple-touch-icon のリンクを追加
- Kinfolk 風アイコン SVG を 3 つ作成
  - `public/tabi-note-favicon.svg`(タブ用)
  - `public/tabi-note-icon.svg`(192/512 通常)
  - `public/tabi-note-icon-maskable.svg`(maskable 用)

**Step 20-6(Chrome での動作確認)**
- ✅ タブのファビコンが Kinfolk 風セリフ体「T」で表示
- ✅ アドレスバー右側に「⊕ インストール」ボタン表示
- ✅ インストールダイアログが「Tabi Note — タビノート」「localhost:4173」で表示
- ✅ DevTools → Application → Service Workers で `sw.js` が `#2131 activated and is running`(緑)
- ✅ Update Cycle:Install → Wait → Activate 全完了

### 成果

- コミット `2053089`(累計 16 コミット)
- 10 files changed, 6744 insertions(+), 2092 deletions(-)

### おまけ:git 著者情報の整備

これまで自動推測の `空閑亮馬 <ryomakuga@kuukansukeumanoMacBook-Air-2.local>` だったため、グローバル設定を整備。

```bash

    git config --global user.name "空閑亮馬"
    git config --global user.email "283587669+ryomakuga@users.noreply.github.com"

加えて GitHub 側で「Keep my email addresses private」と「Block command line pushes that expose my email」を ON。次のコミットから GitHub プロフィールに紐付きつつ、実アドレス(gmail)は非公開で運用される。

### Phase 進捗

- Phase 1:✅ 完了
- Phase 2:✅ 完了
- Phase 3:✅ **完了**(F-08 写真、F-10 現地語、データ消失対策、F-05b 地図、F-11 PWA まで揃った)
- Phase 4:⏳ 未着手(F-12 共同編集、F-13 共有用 PIN)

### 次回の選択肢

- A. **Phase 4 着手:F-12 共同編集**(QR コード/URL での旅データ共有、共有用 PIN)
- B. Step 19-3 フィルタタブ(All / Places / Meals)
- C. GitHub にリモートリポジトリを作って push(クラウドバックアップ)

出発まで:あと 41 日

---

## Step 21:F-12 共同編集 前半(2026/05/19)

### 概要

要件定義書 3.13・9.4 に基づく共有機能の送信側を実装。同行者に旅データを暗号化URLで渡せるところまで完了。受信側(Step 21-4)は次回。

### 実施内容

**前準備**
- GitHub に Private リポジトリ `ryomakuga/tabi-note` を作成
- 17 コミット分を `git push -u origin main` でクラウドへ保護
- git の `user.email` を no-reply アドレス `283587669+ryomakuga@users.noreply.github.com` に整備

**Step 21-0:ライブラリ追加**
- `qrcode` + `@types/qrcode`

**Step 21-2:共有用エクスポート(`data-export.ts`)**
- `ShareData` 型(1旅行分、写真除外)
- `buildShareData(tripId)` で対象旅行のデータを集める
- `encryptShareData(data, sharePin)` で AES-256-GCM 暗号化 → Base64URL
- `buildShareUrl()` で `<origin>/#share=...` 形式に整形
- `generateShareUrl(tripId, sharePin)` で一発生成
- `decryptShareData(payload, sharePin)` で復号(受信側で使う)
- `extractSharePayloadFromUrl(url)` で URL からペイロード抽出

**Step 21-3a:共有モーダル(`ShareModal.tsx`)**
- 共有用PIN を2回入力 → URL 生成
- QR コード生成(errorCorrectionLevel: L)
- データ大きい場合は QR 省略 + URL コピーのみ表示
- Kinfolk トーンで仕上げ

**Step 21-3b:TripDetail に統合**
- ヘッダーに `share ⌁` ボタン追加(`edit ✎` の左)
- モーダル表示の state を管理

### 成果

- コミット `dba2251` `835b8f5` `9ec1332`(累計 20 コミット)
- 動作確認:ダナンの旅で URL 生成 → コピー成功

### 既知の課題

- 共有データが大きいと QR コード生成不可(今は URL コピーのみで運用)
- 圧縮対応(LZ-String 等)は将来検討

### 次回の選択肢

- A. Step 21-4 共有データ受信側(URL を開く → PIN 入力 → 自分のデバイスにインポート)
- B. Step 21-5 URL ルーティング(`#share=...` を自動検出して受信モーダル起動)
- C. Step 21-6 実機テスト(2台で送受信)
- D. データ圧縮(LZ-String 導入で QR 復活)

出発まで:あと 40 日
