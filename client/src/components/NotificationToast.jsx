import { useSocket } from '../context/SocketContext';

export default function NotificationToast() {
    const { notifications, removeNotification } = useSocket();

    if (notifications.length === 0) return null;

    return (
        <div className="toast-container">
            {notifications.map(notif => (
                <div className="toast" key={notif.id}>
                    <span className="toast-icon">
                        {notif.type === 'nearby' ? '📍' : notif.type === 'success' ? '✅' : '🔔'}
                    </span>
                    <span className="toast-message">{notif.message}</span>
                    <button className="toast-close" onClick={() => removeNotification(notif.id)}>×</button>
                </div>
            ))}
        </div>
    );
}
