<script>
    import {onMount} from 'svelte';
    import Api from "../service/api-service";

    export let projectId;
    let issues = [];

    onMount(async () => {
        const api = new Api();
        issues = await api.getProjectIssues(projectId) || [];
    })
</script>


<h1 class="font-bold">Issues</h1>
{#if issues.content}
    {#each issues.content as issue}
        issue.title
    {/each}
{/if}