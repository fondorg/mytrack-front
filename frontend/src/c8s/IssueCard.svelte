<script>
    export let issue;

</script>

{#if issue}
    <div class="flex flex-col p-2 border rounded-sm w-full  md:w-3/4 mb-2 mx-2 bg-gray-100">
        <div class="flex items-start">
            <img class="w-5 mr-2" src="/img/project.svg">
            <a href="#/projects/{issue.projectId}/issues/{issue.id}">
                <div class=" text-base md:text-base">{issue.title}</div>
            </a>
        </div>
        {#if issue.author}
            <div class="text-xs">{issue.author.firstName} {issue.author.lastName}</div>
        {/if}
    </div>
{/if}