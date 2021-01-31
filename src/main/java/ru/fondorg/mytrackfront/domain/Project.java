package ru.fondorg.mytrackfront.domain;

import lombok.Data;

import javax.validation.constraints.NotNull;

@Data
public class Project {
    private Integer id;

    @NotNull
    private String title;

    private String description;

    private String owner;

}
