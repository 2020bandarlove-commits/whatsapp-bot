
import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { CommandsPage } from './pages/Commands';
import { LogsPage } from './pages/Logs';
import { Layout } from './components/Layout';
import { STORAGE_KEYS } from './constants';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  if (!token) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
};

const NotFound = () => (
  <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center font-['Cairo']">
    <h1 className="text-9xl font-black text-slate-200 mb-4">404</h1>
    <p className="text-2xl font-bold text-slate-700 mb-8">عذراً، هذه الصفحة غير موجودة</p>
    <a href="#/" className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-blue-100">
      العودة للرئيسية
    </a>
  </div>
);

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        
        <Route path="/" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        
        <Route path="/commands" element={
          <ProtectedRoute>
            <CommandsPage />
          </ProtectedRoute>
        } />
        
        <Route path="/logs" element={
          <ProtectedRoute>
            <LogsPage />
          </ProtectedRoute>
        } />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
};

export default App;
