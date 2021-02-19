package ru.fondorg.mytrackfront.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfiguration implements WebMvcConfigurer {
//    @Override
//    public void addViewControllers(ViewControllerRegistry registry) {
//        registry.addViewController("/{spring:\\w+}")
//                .setViewName("forward:/");
//        registry.addViewController("/**/{spring:\\w+}")
//                .setViewName("forward:/");
//        registry.addViewController("/{spring:\\w+}/**{spring:?!(\\.js|\\.css)$}")
//                .setViewName("forward:/");
//    }


    @Override
    public void addCorsMappings(CorsRegistry registry) {
        //registry.addMapping("/**").allowedOrigins("http://localhost:8080", "*");
        registry.addMapping("/**")
                //.allowedOrigins("*") //this one is working
                .allowedOrigins("http://localhost:8080", "http://localhost:5000", "http://keycloak:9999", "http://192.168.0.108:8080",
                        "http://192.168.0.108:9999")
                .allowedMethods("PUT", "GET", "DELETE", "OPTIONS", "PATCH", "POST");
    }
}
