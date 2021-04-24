<script>
    export let tag
    export let size='sm'
    export let href = "";
</script>

<style>
    .tag-color {
        color: white;
        background-color: var(--tag-color);
    }
</style>
<a {href} class="">
    <div class="text-{size} flex justify-center tag-color border rounded-lg px-1" style="--tag-color: {tag.color}">
        <div>{tag.name}</div>
    </div>
</a>