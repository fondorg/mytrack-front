package ru.fondorg.mytrackfront.controller;

import lombok.RequiredArgsConstructor;
import org.keycloak.adapters.springsecurity.client.KeycloakRestTemplate;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.web.bind.annotation.*;
import ru.fondorg.mytrackfront.config.MyTrackProperties;
import ru.fondorg.mytrackfront.domain.Project;
import ru.fondorg.mytrackfront.domain.ProjectProjection;

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

    private String baseUrl;

    private final String PROJECTS_PATH = "/projects";

    @PostConstruct
    public void init() {
        baseUrl = myTrackProperties.getMytrackSrvBaseUrl();
    }

    @GetMapping
    public List<ProjectProjection> getAllProjects() {
        return exchangeAsList(baseUrl + PROJECTS_PATH, new ParameterizedTypeReference<List<ProjectProjection>>() {
        });
    }

    @GetMapping("/{id}")
    public Project getProject(@PathVariable String id) {
        /*try {
            Thread.sleep(500);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }*/
        return keycloakRestTemplate.getForObject(baseUrl + PROJECTS_PATH + "/" + id, Project.class);
    }

    @PostMapping
    public Project createProject(@Valid @RequestBody Project project) {
        try {
            Thread.sleep(500);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        return keycloakRestTemplate.postForObject(baseUrl + PROJECTS_PATH, project, Project.class);
    }

    public <T> List<T> exchangeAsList(String uri, ParameterizedTypeReference<List<T>> responseType) {
        return keycloakRestTemplate.exchange(uri, HttpMethod.GET, null, responseType).getBody();
    }
}
