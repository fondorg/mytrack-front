<script>
    import IssueCard from './IssueCard.svelte'
    import {querystring} from 'svelte-spa-router'
    import {parse, stringify} from "qs";

    export let projectId;
    export let issues = [];

    $: queryParams = parse($querystring)

    function queryWithScope(scope) {
        let qp = {}
        Object.assign(qp, queryParams)
        qp.scope = scope;
        return stringify(qp, {arrayFormat: 'brackets'})
    }

</script>

{#if issues.content && issues.content.length === 0}
    <div>No issues yet.</div>
{:else}
    <h1 class="font-bold">Issues</h1>
{/if}
<div class="underline flex pb-1 w-full md:w-3/4">
    <a class="px-1" class:bg-green-200={queryParams.scope === undefined || queryParams.scope === 'open'}
       href="#/projects/{projectId}/issues?{queryWithScope('open')}">Open</a>
    <a class="px-1" class:bg-green-200={queryParams.scope === 'closed'}
       href="#/projects/{projectId}/issues?{queryWithScope('closed')}">Closed</a>
    <a class="px-1" class:bg-green-200={queryParams.scope === 'all'}
       href="#/projects/{projectId}/issues?{queryWithScope('all')}">All</a>
</div>
{#if issues.content}
    {#each issues.content as issue}
        <IssueCard {issue}/>
    {/each}
{/if}