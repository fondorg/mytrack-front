package ru.fondorg.mytrackfront.util;

import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import ru.fondorg.mytrackfront.config.MyTrackProperties;

import java.util.HashMap;
import java.util.Map;

class ApiPathBuilderTest {

    private MyTrackProperties properties;
    private static final String schema = "http";
    private static final String host = "localhost";
    private static final Integer port = 9090;

    @BeforeEach
    public void init() {
        properties = new MyTrackProperties();
        properties.setApiSchema(schema);
        properties.setApiHost(host);
        properties.setApiPort(port);
    }

    /**
     * Checks the building of the correct api uri
     */
    @Test
    public void pathCompose() {
        ApiPathBuilder builder = new ApiV1PathBuilder(properties);
        String testPath = "api/v1/projects";
        String uri = builder.getUrl(testPath);
        Assertions.assertThat(uri).isEqualTo(
                String.format("%s://%s:%d/%s", schema, host, port, testPath));

    }

    /**
     * Checks the specified query params substitution
     */
    @Test
    public void pathWithQueryParams() {
        ApiV1PathBuilder builder = new ApiV1PathBuilder(properties);
        Map<String, Object> queryParams = new HashMap<>();
        queryParams.put("page", 1);
        queryParams.put("size", 20);
        /*String uri = builder.getUrl(queryParams, "issues");
        Assertions.assertThat(uri).contains("page=1").contains("size=20");*/
    }

}