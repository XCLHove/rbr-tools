<script setup lang="ts">
import RbrInstallPathText from '@/components/rbr-install-path-text/rbr-install-path-text.vue'
import { onMounted, ref } from 'vue'
import useRbrToolsStore from '@/stores/useRbrToolsStore.ts'
import { storeToRefs } from 'pinia'
import { ElMessage } from 'element-plus'
import { loadingStart } from '@/utils/LoadingUtils.ts'
import { parse, stringify } from 'ini'
import { readRsfConfigApi, writeRsfConfigApi } from '@/invoke-apis/rsf-config.ts'
import { simpleClone } from '@/utils/simpleClone.ts'
import { CircleCheck, Refresh, RefreshLeft } from '@element-plus/icons-vue'

const rbrToolsStore = useRbrToolsStore()
const { rbrInstallPath, rbrInstallPathValid } = storeToRefs(rbrToolsStore)

const rsfConfig = ref(getDefaultRsfConfig())

function getDefaultRsfConfig() {
  return {
    drive: {
      show_advanced_options: false,
    },
  }
}

function refreshRsfConfig(options?: { showMessage?: boolean }) {
  if (!rbrInstallPathValid.value.valid) {
    ElMessage.error(rbrInstallPathValid.value.message)
    return
  }
  const loadingEnd = loadingStart('读取 RSF 配置...')
  readRsfConfigApi(rbrInstallPath.value)
    .then((iniText) => {
      const config = parse(iniText)
      rsfConfig.value = Object.assign(getDefaultRsfConfig(), config)
      if (options?.showMessage) {
        ElMessage.success('配置读取成功！')
      }
    })
    .finally(() => loadingEnd())
}

function saveRsfConfig() {
  const iniText = stringify(rsfConfig.value, {
    whitespace: true,
  })
  const loadingEnd = loadingStart('保存 RBR 配置...')
  writeRsfConfigApi(rbrInstallPath.value, iniText)
    .then(() => {
      ElMessage.success('保存完毕！')
      refreshRsfConfig()
    })
    .finally(() => loadingEnd())
}

function resetRsfConfig() {
  rsfConfig.value = Object.assign(simpleClone(rsfConfig.value), getDefaultRsfConfig())
  ElMessage.success('已重置为默认配置，请自行保存！')
}

onMounted(async () => {
  await rbrToolsStore.waitingLoad()
  refreshRsfConfig()
})
</script>

<template>
  <div class="flex flex-col">
    <div class="flex mt-1">
      <rbr-install-path-text />
      <el-button type="primary" :icon="Refresh" @click="refreshRsfConfig({ showMessage: true })">刷新配置</el-button>
      <el-button type="success" :icon="CircleCheck" @click="saveRsfConfig">保存配置</el-button>
      <el-button type="warning" :icon="RefreshLeft" @click="resetRsfConfig">默认配置</el-button>
    </div>
    <el-scrollbar class="mt-1">
      <el-descriptions :column="1" border label-width="130">
        <el-descriptions-item label="显示高级选项">
          <el-switch active-text="已开启" inactive-text="已关闭" inline-prompt v-model="rsfConfig.drive.show_advanced_options"></el-switch>
        </el-descriptions-item>
      </el-descriptions>
    </el-scrollbar>
  </div>
</template>

<style scoped lang="scss"></style>
