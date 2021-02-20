package ru.fondorg.mytrackfront.domain;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class Issue {
    private Long id;

    private String title;

    private String description;

    private User author;

    private Long projectId;

    private Boolean closed;
}
