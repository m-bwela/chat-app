import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { SocketProvider } from './context/SocketContext.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Chat from './pages/Chat.jsx';

// Protects pages that require login
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>; // still checking auth status
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
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App;