<script>
    export let actions = [];
    let menuHide = true;
    let icon = 'dots-horizontal.svg'

    function onClickOutside(node) {
        const handleClick = event => {
            if (node && !node.contains(event.target) && !event.defaultPrevented) {
                menuHide = true;
            }
        }
        document.addEventListener('click', handleClick, true);
        return {
            destroy() {
                document.removeEventListener('click', handleClick, true);
            }
        }
    }
</script>

<nav class="relative inline-block flex items-center border-0" use:onClickOutside>
    <div class="block">
        <button on:click={() => menuHide = !menuHide}
                class="flex items-center rounded hover:text-gray-600 hover:border-gray-600 focus:outline-none">
            <img src="/img/{icon}" class="w-6 h-6" alt="">
        </button>
    </div>
    <div id="collapsible-menu"
         class=" flex-col absolute right-0 top-0 mt-8 bg-white border"
         class:hidden={menuHide}
         on:click={() => menuHide = true}>
        <div class="text-sm flex-col w-full px-2">
            {#each actions as action}
                <button class="w-full {action.color || 'text-black'}" on:click={action.action}>{action.title}</button>
            {/each}
        </div>
    </div>
</nav>
