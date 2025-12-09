'use client';

import { useState } from 'react';

export default function Home() {
  const [selectedCountry, setSelectedCountry] = useState('japan');
  const [selectedApi, setSelectedApi] = useState('currency');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const countries = [
    { id: 'usa', name: 'USA' },
    { id: 'uk', name: 'UK' },
    { id: 'japan', name: 'Japan' },
    { id: 'india', name: 'India' },
    { id: 'germany', name: 'Germany' },
    { id: 'france', name: 'France' },
    { id: 'canada', name: 'Canada' },
    { id: 'australia', name: 'Australia' },
    { id: 'china', name: 'China' },
    { id: 'brazil', name: 'Brazil' },
    { id: 'mexico', name: 'Mexico' },
    { id: 'south-korea', name: 'South Korea' },
    { id: 'russia', name: 'Russia' },
  ];

  const handleTest = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const response = await fetch(`/api/${selectedApi}/${selectedCountry}`);
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: 'Failed to fetch data' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center text-gray-800 mb-2">
          🌍 Country Info API
        </h1>
        <p className="text-center text-gray-600 mb-12">
          Simple REST APIs to get country information
        </p>

        {/* Interactive API Tester */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">🧪 Try the API</h3>
          
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            {/* API Type Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select API
              </label>
              <select
                value={selectedApi}
                onChange={(e) => setSelectedApi(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="currency">💰 Currency</option>
                <option value="animal">🦁 National Animal</option>
                <option value="capital">🏛️ Capital City</option>
              </select>
            </div>

            {/* Country Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Country
              </label>
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                {countries.map((country) => (
                  <option key={country.id} value={country.id}>
                    {country.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Test Button */}
          <button
            onClick={handleTest}
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? '⏳ Loading...' : '🚀 Test API'}
          </button>

          {/* Results */}
          {result && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Response:</h4>
              <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-1">
          {/* Currency API */}
          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center mb-4">
              <span className="text-3xl mr-3">💰</span>
              <h2 className="text-2xl font-semibold text-gray-800">Currency API</h2>
            </div>
            <p className="text-gray-600 mb-4">
              Get the current currency value for a country (against USD)
            </p>
            <div className="bg-gray-100 rounded-lg p-4">
              <code className="text-sm text-indigo-600">
                GET /api/currency/[country]
              </code>
            </div>
            <p className="text-sm text-gray-500 mt-3">
              Example: <code className="bg-gray-100 px-2 py-1 rounded">/api/currency/japan</code>
            </p>
          </div>

          {/* National Animal API */}
          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center mb-4">
              <span className="text-3xl mr-3">🦁</span>
              <h2 className="text-2xl font-semibold text-gray-800">National Animal API</h2>
            </div>
            <p className="text-gray-600 mb-4">
              Get the national animal of a country
            </p>
            <div className="bg-gray-100 rounded-lg p-4">
              <code className="text-sm text-indigo-600">
                GET /api/animal/[country]
              </code>
            </div>
            <p className="text-sm text-gray-500 mt-3">
              Example: <code className="bg-gray-100 px-2 py-1 rounded">/api/animal/india</code>
            </p>
          </div>

          {/* Capital City API */}
          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center mb-4">
              <span className="text-3xl mr-3">🏛️</span>
              <h2 className="text-2xl font-semibold text-gray-800">Capital City API</h2>
            </div>
            <p className="text-gray-600 mb-4">
              Get the capital city of a country
            </p>
            <div className="bg-gray-100 rounded-lg p-4">
              <code className="text-sm text-indigo-600">
                GET /api/capital/[country]
              </code>
            </div>
            <p className="text-sm text-gray-500 mt-3">
              Example: <code className="bg-gray-100 px-2 py-1 rounded">/api/capital/france</code>
            </p>
          </div>
        </div>

        {/* Supported Countries */}
        <div className="mt-12 bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Supported Countries</h3>
          <div className="flex flex-wrap gap-2">
            {countries.map((country) => (
              <span
                key={country.id}
                className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm"
              >
                {country.name}
              </span>
            ))}
          </div>
        </div>

        <footer className="mt-12 text-center text-gray-500 text-sm">
          Built with Next.js • Ready for Vercel deployment
        </footer>
      </div>
    </div>
  );
}
