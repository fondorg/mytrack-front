<script>
    export let projectId
    export let tag
</script>

<style>
    .tag-color {
        color: white;
        background-color: var(--tag-color);
    }
</style>
{#if tag}
    <a href="#/projects/{projectId}/tags/{tag.id}" class="w-full md:w-2/3 my-1">
        <div class="flex justify-center px-2 py-3 tag-color  border" style="--tag-color: {tag.color}">
            <div>{tag.name}</div>
        </div>
    </a>
{/if}