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

    </CenteredFlex>
</Layout>