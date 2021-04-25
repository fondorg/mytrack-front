package ru.fondorg.mytrackfront.domain;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Getter
@Setter
public class Issue {
    private Long id;

    private Long pid;

    private LocalDateTime created;

    private String title;

    private String description;

    private User author;

    private Long projectId;

    private Boolean closed;

    private Set<Tag> tags = new HashSet<>();
}
