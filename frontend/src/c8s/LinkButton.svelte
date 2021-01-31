<script>
    import {link} from 'svelte-spa-router'

    export let name = "Button"
    export let href = "/"
    export let defaultAction = false;

</script>

<a href="{href}" on:click
   class:bg-green-200={defaultAction}
   class="inline-block text-sm px-4 py-2 leading-none border rounded border-black active:bg-gray-300 border-gray-500 lg:mt-0">{name}</a>