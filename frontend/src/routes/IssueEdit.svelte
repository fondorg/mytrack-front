<script>
    import InstanceEdit from '../c8s/InstanceEdit.svelte'
    import Api from "../service/api-service";

    export let params = {}
    export let projectId;
    let api = new Api();
    let redirect = (issue, deleted) => {
        if (deleted) {
            return `#/projects/${projectId}/issues/`
        }
        if (issue !== undefined) {
            return `#/projects/${projectId}/issues/${issue.id}`
        }
        //todo: error handling
    }

    let issue = {
        title: undefined,
        description: '',
        closed: false
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

    async function getIssue() {
        return await api.getProjectIssue(projectId, params.issueId);
    }

    async function saveIssue(issue) {
        return await api.saveProjectIssue(projectId, issue);
    }

    async function deleteIssue(issue) {
        return await api.deleteProjectIssue(projectId, issue.id);
    }

</script>

<InstanceEdit dataObject="{issue}" isNew="{params.issueId === undefined}" name="Issue" {fields} {constraints}
              {redirect} readFunc="{getIssue}" saveFunc="{saveIssue}" deleteFunc="{deleteIssue}"/>