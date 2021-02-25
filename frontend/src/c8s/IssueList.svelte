<script>
    import IssueCard from './IssueCard.svelte'

    export let projectId;
    export let issues = [];

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