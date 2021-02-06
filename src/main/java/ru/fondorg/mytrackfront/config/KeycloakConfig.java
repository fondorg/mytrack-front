package ru.fondorg.mytrackfront.config;

import org.keycloak.KeycloakPrincipal;
import org.keycloak.KeycloakSecurityContext;
import org.keycloak.adapters.KeycloakConfigResolver;
import org.keycloak.adapters.springboot.KeycloakSpringBootConfigResolver;
import org.keycloak.adapters.springboot.KeycloakSpringBootProperties;
import org.keycloak.adapters.springsecurity.KeycloakConfiguration;
import org.keycloak.adapters.springsecurity.authentication.KeycloakAuthenticationProvider;
import org.keycloak.adapters.springsecurity.client.KeycloakClientRequestFactory;
import org.keycloak.adapters.springsecurity.config.KeycloakWebSecurityConfigurerAdapter;
import org.keycloak.adapters.springsecurity.token.KeycloakAuthenticationToken;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.config.ConfigurableBeanFactory;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.web.servlet.ServletListenerRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Scope;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.authority.mapping.SimpleAuthorityMapper;
import org.springframework.security.core.session.SessionRegistryImpl;
import org.springframework.security.web.authentication.session.RegisterSessionAuthenticationStrategy;
import org.springframework.security.web.authentication.session.SessionAuthenticationStrategy;
import org.springframework.security.web.session.HttpSessionEventPublisher;
import org.springframework.web.context.request.ServletRequestAttributes;
import ru.fondorg.mytrackfront.restclient.ApiRestTemplate;

import java.security.Principal;


@KeycloakConfiguration
@EnableConfigurationProperties(KeycloakSpringBootProperties.class)
class KeycloakConfig extends KeycloakWebSecurityConfigurerAdapter {

    @Override
    protected void configure(HttpSecurity http) throws Exception {
        super.configure(http);
        http.cors().and().headers().frameOptions().sameOrigin().and().csrf().disable().authorizeRequests() //
                .antMatchers("/account", "/todos*", "/ping", "/api/**").authenticated() //
                .anyRequest().permitAll().and()//
        ;
    }



    /**
     * Enable Keycloak properties from properties / yaml
     *
     * @return
     */
    @Bean
    public KeycloakConfigResolver keycloakConfigResolver() {
        return new KeycloakSpringBootConfigResolver();
    }

    /*@Autowired
    public void initKeycloakConfigResolver(KeycloakSpringBootProperties keycloakSpringBootProperties, ApplicationContext context) {

        KeycloakSpringBootConfigResolverWrapper.setAdapterConfig(keycloakSpringBootProperties);
        KeycloakSpringBootConfigResolverWrapper.setApplicationContext(context);

        // trigger wiring of KeycloakSpringBootConfigResolver, what an API...
        new KeycloakSpringBootConfigResolverWrapper();
    }*/

    /**
     * Enhance {@link KeycloakAuthenticationProvider} with additional {@link org.springframework.security.core.authority.mapping.GrantedAuthoritiesMapper}.
     *
     * @param auth
     */
    @Autowired
    public void configureGlobal(AuthenticationManagerBuilder auth) {

        KeycloakAuthenticationProvider keycloakAuthenticationProvider = keycloakAuthenticationProvider();

        SimpleAuthorityMapper grantedAuthorityMapper = new SimpleAuthorityMapper();
        grantedAuthorityMapper.setPrefix("ROLE_");
        grantedAuthorityMapper.setConvertToUpperCase(true);
        keycloakAuthenticationProvider.setGrantedAuthoritiesMapper(grantedAuthorityMapper);
        auth.authenticationProvider(keycloakAuthenticationProvider);
    }

    @Bean
    @Override
    protected SessionAuthenticationStrategy sessionAuthenticationStrategy() {
        return new RegisterSessionAuthenticationStrategy(new SessionRegistryImpl());
    }

    @Bean
    @Scope(ConfigurableBeanFactory.SCOPE_PROTOTYPE)
    public ApiRestTemplate keycloakRestTemplate(KeycloakClientRequestFactory requestFactory) {
        return new ApiRestTemplate(requestFactory);
    }

    /**
     * Returns the {@link KeycloakSecurityContext} from the Spring
     * {@link ServletRequestAttributes}'s {@link Principal}.
     * <p>
     * The principal must support retrieval of the KeycloakSecurityContext, so at
     * this point, only {@link KeycloakPrincipal} values and
     * {@link KeycloakAuthenticationToken} are supported.
     *
     * @return the current <code>KeycloakSecurityContext</code>
     */
    /*@Bean
    @Scope(scopeName = WebApplicationContext.SCOPE_REQUEST, proxyMode = ScopedProxyMode.TARGET_CLASS)
    public KeycloakSecurityContext getKeycloakSecurityContext() {

        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        Principal principal = attributes.getRequest().getUserPrincipal();
        if (principal == null) {
            return null;
        }

        if (principal instanceof KeycloakAuthenticationToken) {
            principal = Principal.class.cast(KeycloakAuthenticationToken.class.cast(principal).getPrincipal());
        }

        if (principal instanceof KeycloakPrincipal) {
            return KeycloakPrincipal.class.cast(principal).getKeycloakSecurityContext();
        }

        return null;
    }*/

    /**
     * Required to support Session invalidation on backchannel logout!
     */
    @Bean
    protected ServletListenerRegistrationBean<?> httpSessionEventPublisher() {
        return new ServletListenerRegistrationBean<>(new HttpSessionEventPublisher());
    }
}