// app/dashboard/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Dynamiczny import komponentu MapContainer, aby zapobiec błędom podczas renderowania po stronie serwera (SSR)
const DynamicMap = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), {
  ssr: false // Wyłączanie renderowania po stronie serwera dla tego komponentu
});
const DynamicTileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), {
  ssr: false
});
const DynamicMarker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), {
  ssr: false
});
const DynamicPopup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), {
  ssr: false
});

// Domyślne ikony Leaflet są potrzebne do wyświetlania markerów
// To jest workaround dla Next.js, który nie radzi sobie z domyślnymi ikonami w React-Leaflet
if (typeof window !== 'undefined') {
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: '/leaflet/marker-icon-2x.png',
    iconUrl: '/leaflet/marker-icon.png',
    shadowUrl: '/leaflet/marker-shadow.png',
  });
}

interface TrackedLocation {
  userId: string;
  latitude: number;
  longitude: number;
  timestamp: number; // Unix timestamp
  isTracking: boolean;
}

export default function DashboardPage() {
  const [activeLocations, setActiveLocations] = useState<TrackedLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // The API endpoint to fetch all locations is /api/track-location
  const apiUrl = '/api/track-location';
  const POLLING_INTERVAL_MS = 3000; // Poll co 3 sekundy

  const fetchLocations = async () => {
    try {
      const response = await fetch(apiUrl);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch locations');
      }
      const data: TrackedLocation[] = await response.json();
      setActiveLocations(data);
    } catch (err: unknown) {
      console.error('Error fetching locations:', err);
      let errorMessage = 'Nieznany błąd podczas pobierania lokalizacji.';
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      setError(`Błąd: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchLocations(); // Początkowe pobranie danych

    const intervalId = setInterval(fetchLocations, POLLING_INTERVAL_MS);

    return () => clearInterval(intervalId); // Czyszczenie interwału po odmontowaniu komponentu
  }, []);

  // Ustawienie centrum mapy na pierwszą aktywną lokalizację, w przeciwnym razie domyślnie na Warszawę
  const mapCenter: [number, number] = activeLocations.length > 0
    ? [activeLocations[0].latitude, activeLocations[0].longitude]
    : [52.2297, 21.0122];

  if (loading) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-100">
        <p className="text-xl text-blue-500">Ładowanie dashboardu...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-100">
        <p className="text-xl text-red-500">{error}</p>
      </main>
    );
  }

  return (
    <main className="flex flex-col items-center p-6 bg-gray-100 min-h-screen">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-7xl mt-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Dashboard śledzenia lokalizacji</h2>

        {activeLocations.length === 0 ? (
          <p className="text-gray-600 text-center text-lg">Brak aktywnych lokalizacji do wyświetlenia.</p>
        ) : (
          <div className="flex flex-col md:flex-row md:space-x-6 space-y-6 md:space-y-0">
            {/* Sekcja Mapy */}
            <div className="md:w-2/3 w-full h-[600px] rounded-lg overflow-hidden shadow-md">
              <DynamicMap
                center={mapCenter}
                zoom={6}
                scrollWheelZoom={true}
                className="h-full w-full"
              >
                <DynamicTileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {activeLocations.map((loc) => (
                  <DynamicMarker key={loc.userId} position={[loc.latitude, loc.longitude]}>
                    <DynamicPopup>
                      <div className="font-semibold text-gray-800">Użytkownik:</div>
                      <div className="font-mono text-sm break-all">{loc.userId}</div>
                      <div className="mt-2 text-xs text-gray-600">
                        Ostatnia aktualizacja: <br /> {new Date(loc.timestamp).toLocaleString()}
                      </div>
                    </DynamicPopup>
                  </DynamicMarker>
                ))}
              </DynamicMap>
            </div>

            {/* Sekcja Tabeli */}
            <div className="md:w-1/3 w-full overflow-x-auto">
              <table className="min-w-full bg-white rounded-lg shadow-md">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700 rounded-tl-lg">ID Użytkownika</th>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Szerokość</th>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Długość</th>
                  </tr>
                </thead>
                <tbody>
                  {activeLocations.map((loc) => (
                    <tr key={loc.userId} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm text-gray-800 break-all">{loc.userId}</td>
                      <td className="py-3 px-4 text-sm text-gray-800">{loc.latitude.toFixed(6)}</td>
                      <td className="py-3 px-4 text-sm text-gray-800">{loc.longitude.toFixed(6)}</td>
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
