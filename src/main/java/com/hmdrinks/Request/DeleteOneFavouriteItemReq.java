package com.hmdrinks.Request;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DeleteOneFavouriteItemReq {
    private int userId;
    private int favItemId;
}
