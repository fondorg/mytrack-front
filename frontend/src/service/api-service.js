import axios from 'axios'
import {accessToken} from '../c8s/OidcContext.svelte'
import {get} from 'svelte/store'

export default class Api {

    baseUrl = "API_BASE_URL";

    defineHeaders() {
        axios.defaults.headers.common['Authorization'] = 'Bearer ' + get(accessToken)
    }

    async getProject(id) {
        this.defineHeaders();
        return axios
            .get(`http://localhost:8080/api/v1/projects/${id}`)
            .then(response => response.data)
            .catch(err => {
                console.log(err);
            })
    }

    async getProjects() {
        this.defineHeaders();
        return axios
            .get(this.baseUrl + "projects")
            .then(response => response.data)
            .catch(err => {
                console.log(err);
            })
    }

    async saveProject(project) {
        this.defineHeaders();
        return axios
            .post(this.baseUrl + "projects", project)
            .then(response => response.data)
            .catch(err => console.log(err));
    }
}
