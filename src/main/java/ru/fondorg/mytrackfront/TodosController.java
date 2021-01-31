package ru.fondorg.mytrackfront;

//import org.keycloak.KeycloakPrincipal;

import lombok.RequiredArgsConstructor;
import org.keycloak.adapters.springsecurity.client.KeycloakRestTemplate;
import org.springframework.beans.BeansException;
import org.springframework.context.ApplicationContext;
import org.springframework.context.ApplicationContextAware;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import ru.fondorg.mytrackfront.domain.Project;

import java.util.List;

@Controller
@RequiredArgsConstructor
public class TodosController implements ApplicationContextAware {

    ApplicationContext context;

    /*@Autowired
    public KeycloakRestTemplate keycloakRestTemplate;*/

    private final KeycloakRestTemplate keycloakRestTemplate;

    @GetMapping("/todos")
    public String handleMain(@AuthenticationPrincipal Authentication currentUser) {
        /*KeycloakClientRequestFactory factory = new KeycloakClientRequestFactory() {
            *//*@Override
            protected KeycloakSecurityContext getKeycloakSecurityContext() {
                return principal.getKeycloakSecurityContext();
            }*//*

            @Override
            protected void postProcessHttpRequest(HttpUriRequest request) {
                KeycloakSecurityContext context = this.getKeycloakSecurityContext();
                request.setHeader(AUTHORIZATION_HEADER, "Bearer " + context.getTokenString());
            }
        };*/
        //keycloakRestTemplate = new KeycloakRestTemplate(factory);
        //KeycloakSecurityContext.getContext().getAuthentication();

        List<Project> list = exchangeAsList("http://localhost:9090/api/v1/projects", new ParameterizedTypeReference<List<Project>>() {
        });
        return "todos.html";
    }

    public <T> List<T> exchangeAsList(String uri, ParameterizedTypeReference<List<T>> responseType) {
        //KeycloakRestTemplate keycloakRestTemplate = context.getBean(KeycloakRestTemplate.class);

        return keycloakRestTemplate.exchange(uri, HttpMethod.GET, null, responseType).getBody();
    }

    @Override
    public void setApplicationContext(ApplicationContext applicationContext) throws BeansException {
        this.context = applicationContext;
    }

//    @GetMapping("/api/vi/projects")
//    public ResponseEntity<List<Project>>
}
