<script>
    import Layout from '../c8s/Layout.svelte'
    import BusyScreen from '../c8s/BusyScreen.svelte'
    import {onMount} from 'svelte'
    import Api from '../service/api-service'
    import NavMenu from '../c8s/NavMenu.svelte'
    import Router from 'svelte-spa-router'
    import {wrap} from 'svelte-spa-router/wrap'
    import ProjectMembers from './ProjectMembers.svelte'
    import ProjectIssues from './ProjectIssues.svelte'
    import IssueView from './IssueView.svelte'
    import IssueEdit from './IssueEdit.svelte'
    import ProjectHome from './ProjectHome.svelte'

    export let params;

    let projectMenu = [
        {
            link: `/projects/${params.id}/issues`,
            title: 'Issues',
            icon: '/img/document.svg'
        },
        {
            link: `/projects/${params.id}/members`,
            title: 'Members',
            icon: '/img/user-groups.svg'
        },
        {
            link: `/project-edit/${params.id}`,
            title: 'Edit project'
        }
    ]

    let project = {};
    let loading = true;


    function getRoutes() {
        return {
            '/': wrap({
                component: ProjectHome,
                props: {project: project}
            }),
            '/members': ProjectMembers,
            '/issues': wrap({
                component: ProjectIssues,
                props: {projectId: params.id}
            }),
            '/issues/new': wrap({
                component: IssueEdit,
                props: {projectId: params.id}
            }),
            '/issues/:issueId': wrap({
                component: IssueView,
                props: {projectId: params.id}
            }),
            '/issues/:issueId/edit': wrap({
                component: IssueEdit,
                props: {projectId: params.id}
            })
        };
    }

    onMount(async () => {
        await loadProject();
        loading = false;
    })

    async function loadProject() {
        let api = new Api();
        project = await api.getProject(params.id) || {};
    }

    let debug = false
</script>

<Layout>
    {#await loadProject()}
    {:then ignored}
        <div class="hidden md:flex pt-2">
            <a href="#/projects" class="flex">
                <img class="w-4" src="/img/chevron-left.svg" alt="back">
                <div class="text-sm">All projects</div>
            </a>
        </div>
        <div class="relative grid grid-cols-6 gap-1 mt-2 px-2">
            <BusyScreen loading="{loading}"/>
            <div class:bg-red-200={debug} class="flex justify-center md:hidden">
                <a href="#/projects" class="flex flex-col justify-center">
                    <img class="w-6" src="/img/chevron-left.svg" alt="back">
                </a>
            </div>
            <div class:bg-red-200={debug}
                 class="col-span-4 md:col-span-5 w-full flex justify-center items-center">
                <div class="text-center text-md"><a href="#/projects/{project.id}">{project.title}</a></div>
            </div>
            <div class:bg-red-200={debug} class="flex justify-center md:items-start md:row-span-4">
                <NavMenu menuTitle="Project Menu" items="{projectMenu}"/>
            </div>
            <!--<div class:bg-red-200={debug}
                 class="col-span-6 md:col-start-1 md:col-span-5 flex justify-center items-center text-sm">
                {project.description}
            </div>-->
            <div class="col-span-4 col-start-2 md:col-start-1 md:col-span-5 border-t-2 border-gray-200"></div>
            <div class="col-start-1 col-span-6 md:col-start-1 md:col-span-5">
                <Router routes={getRoutes()} prefix={/^\/projects\/[0-9]+/}/>
            </div>
        </div>
    {/await}
</Layout>