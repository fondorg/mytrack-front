import axios from 'axios'
import {accessToken} from '../c8s/OidcContext.svelte'
import {get} from 'svelte/store'
import {stringify} from 'qs'

export default class Api {

    baseUrl = "API_BASE_URL";

    defineHeaders() {
        axios.defaults.headers.common['Authorization'] = 'Bearer ' + get(accessToken)
    }

    async getProject(id) {
        this.defineHeaders();
        return axios
            .get(`${this.baseUrl}/projects/${id}`)
            .then(response => response.data)
            .catch(err => {
                console.log(err);
            })
    }

    async getProjects(page = 1, size = 20) {
        this.defineHeaders();
        return axios
            .get(`${this.baseUrl}/projects?page=${page}&size=${size}`)
            .then(response => response.data)
            .catch(err => {
                console.log(err);
            })
    }

    async saveProject(project) {
        this.defineHeaders();
        return axios
            .post(`${this.baseUrl}/projects`, project)
            .then(response => response.data)
            .catch(err => console.log(err));
    }

    async deleteProject(projectId) {
        this.defineHeaders()
        return axios
            .delete(`${this.baseUrl}/projects/${projectId}`)
            .then(response => {
            })
            .catch(err => console.error(err))
    }

    async getProjectIssues(projectId, params = {}) {
        this.defineHeaders();
        return axios
            // .get(`${this.baseUrl}/projects/${projectId}/issues?page=${params.page}&size=${params.size}` )
            .get(`${this.baseUrl}/projects/${projectId}/issues`, {
                params,
                paramsSerializer: params => {
                    return stringify(params, {arrayFormat: 'brackets'})
                }
            })

            .then(response => response.data)
            .catch(err => console.log(err));
    }

    async getProjectIssue(projectId, issueId) {
        this.defineHeaders();
        return axios
            .get(`${this.baseUrl}/projects/${projectId}/issues/${issueId}`)
            .then(response => response.data)
            .catch(err => {
                console.log(err);
            })
    }

    async saveProjectIssue(projectId, issue) {
        this.defineHeaders();
        return axios
            .post(`${this.baseUrl}/projects/${projectId}/issues`, issue)
            .then(response => response.data)
            .catch(err => console.log(err));
    }

    // async updateProjectIssue(projectId, issueId, issue) {
    //     this.defineHeaders();
    //     return axios
    //         .post(`${this.baseUrl}/projects/${projectId}/issues`, issue)
    //         .then(response => response.data)
    //         .catch(err => console.log(err));
    // }

    async deleteProjectIssue(projectId, issueId) {
        this.defineHeaders();
        return axios
            .delete(`${this.baseUrl}/projects/${projectId}/issues/${issueId}`)
            .then(response => {
            })
            .catch(err => console.log(err))
    }

    async saveProjectTag(projectId, tag) {
        this.defineHeaders()
        return axios.post(`${this.baseUrl}/projects/${projectId}/tags`, tag)
            .then(resp => resp.data)
            .catch(err => console.error(err))
    }

    async saveCommonTag(tag) {
        this.defineHeaders()
        return axios.post(`${this.baseUrl}/tags`, tag)
            .then(resp => resp.data)
            .catch(err => console.error(err))
    }

    async getProjectTags(projectId) {
        this.defineHeaders()
        return axios.get(`${this.baseUrl}/projects/${projectId}/tags`)
            .then(resp => resp.data)
            .catch(err => console.error(err))
    }

    async getCommonTags(params = {}) {
        this.defineHeaders()
        return axios.get(`${this.baseUrl}/tags`, params)
            .then(resp => resp.data)
            .catch(err => console.error(err))
    }

    async getProjectTag(projectId, tagId) {
        this.defineHeaders()
        return axios.get(`${this.baseUrl}/projects/${projectId}/tags/${tagId}`)
            .then(resp => resp.data)
            .catch(err => console.error(err))
    }

    async getCommonTag(tagId) {
        this.defineHeaders()
        return axios.get(`${this.baseUrl}/tags/${tagId}`)
            .then(resp => resp.data)
            .catch(err => console.error(err))
    }

    async deleteProjectTag(projectId, tagId) {
        this.defineHeaders()
        return axios.delete(`${this.baseUrl}/projects/${projectId}/tags/${tagId}`)
            .then(resp => {
            })
            .catch(err => console.error(err))
    }

    async deleteCommonTag(tagId) {
        this.defineHeaders()
        return axios.delete(`${this.baseUrl}/tags/${tagId}`)
            .then(resp => {
            })
            .catch(err => console.error(err))
    }

    async getIssueTags(projectId, issueId) {
        this.defineHeaders()
        return axios.get(`${this.baseUrl}/projects/${projectId}/issues/${issueId}/tags`)
            .then(resp => resp.data)
            .catch(err => console.error(err));
    }
}
