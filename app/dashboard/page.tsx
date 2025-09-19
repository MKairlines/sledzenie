'use client';

import React, { useEffect, useState } from 'react';
import 'leaflet/dist/leaflet.css';

// ✅ Import only types (safe for Next.js)
import type { MapContainerProps, TileLayerProps, MarkerProps, PopupProps } from 'react-leaflet';

// Interfejs do opisu lokalizacji
interface TrackedLocation {
  userId: string;
  latitude: number;
  longitude: number;
  timestamp: number; // Unix timestamp
  isTracking: boolean;
}

// Typy komponentów mapy (żadnego any!)
type MapComponents = {
  MapContainer: React.ComponentType<MapContainerProps>;
  TileLayer: React.ComponentType<TileLayerProps>;
  Marker: React.ComponentType<MarkerProps>;
  Popup: React.ComponentType<PopupProps>;
} | null;

export default function DashboardPage() {
  const [activeLocations, setActiveLocations] = useState<TrackedLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Stan do dynamicznego ładowania komponentów mapy (tylko klient)
  const [mapComponents, setMapComponents] = useState<MapComponents>(null);

  const apiUrl = '/api/track-location';
  const POLLING_INTERVAL_MS = 3000;

  const fetchLocations = async () => {
    try {
      const response = await fetch(apiUrl);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error((errorData as { message?: string }).message || 'Failed to fetch locations');
      }
      const data: TrackedLocation[] = await response.json();
      setActiveLocations(data);
    } catch (err: unknown) {
      console.error('Error fetching locations:', err);
      let errorMessage = 'Nieznany błąd podczas pobierania lokalizacji.';
      if (err instanceof Error) errorMessage = err.message;
      setError(`Błąd: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadMapComponents = async () => {
      try {
        const leaflet = await import('leaflet');
        const rl = await import('react-leaflet');

        // ✅ Fix ikon Leaflet w Next.js
        if (typeof window !== 'undefined') {
          leaflet.Icon.Default.mergeOptions({
            iconRetinaUrl: '/leaflet/marker-icon-2x.png',
            iconUrl: '/leaflet/marker-icon.png',
            shadowUrl: '/leaflet/marker-shadow.png',
          });
        }

        setMapComponents({
          MapContainer: rl.MapContainer,
          TileLayer: rl.TileLayer,
          Marker: rl.Marker,
          Popup: rl.Popup,
        });
      } catch (err) {
        console.error('Błąd ładowania komponentów mapy:', err);
      }
    };

    loadMapComponents();
    fetchLocations();

    const intervalId = setInterval(fetchLocations, POLLING_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, []);

  if (loading) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen p-4" style={{ backgroundColor: '#0b0b0b' }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 mb-4" style={{ borderColor: '#d1b07c' }}></div>
        <p className="text-xl font-bold tracking-wider uppercase" style={{ color: '#d1b07c' }}>Ładowanie...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen p-4" style={{ backgroundColor: '#0b0b0b' }}>
        <p className="text-xl font-bold tracking-wider uppercase" style={{ color: '#ef4444' }}>{error}</p>
      </main>
    );
  }

  const { MapContainer, TileLayer, Marker, Popup } = mapComponents ?? {};

  return (
    <main className="flex flex-col items-center p-6 min-h-screen" style={{ backgroundColor: '#0b0b0b' }}>
      <div className="w-full max-w-7xl mt-8">
        <h2 className="text-3xl font-bold mb-6 text-center tracking-wider uppercase" style={{ color: '#d1b07c' }}>
          Śledzone lokalizacje
        </h2>

        {activeLocations.length === 0 ? (
          <p className="text-center text-lg font-bold tracking-wider uppercase" style={{ color: '#d1b07c' }}>
            Brak aktywnych lokalizacji do wyświetlenia.
          </p>
        ) : (
          <div className="flex flex-col md:flex-row md:space-x-6 space-y-6 md:space-y-0">
            {/* Sekcja Mapy */}
            <div className="md:w-2/3 w-full h-[600px] rounded-lg overflow-hidden shadow-md">
              {mapComponents && MapContainer && TileLayer && Marker && Popup ? (
                <MapContainer
                  center={
                    activeLocations.length > 0
                      ? [activeLocations[0].latitude, activeLocations[0].longitude]
                      : [52.2297, 21.0122]
                  }
                  zoom={6}
                  scrollWheelZoom={true}
                  className="h-full w-full"
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />

                  {activeLocations.map((loc) => (
                    <Marker key={loc.userId} position={[loc.latitude, loc.longitude]}>
                      <Popup>
                        <div className="font-semibold text-gray-800">Użytkownik:</div>
                        <div className="font-mono text-sm break-all">{loc.userId}</div>
                        <div className="mt-2 text-xs text-gray-600">
                          Ostatnia aktualizacja: <br />{' '}
                          {new Date(loc.timestamp).toLocaleString()}
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              ) : (
                <div className="flex items-center justify-center h-full font-bold tracking-wider uppercase" style={{ color: '#d1b07c' }}>Ładowanie mapy...</div>
              )}
            </div>

            {/* Sekcja Tabeli */}
            <div className="md:w-1/3 w-full overflow-x-auto">
              <table className="min-w-full rounded-lg shadow-md" style={{ backgroundColor: '#0b0b0b' }}>
                <thead style={{ backgroundColor: '#1a1a1a' }}>
                  <tr>
                    <th className="py-3 px-4 text-left text-sm font-bold tracking-wider uppercase rounded-tl-lg" style={{ color: '#d1b07c' }}>
                      ID Użytkownika
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-bold tracking-wider uppercase" style={{ color: '#d1b07c' }}>
                      Szerokość
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-bold tracking-wider uppercase" style={{ color: '#d1b07c' }}>
                      Długość
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {activeLocations.map((loc) => (
                    <tr key={loc.userId} className="border-b" style={{ borderColor: '#8a6b3d' }}>
                      <td className="py-3 px-4 text-sm font-bold break-all" style={{ color: '#e5e5e5' }}>{loc.userId}</td>
                      <td className="py-3 px-4 text-sm" style={{ color: '#d1b07c' }}>{loc.latitude.toFixed(6)}</td>
                      <td className="py-3 px-4 text-sm" style={{ color: '#d1b07c' }}>{loc.longitude.toFixed(6)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
