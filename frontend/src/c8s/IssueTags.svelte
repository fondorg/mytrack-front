<script>
    import ModalWindow from './ModalWindow.svelte'
    import ColorButton from './ColorButton.svelte'
    import CenteredFlex from './CenteredFlex.svelte'
    import IssueTagsEdit from './IssueTagsEdit.svelte'
    import {onMount} from 'svelte'
    import Api from '../service/api-service'
    import IssueTagLabel from './IssueTagLabel.svelte'
    import MicroTitle from "./MicroTitle.svelte";

    export let showModal = false;
    export let projectId;
    export let issue;

    const api = new Api();
    let tags = [];

    onMount(async () => {
        await updateTags()
    })

    async function onIssueSaved() {
        await updateTags()
        showModal = false
    }

    function onEditCancel() {
        showModal = false
    }

    async function updateTags() {
        tags = await api.getIssueTags(issue.projectId, issue.id);
    }

</script>

{#if showModal}
    <ModalWindow on:closeModal={() => showModal = false} backdrop="true">
        <CenteredFlex>
            <MicroTitle title="Tags"/>
            <IssueTagsEdit {issue} {onIssueSaved} onCancel={onEditCancel}/>
        </CenteredFlex>
    </ModalWindow>
{/if}

<div class="flex space-x-1">
    {#each tags as tag}
        <IssueTagLabel href={`#/projects/${issue.projectId}/issues/?tags[]=${tag.name}`} {tag}/>
    {/each}
</div>
<ColorButton extraStyle="mt-2" small="true" name="Edit tags" on:click={() => showModal = true}/>