<script>
    import Api from "../service/api-service";
    import Button from './Button.svelte'
    import {createEventDispatcher} from 'svelte'

    const dispatch = createEventDispatcher();
    const api = new Api();
    export let projectId;
    export let issueId;
    let input;
    export let comment = newComment();

    function newComment() {
        return {
            text: ''
        }
    }

    async function postComment() {
        let reloaded = await api.saveComment(projectId, issueId, comment)
        console.log(reloaded)
        dispatch('commentPosted', {comment: reloaded})
        comment  = newComment()
    }

    function onKeyDown(e) {
        if (e.ctrlKey && e.key === 'Enter') {
            postComment();
        }
    }
</script>

<div class="w-full" on:keydown={onKeyDown}>
    <label class="">Write:</label>
    <textarea bind:this={input} name="title" bind:value={comment.text}
              class="w-full px-2 border border-gray-400 focus:border-indigo-600 text-gray-700 focus:border-red-300
               focus:outline-none rounded-sm"
              autocomplete="off"></textarea>
    <Button defaultAction="true" name="Comment" on:click={postComment}/>
</div>

<style>
    textarea {
        min-height: 7rem;
    }
</style>
