<script>
    export let id;
    export let title
    export let desc;
</script>

<div class="flex flex-col p-2 border rounded-sm w-full md:w-1/2 mb-2 mx-2 bg-gray-100">
    <div class="flex">
        <img class="w-5 mr-2" src="/img/project.svg">
        <a href="#/projects/{id}">
            <div class="text-lg">{title}</div>
        </a>
    </div>
    <div class="text-sm">{desc}</div>
</div>