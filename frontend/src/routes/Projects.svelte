<script>
    import Layout from '../c8s/Layout.svelte'
    import CenteredFlex from '../c8s/CenteredFlex.svelte'
    import Api from "../service/api-service";
    import ProjectList from "../c8s/ProjectList.svelte";
    import {parse} from "qs";
    import {querystring} from "svelte-spa-router";
    import Pagination from "../c8s/Pagination.svelte";


    let projects = [];
    const api = new Api();
    $: queryParams = parse($querystring)
    $: {
        onPageChange(queryParams.page !== undefined ? queryParams.page : 1)
    }

    async function onPageChange() {
        projects = await api.getProjects(queryParams.page, 5) || [];
    }

</script>
<Layout>
    <CenteredFlex extraClasses="px-2">
        <ProjectList {projects}/>
        <Pagination totalPages="{projects.totalPages}" currentPage="{queryParams.page || 1}" url="#/projects?"/>
    </CenteredFlex>
</Layout>

