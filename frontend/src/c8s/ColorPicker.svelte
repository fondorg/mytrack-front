<script>
    export let label
    export let value;
    export let errorMsg;
</script>

<div class="grid sm:grid-cols-3 sm:gap-4 mb-2">
    <label class="">{label}</label>
    <div class="flex flex-col col-span-2">
        <div>
            <input name="title" type="color"
                   class="px-2 border border-gray-400 focus:border-indigo-600 text-gray-700 focus:border-red-300 focus:outline-none rounded-sm"
                   autocomplete="off" bind:value={value}>
            <label>{value}</label>
        </div>
        <div class="h-4 md:h-8 text-red-500">{errorMsg || ''}</div>
    </div>
</div>
