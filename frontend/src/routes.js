import Tasks from './routes/Tasks.svelte'
import Projects from './routes/Projects.svelte'
import Home from './routes/Home.svelte';
import Workspace from './routes/Workspace.svelte'
import Login from './routes/Login.svelte'
import ProjectEdit from './routes/ProjectEdit.svelte'
import IssueEdit from './routes/IssueEdit.svelte'
import ProjectView, {params} from './routes/ProjectView.svelte'
import {wrap} from 'svelte-spa-router/wrap'
import {isAuthenticated} from './c8s/OidcContext.svelte'
import {get} from 'svelte/store'
import CommonTags from './routes/CommonTags.svelte'
import CommonTagEdit from "./routes/CommonTagEdit.svelte";
import TagEdit from "./routes/TagEdit.svelte";


const authConditions = [
    (detail => get(isAuthenticated))
]

const notAuthConditions = [
    (detail => !get(isAuthenticated))
]

let authRoutes = {
    '/': wrap({
        component: Home,
        conditions: authConditions
    }),
    '/login': wrap({
        component: Login,
        conditions: notAuthConditions
    }),
    '/tasks': wrap({
        component: Tasks,
        conditions: authConditions
    }),
    '/projects': wrap({
        component: Projects,
        conditions: authConditions
    }),
    '/projects/:id': wrap({
        component: ProjectView,
        conditions: authConditions
    }),
    '/projects/:id/edit': wrap({
        component: ProjectEdit,
        conditions: authConditions
    }),
    '/projects/:id/*': wrap({
        component: ProjectView,
        conditions: authConditions
    }),
    '/project-edit': wrap({
        component: ProjectEdit,
        conditions: authConditions
    }),
    '/project-edit/:id': wrap({
        component: ProjectEdit,
        conditions: authConditions
    }),
    '/projects/:id/issue-edit': wrap({
        component: IssueEdit,
        conditions: authConditions
    }),
    '/projects/:id/issue-edit/:id': wrap({
        component: IssueEdit,
        conditions: authConditions
    }),
    '/workspace': wrap({
        component: Workspace,
        conditions: authConditions
    }),
    '/tags': wrap({
        component: CommonTags,
        conditions: authConditions
    }),
    '/tags/new': wrap({
        component: CommonTagEdit,
        conditions: authConditions
    }),
    '/tags/:tagId': wrap({
        component: TagEdit,
        conditions: authConditions,
        props: {commonTag: true}
    }),
}

let anonymousRoutes = {
    '/': wrap({
        component: Login,
        //conditions: authConditions
    }),
    /*'/login': wrap({
        component: Login,
        conditions: notAuthConditions
    })*/
}

export {authRoutes, anonymousRoutes}