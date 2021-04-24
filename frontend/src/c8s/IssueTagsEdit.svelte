<script>
    import CenteredFlex from './CenteredFlex.svelte'
    import {onMount} from 'svelte'
    import Api from '../service/api-service'
    import Button from "./Button.svelte";

    export let issue;
    export let onIssueSaved;
    export let onCancel;

    let projectTags = []
    let issueTags = []
    let tagList = [];
    const api = new Api();

    onMount(async () => {
        projectTags = await api.getProjectTags(issue.projectId);
        issueTags = await api.getIssueTags(issue.projectId, issue.id);
        projectTags.forEach(pt => {
            tagList.push({
                tag: pt,
                checked: issueTags.some(it => it.id === pt.id)
            })
        })
        tagList = tagList;
    })

    async function saveIssue() {
        issue.tags = [];
        tagList.filter(i => i.checked).forEach(i => issue.tags.push(i.tag));
        issue = await api.saveProjectIssue(issue.projectId, issue);
        if (onIssueSaved !== undefined) {
            onIssueSaved();
        }
    }

</script>

<style>
    .tag-color {
        color: white;
        background-color: var(--tag-color);
    }
</style>

<div>
    {#each tagList as item}
        <div class="flex w-full">
            <div class="flex space-x-1 items-center">
                <input class="w-4 h-4" type="checkbox" bind:checked={item.checked}>
                <div class="w-4 h-4 tag-color" style="--tag-color: {item.tag.color}"></div>
                <div>{item.tag.name}</div>
            </div>
        </div>
    {/each}
    <div id="buttons" class="flex space-x-3 mb-3 mt-3">
        <Button name="Save" on:click={saveIssue} defaultAction="true"/>
        <Button name="Cancel" on:click={onCancel}/>
    </div>
</div>

