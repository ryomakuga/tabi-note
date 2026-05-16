import { useEffect, useState } from 'react';
import { useTripsStore } from '../lib/trips-store';
import { useUIStore } from '../lib/ui-store';
import { useFlightsStore } from '../lib/flights-store';
import { FlightFormModal } from './FlightFormModal';
import { HotelFormModal } from './HotelFormModal';
import { SpotFormModal } from './SpotFormModal';
import { MealFormModal } from './MealFormModal';
import { useSpotsStore } from '../lib/spots-store';
import { useMealsStore } from '../lib/meals-store';
import { useHotelsStore } from '../lib/hotels-store';
import { TripFormModal } from './TripFormModal';
import { ExternalLink } from './ExternalLink';
import { getTimezoneOffsetText } from '../lib/timezones';
import type { Flight, Hotel, Spot, Meal } from '../lib/types';

export function TripDetail() {
  const selectedTripId = useUIStore((s) => s.selectedTripId);
  const closeTrip = useUIStore((s) => s.closeTrip);
  const trips = useTripsStore((s) => s.trips);
  const trip = trips.find((t) => t.id === selectedTripId);
  const loadFlights = useFlightsStore((s) => s.loadFlights);
  const flights = useFlightsStore((s) => s.flights);
  const [isFlightModalOpen, setIsFlightModalOpen] = useState(false);
  const [editingFlight, setEditingFlight] = useState<Flight | undefined>(undefined);
  const [isHotelModalOpen, setIsHotelModalOpen] = useState(false);
  const [editingHotel, setEditingHotel] = useState<Hotel | undefined>(undefined);
  const [isSpotModalOpen, setIsSpotModalOpen] = useState(false);
  const [editingSpot, setEditingSpot] = useState<Spot | undefined>(undefined);
  const [spotFilter, setSpotFilter] = useState<'all' | 'draft' | 'confirmed'>('all');
  const [isMealModalOpen, setIsMealModalOpen] = useState(false);
  const [editingMeal, setEditingMeal] = useState<Meal | undefined>(undefined);
  const [mealFilter, setMealFilter] = useState<'all' | 'draft' | 'confirmed'>('all');
  const [isTripEditOpen, setIsTripEditOpen] = useState(false);

  useEffect(() => {
    if (selectedTripId) loadFlights(selectedTripId);
  }, [selectedTripId, loadFlights]);

  const loadHotels = useHotelsStore((s) => s.loadHotels);
  useEffect(() => {
    if (selectedTripId) loadHotels(selectedTripId);
  }, [selectedTripId, loadHotels]);

  const loadSpots = useSpotsStore((s) => s.loadSpots);
  useEffect(() => {
    if (selectedTripId) loadSpots(selectedTripId);
  }, [selectedTripId, loadSpots]);

  const loadMeals = useMealsStore((s) => s.loadMeals);
  useEffect(() => {
    if (selectedTripId) loadMeals(selectedTripId);
  }, [selectedTripId, loadMeals]);

  if (!trip) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-8">
        <div className="text-center">
          <p className="font-serif-ja text-text-sub mb-4">旅行が見つかりません</p>
          <button onClick={closeTrip} className="text-[11px] tracking-[0.3em] uppercase text-accent border-b border-accent pb-1">— Back —</button>
        </div>
      </div>
    );
  }

  const outboundFlights = flights.filter((f) => f.tripId === trip.id && f.direction === 'outbound');
  const returnFlights = flights.filter((f) => f.tripId === trip.id && f.direction === 'return');

  return (
    <div className="min-h-screen bg-bg pb-24">
      <div className="max-w-md mx-auto px-7 pt-14">
        <div className="flex items-center justify-between mb-8">
          <button onClick={closeTrip} className="font-serif italic text-text-sub text-sm tracking-[0.15em] hover:text-text transition-colors">← back to trips</button>
          <button onClick={() => setIsTripEditOpen(true)} className="font-serif italic text-text-sub text-sm tracking-[0.15em] hover:text-text transition-colors">edit ✎</button>
        </div>

        <div className="text-center pb-6 border-b border-line mb-9">
          <p className="font-serif text-[11px] tracking-[0.45em] uppercase text-accent mb-1.5">Tabi Note</p>
          <p className="font-sans text-[9px] tracking-[0.35em] uppercase text-text-sub">Issue 01 · {trip.destination}</p>
        </div>

        <div className="mb-10">
          <p className="font-serif italic text-[13px] tracking-[0.2em] text-gold mb-3.5">— your journey</p>
          <h1 className="font-serif font-light text-5xl text-text leading-none tracking-tight mb-3.5">{trip.destination}</h1>
          <p className="font-serif-ja text-base text-text mb-1.5 tracking-[0.08em]">{trip.title}</p>
          <p className="font-serif italic text-[13px] text-text-sub tracking-[0.05em]">{formatDateRange(trip.startDate, trip.endDate)}</p>
        </div>

        {trip.timezone && (
          <div className="text-center my-6">
            <p className="inline-block font-serif-ja text-[11px] text-text-sub tracking-[0.08em] border-t border-b border-line py-2 px-5">{getTimezoneOffsetText(trip.timezone)}</p>
          </div>
        )}

        <div className="text-center my-4">
          <p className="font-serif text-secondary text-sm tracking-[0.5em]">· · ·</p>
        </div>

        <section className="mt-12">
          <div className="mb-7">
            <p className="font-serif italic text-[12px] tracking-[0.2em] text-gold mb-2">— chapter one</p>
            <h2 className="font-serif font-light text-3xl text-text leading-none tracking-tight mb-2">Flights</h2>
            <p className="font-serif-ja text-[13px] text-text-sub tracking-[0.05em]">空の旅</p>
          </div>
          <FlightGroup label="Outbound" labelJa="往路" flights={outboundFlights} onEdit={(f) => { setEditingFlight(f); setIsFlightModalOpen(true); }} />
          <FlightGroup label="Return" labelJa="復路" flights={returnFlights} onEdit={(f) => { setEditingFlight(f); setIsFlightModalOpen(true); }} />
          <button onClick={() => { setEditingFlight(undefined); setIsFlightModalOpen(true); }} className="w-full mt-6 py-3 border border-dashed border-text-sub/30 hover:border-accent text-[10px] tracking-[0.35em] uppercase text-text-sub hover:text-text transition-colors">+ Add Flight</button>
        </section>
        <section className="mt-10">
          <div className="mb-7">
            <p className="font-serif italic text-[12px] tracking-[0.2em] text-gold mb-2">— chapter two</p>
            <h2 className="font-serif font-light text-3xl text-text leading-none tracking-tight mb-2">Stay</h2>
            <p className="font-serif-ja text-[13px] text-text-sub tracking-[0.05em]">宿</p>
          </div>
          <HotelList tripId={trip.id} onEdit={(h) => { setEditingHotel(h); setIsHotelModalOpen(true); }} />
          <button onClick={() => { setEditingHotel(undefined); setIsHotelModalOpen(true); }} className="w-full mt-6 py-3 border border-dashed border-text-sub/30 hover:border-accent text-[10px] tracking-[0.35em] uppercase text-text-sub hover:text-text transition-colors">+ Add Hotel</button>
        </section>
        <section className="mt-10">
          <div className="mb-7">
            <p className="font-serif italic text-[12px] tracking-[0.2em] text-gold mb-2">— chapter three</p>
            <h2 className="font-serif font-light text-3xl text-text leading-none tracking-tight mb-2">Places</h2>
            <p className="font-serif-ja text-[13px] text-text-sub tracking-[0.05em]">場所</p>
          </div>
          <SpotFilterTabs tripId={trip.id} filter={spotFilter} onFilterChange={setSpotFilter} />
          <SpotList tripId={trip.id} filter={spotFilter} onEdit={(s) => { setEditingSpot(s); setIsSpotModalOpen(true); }} />
          <button onClick={() => { setEditingSpot(undefined); setIsSpotModalOpen(true); }} className="w-full mt-6 py-3 border border-dashed border-text-sub/30 hover:border-accent text-[10px] tracking-[0.35em] uppercase text-text-sub hover:text-text transition-colors">+ Add Place</button>
        </section>
        <section className="mt-10">
          <div className="mb-7">
            <p className="font-serif italic text-[12px] tracking-[0.2em] text-gold mb-2">— chapter four</p>
            <h2 className="font-serif font-light text-3xl text-text leading-none tracking-tight mb-2">Meals</h2>
            <p className="font-serif-ja text-[13px] text-text-sub tracking-[0.05em]">食事</p>
          </div>
          <MealFilterTabs tripId={trip.id} filter={mealFilter} onFilterChange={setMealFilter} />
          <MealList tripId={trip.id} filter={mealFilter} onEdit={(m) => { setEditingMeal(m); setIsMealModalOpen(true); }} />
          <button onClick={() => { setEditingMeal(undefined); setIsMealModalOpen(true); }} className="w-full mt-6 py-3 border border-dashed border-text-sub/30 hover:border-accent text-[10px] tracking-[0.35em] uppercase text-text-sub hover:text-text transition-colors">+ Add Meal</button>
        </section>


      </div>

      {isFlightModalOpen && (
        <FlightFormModal tripId={trip.id} flight={editingFlight} onClose={() => { setIsFlightModalOpen(false); setEditingFlight(undefined); }} />
      )}
      {isTripEditOpen && (
        <TripFormModal trip={trip} onClose={() => setIsTripEditOpen(false)} />
      )}
      {isHotelModalOpen && (
        <HotelFormModal tripId={trip.id} hotel={editingHotel} onClose={() => { setIsHotelModalOpen(false); setEditingHotel(undefined); }} />
      )}
      {isSpotModalOpen && (
        <SpotFormModal tripId={trip.id} spot={editingSpot} onClose={() => { setIsSpotModalOpen(false); setEditingSpot(undefined); }} />
      )}
      {isMealModalOpen && (
        <MealFormModal tripId={trip.id} meal={editingMeal} onClose={() => { setIsMealModalOpen(false); setEditingMeal(undefined); }} />
      )}
    </div>
  );
}

function FlightGroup({ label, labelJa, flights, onEdit }: { label: string; labelJa: string; flights: Flight[]; onEdit: (f: Flight) => void; }) {
  if (flights.length === 0) {
    return (
      <div className="mb-5">
        <p className="font-sans text-[9px] tracking-[0.35em] uppercase text-text-sub mb-2">— {label} · {labelJa}</p>
        <div className="py-6 px-4 bg-bg-alt/60 text-center"><p className="font-serif italic text-[12px] text-text-sub/70">まだフライトがありません</p></div>
      </div>
    );
  }
  return (
    <div className="mb-5">
      <p className="font-sans text-[9px] tracking-[0.35em] uppercase text-text-sub mb-2">— {label} · {labelJa}</p>
      {flights.map((flight) => (<FlightCard key={flight.id} flight={flight} onEdit={onEdit} />))}
    </div>
  );
}

function FlightCard({ flight, onEdit }: { flight: Flight; onEdit: (f: Flight) => void }) {
  return (
    <button onClick={() => onEdit(flight)} className="w-full text-left bg-bg-alt/60 hover:bg-bg-alt p-5 mb-2 border-l-2 border-gold transition-colors">
      <div className="flex items-baseline justify-between mb-3">
        <p className="font-serif text-xl text-text tracking-wide">{flight.flightNo}</p>
        <p className="font-serif-ja text-[11px] text-text-sub">{flight.airline}</p>
      </div>
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="font-serif text-base text-text">{formatTime(flight.departureTime)}</p>
          <p className="font-serif-ja text-[11px] text-text-sub mt-0.5">{flight.departureAirport}</p>
        </div>
        <p className="font-serif italic text-text-sub/50 text-xs mx-3">→</p>
        <div className="text-right">
          <p className="font-serif text-base text-text">{formatTime(flight.arrivalTime)}</p>
          <p className="font-serif-ja text-[11px] text-text-sub mt-0.5">{flight.arrivalAirport}</p>
        </div>
      </div>
      <p className="font-serif italic text-[11px] text-text-sub/80 mb-2">{formatFullDate(flight.departureTime)}</p>
      {flight.departureTerminal && (<p className="font-serif-ja text-[11px] text-text-sub leading-relaxed">{flight.departureTerminal}</p>)}
      <div className="mt-3 pt-3 border-t border-text-sub/15 flex justify-between">
        <p className="font-sans text-[9px] tracking-[0.25em] uppercase text-text-sub/70">Booking</p>
        <p className="font-serif text-[11px] text-text">{flight.bookingNo}</p>
      </div>
    </button>
  );
}

function formatDateRange(start: string, end: string): string {
  const s = new Date(start), e = new Date(end);
  const m = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const sM = m[s.getMonth()], eM = m[e.getMonth()];
  if (sM === eM) return `${s.getDate()} — ${e.getDate()} ${eM}, ${e.getFullYear()}`;
  return `${s.getDate()} ${sM} — ${e.getDate()} ${eM}, ${e.getFullYear()}`;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatFullDate(iso: string): string {
  const d = new Date(iso);
  const m = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const w = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  return `${d.getDate()} ${m[d.getMonth()]} · ${w[d.getDay()]}`;
}

function HotelList({ tripId, onEdit }: { tripId: string; onEdit: (h: Hotel) => void }) {
  const hotels = useHotelsStore((s) => s.hotels).filter((h) => h.tripId === tripId);
  if (hotels.length === 0) {
    return (
      <div className="py-6 px-4 bg-bg-alt/60 text-center">
        <p className="font-serif italic text-[12px] text-text-sub/70">まだホテルがありません</p>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {hotels.map((h) => (<HotelCard key={h.id} hotel={h} onEdit={onEdit} />))}
    </div>
  );
}

function HotelCard({ hotel, onEdit }: { hotel: Hotel; onEdit: (h: Hotel) => void }) {
  return (
    <button onClick={() => onEdit(hotel)} className="w-full text-left bg-bg-alt/60 hover:bg-bg-alt p-5 border-l-2 border-olive transition-colors">
      <p className="font-serif text-lg text-text tracking-wide mb-2">{hotel.name}</p>
      <p className="font-serif-ja text-[12px] text-text leading-relaxed mb-1">{hotel.address}</p>
      {hotel.addressLocal && (<p className="font-serif italic text-[11px] text-text-sub leading-relaxed mb-3">{hotel.addressLocal}</p>)}
      <div className="mt-3 pt-3 border-t border-text-sub/15 flex justify-between items-baseline">
        <div>
          <p className="font-sans text-[8px] tracking-[0.3em] uppercase text-text-sub/70 mb-0.5">Check-in</p>
          <p className="font-serif text-[13px] text-text">{formatStayDate(hotel.checkIn)}</p>
        </div>
        <p className="font-serif italic text-text-sub/50 text-xs">→</p>
        <div className="text-right">
          <p className="font-sans text-[8px] tracking-[0.3em] uppercase text-text-sub/70 mb-0.5">Check-out</p>
          <p className="font-serif text-[13px] text-text">{formatStayDate(hotel.checkOut)}</p>
        </div>
      </div>
      {(hotel.mapUrl || (hotel.urls && hotel.urls.length > 0)) && (
        <div className="mt-4 pt-3 border-t border-text-sub/15 space-y-1.5 overflow-hidden">
          {hotel.mapUrl && (
            <ExternalLink href={hotel.mapUrl} variant="inline">— 地図を開く</ExternalLink>
          )}
          {hotel.urls && hotel.urls.map((url, i) => (
            <ExternalLink key={i} href={url} variant="list" />
          ))}
        </div>
      )}
    </button>
  );
}

function formatStayDate(iso: string): string {
  const d = new Date(iso);
  const m = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getDate()} ${m[d.getMonth()]} · ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function SpotFilterTabs({ tripId, filter, onFilterChange }: { tripId: string; filter: 'all' | 'draft' | 'confirmed'; onFilterChange: (f: 'all' | 'draft' | 'confirmed') => void }) {
  const spots = useSpotsStore((s) => s.spots).filter((s) => s.tripId === tripId);
  const draftCount = spots.filter((s) => s.status === 'draft').length;
  const confirmedCount = spots.filter((s) => s.status === 'confirmed').length;
  const tab = (key: 'all' | 'draft' | 'confirmed', label: string, count: number) => (
    <button
      onClick={() => onFilterChange(key)}
      className={`font-serif-ja text-[12px] tracking-[0.15em] pb-1 transition-colors ${filter === key ? 'text-text border-b border-accent' : 'text-text-sub hover:text-text'}`}
    >
      {label}<span className="ml-1 font-serif italic text-[11px] text-accent normal-case tracking-normal">{count}</span>
    </button>
  );
  return (
    <div className="flex gap-5 mb-5">
      {tab('all', 'すべて', spots.length)}
      {tab('draft', '候補', draftCount)}
      {tab('confirmed', '確定', confirmedCount)}
    </div>
  );
}

function SpotList({ tripId, filter, onEdit }: { tripId: string; filter: 'all' | 'draft' | 'confirmed'; onEdit: (s: Spot) => void }) {
  const allSpots = useSpotsStore((s) => s.spots).filter((s) => s.tripId === tripId);
  const spots = filter === 'all' ? allSpots : allSpots.filter((s) => s.status === filter);
  if (spots.length === 0) {
    return (
      <div className="py-6 px-4 bg-bg-alt/60 text-center">
        <p className="font-serif italic text-[12px] text-text-sub/70">
          {filter === 'all' ? 'まだスポットがありません' : filter === 'draft' ? '候補はまだありません' : '確定はまだありません'}
        </p>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {spots.map((s, idx) => (<SpotCard key={s.id} spot={s} index={idx + 1} onEdit={onEdit} />))}
    </div>
  );
}

function SpotCard({ spot, index, onEdit }: { spot: Spot; index: number; onEdit: (s: Spot) => void }) {
  const isConfirmed = spot.status === 'confirmed';
  return (
    <button onClick={() => onEdit(spot)} className={`w-full text-left bg-bg-alt/60 hover:bg-bg-alt p-5 border-l-2 transition-colors ${isConfirmed ? 'border-olive' : 'border-secondary'}`}>
      <div className="flex items-start gap-4">
        <span className="font-serif italic text-2xl text-secondary leading-none mt-0.5">{String(index).padStart(2, '0')}</span>
        <div className="flex-1 min-w-0">
          <p className={`font-serif-ja text-[10px] tracking-[0.2em] mb-1.5 ${isConfirmed ? 'text-olive' : 'text-secondary'}`}>
            — {isConfirmed ? '確定' : '候補'}
          </p>
          <p className="font-serif-ja text-[15px] text-text tracking-[0.04em] leading-snug mb-1">{spot.name}</p>
          {spot.nameLocal && (<p className="font-serif italic text-[12px] text-secondary leading-snug mb-2">{spot.nameLocal}</p>)}
          {spot.memo && (<p className="font-serif-ja text-[11px] text-text-sub leading-relaxed mt-2 line-clamp-2">{spot.memo}</p>)}
          {spot.urls && spot.urls.length > 0 && (
            <div className="mt-3 space-y-1.5 overflow-hidden">
              {spot.urls.map((url, i) => (
                <ExternalLink key={i} href={url} variant="list" />
              ))}
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

function MealFilterTabs({ tripId, filter, onFilterChange }: { tripId: string; filter: 'all' | 'draft' | 'confirmed'; onFilterChange: (f: 'all' | 'draft' | 'confirmed') => void }) {
  const meals = useMealsStore((s) => s.meals).filter((m) => m.tripId === tripId);
  const counts = {
    all: meals.length,
    draft: meals.filter((m) => m.status === 'draft').length,
    confirmed: meals.filter((m) => m.status === 'confirmed').length,
  };
  const tabs: { key: 'all' | 'draft' | 'confirmed'; label: string }[] = [
    { key: 'all', label: 'すべて' },
    { key: 'draft', label: '候補' },
    { key: 'confirmed', label: '確定' },
  ];
  return (
    <div className="flex items-baseline gap-5 mb-6 pb-3 border-b border-line">
      {tabs.map((t) => (
        <button key={t.key} onClick={() => onFilterChange(t.key)} className={`font-serif-ja text-[12px] tracking-[0.1em] transition-colors ${filter === t.key ? 'text-text border-b border-accent pb-1' : 'text-text-sub hover:text-text'}`}>
          {t.label}
          <span className="font-serif italic text-[11px] text-accent ml-1.5">{counts[t.key]}</span>
        </button>
      ))}
    </div>
  );
}

function MealList({ tripId, filter, onEdit }: { tripId: string; filter: 'all' | 'draft' | 'confirmed'; onEdit: (m: Meal) => void }) {
  const meals = useMealsStore((s) => s.meals).filter((m) => m.tripId === tripId);
  const filtered = filter === 'all' ? meals : meals.filter((m) => m.status === filter);
  if (filtered.length === 0) {
    return (
      <div className="text-center py-10 border border-dashed border-text-sub/20">
        <p className="font-serif-ja text-[12px] text-text-sub italic">まだ食事の予定が登録されていません</p>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {filtered.map((meal, i) => (
        <MealCard key={meal.id} meal={meal} index={i + 1} onEdit={onEdit} />
      ))}
    </div>
  );
}

function MealCard({ meal, index, onEdit }: { meal: Meal; index: number; onEdit: (m: Meal) => void }) {
  const isConfirmed = meal.status === 'confirmed';
  return (
    <button onClick={() => onEdit(meal)} className="w-full text-left bg-bg-alt/60 hover:bg-bg-alt p-5 transition-colors border-l-2 border-secondary">
      <div className="grid grid-cols-[28px_1fr] gap-4">
        <p className="font-serif italic text-[20px] text-secondary leading-none pt-0.5">{String(index).padStart(2, '0')}</p>
        <div className="min-w-0">
          <p className={`font-sans text-[8.5px] tracking-[0.35em] uppercase mb-1.5 ${isConfirmed ? 'text-olive' : 'text-secondary'}`}>
            — {isConfirmed ? '確定' : '候補'}
          </p>
          <p className="font-serif-ja text-[15px] text-text tracking-[0.04em] leading-snug mb-1">{meal.name}</p>
          {meal.nameLocal && (<p className="font-serif italic text-[12px] text-secondary leading-snug mb-2">{meal.nameLocal}</p>)}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {meal.genre && (
              <span className="font-sans text-[8.5px] tracking-[0.3em] uppercase text-accent border border-accent/30 px-2 py-0.5">{meal.genre}</span>
            )}
            {isConfirmed && meal.scheduledAt && (
              <span className="font-serif italic text-[11px] text-text-sub">{formatMealTime(meal.scheduledAt)}</span>
            )}
          </div>
          {meal.memo && (<p className="font-serif-ja text-[11px] text-text-sub leading-relaxed mt-2 line-clamp-2">{meal.memo}</p>)}
          {meal.urls && meal.urls.length > 0 && (
            <div className="mt-3 space-y-1.5 overflow-hidden">
              {meal.urls.map((url, i) => (
                <ExternalLink key={i} href={url} variant="list" />
              ))}
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

function formatMealTime(iso: string): string {
  const d = new Date(iso);
  const m = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getDate()} ${m[d.getMonth()]} · ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

