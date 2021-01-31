<script>
    import active from 'svelte-spa-router/active'
    import {link} from 'svelte-spa-router'

    export let menuTitle = 'Menu'

    export let items = [];

    let menuHide = true;

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

<style>
</style>

<nav class="flex items-center md:border-0" use:onClickOutside>
    <div class="block md:hidden">
        <button on:click={() => menuHide = !menuHide}
                class="flex items-center rounded hover:text-gray-600 hover:border-gray-600 focus:outline-none">
            <img src="/img/menu.svg" class="w-6 h-6" alt="">
        </button>
    </div>
    <div id="collapsible-menu"
         class="md:flex flex-col md:items-center md:w-auto
         absolute right-0 top-0
         md:relative md:right-auto md:top-auto
         mt-8 md:mt-0
         bg-white border"
         class:hidden={menuHide}
         on:click={() => menuHide = true}>
        <div class="px-2 py-2  text-lg border-b-2 border-gray-400">{menuTitle}</div>
        <div class="text-sm md:flex flex-col w-full">
            {#each items as item}
                <a href="{item.link}" class="flex p-2 items-center" use:link
                   use:active={{path: item.link, className: 'border-l-4 border-gray-500 bg-gray-100'}}>
                    {#if item.icon}
                        <img src="{item.icon}" class="w-4 mr-2" alt="">
                    {/if}
                    <div class="text-md block md:inline-block hover:text-gray-600">
                        {item.title}
                    </div>
                </a>
            {/each}

            <!--<a href="#/projects" class="block mt-4 md:inline-block mt-4 hover:text-gray-600 mr-4">
                Projects
            </a>
            <a href="#responsive-header" class="block md:mt-4 md:inline-block mt-4 hover:text-gray-600">
                Blog
            </a>-->
        </div>
        <!--<div class="flex items-center mt-4 md:mt-0">
            hello
        </div>-->
    </div>
</nav>