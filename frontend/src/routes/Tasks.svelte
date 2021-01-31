<script>
    import Layout from '../c8s/Layout.svelte'
    import {onMount} from 'svelte'
    import Api from '../service/api-service'

    let projects;

    onMount(() => {
        //projects = performRequest();
    })

    async function performRequest() {
        const api = new Api();
        console.log(projects)
        return projects;
    }
</script>

<Layout>
    <h1>tasks</h1>
    <div>projects: {projects}</div>



</Layout>