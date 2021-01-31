<script>
    export let label
    export let value
    export let errorMsg;
</script>

<div class="flex items-center">
    <input type="checkbox" id="checkbox" bind:checked={value}>
    <div class="flex flex-col">
        <label class="ml-4" for="checkbox">{label}</label>
        <div class="text-red-500">{errorMsg || ''}</div>
    </div>
</div>