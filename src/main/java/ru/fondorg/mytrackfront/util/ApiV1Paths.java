package ru.fondorg.mytrackfront.util;

public final class ApiV1Paths {
    private ApiV1Paths() {
    }
    public static final String API_PREFIX = "api";
    public static final String API_VER = "v1";
    public static final String PAGE_PARAMS = "page={page}&size={size}";

    public static final String PROJECTS = "/api/v1/projects";
    public static final String PROJECT = "/api/v1/projects/{id}";
    public static final String PROJECT_ISSUES = "/api/v1/projects/{id}/issues";


    public static final String ISSUES = "/api/v1/issues";
    public static final String ISSUE = "/api/v1/issues/{id}";
    public static final String ISSUES_PAGE = "/api/v1/issues";
}
