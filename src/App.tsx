import { useEffect } from 'react';
import { useAuthStore } from './lib/auth-store';
import { useUIStore } from './lib/ui-store';
import { LockScreen } from './components/LockScreen';
import { TripsHome } from './components/TripsHome';
import { TripDetail } from './components/TripDetail';

function App() {
  const isLocked = useAuthStore((s) => s.isLocked);
  const init = useAuthStore((s) => s.init);
  const selectedTripId = useUIStore((s) => s.selectedTripId);

  // アプリ起動時にセッション状態を初期化
  useEffect(() => {
    init();
  }, [init]);

  // ロック中はロック画面、解錠後はメイン画面
  if (isLocked) {
    return <LockScreen />;
  }

  // selectedTripId があれば詳細画面、なければ一覧画面
  if (selectedTripId) {
    return <TripDetail />;
  }

  return <TripsHome />;
}

export default App;