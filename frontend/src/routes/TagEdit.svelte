<script>
    import InstanceEdit from '../c8s/InstanceEdit.svelte'
    import Api from "../service/api-service";

    export let params = {}
    export let projectId;
    const api = new Api();

    let redirect = (tag, deleted) => {
        return `#/projects/${projectId}/tags/`
    }

    export let tag = {
        name: undefined,
        color: '#5c5c5c'
    }

    let fields = {
        name: {
            type: 'text',
            label: 'Name',
            autofocus: true
        },
        color: {
            type: 'colorPicker',
            label: 'Color'
        }
    }

    let constraints = {
        name: {
            presence: {
                allowEmpty: false
            }
        },
        color: {
            presence: {
                allowEmpty: false
                //todo: color string validation
            }
        }
    };

    async function getTag() {
        return await api.getProjectTag(projectId, params.tagId);
    }

    async function saveTag(tag) {
        return await api.saveProjectTag(projectId, tag);
    }

    async function deleteTag(tag) {
        return await api.deleteProjectTag(projectId, tag.id);
    }
</script>

<InstanceEdit dataObject="{tag}" isNew="{params.tagId === undefined}" name="Tag" {fields} {constraints}
              {redirect} readFunc="{getTag}" saveFunc="{saveTag}" deleteFunc="{deleteTag}"/>
