package ru.fondorg.mytrackfront.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(MyTrackProperties.class)
public class MyTrackConfig {
}
