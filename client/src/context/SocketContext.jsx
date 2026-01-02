import { createContext, useContext, useState, useEffect } from "react";
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null); // The connection (null = not connected)
    const { user } = useAuth(); // Get logged-in user from AuthContext

    useEffect(() => {
        if (user) { // Only connect if logged in
            const newSocket = io('http://localhost:5000'); // Connect to server

            newSocket.on('connect', () => {
                console.log('Connected to socket server');
                const token = localStorage.getItem('token');
                newSocket.emit('authenticate', token); // Tell server who I am
            });

            setSocket(newSocket); // Save connection

            return () => {
                newSocket.close(); // Clean up when logging out
            };
        }
    }, [user]); // Re-run when user changes (login/logout)

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    )
}