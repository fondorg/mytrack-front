<script>
    import './CenteredFlex.svelte'
    import CenteredFlex from "./CenteredFlex.svelte";
    import {afterUpdate} from 'svelte'
    import {stringify} from 'qs'

    export let totalPages;
    export let currentPage;
    export let url;
    export let qParams;

    let pages = [];

    function extraParams() {
        let qstr = stringify(qParams, {
            filter: (prefix, value) => {
                if (prefix === 'page' || prefix === 'size') {
                    return;
                }
                return value;
            }
        });
        return qstr === '' ? '' : '&' + qstr
    }

    afterUpdate(() => {
        pages = [];
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push({p: i})
            }
        } else {
            if (currentPage < 3 || currentPage > totalPages - 2) {
                for (let i = 1; i < 4; i++) {
                    pages.push({p: i})
                }
                pages.push({dots: true})
                for (let i = totalPages - 2; i <= totalPages; i++) {
                    pages.push({p: i})
                }
            } else {
                pages.push({p: 1});
                if (parseInt(currentPage) !== 3) {
                    pages.push({dots: true})
                }
                pages.push({p: currentPage - 1})
                pages.push({p: parseInt(currentPage)})
                pages.push({p: parseInt(currentPage) + 1})
                if (parseInt(currentPage) !== totalPages - 2) {
                    pages.push({dots: true})
                }
                pages.push({p: totalPages})
            }
        }
        pages = pages;
    })
</script>

<CenteredFlex>
    {#if totalPages > 1}
        <div class="flex flex-wrap">
            <a href="{url + `page=${currentPage > 1 ? currentPage - 1 : '1'}${extraParams()}`}"
               class="px-2 md:px-4 py-1 md:py-2 m-1 md:m-2 rounded border" rel="prev">«</a>
            {#each pages as p, i}
                {#if !p.dots}
                    <a href="{url + `page=${p.p}${extraParams()}`}" class="px-2 md:px-4 py-1 md:py-2 m-1 md:m-2 rounded border"
                       class:bg-green-200="{parseInt(currentPage) === p.p}">{p.p}</a>
                {:else}
                    <div class="h-full align-bottom px-2 md:px-4 py-1 md:py-2 m-1 md:m-2 text-lg">...</div>
                {/if}
            {/each}
            <!--<div class="h-full align-bottom px-4 py-1 md:py-2 m-1 md:m-2 text-lg">...</div>-->
            <a href="{url + `page=${currentPage < totalPages ? parseInt(currentPage) + 1 : totalPages}${extraParams()}`}"
               class="px-2 md:px-4 py-1 md:py-2 m-1 md:m-2 rounded border" rel="next">»</a>
        </div>
    {/if}
</CenteredFlex>
