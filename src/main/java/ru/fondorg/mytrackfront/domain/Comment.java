package ru.fondorg.mytrackfront.domain;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class Comment {

    private Long id;

    private LocalDateTime created;

    private String text;

    private User author;

    private Long issueId;
}
