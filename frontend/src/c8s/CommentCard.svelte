<script>
    import ColorButton from './ColorButton.svelte'
    import ModalWindow from './ModalWindow.svelte'
    import CenteredFlex from "./CenteredFlex.svelte";
    import MediumTitle from "./MediumTitle.svelte";
    import Api from '../service/api-service'
    import {createEventDispatcher} from 'svelte'
    import marked from 'marked'
    import MarkdownCss from './MarkdownCss.svelte'
    import CommentEdit from './CommentEdit.svelte'
    import ActionMenu from './ActionMenu.svelte'

    export let comment;
    export let projectId;
    const api = new Api();
    const dispatch = createEventDispatcher();
    let showDeleteConfirm = false;
    let editMode = false;

    let menuActions = [
        {
            title: 'Delete comment',
            action: () => showDeleteConfirm = true,
            color: 'text-red-500'
        }
    ]

    function editComment() {
        editMode = !editMode;
    }
    function onCommentPosted(e) {
        editMode = false;
        comment = e.detail.comment
    }

    async function deleteComment() {
        await api.deleteComment(projectId, comment.issueId, comment.id);
        showDeleteConfirm = false;
        dispatch('commentDeleted', {commentId: comment.id})
    }
    function onDeleteDialogKeyDown(e) {
        if (showDeleteConfirm) {
            if (e.key === 'Enter') {
                deleteComment()
            } else if (e.key === 'Escape') {
                showDeleteConfirm = false;
            }
        }
    }
</script>
<svelte:window on:keydown={onDeleteDialogKeyDown}/>

<MarkdownCss/>
{#if showDeleteConfirm}
    <ModalWindow on:closeModal={() => showDeleteConfirm = false} backdrop="true">
        <div>
            <CenteredFlex extraClasses="py-4">
                <MediumTitle title="Are you sure you want to delete this comment?"/>
                <div class="flex space-x-2">
                    <ColorButton  name="Delete" bgColor="bg-red-400" , textColor="text-white" on:click={deleteComment}/>
                    <ColorButton name="Cancel" on:click={()=> showDeleteConfirm = false}/>
                </div>
            </CenteredFlex>
        </div>
    </ModalWindow>
{/if}
<div class="flex flex-col w-full border rounded-sm p-1">
    <div class="grid grid-cols-2">
        <div class="flex">
            {#if comment.author}
                <div class="text-xs font-bold">{comment.author.firstName} {comment.author.lastName}</div>
                <div class="text-xs pl-4">{comment.created}</div>
            {/if}
        </div>
        <div class="flex justify-end space-x-2 pb-2">
            <ColorButton extraStyle="self-stretch justify-self-end" small="true" name="edit"
                         on:click={editComment}/>
            <!--<ColorButton bgColor="bg-red-400" textColor="text-white" name="delete" small="true"
                         on:click={() => showDeleteConfirm = true}/>-->
            <ActionMenu actions={menuActions}/>
        </div>
    </div>
    {#if editMode}
        <CommentEdit label="Edit:" comment={Object.assign({}, comment)} {projectId} issueId={comment.issueId} on:commentPosted={onCommentPosted}
                     cancelable="true"
        on:commentEditCanceled={() => editMode = false} focusable="true"/>
    {:else}
        <div id="markdown-container">{@html marked(comment.text)}</div>
    {/if}
</div>
