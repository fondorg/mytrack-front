<script>
    import CenteredFlex from './CenteredFlex.svelte'
    import TagCard from './TagCard.svelte'

    export let projectId;
    export let tags = []
</script>


<CenteredFlex extraClasses="w-full">
    {#if tags}
        {#each tags as tag}
            <TagCard {tag} {projectId}/>
        {/each}
    {/if}
</CenteredFlex>
