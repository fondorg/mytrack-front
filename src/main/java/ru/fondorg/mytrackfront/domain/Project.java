package ru.fondorg.mytrackfront.domain;

import lombok.Data;

import javax.validation.constraints.NotNull;

@Data
public class Project {
    private Long id;

    @NotNull
    private String title;

    private String description;

    private String owner;

}
