package ru.fondorg.mytrackfront.controller;

import lombok.RequiredArgsConstructor;
import org.keycloak.adapters.springsecurity.client.KeycloakRestTemplate;
import org.springframework.data.domain.Page;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.*;
import ru.fondorg.mytrackfront.domain.Issue;
import ru.fondorg.mytrackfront.restclient.ApiRestTemplate;
import ru.fondorg.mytrackfront.util.ApiPathBuilder;
import ru.fondorg.mytrackfront.util.ApiV1Paths;

import javax.validation.Valid;

@RestController
@CrossOrigin(origins = {"http://localhost:5000", "http://localhost:8080"})
//@RequestMapping(ApiV1Paths.ISSUES_API)
@RequiredArgsConstructor
public class IssueController {
    private final KeycloakRestTemplate keycloakRestTemplate;

    private final ApiPathBuilder pathBuilder;
    private final ApiRestTemplate apiRestTemplate;

    @PostMapping(ApiV1Paths.PROJECT_ISSUES)
    public Issue newProjectIssue(@PathVariable Long id, @Valid @RequestBody Issue issue) {
        return keycloakRestTemplate.postForObject(pathBuilder.getUrl(ApiV1Paths.PROJECT_ISSUES), issue, Issue.class, id);
    }

    @GetMapping(ApiV1Paths.PROJECT_ISSUES)
    public Page<Issue> getProjectIssues(@PathVariable String id,
                                        @RequestParam MultiValueMap<String, String> params) {
        return apiRestTemplate.exchangeAsPage(pathBuilder.getUrl(ApiV1Paths.PROJECT_ISSUES, params), id);
    }

    @GetMapping(ApiV1Paths.PROJECT_ISSUE)
    public Issue getProjectIssue(@PathVariable Long projectId, @PathVariable Long issueId) {
        return apiRestTemplate.getForObject(pathBuilder.getUrl(ApiV1Paths.PROJECT_ISSUE), Issue.class, projectId, issueId);
    }

    @DeleteMapping(ApiV1Paths.PROJECT_ISSUE)
    public void deleteProjectIssue(@PathVariable Long projectId, @PathVariable Long issueId) {
        apiRestTemplate.delete(pathBuilder.getUrl(ApiV1Paths.PROJECT_ISSUE), projectId, issueId);
    }

}
