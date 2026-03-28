<script lang="ts" setup>
import useRbrToolsStore from '@/stores/useRbrToolsStore.ts'
import { storeToRefs } from 'pinia'

defineOptions({
  name: 'rbr-install-path-text',
})

const rbrToolsStore = useRbrToolsStore()
const { rbrInstallPath } = storeToRefs(rbrToolsStore)
</script>

<template>
  <div class="flex flex-col mt-1 pl-1 pr-1">
    <el-text class="text-nowrap" style="align-self: flex-start" truncated>
      RBR 安装路径：{{ rbrInstallPath || '未配置，请前往【配置】界面配置！' }}
    </el-text>
  </div>
</template>

<style lang="scss" scoped></style>
