package ru.fondorg.mytrackfront.domain;

import lombok.Data;

@Data
public class User {
    private String id;
    private String username;
    private String firstName;
    private String lastName;
}
