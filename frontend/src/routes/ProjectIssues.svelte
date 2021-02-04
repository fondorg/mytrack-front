<script>
    import CenteredFlex from '../c8s/CenteredFlex.svelte'
    import IssueList from '../c8s/IssueList.svelte'
    import LinkButton from "../c8s/LinkButton.svelte";

    export let projectId;
</script>

<CenteredFlex>
    <div class="mb-4">
        <LinkButton name="New Issue" href="#/projects/{projectId}/issue-edit" defaultAction="true"/>
    </div>
    <IssueList projectId="{projectId}"/>
</CenteredFlex>