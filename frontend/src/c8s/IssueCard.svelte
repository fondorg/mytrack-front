<script>
    import IssueTagLabel from './IssueTagLabel.svelte'

    export let issue;

</script>

{#if issue}
    <div class="flex flex-col p-2 border rounded-sm w-full md:w-3/4 mb-2 mx-2 bg-gray-100">
        <div class="flex items-start">
            <img class="w-5 mr-2" src="/img/project.svg">
            <a href="#/projects/{issue.projectId}/issues/{issue.id}">
                <div class="text-base md:text-base">{issue.title}</div>
            </a>
        </div>
        <div class="text-xs flex items-start">
            <div class="text-sm mr-2">#{issue.pid}</div>
            <div class="md:flex">
                <div class="mr-2">
                    {#if issue.author}
                        <div class="mr-2">
                            Author: {issue.author.firstName} {issue.author.lastName}
                        </div>
                    {/if}
                    <div>created: {issue.created}</div>
                </div>
                <div class="flex space-x-1">
                    {#each issue.tags as tag}
                        <IssueTagLabel href={`#/projects/${issue.projectId}/issues/?tags[]=${tag.name}`} {tag}
                                       size="xs"/>
                    {/each}
                </div>
            </div>
        </div>
    </div>
{/if}