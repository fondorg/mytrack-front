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
    import ColorButton from "./ColorButton.svelte";

    export let dataObject;
    export let fields;
    export let constraints;
    export let onSubmit;
    export let onDelete;

    export let onCancel = () => {
        pop()
    };

    let validations = {};
    let formIsValid = false;
    let processing = false;

    $: {
        //console.log(dataObject)
        let vRes = validate(dataObject, constraints)
        formIsValid = vRes === undefined
        validations = vRes || {}
    }

    async function doSubmit() {
        processing = true;
        await onSubmit(dataObject);
        processing = false;
    }

    async function doDelete() {
        processing = true;
        await onDelete(dataObject);
        processing = false;
    }

    function onKeyDown(e) {
        if (e.ctrlKey && e.key === 'Enter' && formIsValid) {
            doSubmit();
        }
    }

</script>

<div class="grid relative w-full" on:keydown={onKeyDown}>
    <BusyScreen loading="{processing}"/>
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
    <div class="mt-4 grid grid-cols-4 md:grid-cols-4 gap-4" id="form-action-bar">
        <Button on:click={doSubmit} name="Save" defaultAction="true" disabled='{!formIsValid}'/>
        <div></div>
        {#if onDelete}
            <ColorButton on:click={doDelete} name="Delete" textColor="text-white" bgColor="bg-red-700"
                         pressedBackground="bg-red-900"
                         extraStyle="px-0"/>
        {:else}
            <div></div>
        {/if}
        <Button name="Cancel" on:click={onCancel}/>
    </div>
</div>