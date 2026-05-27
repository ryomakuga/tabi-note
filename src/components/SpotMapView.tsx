// ============================================
// Tabi Note - スポット地図表示
// 要件 F-05 / 観光スポット管理 - 地図ビュー
// Leaflet + OpenStreetMap で全スポットをピン表示
// ============================================

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { Spot, Hotel, Meal } from '../lib/types';

// Leaflet のデフォルトアイコンを修正(Vite だとパスが壊れる問題への対処)
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// 確定スポット用のカスタムアイコン(オリーブグリーン)
const confirmedIcon = L.divIcon({
  className: 'tabi-pin-confirmed',
  html: '<div style="width:14px;height:14px;background:#5C7548;border-radius:50%;border:2px solid #ECE5D8;box-shadow:0 2px 6px rgba(58,47,31,0.4);"></div>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

// 候補スポット用のカスタムアイコン(サンドブラウン)
const draftIcon = L.divIcon({
  className: 'tabi-pin-draft',
  html: '<div style="width:14px;height:14px;background:#8B7355;border-radius:50%;border:2px solid #ECE5D8;box-shadow:0 2px 6px rgba(58,47,31,0.4);"></div>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

// ホテル用のカスタムアイコン(ダークゴールド、ひし形)
const hotelIcon = L.divIcon({
  className: 'tabi-pin-hotel',
  html: '<div style="width:12px;height:12px;background:#C49B5C;border:2px solid #ECE5D8;box-shadow:0 2px 6px rgba(58,47,31,0.4);transform:rotate(45deg);"></div>',
  iconSize: [12, 12],
  iconAnchor: [6, 6],
});

// 食事用のカスタムアイコン(テラコッタ橙、四角・食器イメージ)
const mealIcon = L.divIcon({
  className: 'tabi-pin-meal',
  html: '<div style="width:12px;height:12px;background:#C97C5D;border:2px solid #ECE5D8;box-shadow:0 2px 6px rgba(58,47,31,0.4);"></div>',
  iconSize: [12, 12],
  iconAnchor: [6, 6],
});

interface Props {
  spots: Spot[];
  hotels: Hotel[];
  onSpotClick?: (spot: Spot) => void;
  meals?: Meal[];
  onMealClick?: (meal: Meal) => void;
}

// ホテルの mapUrl から座標を抽出するヘルパー
function extractHotelCoords(h: Hotel): { lat: number; lng: number } | null {
  if (h.lat != null && h.lng != null) return { lat: h.lat, lng: h.lng };
  if (!h.mapUrl) return null;
  const m = h.mapUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) };
  return null;
}

// 全てのピンが画面に収まるよう自動フィット
function FitBoundsToMarkers({
  spots,
  hotelsWithCoords,
  meals,
}: {
  spots: Spot[];
  hotelsWithCoords: { lat: number; lng: number }[];
  meals: Meal[];
}) {
  const map = useMap();

  useEffect(() => {
    const points: [number, number][] = [];
    spots.forEach((s) => {
      if (s.lat != null && s.lng != null) points.push([s.lat, s.lng]);
    });
    hotelsWithCoords.forEach((h) => {
      points.push([h.lat, h.lng]);
    });
    meals.forEach((m) => {
      if (m.lat != null && m.lng != null) points.push([m.lat, m.lng]);
    });

    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], 14);
      return;
    }
    const bounds = L.latLngBounds(points);
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [spots, hotelsWithCoords, meals, map]);

  return null;
}

export function SpotMapView({ spots, hotels, meals = [], onSpotClick: _onSpotClick, onMealClick }: Props) {
  // 座標を持つスポット・ホテル・食事だけ抽出
  const spotsWithCoords = spots.filter((s) => s.lat != null && s.lng != null);
  const mealsWithCoords = meals.filter((m) => m.lat != null && m.lng != null);
  const hotelsWithCoords = hotels
    .map((h) => {
      const coords = extractHotelCoords(h);
      return coords ? { ...h, _lat: coords.lat, _lng: coords.lng } : null;
    })
    .filter((h): h is Hotel & { _lat: number; _lng: number } => h !== null);

  const hasAnyPin = spotsWithCoords.length > 0 || hotelsWithCoords.length > 0 || mealsWithCoords.length > 0;

  if (!hasAnyPin) {
    return (
      <div className="border border-line bg-bg-alt/40 p-12 text-center">
        <p className="font-serif italic text-[12px] tracking-[0.2em] text-gold mb-3">— no pins yet</p>
        <p className="font-serif-ja text-[13px] text-text mb-2">まだピンがありません</p>
        <p className="font-serif italic text-[11px] text-text-sub leading-relaxed">
          スポットに位置情報を追加すると、<br />ここに地図が表示されます。
        </p>
      </div>
    );
  }

  // デフォルトの中心(ダナン市街地)
  const defaultCenter: [number, number] = [16.0544, 108.2022];

  const hotelsForBounds = hotelsWithCoords.map((h) => ({ lat: h._lat, lng: h._lng }));

  return (
    <div className="border border-line" style={{ height: 400, width: '100%' }}>
      <MapContainer
        center={defaultCenter}
        zoom={12}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <FitBoundsToMarkers spots={spotsWithCoords} hotelsWithCoords={hotelsForBounds} meals={mealsWithCoords} />

        {hotelsWithCoords.map((h) => (
          <Marker key={'h-' + h.id} position={[h._lat, h._lng]} icon={hotelIcon}>
            <Popup>
              <div style={{ fontFamily: 'serif', minWidth: 160 }}>
                <p style={{ fontSize: 9, letterSpacing: '0.3em', color: '#C49B5C', textTransform: 'uppercase', margin: 0, marginBottom: 4 }}>— stay</p>
                <p style={{ fontSize: 13, color: '#3A2F1F', margin: 0, lineHeight: 1.4, marginBottom: 8 }}>{h.name}</p>
                <div style={{ borderTop: '0.5px solid rgba(58,47,31,0.15)', paddingTop: 8, marginTop: 4 }}>
                  
                    <a
                    className="google-maps-popup-link"
                    href={'https://www.google.com/maps/search/?api=1&query=' + h._lat + ',' + h._lng}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: 'block', textAlign: 'center', fontSize: 10, letterSpacing: '0.25em', color: '#C49B5C', textTransform: 'uppercase', padding: '4px 0', textDecoration: 'none', fontFamily: 'serif' }}
                  >
                    Google マップで開く →
                  </a>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {spotsWithCoords.map((s) => (
          <Marker
            key={'s-' + s.id}
            position={[s.lat as number, s.lng as number]}
            icon={s.status === 'confirmed' ? confirmedIcon : draftIcon}
          >
            <Popup>
              <div style={{ fontFamily: 'serif', minWidth: 160 }}>
                <p style={{ fontSize: 9, letterSpacing: '0.3em', textTransform: 'uppercase', margin: 0, marginBottom: 4, color: s.status === 'confirmed' ? '#5C7548' : '#8B7355' }}>
                  — {s.status === 'confirmed' ? 'confirmed' : 'draft'}
                </p>
                <p style={{ fontSize: 13, color: '#3A2F1F', margin: 0, lineHeight: 1.4, marginBottom: 2 }}>{s.name}</p>
                {s.nameLocal && (
                  <p style={{ fontSize: 11, fontStyle: 'italic', color: '#8B7355', margin: 0, marginBottom: 8 }}>{s.nameLocal}</p>
                )}
                <div style={{ borderTop: '0.5px solid rgba(58,47,31,0.15)', paddingTop: 8, marginTop: 4 }}>
                  
                    <a
                    className="google-maps-popup-link"
                    href={'https://www.google.com/maps/search/?api=1&query=' + (s.lat as number) + ',' + (s.lng as number)}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: 'block', textAlign: 'center', fontSize: 10, letterSpacing: '0.25em', color: '#8B7355', textTransform: 'uppercase', padding: '4px 0', textDecoration: 'none', fontFamily: 'serif' }}
                  >
                    Google マップで開く →
                  </a>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {mealsWithCoords.map((m) => (
          <Marker
            key={'m-' + m.id}
            position={[m.lat as number, m.lng as number]}
            icon={mealIcon}
            eventHandlers={onMealClick ? { click: () => onMealClick(m) } : undefined}
          >
            <Popup>
              <div style={{ fontFamily: 'serif', minWidth: 140 }}>
                <p style={{ fontSize: 9, letterSpacing: '0.3em', textTransform: 'uppercase', margin: 0, marginBottom: 4, color: '#C97C5D' }}>
                  — meal · {m.status === 'confirmed' ? 'confirmed' : 'draft'}
                </p>
                <p style={{ fontSize: 13, color: '#3A2F1F', margin: 0, lineHeight: 1.4, marginBottom: 2 }}>{m.name}</p>
                {m.nameLocal && (
                  <p style={{ fontSize: 11, fontStyle: 'italic', color: '#8B7355', margin: 0, marginBottom: 2 }}>{m.nameLocal}</p>
                )}
                {m.genre && (
                  <p style={{ fontSize: 10, color: '#A8A293', margin: 0, marginBottom: 6 }}>{m.genre}</p>
                )}
                
                  <a
                  className="google-maps-popup-link"
                  href={'https://www.google.com/maps/search/?api=1&query=' + m.lat + ',' + m.lng}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'block', textAlign: 'center', fontSize: 10, letterSpacing: '0.25em', color: '#C97C5D', textTransform: 'uppercase', padding: '4px 0', textDecoration: 'none', fontFamily: 'serif', borderTop: '1px solid rgba(58,47,31,0.15)', marginTop: 6 }}
                >
                  Google マップで開く →
                </a>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
