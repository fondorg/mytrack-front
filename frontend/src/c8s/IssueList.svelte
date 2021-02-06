<script>
    import {onMount} from 'svelte';
    import Api from "../service/api-service";
    import IssueCard from './IssueCard.svelte'

    export let projectId;
    let issues = [];

    onMount(async () => {
        const api = new Api();
        issues = await api.getProjectIssues(projectId) || [];
        console.log(issues)
    })
</script>


<h1 class="font-bold">Issues</h1>
{#if issues.content}
    {#each issues.content as issue}
        <IssueCard {issue}/>
    {/each}
{/if}