// app/page.tsx
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';

export default function Home() {
  const [statusText, setStatusText] = useState('Nieaktywne');
  const [isTracking, setIsTracking] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userIdInitError, setUserIdInitError] = useState<string | null>(null); // Init error if order number missing

  const watchId = useRef<number | null>(null);

  // The API endpoint is now /api/track-location
  const apiUrl = '/api/track-location';

  // Retrieve shipment number (orderNumber) from localStorage
  useEffect(() => {
    try {
      const storedOrderNumber = localStorage.getItem('orderNumber');
      if (!storedOrderNumber) {
        const msg = 'Brak numeru przesyłki. Zacznij jeszcze raz.';
        setUserIdInitError(msg);
        showMessage(msg);
        return;
      }
      setUserId(storedOrderNumber);
    } catch (error: unknown) {
      console.error("Error reading orderNumber:", error);
      let errorMessage = 'Nie można odczytać numeru przesyłki.';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      setUserIdInitError(`Błąd inicjalizacji numeru przesyłki: ${errorMessage}. Śledzenie niemożliwe.`);
      showMessage(`Krytyczny błąd: ${errorMessage}. Śledzenie niemożliwe.`);
    }
  }, []);

  const showMessage = (message: string) => {
    alert(message); // Using alert for simplicity, but a custom modal is recommended
  };

  // useCallback to memoize this function, preventing unnecessary re-renders
  const sendLocationToServer = useCallback(async (currentUserId: string, latitude: number, longitude: number, trackingStatus: boolean) => {
    if (!currentUserId) { // Ensure userId is definitely present
      console.error("User ID is not available in sendLocationToServer.");
      showMessage("Błąd wewnętrzny: ID użytkownika jest niedostępne.");
      return false;
    }

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: currentUserId, latitude, longitude, isTracking: trackingStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Backend error:', errorData.message);
        showMessage(`Błąd wysyłania lokalizacji: ${errorData.message}`);
        return false;
      }

      const result = await response.json();
      console.log('Backend response:', result.message);
      return true;
    } catch (error: unknown) {
      console.error('Network error or problem with fetch operation:', error);
      let errorMessage = 'Nieznany błąd sieci.';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      showMessage(`Błąd sieci: Nie można połączyć się z serwerem. ${errorMessage}`);
      return false;
    }
  }, []); // Empty dependency array as it depends only on constants like apiUrl and showMessage (which is an alert)


  const startTracking = () => {
    if (userIdInitError) {
      showMessage(userIdInitError);
      return;
    }
    if (typeof userId !== 'string' || !userId) { // Ensure order number is present
      showMessage("Numer przesyłki jest niedostępny. Proszę się zalogować.");
      return;
    }

    if (navigator.geolocation) {
      watchId.current = navigator.geolocation.watchPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          setStatusText(`Twoja lokalizacja: ${latitude}, ${longitude}`);
          await sendLocationToServer(userId, latitude, longitude, true); // Pass userId explicitly
        },
        (err) => {
          console.error("Błąd pobierania lokalizacji:", err);
          setStatusText("Nie udało się pobrać lokalizacji.");
          showMessage("Nie udało się pobrać lokalizacji. Upewnij się, że masz włączoną geolokalizację.");
          stopTracking();
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
      setIsTracking(true);
      // Send initial status update with dummy coords, actual coords will follow
      sendLocationToServer(userId, 0, 0, true); // Using orderNumber as identifier
    } else {
      showMessage("Twoja przeglądarka nie wspiera geolokalizacji!");
    }
  };

  const stopTracking = async () => {
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
    setIsTracking(false);
    setStatusText("Nieaktywne");
    if (userId) {
      // Send a final update to indicate tracking stopped
      await sendLocationToServer(userId, 0, 0, false); // Pass userId explicitly
    }
  };

  useEffect(() => {
    // Cleanup: When component unmounts, try to send a stop signal
    return () => {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
      }
      if (userId) {
        // Best effort to mark as not tracking when component unmounts
        sendLocationToServer(userId, 0, 0, false).catch(console.error); // Using orderNumber as identifier
      }
    };
  }, [userId, sendLocationToServer]); // Added sendLocationToServer to dependencies to ensure correct closure

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Śledzenie</h2>
        {!userId && !userIdInitError && <p className="text-center text-blue-500 mb-4">Wczytywanie numeru przesyłki...</p>}
        {userIdInitError && <p className="text-center text-red-500 mb-4">{userIdInitError}</p>}
        {userId && (
            <p className="text-sm text-gray-600 text-center mb-4 break-all">
                Numer przesyłki: <span className="font-mono bg-gray-100 p-1 rounded">{userId}</span>
            </p>
        )}
        <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4 mb-6">
          <button
            onClick={startTracking}
            disabled={isTracking || !userId || !!userIdInitError}
            className={`font-semibold py-3 px-6 rounded-lg shadow transition-colors duration-200
                        ${isTracking || !userId || !!userIdInitError ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
          >
            Start śledzenia
          </button>
          <button
            onClick={stopTracking}
            disabled={!isTracking || !userId || !!userIdInitError}
            className={`font-semibold py-3 px-6 rounded-lg shadow transition-colors duration-200
                        ${!isTracking || !userId || !!userIdInitError ? 'bg-red-300 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 text-white'}`}
          >
            Zakończ śledzenie
          </button>
        </div>
        <div id="status" className="bg-gray-100 p-4 rounded-lg text-gray-700 font-bold text-lg text-center">
          {statusText}
        </div>
      </div>
    </main>
  );
}
