<script>
    import ModalWindow from './ModalWindow.svelte'
    import ColorButton from './ColorButton.svelte'
    import CenteredFlex from './CenteredFlex.svelte'
    import IssueTagsEdit from './IssueTagsEdit.svelte'
    import IssueTags from "./IssueTags.svelte";

    export let showModal = true;
    export let projectId;
    export let issue;

</script>

{#if showModal}
    <ModalWindow on:closeModal={() => showModal = false} backdrop="true">
        <CenteredFlex>
            <h1 class="text-lg">Tags</h1>
            <IssueTagsEdit {issue}/>
        </CenteredFlex>
    </ModalWindow>
{/if}

<ColorButton name="Show" on:click={() => showModal = true}/>
<div class="grid">
    <div class="font-bold text-xs">Tags</div>

</div>