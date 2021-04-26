<script>
    import Tailwindcss from './Tailwindcss.svelte'
    import CenteredFlex from './c8s/CenteredFlex.svelte'
    import Header from './c8s/Header.svelte'
    import Navigation from './c8s/Navigation.svelte'
    import ProjectList from "./c8s/ProjectList.svelte";
    import Login from './routes/Login.svelte'

    import OidcContext, {
        authError,
        idToken,
        accessToken,
        isAuthenticated,
        isLoading,
        login,
        logout,
        refreshToken,
        userInfo,
        isReady
    } from './c8s/OidcContext.svelte';

    import Router from 'svelte-spa-router'
    import {authRoutes, anonymousRoutes} from './routes.js'
    import {replace} from 'svelte-spa-router'

    /*$: {
        console.log("is ready: ", $isReady)
    }*/

    function onRouteConditionFailed(e) {
        console.log("onRouteConditionFailed", e.detail)
        replace("/login");
    }
</script>

<Tailwindcss/>
<OidcContext
        issuer="OIDC_ISSUER"
        client_id="OIDC_CLIENT_ID"
        redirect_uri="OIDC_REDIRECT_URL"
        post_logout_redirect_uri="OIDC_LOGOUT_REDIRECT_URL">
</OidcContext>
{#if $isReady}
    {#if $isAuthenticated}
        <Router routes={authRoutes} on:conditionsFailed={onRouteConditionFailed}/>
    {:else}
        <Login/>
    {/if}
{:else}

{/if}

<!--{#if !$isLoading && $isAuthenticated}
    <ProjectList/>
{/if}-->

<!--<div>OIDC check:</div>
<OidcContext
        issuer="OIDC_ISSUER"
        client_id="OIDC_CLIENT_ID"
        redirect_uri="OIDC_REDIRECT_URL"
        post_logout_redirect_uri="OIDC_LOGOUT_REDIRECT_URL"
>

    {#if !$isAuthenticated}
        <button class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
                on:click|preventDefault='{() => login() }'>Login
        </button>
    {/if}
    {#if $isAuthenticated}
        <button class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
                on:click|preventDefault='{() => logout() }'>Logout
        </button>
    {/if}
    <br/>
    <pre>isLoading: {$isLoading}</pre>
    <pre>isAuthenticated: {$isAuthenticated}</pre>
    <pre>authToken: {$accessToken}</pre>
    <pre>idToken: {$idToken}</pre>
    <pre>userInfo: {JSON.stringify($userInfo, null, 2)}</pre>
    <pre>authError: {$authError}</pre>
</OidcContext>-->
