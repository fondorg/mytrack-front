<script>
    import {onMount} from "svelte";
    import Api from '../service/api-service'
    import CenteredFlex from '../c8s/CenteredFlex.svelte'

    const api = new Api();
    let tag;
    export let params;
    export let projectId;

    onMount(async () => {
        tag = await api.getProjectTag(projectId, params.tagId);
    })
</script>

{#if tag}
    <CenteredFlex>

    </CenteredFlex>

{/if}