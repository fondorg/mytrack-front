<script>
    import CenteredFlex from '../c8s/CenteredFlex.svelte'
    import IssueList from '../c8s/IssueList.svelte'
    import LinkButton from "../c8s/LinkButton.svelte";
    import {onMount} from 'svelte'

    export let projectId;
    export let params;

    onMount(() => {
        console.log(params)
    })

</script>

<CenteredFlex>
    <div class="mb-4">
        <LinkButton name="New Issue" href="#/projects/{projectId}/issues/new" defaultAction="true"/>
    </div>
    <IssueList projectId="{projectId}"/>
</CenteredFlex>