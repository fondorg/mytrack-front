<script>
    import {push} from 'svelte-spa-router'
    import {login, isAuthenticated} from '../c8s/OidcContext.svelte'
    import {onMount} from 'svelte';
    import LinkButton from '../c8s/LinkButton.svelte'

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
</div>