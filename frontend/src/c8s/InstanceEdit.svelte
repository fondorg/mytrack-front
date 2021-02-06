<script>
    /**
     * this is a generic view to perform CRUD operations with any instances
     */

    import Layout from '../c8s/Layout.svelte'
    import CenteredFlex from '../c8s/CenteredFlex.svelte'
    import Form from '../c8s/Form.svelte'
    import {push} from "svelte-spa-router";
    import {onMount} from 'svelte'
    import BusyScreen from "../c8s/BusyScreen.svelte";

    export let isNew = true; //defines if the dataObject is a new instance
    export let name = ''; //The name of the instance
    export let dataObject; //data object to perform CRUD operations with
    export let fields; //description of the fields
    export let constraints; //fields validation constraints
    export let readFunc; //instance async read function. will be called on mount. The function must return a data object
    export let saveFunc; //instance async create and update function. will be called on mount. Takes modified object as an argument
    export let redirect; //redirect uri after object is saved

    let loading = true;

    onMount(async () => {
        if (!isNew) {
            dataObject = await readFunc();
            console.log(dataObject);
        }
        loading = false;
    })

    async function saveInstance(project) {
        let saved = await saveFunc(project);
        push(redirect)
    }
</script>

<CenteredFlex extraClasses="relative">
    <BusyScreen loading="{loading}"/>
    <h1 class="text-xl mb-4">{isNew ? `New ${name}` : `Edit ${name}`}</h1>
    <Form dataObject="{dataObject}" fields="{fields}" onSubmit={saveInstance} constraints="{constraints}"/>
</CenteredFlex>
