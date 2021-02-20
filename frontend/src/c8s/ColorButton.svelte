<script>
    export let name = "Button"
    export let disabled;
    export let bgColor = 'border-gray-500'
    export let textColor = ''
    export let pressedBackground = 'bg-gray-300'
    export let extraStyle = ''
//{defaultAction ? 'active:bg-green-500 active:text-white' :'hover:bg-gray-300 hover:text-gray-600'}
</script>

<button {disabled} on:click
   class="text-sm px-4 py-2 leading-none border rounded {bgColor} {textColor} active:{pressedBackground}
   {extraStyle}

   focus:outline-none
 lg:mt-0">{name}</button>

<style>
    button:disabled {
        background-color: #e5e7eb;
        border: none;
        color: #6b7280;
    }
</style>