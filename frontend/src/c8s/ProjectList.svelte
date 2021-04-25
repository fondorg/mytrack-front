<script>
    import ProjectCard from './ProjectCard.svelte'
    import LinkButton from './LinkButton.svelte'
    import HugeTitle from './HugeTitle.svelte'

    export let projects = {};
</script>


<!--<h1 class="text-2xl mb-2">Your projects</h1>-->
<HugeTitle title="Your projects"/>

<div class="w-full flex justify-end py-2">
    <LinkButton name="New Project" href="#/project-edit"/>
</div>

{#if projects.content && projects.content.length > 0}
    {#each projects.content as p}
        <ProjectCard id="{p.project.id}" title="{p.project.title}" desc="{p.project.description}"/>
    {/each}
{:else}
    <div class="mt-8">
        No projects yet. <a class="underline font-bold" href="#/project-edit">Create</a> one.
    </div>
{/if}