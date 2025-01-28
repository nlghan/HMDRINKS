package com.hmdrinks.Request;

import lombok.Data;
import lombok.Getter;
import lombok.Setter;

@Data
@Getter
@Setter
public class AddItemOrderConfirmRequest {
    private Integer orderId;
    private Integer userId;
}
