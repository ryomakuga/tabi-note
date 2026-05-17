// ============================================
// Tabi Note - 旅行一覧画面
// プロトタイプ trips_home.html ベース
// 要件定義書 F-01 に準拠
// ============================================

import { useEffect, useState } from 'react';
import { useTripsStore } from '../lib/trips-store';
import { useUIStore } from '../lib/ui-store';
import { useAuthStore } from '../lib/auth-store';
import type { Trip } from '../lib/types';
import { TripFormModal } from './TripFormModal';
import { SettingsMenu } from './SettingsMenu';

export function TripsHome() {
  const { trips, loadTrips, getUpcomingTrips, getPastTrips, getDaysUntilStart} = useTripsStore();
  const { lock } = useAuthStore();
  const { openTrip } = useUIStore();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    loadTrips();
  }, [loadTrips]);

  const upcomingTrips = getUpcomingTrips();
  const pastTrips = getPastTrips();
  const featuredTrip: Trip | undefined = upcomingTrips[0];

  // 空状態
  if (trips.length === 0) {
    return (
      <>
        <Header onSettingsClick={() => setShowSettings(true)} />
        <div className="min-h-screen flex flex-col items-center justify-center px-8 bg-bg pb-24">
          <div className="text-center max-w-xs">
            <div
              className="text-3xl text-gold mb-6"
              style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', letterSpacing: '0.3em' }}
            >
              — ◌ —
            </div>
            <h2
              className="text-3xl text-text mb-3 leading-tight"
              style={{ fontFamily: '"Cormorant Garamond", serif', fontWeight: 300 }}
            >
              The first<br />journey begins
            </h2>
            <p
              className="text-sm text-text mb-5"
              style={{ fontFamily: '"Noto Serif JP", serif', letterSpacing: '0.06em' }}
            >
              最初の旅をはじめる
            </p>
            <p
              className="text-xs text-text-sub mb-8 leading-loose"
              style={{ fontFamily: '"Noto Serif JP", serif', fontWeight: 300 }}
            >
              行き先を決めて、日程をひらく。<br />
              あなただけの旅の本を、はじめましょう。
            </p>
            <button
              onClick={() => setIsFormOpen(true)}
              className="px-9 py-3.5 bg-text text-bg text-xs uppercase border border-text hover:bg-transparent hover:text-text transition-colors"
              style={{ fontFamily: '"Cormorant Garamond", serif', letterSpacing: '0.45em' }}
            >
              — Begin —
            </button>
          </div>
        </div>
        {isFormOpen && <TripFormModal onClose={() => setIsFormOpen(false)} />}
        {showSettings && <SettingsMenu onClose={() => setShowSettings(false)} />}
      </>
    );
  }

  return (
    <>
      <Header onSettingsClick={() => setShowSettings(true)} />
      <div className="min-h-screen bg-bg px-7 pt-14 pb-24 max-w-md mx-auto">
        {/* 章タイトル */}
        <div className="mb-9">
          <div
            className="text-xs text-gold mb-3.5"
            style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', letterSpacing: '0.2em' }}
          >
            — your library
          </div>
          <h1
            className="text-5xl text-text mb-3.5 leading-none"
            style={{ fontFamily: '"Cormorant Garamond", serif', fontWeight: 300 }}
          >
            Trips
          </h1>
          <p
            className="text-base text-text mb-1.5"
            style={{ fontFamily: '"Noto Serif JP", serif', letterSpacing: '0.08em' }}
          >
            あなたの旅
          </p>
          <p
            className="text-sm text-text-sub"
            style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic' }}
          >
            a quiet collection of journeys
          </p>
        </div>

        {/* Upcoming */}
        {featuredTrip && (
          <>
            <SectionLabel text="— Upcoming" />
            <FeaturedTripCard
              trip={featuredTrip}
              daysToGo={getDaysUntilStart(featuredTrip)}
              onClick={() => openTrip(featuredTrip.id)}
            />
          </>
        )}

        {/* Past Issues */}
        {pastTrips.length > 0 && (
          <>
            <SectionLabel text="— Past Issues" />
            <div className="mb-6">
              {pastTrips.map((trip, idx) => (
                <PastTripCard
                  key={trip.id}
                  trip={trip}
                  index={pastTrips.length - idx}
                  onClick={() => openTrip(trip.id)}
                />
              ))}
            </div>
          </>
        )}

        {/* 新規追加ボタン */}
        <button
          onClick={() => setIsFormOpen(true)}
          className="block w-full mt-7 py-5 border border-dashed border-line-strong hover:border-solid hover:border-accent hover:bg-bg-alt transition-all text-center"
        >
          <div
            className="text-2xl text-accent leading-none mb-1.5"
            style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic' }}
          >
            +
          </div>
          <div
            className="text-xs text-text-sub uppercase"
            style={{ fontFamily: '"Cormorant Garamond", serif', letterSpacing: '0.4em' }}
          >
            — Begin a new journey —
          </div>
        </button>

        <div
          className="text-center my-8 text-secondary"
          style={{ fontFamily: '"Cormorant Garamond", serif', letterSpacing: '0.5em' }}
        >
          · · ·
        </div>
      </div>

      {isFormOpen && <TripFormModal onClose={() => setIsFormOpen(false)} />}
      {showSettings && <SettingsMenu onClose={() => setShowSettings(false)} />}
    </>
  );
}

// ───── ヘッダー ─────
function Header({ onSettingsClick }: { onSettingsClick: () => void }) {
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'good morning' : hour < 18 ? 'good afternoon' : 'good evening';

  return (
    <div className="max-w-md mx-auto px-7 pt-14 pb-6 border-b border-line relative">
      <div className="text-center">
        <div
          className="text-xs text-accent uppercase mb-1.5"
          style={{ fontFamily: '"Cormorant Garamond", serif', letterSpacing: '0.45em' }}
        >
          Tabi Note
        </div>
        <div
          className="text-xs text-text-sub uppercase"
          style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '0.35em' }}
        >
          — {greeting}
        </div>
      </div>
      <button
        onClick={onSettingsClick}
        className="absolute top-14 right-7 text-text-sub px-2 py-1 text-base"
        style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic' }}
      >
        ⋯
      </button>
    </div>
  );
}

// ───── セクションラベル ─────
function SectionLabel({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-4 mb-6 mt-10">
      <div
        className="text-xs text-accent uppercase whitespace-nowrap"
        style={{ fontFamily: '"Cormorant Garamond", serif', letterSpacing: '0.4em' }}
      >
        {text}
      </div>
      <div className="flex-1 h-px bg-line" />
    </div>
  );
}

// ───── 進行中の旅行カード ─────
function FeaturedTripCard({
  trip,
  daysToGo,
  onClick,
}: {
  trip: Trip;
  daysToGo: number;
  onClick: () => void;
}) {
  const startDate = formatDateRange(trip.startDate, trip.endDate);
  const duration = computeDays(trip.startDate, trip.endDate);

  return (
    <div className="mb-6 cursor-pointer" onClick={onClick}>
      {/* カバー */}
      <div
        className="w-full aspect-[4/5] relative overflow-hidden mb-5"
        style={{
          background:
            'linear-gradient(160deg, #d4c5a3 0%, #c4a87a 40%, #8b7355 80%, #5c4d3a 100%)',
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 30% 70%, rgba(255,255,255,0.15) 0%, transparent 50%), radial-gradient(circle at 70% 30%, rgba(58,47,31,0.25) 0%, transparent 50%)',
          }}
        />
        <div
          className="absolute top-5 left-5 text-xs text-bg px-2.5 py-1 z-10"
          style={{
            fontFamily: '"Cormorant Garamond", serif',
            fontStyle: 'italic',
            letterSpacing: '0.3em',
            background: 'rgba(58, 47, 31, 0.4)',
            backdropFilter: 'blur(4px)',
          }}
        >
          — next journey
        </div>
        <div className="absolute bottom-5 right-5 text-right z-10 text-bg">
          <div
            className="text-5xl leading-none"
            style={{ fontFamily: '"Cormorant Garamond", serif', fontWeight: 300 }}
          >
            {daysToGo}
          </div>
          <div
            className="text-xs uppercase opacity-85 mt-1"
            style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '0.35em' }}
          >
            days to go
          </div>
        </div>
      </div>

      {/* 情報 */}
      <div>
        <div
          className="text-xs text-accent uppercase mb-2.5"
          style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '0.4em' }}
        >
          Issue 01
        </div>
        <h2
          className="text-4xl text-text mb-2 leading-none"
          style={{ fontFamily: '"Cormorant Garamond", serif', fontWeight: 300 }}
        >
          {trip.destination}
        </h2>
        <div
          className="text-sm text-text mb-3.5"
          style={{ fontFamily: '"Noto Serif JP", serif', letterSpacing: '0.06em' }}
        >
          {trip.title}
        </div>
        <div
          className="text-sm text-text-sub mb-1"
          style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', letterSpacing: '0.1em' }}
        >
          {startDate}
        </div>
        <div className="flex items-center gap-3.5 mt-3.5 text-xs uppercase text-text-sub" style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '0.25em' }}>
          <span>{duration} days</span>
          <span className="w-0.5 h-0.5 bg-line-strong rounded-full" />
          <span>{trip.destination}</span>
        </div>

        <button
          className="block w-full mt-5 py-3.5 border border-accent text-xs uppercase text-text hover:bg-accent hover:text-bg transition-colors"
          style={{ fontFamily: '"Cormorant Garamond", serif', letterSpacing: '0.45em' }}
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
        >
          — Open —
        </button>
      </div>
    </div>
  );
}

// ───── 過去の旅行カード ─────
function PastTripCard({
  trip,
  index,
  onClick,
}: {
  trip: Trip;
  index: number;
  onClick: () => void;
}) {
  return (
    <div
      className="grid grid-cols-[96px_1fr] gap-4 py-4 border-b border-line cursor-pointer items-center"
      onClick={onClick}
    >
      <div
        className="w-24 h-18 relative overflow-hidden"
        style={{
          height: '72px',
          background: 'linear-gradient(135deg, #c5a880 0%, #8b7355 70%, #3e3324 100%)',
        }}
      />
      <div>
        <div
          className="text-xs text-secondary mb-1"
          style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', letterSpacing: '0.2em' }}
        >
          Issue {String(index).padStart(2, '0')} · archived
        </div>
        <div
          className="text-lg text-text mb-0.5"
          style={{ fontFamily: '"Cormorant Garamond", serif' }}
        >
          {trip.destination}
        </div>
        <div
          className="text-xs text-text mb-1.5"
          style={{ fontFamily: '"Noto Serif JP", serif', letterSpacing: '0.05em' }}
        >
          {trip.title}
        </div>
        <div
          className="text-xs text-text-sub"
          style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', letterSpacing: '0.08em' }}
        >
          {formatMonthYear(trip.startDate)}
        </div>
      </div>
    </div>
  );
}

// ───── 設定メニュー ─────
// ───── ユーティリティ ─────
function formatDateRange(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${s.getDate()} ${monthNames[s.getMonth()]} — ${e.getDate()} ${monthNames[e.getMonth()]}, ${e.getFullYear()}`;
}

function formatMonthYear(date: string): string {
  const d = new Date(date);
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
}

function computeDays(start: string, end: string): number {
  const s = new Date(start);
  const e = new Date(end);
  return Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
}