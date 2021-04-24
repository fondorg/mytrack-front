package ru.fondorg.mytrackfront.util;

import org.springframework.util.MultiValueMap;

public interface ApiPathBuilder {

    /**
     * Builds complete URL for backend API with the specified path.
     * Path is allowed to contain slashes and other special characters such as variable mappings.
     * These characters will not be replaced
     *
     * @param path        Path to be added to the resulting API URL
     * @param queryParams a Map of query parameters to be added to the resulting URL
     * @return Complete URL for API
     */
    String getUrl(String path, String... queryParams);

    /**
     * Overload of {@link #getUrl(String, String...)}. Allows to provide query params as multi-value map
     *
     * @param path   Path to be added to the resulting API URL
     * @param params Multi-value map of query params
     * @return Complete URL for API
     */
    String getUrl(String path, MultiValueMap<String, String> params);
}
