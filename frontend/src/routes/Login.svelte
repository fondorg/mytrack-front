<script>
    import {push} from 'svelte-spa-router'
    import {login, isAuthenticated} from '../c8s/OidcContext.svelte'
    import {onMount} from 'svelte';
    import LinkButton from '../c8s/LinkButton.svelte'
    import CenteredFlex from "../c8s/CenteredFlex.svelte";
    import MediumTitle from '../c8s/MediumTitle.svelte'
    import ExtLink from '../c8s/ExtLink.svelte'

    let errorMsg;

    function doLogin() {
        errorMsg = undefined;
        login().catch(e => errorMsg = e.message);
    }

</script>

<div class="container mx-auto flex flex-col items-center pt-16">
    <div class="mt-8 p-6 lg:w-1/2 sm:w-3/4 bg-green-500 flex flex-col">
        <img src="/img/logo_1_inv.svg" alt="">
        <div class="text-white mt-8 flex justify-end">
            Simple general purpose issue tracker
        </div>
    </div>
    <div class="mt-16">
        <LinkButton name="Login" href="#" on:click={doLogin}/>
    </div>
    {#if errorMsg}
        <div class="bg-red-500 mt-8">
        {errorMsg}
        </div>
    {/if}

    <CenteredFlex extraClasses="mt-10">
        <div class="border-t w-11/12 pb-2"></div>
        <MediumTitle title="General purpose issue tracker"/>
        <div class="text-justify md:w-3/4 px-2 md:px-0">
            <div>
                This is an open source training project that provides issue tracker functionality.
                The project currently contains a couple of separate services. Source can be found here:
            </div>
            <ul class="list-disc">
                <li>
                    <ExtLink href="https://github.com/fondorg/mytrack-srv"
                             title="https://github.com/fondorg/mytrack-srv"/>
                    - domain logic backend service
                </li>
                <li>
                    <ExtLink href="https://github.com/fondorg/mytrack-front"
                             title="https://github.com/fondorg/mytrack-front"/>
                    - web front-end service
                </li>
            </ul>
            <div class="mt-2">
                <ExtLink href="https://www.keycloak.org" title="Keycloak"/>
                is used for
                access management. It provides single-sign on for all applications by means of OAuth 2.0
                protocol.
            </div>
            <div class="mt-2">
                <MediumTitle title="Technology stack"/>
                <div class="mt-1">Backend:</div>
                <ul class="list-disc">
                    <li>Spring Boot</li>
                    <li>Spring Data JPA</li>
                    <li>MySQL</li>
                    <li>
                        <ExtLink href="http://www.querydsl.com/" title="Querydsl"/>
                    </li>
                </ul>
                <div class="mt-1">Frontend:</div>
                <ul class="list-disc">
                    <li>Spring Boot</li>
                    <li>
                        <ExtLink href="http://svelte.dev" title="Svelte"/>
                    </li>
                    <li>
                        <ExtLink href="https://tailwindcss.com" title="Tailwindcss"/>
                    </li>
                    <li>
                        <ExtLink href="https://rollupjs.org/guide/en/" title="Rollup.js"/>
                    </li>
                    <li>
                        <ExtLink href="https://github.com/ItalyPaleAle/svelte-spa-router"
                                 title="Svelte SPA Router"/>
                    </li>
                    <li>
                        <ExtLink href="https://github.com/postcss/postcss" title="Postcss"/>
                    </li>
                    <li>
                        <ExtLink href="https://github.com/IdentityModel/oidc-client-js" title="oidc-client-js"/>
                    </li>
                    <li>
                        <ExtLink href="https://github.com/axios/axios" title="Axios"/>
                    </li>
                    <li>
                        <ExtLink href="https://github.com/ansman/validate.js" title="Validate.js"/>
                    </li>
                </ul>
            </div>
            <div class="mt-2">
                <MediumTitle title="Deploy"/>
                <div>Each service provides a set of Kubernetes manifests for deployment</div>
            </div>
            <div class="mt-2">
                <MediumTitle title="MyTracker features"/>
                <div>Some main MyTracker features currently available</div>
                <ul class="list-disc">
                    <li>Projects management</li>
                    <li>Issue management</li>
                    <li>Issue tagging</li>
                </ul>
            </div>
        </div>
    </CenteredFlex>
</div>