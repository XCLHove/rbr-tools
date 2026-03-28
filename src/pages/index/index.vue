<template>
  <div class="pl-5 pr-5">
    <page-readme :url="ReadmeUrl" />
  </div>
</template>

<script setup>
import ReadmeUrl from './README.md?url'
import PageReadme from '@/components/page-readme/page-readme.vue'
</script>

<style lang="scss" scoped></style>
