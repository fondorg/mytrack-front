package ru.fondorg.mytrackfront.controller;

import lombok.RequiredArgsConstructor;
import org.keycloak.adapters.springsecurity.client.KeycloakRestTemplate;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import ru.fondorg.mytrackfront.domain.Issue;
import ru.fondorg.mytrackfront.util.ApiV1PathBuilder;
import ru.fondorg.mytrackfront.util.ApiV1Paths;
import ru.fondorg.mytrackfront.util.PageParamMapper;

import javax.validation.Valid;

@RestController
@CrossOrigin(origins = {"http://localhost:5000", "http://localhost:8080"})
//@RequestMapping(ApiV1Paths.ISSUES_API)
@RequiredArgsConstructor
public class IssueController {
    private final KeycloakRestTemplate keycloakRestTemplate;

    private final ApiV1PathBuilder pathBuilder;

    private final PageParamMapper pageParamMapper;

    @PostMapping(ApiV1Paths.ISSUES)
    public Issue newIssue(@Valid @RequestBody Issue issue) {
        return keycloakRestTemplate.postForObject(pathBuilder.buildPath(ApiV1Paths.ISSUES), issue, Issue.class);
    }
}
