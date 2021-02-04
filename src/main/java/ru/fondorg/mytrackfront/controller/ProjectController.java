package ru.fondorg.mytrackfront.controller;

import lombok.RequiredArgsConstructor;
import org.keycloak.adapters.springsecurity.client.KeycloakRestTemplate;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpMethod;
import org.springframework.web.bind.annotation.*;
import ru.fondorg.mytrackfront.domain.Issue;
import ru.fondorg.mytrackfront.domain.Project;
import ru.fondorg.mytrackfront.domain.ProjectProjection;
import ru.fondorg.mytrackfront.util.ApiPathBuilder;
import ru.fondorg.mytrackfront.util.ApiV1Paths;

import javax.annotation.PostConstruct;
import javax.validation.Valid;
import java.util.List;

@RestController
@CrossOrigin(origins = {"http://localhost:5000", "http://localhost:8080"})
//@RequestMapping(ApiV1Paths.PROJECTS_API)
@RequiredArgsConstructor
public class ProjectController {

    private final KeycloakRestTemplate keycloakRestTemplate;

    private final ApiPathBuilder pathBuilder;

    @PostConstruct
    public void init() {
    }

    @GetMapping(ApiV1Paths.PROJECTS)
    public List<ProjectProjection> getAllProjects() {
        return exchangeAsList(pathBuilder.getUrl(ApiV1Paths.PROJECTS));
    }

    @GetMapping(ApiV1Paths.PROJECT)
    public Project getProject(@PathVariable String id) {
        return keycloakRestTemplate.getForObject(pathBuilder.getUrl(ApiV1Paths.PROJECT), Project.class, id);
    }

    @PostMapping(ApiV1Paths.PROJECTS)
    public Project createProject(@Valid @RequestBody Project project) {
        return keycloakRestTemplate.postForObject(pathBuilder.getUrl(ApiV1Paths.PROJECTS), project, Project.class);
    }

    @GetMapping(ApiV1Paths.PROJECT_ISSUES)
    public Page<Issue> getProjectIssues(@PathVariable String id,
                                        @RequestParam(required = false) Integer page,
                                        @RequestParam(required = false) Integer size) {

        return exchangeAsPage(pathBuilder.getUrl(ApiV1Paths.PROJECT_ISSUES, ApiV1Paths.PAGE_PARAMS), id, page, size);
    }

    public <T> List<T> exchangeAsList(String uri) {
        return keycloakRestTemplate.exchange(uri, HttpMethod.GET, null,
                new ParameterizedTypeReference<List<T>>() {
                }).getBody();
    }

    public <T> PageResource<T> exchangeAsPage(String uri, Object... uriVars) {
        return keycloakRestTemplate.exchange(uri, HttpMethod.GET, null,
                new ParameterizedTypeReference<PageResource<T>>() {
                }, uriVars).getBody();
    }
}
