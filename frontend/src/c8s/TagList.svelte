<script>
    import CenteredFlex from './CenteredFlex.svelte'
    import TagCard from './TagCard.svelte'

    export let projectId;
    export let commonTags = false;
    export let tags = []
</script>


<CenteredFlex extraClasses="w-full">
    {#if tags}
        {#each tags as tag}
            <TagCard commonTag={commonTags} {tag} {projectId} />
        {/each}
    {/if}
</CenteredFlex>
