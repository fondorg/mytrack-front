<script>
    import {onMount} from 'svelte'
    import CenteredFlex from '../c8s/CenteredFlex.svelte'
    import Api from '../service/api-service';

    export let params;
    export let projectId;
    export let issue;
    let api = new Api();

    onMount(async () => {
        issue = await api.getProjectIssue(projectId, params.issueId);
    })
</script>

{#if issue}
    <CenteredFlex>
        <div class="text-lg">{issue.title}</div>
        <div class="text-sm">{issue.description}</div>
    </CenteredFlex>
{/if}