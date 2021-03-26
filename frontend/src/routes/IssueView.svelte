<script>
    import {onMount} from 'svelte'
    import CenteredFlex from '../c8s/CenteredFlex.svelte'
    import Api from '../service/api-service';
    import LinkButton from '../c8s/LinkButton.svelte'
    import marked from 'marked'
    import ColorButton from "../c8s/ColorButton.svelte";
    import {push} from 'svelte-spa-router'
    import IssueTags from '../c8s/IssueTags.svelte'

    export let params;
    export let projectId;
    export let issue;
    let api = new Api();

    onMount(async () => {
        issue = await api.getProjectIssue(projectId, params.issueId);
    })

    async function switchCloseState() {
        issue.closed = !issue.closed;
        issue = await api.saveProjectIssue(projectId, issue);
        push(`#/projects/${projectId}/issues/${issue.id}`)
    }
</script>

{#if issue}
    <CenteredFlex>
        <div class="font-bold">issue #{issue.id}</div>
        <div id="title-container" class="flex w-full items-start">
            <div class="text-md font-bold flex-grow">{issue.title}</div>
            <div class="pt-1 flex">
                <LinkButton small="true" name="Edit" href="#/projects/{projectId}/issues/{params.issueId}/edit"/>
            </div>
        </div>
        <div class="flex w-full justify-start items-center mt-1">
            <div class="text-sm w-full">author: {issue.author.firstName} {issue.author.lastName}</div>
            {#if issue.closed}
                <div class="float-right px-1 border rounded bg-red-700 text-white text-xs">closed</div>
            {/if}
        </div>
        <div class="divide-y divide-gray-400">
            <div id="desc-container"
                 class="w-full px-2 pt-2 md:p-3 text-sm text-justify whitespace-pre-wrap">{@html marked(issue.description)}</div>
            <IssueTags {issue}/>

            <div id="issue-action">
                <ColorButton small="true" on:click={switchCloseState}
                             name="{issue.closed ? 'Reopen issue' : 'Close issue'}" bgColor="border-red-700"
                             textColor="text-red-700"
                             pressedBackground="bg-red-200"/>
            </div>
        </div>
    </CenteredFlex>
{/if}

<style>
    #desc-container :global(h1) {
        font-size: 2rem;
        font-weight: bold;
    }

    #desc-container :global(h2) {
        font-size: 1.5rem;
        font-weight: bold;
    }

    #desc-container :global(h3) {
        font-size: 1rem;
        font-weight: bold;
    }

    #desc-container :global(h4) {
        font-size: 0.75rem;
        font-weight: bold;
    }

    #desc-container :global(a) {
        color: blue;
        text-decoration: underline;
    }

    #desc-container :global(ol, ul) {
        list-style: inside;
    }

</style>
