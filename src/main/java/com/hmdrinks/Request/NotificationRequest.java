package com.hmdrinks.Request;

import lombok.Data;
import lombok.NonNull;

@Data
public class NotificationRequest {
    @NonNull
    private Integer userId;

    public NotificationRequest() {
    }

    public NotificationRequest(int userId) {
        this.userId = userId;
    }
}
