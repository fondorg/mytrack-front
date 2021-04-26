package ru.fondorg.mytrackfront.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import ru.fondorg.mytrackfront.domain.Comment;
import ru.fondorg.mytrackfront.restclient.ApiRestTemplate;
import ru.fondorg.mytrackfront.util.ApiPathBuilder;
import ru.fondorg.mytrackfront.util.ApiV1Paths;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class CommentController {

    private final ApiRestTemplate apiRestTemplate;
    private final ApiPathBuilder pathBuilder;

    @PostMapping(ApiV1Paths.ISSUE_COMMENTS)
    public Comment saveComment(@PathVariable Long projectId, @PathVariable Long issueId, @RequestBody Comment comment) {
        return apiRestTemplate.postForObject(pathBuilder.getUrl(ApiV1Paths.ISSUE_COMMENTS), comment, Comment.class,
                projectId, issueId);
    }

    @GetMapping(ApiV1Paths.ISSUE_COMMENT)
    public Comment getComment(@PathVariable Long projectId, @PathVariable Long issueId, @PathVariable Long commentId) {
        return apiRestTemplate.getForObject(pathBuilder.getUrl(ApiV1Paths.ISSUE_COMMENT), Comment.class,
                projectId, issueId, commentId);
    }

    @GetMapping(ApiV1Paths.ISSUE_COMMENTS)
    public List<Comment> getIssueComments(@PathVariable Long projectId, @PathVariable Long issueId
                                          /*@RequestParam MultiValueMap<String, String> params*/) {
        return apiRestTemplate.exchangeAsList(pathBuilder.getUrl(ApiV1Paths.ISSUE_COMMENTS),
                projectId, issueId);
    }

    @DeleteMapping(ApiV1Paths.ISSUE_COMMENT)
    public void deleteComment(@PathVariable Long projectId, @PathVariable Long issueId, @PathVariable Long commentId) {
        apiRestTemplate.delete(pathBuilder.getUrl(ApiV1Paths.ISSUE_COMMENT), projectId, issueId, commentId);
    }
}
