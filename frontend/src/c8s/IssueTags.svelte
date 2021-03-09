<script>
    import ModalWindow from './ModalWindow.svelte'
    import ColorButton from './ColorButton.svelte'

    export let showModal = false;
    let number = 42;
    function switchModal() {
        console.log(showModal)
        console.log(number);
        showModal = !showModal
    }

</script>

{#if showModal}
    <ModalWindow show="{showModal}" {number}/>
{/if}

<ColorButton name="Show" on:click={switchModal}/>
<div class="grid">
    <div class="font-bold text-xs">Tags</div>


</div>