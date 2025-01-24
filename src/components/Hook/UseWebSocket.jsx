import { useEffect, useState } from 'react';
import { Client } from '@stomp/stompjs'; // Sử dụng Client thay vì over
import SockJS from 'sockjs-client';

const UseWebSocket = (userId) => {
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        if (!userId) {
            console.warn('Shipper ID không hợp lệ.');
            return;
        }

        // Log để kiểm tra giá trị userId
        console.log('Connecting WebSocket with userId:', userId);

        // Tạo kết nối SockJS với `withCredentials`
        const socket = new SockJS('http://localhost:1010/ws', null, {
            withCredentials: true, // Kích hoạt withCredentials
        });

        const stompClient = new Client({
            webSocketFactory: () => socket, // Sử dụng webSocketFactory cho SockJS
            connectHeaders: {}, // Thêm headers nếu cần (ví dụ: Authorization token)
            debug: (str) => console.log(str),
            onConnect: () => {
                console.log('WebSocket connected');
                
                // Log để kiểm tra khi đã kết nối thành công
                console.log(`Subscribing to /topic/shipper/${userId}`);
                
                // Đăng ký topic dành riêng cho shipper
                stompClient.subscribe(`/topic/shipper/${userId}`, (message) => {
                    console.log("Received message:", message);  // Log thông báo nhận được
                    
                    if (message.body) {
                        try {
                            const notification = JSON.parse(message.body);  // Parse thông báo
                            console.log('Parsed notification:', notification);  // Log thông báo đã parse
                            
                            setNotifications((prev) => [...prev, notification.message]);
                        } catch (e) {
                            console.error('Error parsing message body:', e);
                        }
                    }
                });
            },
            onStompError: (frame) => {
                console.error(`Broker reported error: ${frame.headers['message']}`);
                console.error(`Additional details: ${frame.body}`);
            },
            onDisconnect: () => {
                console.log('WebSocket disconnected');
            },
        });

        // Kích hoạt WebSocket
        stompClient.activate();

        // Log trạng thái kết nối WebSocket
        console.log('WebSocket is activating...');

        return () => {
            // Đảm bảo WebSocket được đóng khi component unmount
            if (stompClient) stompClient.deactivate();
            console.log('WebSocket deactivated');
        };
    }, [userId]);

    // Log trạng thái của notifications
    useEffect(() => {
        console.log('Current notifications:', notifications);
    }, [notifications]);

    return notifications;
};

export default UseWebSocket;
