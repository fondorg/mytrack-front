<script>
    export let loading = false;
    import BusyCircle from './BusyCircle.svelte'
</script>

{#if loading}
    <div class="z-50 flex justify-center items-center opacity-75 bg-white w-full h-full absolute top-0 left-0"
         id="busy-screen">
        <BusyCircle/>
    </div>
{/if}
