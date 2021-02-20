<script>
    import {onMount} from 'svelte'
    import CenteredFlex from '../c8s/CenteredFlex.svelte'
    import Api from '../service/api-service';
    import LinkButton from '../c8s/LinkButton.svelte'
    import marked from 'marked'

    export let params;
    export let projectId;
    export let issue;
    let api = new Api();

    onMount(async () => {
        issue = await api.getProjectIssue(projectId, params.issueId);
    })

    function delayedMarkdown() {

    }
</script>

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
</style>

{#if issue}
    <CenteredFlex>
        <div class="font-bold">issue #{issue.id}</div>
        <div id="title-container" class="flex w-full items-start">
            <div class="text-lg font-bold flex-grow">{issue.title}</div>
            <div class="pt-1">
                <LinkButton small="true" name="Edit" href="#/projects/{projectId}/issues/{params.issueId}/edit"/>
            </div>
        </div>
        <div class="w-full text-sm">author: {issue.author.firstName} {issue.author.lastName}</div>
        <div id="desc-container"
             class="w-full p-3 text-sm text-justify whitespace-pre-wrap">{@html marked(issue.description)}</div>
    </CenteredFlex>
{/if}
