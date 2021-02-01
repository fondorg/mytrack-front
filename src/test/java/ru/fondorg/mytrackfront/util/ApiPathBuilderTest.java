package ru.fondorg.mytrackfront.util;

import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import ru.fondorg.mytrackfront.config.MyTrackProperties;

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

    @Test
    public void pathCompose() throws Exception {
        ApiPathBuilder builder = new ApiPathBuilder(properties);
        String testPath = "projects";
        String uri = builder.buildPath(testPath);
        Assertions.assertThat(uri).isEqualTo(
                String.format("%s://%s:%d/%s/%s/%s", schema, host, port,
                        ApiPathBuilder.API_PREFIX, ApiPathBuilder.API_VER, testPath));

    }

}