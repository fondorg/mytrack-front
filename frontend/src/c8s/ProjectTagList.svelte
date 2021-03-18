<script>
    import CenteredFlex from './CenteredFlex.svelte'
    import {onMount} from 'svelte'
    import Api from '../service/api-service'

    export let tags = []
    export let issueTags = []
    export let projectId;
    const api = new Api();

    onMount(async () => {
        tags = await api.getProjectTags(projectId);
    })

</script>

<CenteredFlex>
    {#each tags as tag}
        <div>{tag.name}</div>
    {/each}
</CenteredFlex>

