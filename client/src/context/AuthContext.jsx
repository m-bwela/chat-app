import { createContext, useContext, useState, useEffect } from "react";
import api from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null); // Who's logged in? (null = nobody)
    const [loading, setLoading] = useState(true); // Still checking?

    // When app loads, check if user was already logged in
    useEffect(() => {
        const token = localStorage.getItem('token'); // check saved token
        const minLoadTime = 3000; // Minimum loading time in ms (3 seconds)
        const startTime = Date.now();
        
        const finishLoading = () => {
            const elapsed = Date.now() - startTime;
            const remainingTime = Math.max(0, minLoadTime - elapsed);
            // Wait for remaining time before hiding loading screen
            setTimeout(() => setLoading(false), remainingTime);
        };
        
        if (token) {
            // Verify token and fetch user data
            api.get('/auth/me')  // Ask server who I am?
                .then((res) => setUser(res.data)) // Save user info
                .catch(() => localStorage.removeItem('token')) // Invalid token, remove it
                .finally(() => finishLoading()); // Done checking
        } else {
            finishLoading();
        }
    }, []);

    // Login function
    const login = async (email, password) => {
        const res = await api.post('/auth/login', { email, password });
        localStorage.setItem('token', res.data.token); // Save token for later
        setUser(res.data.user); // Now we know who's logged in
        return res.data; 
    };

    // Register function
    const register = async (username, email, password) => {
        const res = await api.post('/auth/register', { username, email, password }); // Create account
        localStorage.setItem('token', res.data.token); // Save token for later
        setUser(res.data.user); // Now we know who's logged in
        return res.data;
    };

    // Logout function
    const logout = async () => {
        try {
          await api.post('/auth/logout'); // Inform server about logout
        } catch (err) {
          console.error('Failed to logout:', err);    
        } 
        localStorage.removeItem('token'); // Remove saved token
        setUser(null); // No user is logged in
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};