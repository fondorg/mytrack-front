<script>
    import CenteredFlex from '../c8s/CenteredFlex.svelte'
    import Api from '../service/api-service'
    import {onMount} from 'svelte'

    let Api = new Api()
    export let projectId;
    let tags = []

    onMount(async () => {
        tags = await Api.getProjectTags(projectId)
    })


</script>

<CenteredFlex>
    {#each tags as tag}
        <div >
            {tag.name}
        </div>

    {/each}

</CenteredFlex>