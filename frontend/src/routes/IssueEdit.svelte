<script>
    import InstanceEdit from '../c8s/InstanceEdit.svelte'
    import Api from "../service/api-service";
    import {onMount} from 'svelte'

    export let params = {}
    export let projectId;
    let api = new Api();
    let redirect = () => {
        if (params.issueId !== undefined) {
            return `#/projects/${projectId}/issues/${params.issueId}`
        } else {
            return `#/projects/${projectId}/issues`
        }
    }

    let issue = {
        title: undefined,
        description: ''
    }

    let fields = {
        title: {
            type: 'text',
            label: 'Title',
            autofocus: true
        },
        description: {
            type: 'textarea',
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

    onMount(() => {
        console.log(params);
    })

    async function getIssue() {
        return await api.getProjectIssue(projectId, params.issueId);
    }

    async function saveIssue(issue) {
        return await api.saveProjectIssue(projectId, issue);
    }

</script>

<InstanceEdit dataObject="{issue}" isNew="{params.issueId === undefined}" name="Issue" {fields} {constraints}
              {redirect} readFunc="{getIssue}" saveFunc="{saveIssue}"/>