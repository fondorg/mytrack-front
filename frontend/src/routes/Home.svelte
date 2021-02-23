<script>
    import {push} from 'svelte-spa-router'
    import {login, isAuthenticated} from '../c8s/OidcContext.svelte'
    import {onMount} from 'svelte';
    import LinkButton from '../c8s/LinkButton.svelte'
    import Layout from '../c8s/Layout.svelte'
    import CenteredFlex from "../c8s/CenteredFlex.svelte";

    /*$: {
        if ($isAuthenticated) {
            console.log('redirecting to tasks')
            push("/tasks");
        }
    }*/

    onMount(() => {
        console.log("Home onMount")
    })
</script>

<Layout>
    <CenteredFlex>
        <div class="mt-10">Home component</div>
        <div class="mt-10">Check out your <a class="underline" href="#/projects">Projects</a></div>
    </CenteredFlex>
</Layout>