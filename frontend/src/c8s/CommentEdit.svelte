<script>
    import Api from "../service/api-service";
    import Button from './Button.svelte'
    import {createEventDispatcher} from 'svelte'
    import {onMount} from 'svelte'

    const dispatch = createEventDispatcher();
    const api = new Api();
    export let projectId;
    export let issueId;
    export let label = "Write:"
    export let cancelable = false;
    export let focusable = false;
    let input;
    export let comment = newComment();

    onMount(() => {
        if (focusable) {
            setTimeout(() => {
                input.focus();
            }, 0)
        }
    })

    function newComment() {
        return {
            text: ''
        }
    }

    async function postComment() {
        console.log(comment)
        let reloaded = await api.saveComment(projectId, issueId, comment)
        dispatch('commentPosted', {comment: reloaded})
        comment = newComment()
    }

    function onKeyDown(e) {
        if (e.ctrlKey && e.key === 'Enter') {
            postComment();
        }
    }
</script>

<div class="w-full" on:keydown={onKeyDown}>
    <label class="">{label}</label>
    <textarea bind:this={input} name="title" bind:value={comment.text}
              class="w-full px-2 border border-gray-400 focus:border-indigo-600 text-gray-700 focus:border-red-300
               focus:outline-none rounded-sm"
              autocomplete="off"></textarea>
    <Button defaultAction="true" name="Comment" on:click={postComment}/>
    {#if cancelable}
        <Button name="Cancel" on:click={() => dispatch('commentEditCanceled')}/>
    {/if}
</div>

<style>
    textarea {
        min-height: 7rem;
    }
</style>
