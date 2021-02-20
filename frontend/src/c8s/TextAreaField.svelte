<script>
    import {onMount} from "svelte";
    import {autoresize} from '../util/autoresize'

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
<style>
    textarea {
        min-height: 7rem;
    }
</style>

<div class="grid sm:grid-cols-3 sm:gap-4 mb-2">
    <label class="">{label}</label>
    <div class="flex flex-col col-span-2">
        <textarea bind:this={input} name="title" use:autoresize
               class="px-2 border border-gray-400 focus:border-indigo-600 text-gray-700 focus:border-red-300
               focus:outline-none rounded-sm"
                  autocomplete="off" bind:value={value}></textarea>
        <div class="h-4 md:h-8 text-red-500">{errorMsg || ''}</div>
    </div>
</div>
