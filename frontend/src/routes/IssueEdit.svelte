<script>
    import InstanceEdit from '../c8s/InstanceEdit.svelte'
    import Api from "../service/api-service";

    export let params = {}
    export let projectId;
    let api = new Api();
    let redirect = `#/projects/${projectId}/issues`

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

    async function getIssue() {
        return await api.getProjectIssue(projectId, params.issuesId);
    }

    async function saveIssue(issue) {
        return await api.saveProjectIssue(projectId, issue);
    }

</script>

<InstanceEdit dataObject="{issue}" isNew="{params.id}" name="Issue" {fields} {constraints}
              {redirect} readFunc="{getIssue}" saveFunc="{saveIssue}"/>