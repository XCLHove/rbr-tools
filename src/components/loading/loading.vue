<script lang="ts" setup>
type LoadingProps = {
  text?: string
}

const props = withDefaults(defineProps<LoadingProps>(), {
  text: '加载中...',
})
</script>

<template>
  <div v-loading="true" :element-loading-text="props.text" class="w-full h-full"></div>
</template>

<style lang="scss" scoped></style>
