<script>
    import Layout from '../c8s/Layout.svelte'
    import CenteredFlex from '../c8s/CenteredFlex.svelte'
    import {onMount} from 'svelte'
    import {parse} from "qs";
    import Api from "../service/api-service";
    import {querystring} from "svelte-spa-router";
    import LinkButton from '../c8s/LinkButton.svelte'
    import TagList from '../c8s/TagList.svelte'
    import HugeTitle from '../c8s/HugeTitle.svelte'

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
    }

</script>

<Layout>
    <CenteredFlex extraClasses="px-2">
        <HugeTitle title="Common tags"/>
        <div class="w-full flex justify-end py-2">
            <LinkButton name="Add Common Tag" href="#/tags/new"/>
        </div>
        <TagList tags={tags.content} commonTags="true"/>
    </CenteredFlex>
</Layout>