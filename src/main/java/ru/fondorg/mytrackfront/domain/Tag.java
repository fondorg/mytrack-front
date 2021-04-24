package ru.fondorg.mytrackfront.domain;


import lombok.Data;
import lombok.NoArgsConstructor;

import javax.validation.constraints.NotNull;

@Data
@NoArgsConstructor
public class Tag {

    public Tag(String name, String color) {
        this.name = name;
        this.color = color;
    }

    public Tag(String name, String color, Project project) {
        this.name = name;
        this.color = color;
        this.project = project;
    }

    private Long id;

    @NotNull
    private String name;

    @NotNull
    private String color;

    private Project project;
}
