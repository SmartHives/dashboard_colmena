import React from 'react';
import Dashboard from './components/Dashboard';

function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      <main className="container mx-auto py-4">
        <Dashboard />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-8">
        <div className="container mx-auto p-4 text-center text-gray-600 text-sm">
          Colmena IoT Dashboard © {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  );
}

export default App;