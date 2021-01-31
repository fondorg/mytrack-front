<script>
    export let name = "Button"
    export let defaultAction = false;
    export let disabled;
//{defaultAction ? 'active:bg-green-500 active:text-white' :'hover:bg-gray-300 hover:text-gray-600'}
</script>

<button {disabled} on:click
   class="text-sm px-4 py-2 leading-none border rounded border-gray-500
    {!defaultAction ? 'active:bg-gray-300' : 'bg-mytrack-light active:bg-mytrack-dark'}

   focus:outline-none
 lg:mt-0">{name}</button>

<style>
    button:disabled {
        background-color: #e5e7eb;
        border: none;
        color: #6b7280;
    }
</style>