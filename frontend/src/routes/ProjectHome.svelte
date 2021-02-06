<script>
    import CenteredFlex from "../c8s/CenteredFlex.svelte";

    export let project = {};

</script>
<CenteredFlex>
    {#if project}
        <div>{project.description}</div>
    {/if}
</CenteredFlex>