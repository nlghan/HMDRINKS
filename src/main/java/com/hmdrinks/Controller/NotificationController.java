package com.hmdrinks.Controller;

import com.hmdrinks.Request.NotificationRequest;
import com.hmdrinks.Response.NotificationResponse;
import com.hmdrinks.Service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    @PostMapping("/send")
    public ResponseEntity<?> sendNotification(@RequestBody NotificationRequest notificationRequest) {
        // Tạo thông điệp mặc định
        String message = "Bạn có đơn hàng mới";

        // Gửi thông báo thông qua service
        notificationService.sendNotification(notificationRequest.getUserId(), message);

        // Trả về response với thông điệp đã gửi
        return ResponseEntity.ok(new NotificationResponse(message));
    }
}

