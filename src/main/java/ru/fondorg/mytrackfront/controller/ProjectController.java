package ru.fondorg.mytrackfront.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;
import ru.fondorg.mytrackfront.domain.Project;
import ru.fondorg.mytrackfront.domain.ProjectProjection;
import ru.fondorg.mytrackfront.restclient.ApiRestTemplate;
import ru.fondorg.mytrackfront.util.ApiPathBuilder;
import ru.fondorg.mytrackfront.util.ApiV1Paths;

import javax.annotation.PostConstruct;
import javax.validation.Valid;

@RestController
@CrossOrigin(origins = {"http://localhost:5000", "http://localhost:8080", "http://192.168.0.108:8080"})
//@RequestMapping(ApiV1Paths.PROJECTS_API)
@RequiredArgsConstructor
public class ProjectController {

    private final ApiRestTemplate apiRestTemplate;

    private final ApiPathBuilder pathBuilder;

    @PostConstruct
    public void init() {
    }

    @GetMapping(ApiV1Paths.PROJECTS)
    public Page<ProjectProjection> getAllProjects(
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {
        return apiRestTemplate.exchangeAsPage(pathBuilder.getUrl(ApiV1Paths.PROJECTS, ApiV1Paths.PAGE_PARAMS), page, size);
    }

    @GetMapping(ApiV1Paths.PROJECT)
    public Project getProject(@PathVariable String id) {
        return apiRestTemplate.getForObject(pathBuilder.getUrl(ApiV1Paths.PROJECT), Project.class, id);
    }

    @PostMapping(ApiV1Paths.PROJECTS)
    public Project createProject(@Valid @RequestBody Project project) {
        return apiRestTemplate.postForObject(pathBuilder.getUrl(ApiV1Paths.PROJECTS), project, Project.class);
    }

}
