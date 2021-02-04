<script>
    import InstanceEdit from '../c8s/InstanceEdit.svelte'
    import Api from "../service/api-service";

    export let params = {}
    let api = new Api();
    let redirect = "issues"

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
        return await api.getIssue(params.id);
    }

    async function saveIssue(issue) {
        return await api.saveIssue(issue);
    }

</script>

<InstanceEdit dataObject="{issue}" isNew="{params.id}" name="Issue" {fields} {constraints}
              {redirect} readFunc="{getIssue}" saveFunc="{saveIssue}"/>