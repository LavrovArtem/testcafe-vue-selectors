<template lang="pug">
    li(:id='id')
        p {{ id }}
</template>
<script>
    export default {
        name:  'ListItem',
        props: ['id']
    };
</script>
<style>
    li {
        margin: 0 20px;
    }
</style>
