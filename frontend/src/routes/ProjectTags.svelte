<script>
    import CenteredFlex from '../c8s/CenteredFlex.svelte'
    import Api from '../service/api-service'
    import {onMount} from 'svelte'
    import TagList from '../c8s/TagList.svelte'
    import LinkButton from '../c8s/LinkButton.svelte'

    const api = new Api()
    export let projectId;
    let tags = []

    onMount(async () => {
        tags = await api.getProjectTags(projectId)
        console.log(tags)
    })


</script>

<LinkButton name="Add Tag" href="#/projects/{projectId}/tags/new"/>
<CenteredFlex>
    <TagList {tags} {projectId}/>
</CenteredFlex>