package ru.fondorg.mytrackfront.util;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.util.MultiValueMap;
import org.springframework.web.util.UriComponentsBuilder;
import ru.fondorg.mytrackfront.config.MyTrackProperties;

import java.util.stream.Stream;

@Component
@RequiredArgsConstructor
public class ApiV1PathBuilder implements ApiPathBuilder {

    private final MyTrackProperties properties;

    @Override
    public String getUrl(String path, String... queryParams) {
        UriComponentsBuilder builder = UriComponentsBuilder.newInstance();
        builder.scheme(properties.getApiSchema()).host(properties.getApiHost()).port(properties.getApiPort())
                .path(path);
        Stream.of(queryParams).forEach(builder::query);
        return builder.build(false).toUriString();
    }

    @Override
    public String getUrl(String path, MultiValueMap<String, String> params) {
        UriComponentsBuilder builder = UriComponentsBuilder.newInstance();
        builder.scheme(properties.getApiSchema()).host(properties.getApiHost()).port(properties.getApiPort())
                .path(path).queryParams(params);
        return builder.build(false).toUriString();
    }
}
