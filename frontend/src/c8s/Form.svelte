<script>
    /**
     * Generic form for instance editing
     */

    import {validate} from 'validate.js'
    import TextField from './TextField.svelte'
    import Checkbox from './Checkbox.svelte'
    import TextAreaField from './TextAreaField.svelte'
    import Button from './Button.svelte'
    import {pop} from 'svelte-spa-router'
    import BusyScreen from './BusyScreen.svelte'

    export let dataObject;
    export let fields;
    export let constraints;
    export let onSubmit;

    export let onCancel = () => {
        pop()
    };

    let validations = {};
    let formIsValid = false;
    let submitting = false;

    $: {
        //console.log(dataObject)
        let vRes = validate(dataObject, constraints)
        formIsValid = vRes === undefined
        validations = vRes || {}
    }

    async function doSubmit() {
        submitting = true;
        await onSubmit(dataObject)
        submitting = false;
    }

    function onKeyDown(e) {
        if (e.ctrlKey && e.key === 'Enter' && formIsValid) {
            doSubmit();
        }
    }

</script>

<div class="grid relative" on:keydown={onKeyDown}>
    <BusyScreen loading="{submitting}"/>
    {#each Object.entries(fields) as [key, val] (key)}
        {#if val.type === 'text'}
            <TextField label="{val.label}" bind:value={dataObject[key]} bind:errorMsg={validations[key]}
                       autofocus="{val.autofocus || false}"/>
        {:else if val.type === 'checkbox'}
            <Checkbox label="{val.label}" bind:value={dataObject[key]} bind:errorMsg={validations[key]}/>
        {:else if val.type === 'textarea'}
            <TextAreaField label="{val.label}" bind:value={dataObject[key]} bind:errorMsg={validations[key]}
            autofocus="{val.autofocus || false}"/>
        {/if}
    {/each}
    <div class="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4" id="form-action-bar">
        <div></div>
        <div></div>
        <Button on:click={doSubmit} name="Save" defaultAction="true" disabled='{!formIsValid}'/>
        <Button name="Cancel" on:click={onCancel}/>
    </div>
</div>