<script lang="ts" setup>
import RbrInstallPathText from '@/components/rbr-install-path-text/rbr-install-path-text.vue'
import { onMounted, ref } from 'vue'
import {
  cancelConfigReadonlyApi,
  disabledAutoCancelConfigReadonlyApi,
  enableAutoCancelConfigReadonlyApi,
  getConfigReadonlyApi,
  getIsEnableAutoCancelConfigReadonlyApi,
} from '@/invoke-apis/cancel-config-readonly.ts'
import { loadingStart } from '@/utils/LoadingUtils.ts'
import useRbrToolsStore from '@/stores/useRbrToolsStore.ts'
import { storeToRefs } from 'pinia'
import { ElMessage } from 'element-plus'
import PageReadme from '@/components/page-readme/page-readme.vue'
import ReadmeUrl from './README.md?url'

const rbrToolsStore = useRbrToolsStore()
const { rbrInstallPath, rbrInstallPathValid } = storeToRefs(rbrToolsStore)
const configReadonly = ref<boolean | null>(null)

const isEnableAutoCancelConfigReadonly = ref(false)

function refreshIsEnableAutoCancelConfigReadonly() {
  const loadingEnd = loadingStart('加载状态...')
  getIsEnableAutoCancelConfigReadonlyApi()
    .then((v) => {
      isEnableAutoCancelConfigReadonly.value = v
    })
    .finally(() => loadingEnd())
}

async function refreshConfigReadonly() {
  if (!rbrInstallPathValid.value.valid) {
    ElMessage.error(rbrInstallPathValid.value.message)
    return
  }
  const loadingEnd = loadingStart('加载状态...')
  await getConfigReadonlyApi(rbrInstallPath.value)
    .then((v) => {
      configReadonly.value = v
    })
    .finally(() => loadingEnd())
}

async function switchAutoCancelConfigReadonly(enable: boolean) {
  if (!enable) {
    const loadingEnd = loadingStart('取消监听...')
    await disabledAutoCancelConfigReadonlyApi().finally(() => loadingEnd())
  } else {
    if (!rbrInstallPathValid.value.valid) {
      ElMessage.error(rbrInstallPathValid.value.message)
      return
    }
    await cancelConfigReadonly()
    const loadingEnd2 = loadingStart('开始监听...')
    await enableAutoCancelConfigReadonlyApi(rbrInstallPath.value).finally(() => loadingEnd2())
  }
  refreshIsEnableAutoCancelConfigReadonly()
}

async function cancelConfigReadonly() {
  if (!rbrInstallPathValid.value.valid) {
    ElMessage.error(rbrInstallPathValid.value.message)
    return
  }
  const loadingEnd = loadingStart('开始监听...')
  await cancelConfigReadonlyApi(rbrInstallPath.value).finally(() => loadingEnd())
  await refreshConfigReadonly()
}

onMounted(async () => {
  await rbrToolsStore.waitingLoad()
  refreshIsEnableAutoCancelConfigReadonly()
  refreshConfigReadonly()
})
</script>

<template>
  <div class="w-full h-full flex flex-col">
    <rbr-install-path-text />
    <div class="flex items-center">
      <el-text>配置文件状态：</el-text>
      <el-tag v-if="configReadonly === null" size="large" type="info">未知</el-tag>
      <el-tag v-else-if="configReadonly" size="large" type="danger">只读</el-tag>
      <el-tag v-else size="large" type="success">可写</el-tag>
      <div class="flex ml-2">
        <el-button type="primary" @click="refreshConfigReadonly">刷新</el-button>
        <el-button type="success" @click="cancelConfigReadonly">取消只读</el-button>
      </div>
    </div>
    <div class="flex items-center">
      <el-text>自动取消只读：</el-text>
      <el-switch
        :active-value="true"
        :inactive-value="false"
        :model-value="isEnableAutoCancelConfigReadonly"
        active-text="已开启"
        inactive-text="已关闭"
        inline-prompt
        @change="(v) => switchAutoCancelConfigReadonly(v as boolean)"
      ></el-switch>
    </div>
    <page-readme :url="ReadmeUrl" />
  </div>
</template>

<style lang="scss" scoped></style>
