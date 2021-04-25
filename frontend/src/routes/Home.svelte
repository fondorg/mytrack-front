<script>
    import {onMount} from 'svelte';
    import Layout from '../c8s/Layout.svelte'
    import CenteredFlex from "../c8s/CenteredFlex.svelte";
    import MediumTitle from '../c8s/MediumTitle.svelte'
    import ExtLink from '../c8s/ExtLink.svelte'

    onMount(() => {
    })
</script>

<Layout>
    <CenteredFlex>
        <MediumTitle title="MyTrack. Issue tracker"/>
        <div class="mt-5">Check out your <a class="underline" href="#/projects">Projects</a></div>

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
    </CenteredFlex>
</Layout>