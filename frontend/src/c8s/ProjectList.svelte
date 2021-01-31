<script>
    import {onMount} from 'svelte'
    import Api from "../service/api-service";
    import ProjectCard from './ProjectCard.svelte'
    import LinkButton from './LinkButton.svelte'

    let projects = [];
    onMount(async () => {
        projects = await performRequest();
    })

    async function performRequest() {
        const api = new Api();
        projects = await api.getProjects();
        return projects;
    }
</script>


<h1 class="text-2xl mb-2">Your projects</h1>
<div class="w-full flex justify-end py-2">
    <LinkButton name="New Project" href="#/project-edit" />
</div>
{#each projects as p}
    <ProjectCard id="{p.project.id}" title="{p.project.title}" desc="{p.project.description}"/>
{/each}