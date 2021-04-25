<script>
    import {onMount} from 'svelte'
    import CenteredFlex from "./CenteredFlex.svelte";
    import Api from '../service/api-service';

    export let projectId;
    export let issueId;

    const api = new Api();
    let comments = []


    onMount(async () => {
        comments = await api.getIssueComments(projectId, issueId);
        console.log(comments);

    })
</script>

<CenteredFlex>


</CenteredFlex>