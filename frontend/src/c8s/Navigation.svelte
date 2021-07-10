<script>
    import {logout, login, isAuthenticated, userInfo} from './OidcContext.svelte'
    import {push} from 'svelte-spa-router'
    import LinkButton from './LinkButton.svelte'
    import Button from "./Button.svelte";

    let menuHide = true;


    async function doLogout() {
        await logout()
        push("/")
    }
</script>

<nav class="flex items-center justify-between flex-wrap p-6  border-b-2 lg:border-0">
    <div class="flex items-center flex-shrink-0 text-white mr-6">
        <a href="#/">
            <img class="w-32" src="/img/logo_1.svg" alt="logo">
        </a>
    </div>
    <div class="block lg:hidden">
        <button on:click={() => menuHide = !menuHide}
                class="flex items-center px-3 py-2 border border-gray-500 rounded hover:text-gray-600 hover:border-gray-600 focus:outline-none">
            <img src="/img/dots-horizontal.svg" class="w-3" alt="">
            <!--<svg class="fill-current h-3 w-3" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><title>Menu</title>
                <path d="M0 3h20v2H0V3zm0 6h20v2H0V9zm0 6h20v2H0v-2z"/>
            </svg>-->
        </button>
    </div>
    <div id="collapsible" class="w-full block flex-grow lg:flex lg:items-center lg:w-auto" class:hidden={menuHide}
         on:click={() => menuHide = true}>
        <div class="text-sm lg:flex-grow">
            <a href="#/tasks" class="block mt-4 lg:inline-block lg:mt-0 hover:text-gray-600 mr-4">
                Tasks
            </a>
            <a href="#/projects" class="block mt-4 lg:inline-block lg:mt-0 hover:text-gray-600 mr-4">
                Projects
            </a>
            <a href="#/tags" class="block mt-4 lg:inline-block lg:mt-0 hover:text-gray-600 mr-4">
                Tags
            </a>
            <!--<a href="#responsive-header" class="block mt-4 lg:inline-block lg:mt-0 hover:text-gray-600">
                Blog
            </a>-->
        </div>
        <div class="flex items-center mt-4 lg:mt-0">
            {#if !$isAuthenticated}
                <LinkButton name="Login" href="/" on:click={() => login()}/>
            {/if}
            {#if $isAuthenticated}
                <a href="OIDC_ACCOUNT_SERVICE?referrer=OIDC_CLIENT_ID" class="mr-5 flex items-center text-sm">
                    <svg class="w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="black">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                    </svg>
                    <span>{$userInfo.preferred_username}</span>
                </a>
                <Button name="Logout" on:click={doLogout}/>
            {/if}
        </div>
    </div>
</nav>