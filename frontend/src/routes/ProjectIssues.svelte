<script>
    import CenteredFlex from '../c8s/CenteredFlex.svelte'
    import IssueList from '../c8s/IssueList.svelte'
    import LinkButton from "../c8s/LinkButton.svelte";
    import {onMount} from 'svelte'
    import {querystring} from 'svelte-spa-router'
    import {parse} from 'qs'
    import Api from "../service/api-service";
    import Pagination from '../c8s/Pagination.svelte'

    export let projectId;
    let issues = [];
    const api = new Api();
    let page;

    onMount(async () => {
        page = parse($querystring).page || 1
        await onPageChange(page)
    })

    async function onPageChange(newPage) {
        page = newPage
        console.log("new page: " + newPage)
        issues = await api.getProjectIssues(projectId, page, 5) || [];
        console.log(issues)
    }

</script>

<CenteredFlex>
    <div class="mb-4">
        <LinkButton name="New Issue" href="#/projects/{projectId}/issues/new" defaultAction="true"/>
    </div>
    <IssueList {issues} projectId="{projectId}"/>
    <Pagination totalPages="{issues.totalPages}" currentPage="{page}" url="#/projects/{projectId}/issues?" navFunction="{onPageChange}"/>
</CenteredFlex>