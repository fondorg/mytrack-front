package ru.fondorg.mytrackfront.restclient;

import org.keycloak.adapters.springsecurity.client.KeycloakClientRequestFactory;
import org.keycloak.adapters.springsecurity.client.KeycloakRestTemplate;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import ru.fondorg.mytrackfront.controller.PageResource;

import java.util.List;

/**
 * Provides convenient methods on top of {@link KeycloakRestTemplate}
 */
public class ApiRestTemplate extends KeycloakRestTemplate {

    public ApiRestTemplate(KeycloakClientRequestFactory factory) {
        super(factory);
    }

    public <T> List<T> exchangeAsList(String uri) {
        return exchange(uri, HttpMethod.GET, null,
                new ParameterizedTypeReference<List<T>>() {
                }).getBody();
    }

    public <T> PageResource<T> exchangeAsPage(String uri, Object... uriVars) {
        return exchange(uri, HttpMethod.GET, null,
                new ParameterizedTypeReference<PageResource<T>>() {
                }, uriVars).getBody();
    }
}
