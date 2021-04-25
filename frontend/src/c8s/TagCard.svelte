<script>
    export let projectId
    export let tag
    export let commonTag = false;

/*
    let href;
    $:
    {
        href = commonTag === true ? `#/tags/${tag.id}` : `#/projects/${projectId}/tags/${tag.id}`
    }
*/

/*
    function getHref() {
        console.log('common tag: ', commonTag)
        if (commonTag === true) {
            return `#/tags/${tag.id}`
        } else {
            return `#/projects/${projectId}/tags/${tag.id}`
        }
    }
*/
</script>

<style>
    .tag-color {
        color: white;
        background-color: var(--tag-color);
    }
</style>
{#if tag}
    {#if commonTag}
        <a href="#/tags/{tag.id}" class="w-full md:w-2/3 my-1">
            <div class="flex justify-center px-2 py-3 tag-color  border" style="--tag-color: {tag.color}">
                <div>{tag.name}</div>
            </div>
        </a>
    {:else}
        <a href="#/projects/{projectId}/tags/{tag.id}" class="w-full md:w-2/3 my-1">
            <div class="flex justify-center px-2 py-3 tag-color  border" style="--tag-color: {tag.color}">
                <div>{tag.name}</div>
            </div>
        </a>
    {/if}
{/if}