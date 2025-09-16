'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [orderNumber, setOrderNumber] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    const normalized = orderNumber.replace(/\D/g, '');
    if (/^\d{8}$/.test(normalized)) {
      const existingOrderNumber = localStorage.getItem('orderNumber');
      if (existingOrderNumber && existingOrderNumber === normalized) {
        setError('przesyłka już jest śledzona. Wpisz inny numer');
        return;
      }

      localStorage.setItem('auth', 'true');
      localStorage.setItem('orderNumber', normalized);
      router.push('/main');
    } else {
      setError('Wprowadź poprawnie 8-cyfrowy numer przewozu');
    }
  };

  return (
    <main className="flex items-center justify-center min-h-screen bg-gray-100">
      <form
        onSubmit={handleLogin}
        className="bg-white p-8 rounded-lg shadow-lg w-full max-w-sm"
      >
        <h2 className="text-2xl font-bold mb-6 text-center">Podaj numer przewozu</h2>

        {error && (
          <p className="text-red-500 text-sm mb-4 text-center">{error}</p>
        )}

        <input
          type="text"
          placeholder="Numer przewozu"
          value={orderNumber}
          onChange={(e) => setOrderNumber(e.target.value.replace(/\D/g, '').slice(0, 8))}
          maxLength={8}
          className="w-full mb-6 p-3 border rounded-lg"
        />

        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600"
        >
          Dalej
        </button>
      </form>
    </main>
  );
}
