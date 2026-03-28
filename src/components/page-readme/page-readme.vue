<script lang="ts" setup>
import { MdPreview } from 'md-editor-v3'
import 'md-editor-v3/lib/preview.css'
import { ref, watch } from 'vue'
import axios from 'axios'
import { useLoading } from '@/utils/LoadingUtils.ts'

type PageReadmeProps = {
  url: string
}

const props = defineProps<PageReadmeProps>()

const { loading, loadingText, loadingStart } = useLoading()
const readmeContent = ref('')

watch(
  () => props.url,
  () => getReadmeContent(),
  {
    immediate: true,
  },
)

function getReadmeContent() {
  const url = props.url
  const loadingEnd = loadingStart()
  axios
    .get(url)
    .then((r) => {
      if (props.url !== props.url) return
      readmeContent.value = r.data
    })
    .finally(() => loadingEnd())
}
</script>

<template>
  <MdPreview v-loading="loading" :element-loading-text="loadingText" :modelValue="readmeContent" />
</template>

<style lang="scss" scoped></style>
