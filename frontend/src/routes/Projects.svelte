<script>
    import Layout from '../c8s/Layout.svelte'
    import CenteredFlex from '../c8s/CenteredFlex.svelte'
    import {onMount} from 'svelte'
    import Api from "../service/api-service";
    import ProjectCard from '../c8s/ProjectCard.svelte'
    import OidcContext, {isLoading} from '../c8s/OidcContext.svelte'
    import ProjectList from "../c8s/ProjectList.svelte";


</script>
<Layout>
    <CenteredFlex extraClasses="px-2">
        <ProjectList/>
    </CenteredFlex>
</Layout>

