<script>
    import {onMount} from 'svelte';
    import Layout from '../c8s/Layout.svelte'
    import CenteredFlex from "../c8s/CenteredFlex.svelte";
    import MediumTitle from '../c8s/MediumTitle.svelte'
    import MicroTitle from '../c8s/MicroTitle.svelte'

    onMount(() => {
    })
</script>

<Layout>
    <CenteredFlex>
        <MediumTitle title="MyTrack. Issue tracker"/>
        <div class="mt-5">Check out your <a class="underline" href="#/projects">Projects</a></div>


        <CenteredFlex extraClasses="mt-10">
            <div class="border-t w-11/12 pb-2"></div>
            <MicroTitle title="General purpose issue tracker"/>
            <p class="text-justify md:w-3/4">
                This is an open source training project
            </p>
        </CenteredFlex>
    </CenteredFlex>
</Layout>