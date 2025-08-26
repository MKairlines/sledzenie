// app/dashboard/page.tsx
'use client';

import React, { useState, useEffect } from 'react';

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
  const POLLING_INTERVAL_MS = 3000; // Poll every 3 seconds

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
    fetchLocations(); // Initial fetch

    const intervalId = setInterval(fetchLocations, POLLING_INTERVAL_MS);

    return () => clearInterval(intervalId); // Cleanup interval on component unmount
  }, []);

  if (loading) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-100">
        <p className="text-xl text-blue-500">Ładowanie...</p>
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
      <div className="bg-white p-8 rounded-lg shadow-xl max-w-3xl w-full mt-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Śledzone lokalizacje</h2>

        {activeLocations.length === 0 ? (
          <p className="text-gray-600 text-center text-lg">Brak aktywnych lokalizacji do wyświetlenia.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded-lg shadow-md">
              <thead className="bg-gray-200">
                <tr>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700 rounded-tl-lg">ID Użytkownika</th>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Szerokość Geograficzna</th>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Długość Geograficzna</th>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700 rounded-tr-lg">Ostatnia Aktualizacja</th>
                </tr>
              </thead>
              <tbody>
                {activeLocations.map((loc) => (
                  <tr key={loc.userId} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-800 break-all">{loc.userId}</td>
                    <td className="py-3 px-4 text-sm text-gray-800">{loc.latitude.toFixed(6)}</td>
                    <td className="py-3 px-4 text-sm text-gray-800">{loc.longitude.toFixed(6)}</td>
                    <td className="py-3 px-4 text-sm text-gray-800">{new Date(loc.timestamp).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}

