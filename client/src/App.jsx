import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { SocketProvider } from './context/SocketContext.jsx';
import { ThemeProvider, useTheme } from './context/ThemeContext.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Chat from './pages/Chat.jsx';

// Beautiful Loading Screen Component
const LoadingScreen = () => {
  const { darkMode } = useTheme();
  
  return (
    <div className={`min-h-screen flex flex-col items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-500 via-blue-600 to-purple-700'}`}>
      {/* Animated Background Circles */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>
      
      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Logo/Icon */}
        <div className="mb-8 relative">
          <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center shadow-2xl">
            <svg className="w-14 h-14 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          {/* Pulsing ring animation */}
          <div className="absolute inset-0 w-24 h-24 bg-white/30 rounded-3xl animate-ping"></div>
        </div>
        
        {/* App Name */}
        <h1 className="text-4xl font-bold text-white mb-2 tracking-wide">i-ONGEA</h1>
        <p className="text-white/70 mb-8 text-lg">Connecting conversations</p>
        
        {/* Loading Spinner */}
        <div className="flex items-center gap-3">
          <div className="flex space-x-2">
            <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
        
        {/* Loading Text */}
        <p className="mt-6 text-white/60 text-sm animate-pulse">Loading your chats...</p>
      </div>
      
      {/* Bottom Branding */}
      <div className="absolute bottom-8 text-white/40 text-sm">
        <p>&copy;  2026  i-ONGEA</p>
      </div>
    </div>
  );
};

// Protects pages that require login
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/login" />; // Not logged in? Go to login page
  }

  return children; // logged in? show the page
};

function AppRoutes() {
  const { user } = useAuth();

  return (
    <>
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/" /> : <Register />} />
      <Route
      path="/"
      element={
        <ProtectedRoute>
          <SocketProvider>
            <Chat />
          </SocketProvider>
        </ProtectedRoute>
      }
      />
    </Routes>
    </>
  );
}

function App() {
  return (
    <ThemeProvider>
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
    </ThemeProvider>
  )
}

export default App;