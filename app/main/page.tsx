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
    <main className="flex flex-col items-center justify-center min-h-screen p-4" style={{ backgroundColor: '#0b0b0b' }}>
      <div 
        className="shadow-xl max-w-md w-full"
        style={{
          backgroundColor: '#111111',
          padding: 20,
          borderRadius: 16,
          borderWidth: 2,
          borderColor: '#8a6b3d',
        }}
      >
        <h2 
          className="text-center"
          style={{
            fontSize: 24,
            fontWeight: 800,
            marginBottom: 20,
            color: '#d1b07c',
            letterSpacing: 2,
            textTransform: 'uppercase',
          }}
        >
          Śledzenie
        </h2>
        {!userId && !userIdInitError && <p className="text-center" style={{ color: '#c9c9c9', marginBottom: 10 }}>Wczytywanie numeru przesyłki...</p>}
        {userIdInitError && <p className="text-center" style={{ color: '#ef4444', marginBottom: 10 }}>{userIdInitError}</p>}
        {userId && (
            <p className="text-center break-all" style={{ color: '#e5e5e5', marginBottom: 20 }}>
                Numer przesyłki: <span 
                  className="font-mono"
                  style={{
                    backgroundColor: '#0b0b0b',
                    color: '#f5f5f5',
                    padding: 4,
                    borderRadius: 6,
                    borderWidth: 1,
                    borderColor: '#8a6b3d',
                  }}
                >{userId}</span>
            </p>
        )}
        <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4 mb-6">
          <button
            onClick={startTracking}
            disabled={isTracking || !userId || !!userIdInitError}
            className="flex-1 mx-1 rounded-full border-2"
            style={{
              paddingTop: 14,
              paddingBottom: 14,
              borderRadius: 28,
              backgroundColor: (isTracking || !userId || !!userIdInitError) ? '#2a2a2a' : '#d1b07c',
              borderColor: (isTracking || !userId || !!userIdInitError) ? '#555555' : '#d1b07c',
            }}
          >
            <span 
              className="font-bold text-center uppercase"
              style={{
                fontWeight: 800,
                fontSize: 16,
                letterSpacing: 1.5,
                color: (isTracking || !userId || !!userIdInitError) ? '#9ca3af' : '#0b0b0b',
              }}
            >
              Start śledzenia
            </span>
          </button>
          <button
            onClick={stopTracking}
            disabled={!isTracking || !userId || !!userIdInitError}
            className="flex-1 mx-1 rounded-full border-2"
            style={{
              paddingTop: 14,
              paddingBottom: 14,
              borderRadius: 28,
              borderColor: '#d1b07c',
              backgroundColor: (!isTracking || !userId || !!userIdInitError) ? '#2a2a2a' : 'transparent',
              borderColor: (!isTracking || !userId || !!userIdInitError) ? '#555555' : '#d1b07c',
            }}
          >
            <span 
              className="font-bold text-center uppercase"
              style={{
                fontWeight: 800,
                fontSize: 16,
                letterSpacing: 1.5,
                color: (!isTracking || !userId || !!userIdInitError) ? '#9ca3af' : '#d1b07c',
              }}
            >
              Zakończ śledzenie
            </span>
          </button>
        </div>
        <div 
          id="status" 
          className="p-4 rounded-lg font-bold text-lg text-center"
          style={{
            backgroundColor: '#0b0b0b',
            padding: 16,
            borderRadius: 12,
            borderWidth: 2,
            borderColor: '#8a6b3d',
            marginTop: 16,
          }}
        >
          <span style={{ fontSize: 16, fontWeight: 'bold', color: '#f5f5f5' }}>
            {statusText}
          </span>
        </div>
      </div>
    </main>
  );
}
