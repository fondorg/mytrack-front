package ru.fondorg.mytrackfront.util;

public interface ApiPathBuilder {

    /**
     * Builds complete URL for backend API with the specified path.
     * Path is allowed to contain slashes and other special characters such as variable mappings.
     * These characters will not be replaced
     * @param path        Path to be added to the resulting API URL
     * @param queryParams a Map of query parameters to be added to the resulting URL
     * @return Complete URL for API
     */
    String getUrl(String path, String... queryParams);
}
