// app/page.tsx
'use client'; // This directive makes the component a Client Component, allowing browser APIs like geolocation

import React, { useState, useEffect, useRef } from 'react';

export default function Home() {
  const [statusText, setStatusText] = useState('Nieaktywne');
  const [isTracking, setIsTracking] = useState(false);
  const watchId = useRef<number | null>(null); // useRef to keep track of watchId across renders

  const apiUrl = '/api/track-location'; // Next.js API route

  // Custom function to show messages instead of alert()
  const showMessage = (message: string) => {
    // In a real app, you'd use a modal library or state to display this.
    // For now, we'll log to console and update a simple text area if available.
    console.warn("User Message:", message);
    // You could also add a state variable here and display it in a simple div
    // For example: setNotificationMessage(message);
    alert(message); // Using alert for simplicity, but a custom modal is recommended for production
  };

  // Function to send location data to the backend
  const sendLocationToServer = async (latitude: number, longitude: number) => {
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ latitude, longitude }),
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
    } catch (error: any) {
      console.error('Network error or problem with fetch operation:', error);
      showMessage(`Błąd sieci: Nie można połączyć się z serwerem. ${error.message}`);
      return false;
    }
  };

  const startTracking = () => {
    if (navigator.geolocation) {
      // Use watchPosition to continuously get updates
      watchId.current = navigator.geolocation.watchPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          setStatusText(`Twoja lokalizacja: ${latitude}, ${longitude}`);
          await sendLocationToServer(latitude, longitude);
        },
        (err) => {
          console.error("Błąd pobierania lokalizacji:", err);
          setStatusText("Nie udało się pobrać lokalizacji.");
          showMessage("Nie udało się pobrać lokalizacji. Upewnij się, że masz włączoną geolokalizację.");
          stopTracking(); // Stop watching if there's an error
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
      setIsTracking(true);
    } else {
      showMessage("Twoja przeglądarka nie wspiera geolokalizacji!");
    }
  };

  const stopTracking = () => {
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
    setIsTracking(false);
    setStatusText("Nieaktywne");
  };

  // Clean up the watchPosition when the component unmounts
  useEffect(() => {
    return () => {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
      }
    };
  }, []); // Empty dependency array ensures this runs once on mount and once on unmount

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Udostępnianie lokalizacji</h2>
        <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4 mb-6">
          <button
            onClick={startTracking}
            disabled={isTracking}
            className={`font-semibold py-3 px-6 rounded-lg shadow transition-colors duration-200
                        ${isTracking ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
          >
            Start śledzenia
          </button>
          <button
            onClick={stopTracking}
            disabled={!isTracking}
            className={`font-semibold py-3 px-6 rounded-lg shadow transition-colors duration-200
                        ${!isTracking ? 'bg-red-300 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 text-white'}`}
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
