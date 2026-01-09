import { useEffect, useState } from "react";

export const useNotification = () => {
    const [permission, setPermission] = useState(Notification.permission);

    useEffect(() => {
        // Request permission on mount if not already granted or denied
        if (permission === 'default') {
            Notification.requestPermission().then((result) => {
                setPermission(result);
            });
        }
    }, [permission]);

    const sendNotification = (title, options = {}) => {
        // Only send notification if permission is granted
        if (permission === 'granted' && document.hidden) {
            const notification = new Notification(title, {
                icon: '/favicon.ico',
                badge: '/favicon.ico',
                ...options,
            });

            // Auto-close notification after 5 seconds
            setTimeout(() => notification.close(), 5000);

            // Focus window when notification is clicked
            notification.onclick = () => {
                window.focus();
                notification.close();
            };
        }
    };

    return { permission, sendNotification };
};