<script>
    import CenteredFlex from '../c8s/CenteredFlex.svelte'
    import IssueList from '../c8s/IssueList.svelte'
    import LinkButton from "../c8s/LinkButton.svelte";
    import {querystring} from 'svelte-spa-router'
    import {parse} from 'qs'
    import Api from "../service/api-service";
    import Pagination from '../c8s/Pagination.svelte'

    export let projectId;
    let issues = [];
    const api = new Api();
    $: queryParams = parse($querystring)
    $: {
        onPageChange(queryParams.page !== undefined ? queryParams.page : 1)
    }

    async function onPageChange() {
        issues = await api.getProjectIssues(projectId, queryParams.page, 5) || [];
    }

</script>

<CenteredFlex>
    <div class="mb-4">
        <LinkButton name="New Issue" href="#/projects/{projectId}/issues/new" defaultAction="true"/>
    </div>
    <IssueList {issues} projectId="{projectId}"/>
    <Pagination totalPages="{issues.totalPages}" currentPage="{queryParams.page || 1}" url="#/projects/{projectId}/issues?"/>
</CenteredFlex>