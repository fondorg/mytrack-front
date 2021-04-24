<script>
    import Layout from '../c8s/Layout.svelte'
    import CenteredFlex from '../c8s/CenteredFlex.svelte'
    import {onMount} from 'svelte'
    import {parse} from "qs";
    import Api from "../service/api-service";
    import {querystring} from "svelte-spa-router";

    let tags = []

    const api = new Api();
    $: queryParams = parse($querystring)
    $: {
        onPageChange(queryParams.page !== undefined ? queryParams.page : 1)
    }

    async function onPageChange() {
        queryParams.page = queryParams.page || 1
        queryParams.size = queryParams.si || 5
        tags = await api.getCommonTags(queryParams) || [];
        console.log(tags)
    }


</script>

<Layout>
    <CenteredFlex>

    </CenteredFlex>

</Layout>