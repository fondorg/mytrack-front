package ru.fondorg.mytrackfront.controller;

import lombok.RequiredArgsConstructor;
import org.keycloak.adapters.springsecurity.client.KeycloakRestTemplate;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.http.HttpMethod;
import org.springframework.web.bind.annotation.*;
import ru.fondorg.mytrackfront.config.MyTrackProperties;
import ru.fondorg.mytrackfront.domain.Issue;
import ru.fondorg.mytrackfront.domain.Project;
import ru.fondorg.mytrackfront.domain.ProjectProjection;
import ru.fondorg.mytrackfront.util.ApiPathBuilder;
import ru.fondorg.mytrackfront.util.PageParamMapper;

import javax.annotation.PostConstruct;
import javax.validation.Valid;
import java.util.List;

@RestController
@CrossOrigin(origins = {"http://localhost:5000", "http://localhost:8080"})
@RequestMapping("/api/v1/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final KeycloakRestTemplate keycloakRestTemplate;

    private final MyTrackProperties myTrackProperties;

    private final ApiPathBuilder apiPathBuilder;

    private final PageParamMapper pageParamMapper;

    private final String PROJECTS_PATH = "projects";
    private final String ISSUES_PATH = "issues";

    @PostConstruct
    public void init() {
    }

    @GetMapping
    public List<ProjectProjection> getAllProjects() {
        return exchangeAsList(apiPathBuilder.buildPath(PROJECTS_PATH));
    }

    @GetMapping("/{id}")
    public Project getProject(@PathVariable String id) {
        /*try {
            Thread.sleep(500);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }*/
        return keycloakRestTemplate.getForObject(apiPathBuilder.buildPath(PROJECTS_PATH, id), Project.class);
    }

    @PostMapping
    public Project createProject(@Valid @RequestBody Project project) {
        try {
            Thread.sleep(500);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        return keycloakRestTemplate.postForObject(apiPathBuilder.buildPath(PROJECTS_PATH), project, Project.class);
    }

    @GetMapping("/{id}/issues")
    public Page<Issue> getProjectIssues(@PathVariable String id,
                                        @RequestParam(required = false, defaultValue = "0") int page,
                                        @RequestParam(required = false, defaultValue = "0") int size) {
        return exchangeAsPage(apiPathBuilder.buildPath(pageParamMapper.mapParams(page, size), PROJECTS_PATH, id, ISSUES_PATH));
    }

    public <T> List<T> exchangeAsList(String uri) {
        return keycloakRestTemplate.exchange(uri, HttpMethod.GET, null,
                new ParameterizedTypeReference<List<T>>() {
                }).getBody();
    }

    public <T> PageImpl<T> exchangeAsPage(String uri) {
        return keycloakRestTemplate.exchange(uri, HttpMethod.GET, null,
                new ParameterizedTypeReference<PageImpl<T>>() {
                }).getBody();
    }
}
