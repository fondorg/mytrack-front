<script>
    export let name = "Button"
    export let href = "/"
    export let defaultAction = false;
    export let small = false;
</script>

<a href="{href}" on:click
   class:bg-green-200={defaultAction}
   class="inline-block  {small ? 'px-2 py-1 text-xs' : 'px-4 py-2 text-sm'} leading-none border rounded border-black
   active:bg-gray-300 border-gray-500 lg:mt-0">{name}</a>