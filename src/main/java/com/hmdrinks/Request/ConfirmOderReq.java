package com.hmdrinks.Request;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ConfirmOderReq {
    private int  orderId;
    private LocalDateTime timeConfirmed;
}
