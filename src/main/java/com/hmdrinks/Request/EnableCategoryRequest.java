package com.hmdrinks.Request;

import lombok.Data;
import lombok.Getter;
import lombok.Setter;

@Data
@Getter
@Setter
public class EnableCategoryRequest {
    private Integer id;
    private Boolean isCancel;
    private String transactionToken;



}
