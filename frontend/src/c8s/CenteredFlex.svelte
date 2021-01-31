<script>
    export let extraClasses = '';
</script>

<div class="container flex flex-grow mx-auto items-center justify-center mt-2">
    <div class="flex flex-col items-center w-full {extraClasses}">
        <slot></slot>
    </div>
</div>
