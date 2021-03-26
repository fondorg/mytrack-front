<script>
    import CenteredFlex from './CenteredFlex.svelte'
    import {onMount} from 'svelte'
    import Api from '../service/api-service'
    import Button from "./Button.svelte";

    export let issue;
    let projectTags = []
    let issueTags = []
    let tagList = [];
    const api = new Api();

    onMount(async () => {
        console.log(issue)
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
        issue = await api.updateProjectIssue(issue.projectId, issue.id, issue);
        console.log(issue)
    }

</script>

<CenteredFlex>
    {#each tagList as item}
        <div class="flex">
            <label class="">
                <input type="checkbox" bind:checked={item.checked}>
            </label>
            <div>{item.tag.name}</div>
        </div>
    {/each}
    <div id="buttons" class="flex">
        <Button name="Save" on:click={saveIssue} defaultAction="true"/>
        <Button name="Cancel"/>
    </div>
</CenteredFlex>

