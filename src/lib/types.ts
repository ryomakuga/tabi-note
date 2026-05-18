// ============================================
// Tabi Note - 型定義
// 要件定義書 V1.5 / 5.2 のエンティティに対応
// V1.5: Traveler / FlightSeat を削除(機微情報を保持しない方針)
// ============================================

export interface Trip {
  id: string;
  title: string;
  destination: string;
  origin: string;
  localLanguage: string;
  timezone?: string;                 // 例: 'Asia/Ho_Chi_Minh'
  startDate: string;
  endDate: string;
  coverImage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Flight {
  id: string;
  tripId: string;
  flightNo: string;
  departureTime: string;
  arrivalTime: string;
  departureAirport: string;
  arrivalAirport: string;
  departureTerminal?: string;
  arrivalTerminal?: string;
  bookingNo: string;
  eTicketNo?: string;
  memo?: string;
  airline: string;                   // 例: ベトナム航空
  direction: 'outbound' | 'return';
  createdAt: string;
  updatedAt: string;
}

export interface Hotel {
  id: string;
  tripId: string;
  name: string;
  address: string;
  addressLocal: string;
  checkIn: string;
  checkOut: string;
  mapUrl?: string;
  urls?: string[];
  phone?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Spot {
  id: string;
  tripId: string;
  name: string;
  nameLocal: string;
  status: 'draft' | 'confirmed';
  lat?: number;
  lng?: number;
  memo?: string;
  urls?: string[];
  photo?: string;
  scheduledAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Meal {
  id: string;
  tripId: string;
  name: string;
  nameLocal: string;
  genre: string;
  status: 'draft' | 'confirmed';
  scheduledAt?: string;
  memo?: string;
  mapUrl?: string;
  lat?: number;
  lng?: number;
  urls?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Photo {
  id: string;
  tripId: string;
  filename: string;
  blob: Blob;
  takenAt: string;
  isFavorite: boolean;
  createdAt: string;
}

export interface Session {
  deviceId: string;
  unlockedAt: string;
  expiresAt: string;
}