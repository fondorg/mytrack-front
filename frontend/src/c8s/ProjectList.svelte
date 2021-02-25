<script>
    import ProjectCard from './ProjectCard.svelte'
    import LinkButton from './LinkButton.svelte'

    export let projects = {};
</script>


<h1 class="text-2xl mb-2">Your projects</h1>
<div class="w-full flex justify-end py-2">
    <LinkButton name="New Project" href="#/project-edit"/>
</div>

{#if projects.content}
    {#each projects.content as p}
        <ProjectCard id="{p.project.id}" title="{p.project.title}" desc="{p.project.description}"/>
    {/each}
{/if}