package com.hmdrinks.Request;

import com.hmdrinks.Enum.Role;
import jakarta.validation.constraints.Email;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UpdateAccountUserReq {
    private int userId;
    private String fullName;
    private String userName;
    @Email
    private String email;
    private String password;
    private Role role;
    private String phoneNumber;
    private Boolean isDeleted;
}
