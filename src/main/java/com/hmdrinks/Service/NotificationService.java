package com.hmdrinks.Service;

import com.hmdrinks.Response.NotificationResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
public class NotificationService {

    private final SimpMessagingTemplate messagingTemplate;

    @Autowired
    public NotificationService(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    public void sendNotification(int userId, String message) {
        System.out.println("Sending notification to user " + userId + " with message " + message);
        String destination = "/topic/shipper/" + userId;

        if (userId <= 0) {
            System.err.println("Error: Invalid userId: " + userId);
            return;
        }
        try {
            messagingTemplate.convertAndSend(destination, new NotificationResponse(message));

            System.out.println("Notification sent successfully to: " + destination + " with message: " + message);
        } catch (Exception e) {
            System.err.println("Error while sending notification to: " + destination);
            e.printStackTrace();
        }
    }
}
