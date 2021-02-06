<script>
    import {onMount} from 'svelte'

    export let label
    export let value;
    export let errorMsg;
    export let autofocus = undefined;

    let input;

    onMount(() => {
        if (autofocus) {
            setTimeout(() => {
                input.focus();
            }, 0)

        }
    })
</script>

<div class="grid sm:grid-cols-3 sm:gap-4 mb-2">
    <label class="">{label}</label>
    <div class="flex flex-col col-span-2">
        <input bind:this={input} name="title" type="text"
               class="px-2 border border-gray-400 focus:border-indigo-600 text-gray-700 focus:border-red-300 focus:outline-none rounded-sm"
               autocomplete="off" bind:value={value}>
        <div class="h-4 md:h-8 text-red-500">{errorMsg || ''}</div>
    </div>
</div>