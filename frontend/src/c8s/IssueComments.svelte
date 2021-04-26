<script>
    import {onMount} from 'svelte'
    import CenteredFlex from "./CenteredFlex.svelte";
    import Api from '../service/api-service';
    import CommentEdit from "./CommentEdit.svelte";
    import CommentCard from './CommentCard.svelte'

    export let projectId;
    export let issueId;

    const api = new Api();
    export let comments = []

    onMount(async () => {
        await commentReload();
    })

    async function commentReload() {
        comments = await api.getIssueComments(projectId, issueId);
    }

    function onCommentPosted(e) {
        comments.push(e.detail.comment)
        comments = comments;
    }

    function onCommentDeleted(e) {
        comments = comments.filter(c => c.id !== e.detail.commentId);
    }
</script>


<CenteredFlex>
    {#if comments}
        <div class="w-full flex flex-col space-y-2">
            {#each comments as comment}
                <CommentCard {comment} {projectId} on:commentDeleted={onCommentDeleted}/>
            {/each}
        </div>
    {/if}
    <div class="py-2"></div>
    <CommentEdit {projectId} {issueId} on:commentPosted={onCommentPosted}/>
</CenteredFlex>