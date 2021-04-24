package ru.fondorg.mytrackfront.domain;

import lombok.Getter;
import lombok.Setter;

import java.util.HashSet;
import java.util.Set;

@Getter
@Setter
public class Issue {
    private Long id;

    private String title;

    private String description;

    private User author;

    private Long projectId;

    private Boolean closed;

    private Set<Tag> tags = new HashSet<>();
}
