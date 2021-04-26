<script>
    import {onMount} from 'svelte'
    import CenteredFlex from '../c8s/CenteredFlex.svelte'
    import Api from '../service/api-service';
    import LinkButton from '../c8s/LinkButton.svelte'
    import marked from 'marked'
    import ColorButton from "../c8s/ColorButton.svelte";
    import {push} from 'svelte-spa-router'
    import IssueTags from '../c8s/IssueTags.svelte'
    import MicroTitle from "../c8s/MicroTitle.svelte";
    import IssueComments from '../c8s/IssueComments.svelte'
    import MarkdownCss from '../c8s/MarkdownCss.svelte'

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

<MarkdownCss/>
{#if issue}
    <CenteredFlex>
        <div class="text-sm mb-2">
            <a class="underline" href="#/projects/{projectId}/issues">issues</a> > issue #{issue.pid}
        </div>
        <div id="title-container" class="flex w-full items-start">
            <div class="text-md font-bold flex-grow">{issue.title}</div>
            <div class="pt-1 flex">
                <LinkButton small="true" name="Edit" href="#/projects/{projectId}/issues/{params.issueId}/edit"/>
            </div>
        </div>
        <div class="flex w-full justify-start items-center mt-1">
            <div class="text-sm">
                author: {issue.author != undefined ? issue.author.firstName + ' ' + issue.author.lastName : ''}
            </div>
            <div class="ml-2 text-sm">
                created: {issue.created}
            </div>
            {#if issue.closed}
                <div class="ml-2 float-right px-1 border rounded bg-red-700 text-white text-xs">closed</div>
            {/if}
        </div>
        <div class="w-full divide-y divide-gray-400">
            <div id="markdown-container"
                 class="w-full px-2 pt-2 md:p-3 text-sm text-justify whitespace-pre-wrap">{@html marked(issue.description)}</div>

            <div class="w-full py-2">
                <MicroTitle title="Tags"/>
                <IssueTags {issue}/>
            </div>

            <div id="issue-action" class="py-2">
                <MicroTitle title="Actions"/>
                <ColorButton small="true" on:click={switchCloseState}
                             name="{issue.closed ? 'Reopen issue' : 'Close issue'}" bgColor="border-red-700"
                             textColor="text-red-700"
                             pressedBackground="bg-red-200"/>
            </div>
            <div id="issue-comments" class="py-2">
                <MicroTitle title="Comments"/>
                <IssueComments {projectId} issueId="{issue.id}"/>
            </div>
        </div>
    </CenteredFlex>
{/if}


