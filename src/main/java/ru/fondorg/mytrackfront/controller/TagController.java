package ru.fondorg.mytrackfront.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;
import ru.fondorg.mytrackfront.domain.Tag;
import ru.fondorg.mytrackfront.restclient.ApiRestTemplate;
import ru.fondorg.mytrackfront.util.ApiPathBuilder;
import ru.fondorg.mytrackfront.util.ApiV1Paths;

import javax.validation.Valid;
import java.util.List;

@RestController
@RequiredArgsConstructor
public class TagController {
    private final ApiPathBuilder pathBuilder;
    private final ApiRestTemplate apiRestTemplate;

    @PostMapping(ApiV1Paths.PROJECT_TAGS)
    public Tag saveProjectTag(@PathVariable Long projectId, @Valid @RequestBody Tag tag) {
        return apiRestTemplate.postForObject(pathBuilder.getUrl(ApiV1Paths.PROJECT_TAGS), tag, Tag.class, projectId);
    }

    @PostMapping(ApiV1Paths.TAGS)
    public Tag saveCommonTag(@Valid @RequestBody Tag tag) {
        return apiRestTemplate.postForObject(pathBuilder.getUrl(ApiV1Paths.TAGS), tag, Tag.class);
    }

    @GetMapping(ApiV1Paths.PROJECT_TAGS)
    public List<Tag> getProjectTags(@PathVariable Long projectId) {
        return apiRestTemplate.exchangeAsList(pathBuilder.getUrl(ApiV1Paths.PROJECT_TAGS), projectId);
    }

    @GetMapping(ApiV1Paths.TAGS)
    public Page<Tag> getCommonTags(
            @PathVariable Long projectId,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {
        return apiRestTemplate.exchangeAsPage(pathBuilder.getUrl(ApiV1Paths.PROJECT_TAGS, ApiV1Paths.PAGE_PARAMS), projectId, page, size);
    }

    @GetMapping(ApiV1Paths.PROJECT_TAG)
    public Tag getProjectTag(@PathVariable Long projectId, @PathVariable Long tagId) {
        return apiRestTemplate.getForObject(pathBuilder.getUrl(ApiV1Paths.PROJECT_TAG), Tag.class, projectId, tagId);
    }

    @GetMapping(ApiV1Paths.TAG)
    public Tag getCommonTag(@PathVariable Long tagId) {
        return apiRestTemplate.getForObject(pathBuilder.getUrl(ApiV1Paths.TAG), Tag.class, tagId);
    }

    @DeleteMapping(ApiV1Paths.PROJECT_TAG)
    public void deleteProjectTag(@PathVariable Long projectId, @PathVariable Long tagId) {
        apiRestTemplate.delete(pathBuilder.getUrl(ApiV1Paths.PROJECT_TAG), projectId, tagId);
    }

    @DeleteMapping(ApiV1Paths.TAG)
    public void deleteCommonTag(@PathVariable Long tagId) {
        apiRestTemplate.delete(pathBuilder.getUrl(ApiV1Paths.TAG), tagId);
    }

    @GetMapping(ApiV1Paths.ISSUE_TAGS)
    public List<Tag> getIssueTags(@PathVariable Long projectId, @PathVariable Long issueId) {
        return apiRestTemplate.exchangeAsList(pathBuilder.getUrl(ApiV1Paths.ISSUE_TAGS), projectId, issueId);
    }
}
