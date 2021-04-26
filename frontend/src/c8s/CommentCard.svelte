<script>
    import ColorButton from './ColorButton.svelte'
    import ModalWindow from './ModalWindow.svelte'
    import CenteredFlex from "./CenteredFlex.svelte";
    import MediumTitle from "./MediumTitle.svelte";
    import Api from '../service/api-service'
    import {createEventDispatcher} from 'svelte'
    import marked from 'marked'

    export let comment;
    export let projectId;

    const api = new Api();
    const dispatch = createEventDispatcher();
    let showDeleteConfirm = false;

    function editComment() {

    }

    async function deleteComment() {
        showDeleteConfirm = true;
        await api.deleteComment(projectId, comment.issueId, comment.id);
        showDeleteConfirm = false;
        dispatch('commentDeleted', {commentId: comment.id})
    }
</script>

{#if showDeleteConfirm}
    <ModalWindow on:closeModal={() => showDeleteConfirm = false} backdrop="true">
        <div>
            <CenteredFlex extraClasses="py-4">
                <MediumTitle title="Are you sure you want to delete this comment?"/>
                <div class="flex space-x-2">
                    <ColorButton name="Delete" bgColor="bg-red-400" , textColor="text-white" on:click={deleteComment}/>
                    <ColorButton name="Cancel" on:click={()=> showDeleteConfirm = false}/>
                </div>
            </CenteredFlex>
        </div>
    </ModalWindow>
{/if}
<div class="flex flex-col w-full border rounded-sm p-1">
    {#if comment.author}
        <div class="grid grid-cols-2">
            <div class="flex">
                <div class="text-xs font-bold">{comment.author.firstName} {comment.author.lastName}</div>
                <div class="text-xs pl-4">{comment.created}</div>
            </div>
            <div class="flex justify-end space-x-1 pb-2">
                <ColorButton extraStyle="self-stretch justify-self-end" small="true" name="edit"
                             on:click={editComment}/>
                <ColorButton bgColor="bg-red-400" textColor="text-white" name="delete" small="true"
                             on:click={() => showDeleteConfirm = true}/>
            </div>

        </div>
        <div class="desc-container">{@html marked(comment.text)}</div>
    {/if}
</div>
