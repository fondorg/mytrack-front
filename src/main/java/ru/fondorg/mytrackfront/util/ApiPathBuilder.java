package ru.fondorg.mytrackfront.util;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;
import ru.fondorg.mytrackfront.config.MyTrackProperties;

@Component
@RequiredArgsConstructor
public class ApiPathBuilder {
    private final MyTrackProperties properties;


    public static final String API_PREFIX = "api";
    public static final String API_VER = "v1";

    /**
     * Builds API path with the given segments
     * @param segments segments of the API path
     * @return API URL
     */
    public String buildPath(String... segments) {
        UriComponentsBuilder builder = UriComponentsBuilder.newInstance();
        return builder.scheme(properties.getApiSchema()).host(properties.getApiHost()).port(properties.getApiPort())
                .pathSegment(API_PREFIX, API_VER)
                .pathSegment(segments).toUriString();
    }
}
