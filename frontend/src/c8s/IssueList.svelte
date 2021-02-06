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

{#if issues.content && issues.content.length === 0}
    <div>No issues yet.</div>
{:else}
    <h1 class="font-bold">Issues</h1>
{/if}
{#if issues.content}
    {#each issues.content as issue}
        <IssueCard {issue}/>
    {/each}
{/if}