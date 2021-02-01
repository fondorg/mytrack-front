<script>
    import CenteredFlex from '../c8s/CenteredFlex.svelte'
    import IssueList from '../c8s/IssueList.svelte'

    export let projectId;
</script>

<CenteredFlex>
    <IssueList projectId="{projectId}"/>
</CenteredFlex>