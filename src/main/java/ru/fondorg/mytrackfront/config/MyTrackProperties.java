package ru.fondorg.mytrackfront.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Data
@ConfigurationProperties(prefix = "mytrack")
public class MyTrackProperties {

    private String mytrackSrvBaseUrl;

    private String apiHost;

    private Integer apiPort;

    private String apiSchema;

    private Integer defaultIssuesPageSize = 20;

}
