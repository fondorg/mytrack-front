<script>
    import Layout from '../c8s/Layout.svelte'
    import CenteredFlex from '../c8s/CenteredFlex.svelte'
    import Form from '../c8s/Form.svelte'
    import Api from "../service/api-service";
    import {push} from "svelte-spa-router";
    import {onMount} from 'svelte'
    import BusyScreen from "../c8s/BusyScreen.svelte";

    export let params = {}
    let loading = true;
    let api = new Api();

    export let project = {
        title: undefined,
        description: ''
    };

    let fields = {
        title: {
            type: 'text',
            label: 'Title',
            autofocus: true
        },
        description: {
            type: 'text',
            label: 'Description'
        }
    }

    let constraints = {
        title: {
            presence: {
                allowEmpty: false
            }
        }
    };

    onMount(async () => {
        if (params.id) {
            try {
                project = await api.getProject(params.id);
            } catch (e) {
                console.log(e);
            }
        }
        loading = false;
    })

    async function saveProject(project) {
        let saved = await api.saveProject(project);
        push("#/projects")
    }
</script>

<Layout>
    <CenteredFlex extraClasses="relative">
        <BusyScreen loading="{loading}"/>
        <h1 class="text-xl mb-4">{params.id ? 'New project' : `Edit project: ${name}`}</h1>
        <Form dataObject="{project}" fields="{fields}" onSubmit={saveProject} constraints="{constraints}"/>
    </CenteredFlex>
</Layout>