// client/src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SavedProvider } from './context/SavedContext';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import HomePage from './pages/HomePage';
import PropertiesPage from './pages/PropertiesPage';
import PropertyDetailPage from './pages/PropertyDetailPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import MyPropertiesPage from './pages/MyPropertiesPage';
import AddEditPropertyPage from './pages/AddEditPropertyPage';

// Simple 404 page
function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 text-2xl font-bold">
        404
      </div>
      <h1 className="text-2xl font-extrabold text-slate-900 mb-2">Page Not Found</h1>
      <p className="text-sm text-slate-500 max-w-sm mb-6">
        The rental page you are looking for does not exist or may have been relocated.
      </p>
      <a
        href="/"
        className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-xs tracking-wide shadow-sm hover:bg-blue-700"
      >
        Return to Home Page
      </a>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SavedProvider>
        <BrowserRouter>
          <div className="min-h-screen flex flex-col bg-[#FBFBFA] text-[#0F172A] selection:bg-blue-100 selection:text-blue-900 font-sans">
            <Navbar />
            <div className="flex-1">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<HomePage />} />
                <Route path="/properties" element={<PropertiesPage />} />
                <Route path="/properties/:id" element={<PropertyDetailPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                {/* Protected Routes (Logged-in users) */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <DashboardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/my-listings"
                  element={
                    <ProtectedRoute>
                      <MyPropertiesPage />
                    </ProtectedRoute>
                  }
                />

                {/* Landlord-Only Routes */}
                <Route
                  path="/add-property"
                  element={
                    <ProtectedRoute landlordOnly={true}>
                      <AddEditPropertyPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/edit-property/:id"
                  element={
                    <ProtectedRoute landlordOnly={true}>
                      <AddEditPropertyPage />
                    </ProtectedRoute>
                  }
                />

                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
            <Footer />
          </div>
        </BrowserRouter>
      </SavedProvider>
    </AuthProvider>
  );
}
