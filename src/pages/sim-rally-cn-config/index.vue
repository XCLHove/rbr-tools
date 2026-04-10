<script setup lang="ts">
import RbrInstallPathText from '@/components/rbr-install-path-text/rbr-install-path-text.vue'
import { onMounted, ref } from 'vue'
import useRbrToolsStore from '@/stores/useRbrToolsStore.ts'
import { storeToRefs } from 'pinia'
import { ElMessage } from 'element-plus'
import { loadingStart } from '@/utils/LoadingUtils.ts'
import { parse, stringify } from 'ini'
import { readSimRallyCNConfigApi, writeSimRallyCNConfigApi } from '@/invoke-apis/sim-rally-cn-config.ts'
import { simpleClone } from '@/utils/simpleClone.ts'
import { CircleCheck, Refresh, RefreshLeft } from '@element-plus/icons-vue'

const rbrToolsStore = useRbrToolsStore()
const { rbrInstallPath, rbrInstallPathValid } = storeToRefs(rbrToolsStore)

const simRallyCNConfig = ref(getDefaultSimRallyCNConfig())

function getDefaultSimRallyCNConfig() {
  return {
    livebattle: {
      ServerHost: '8.137.36.254',
      ServerPort: '24555',
      LeaderEnable: true,
      ProgressEnable: true,
      LeaderBoardPosX: '20',
      LeaderBoardPosY: '20',
      ProgressBarPosX: '30',
      ProgressBarPosY: '300',
    },
  }
}

function refreshRsfConfig(options?: { showMessage?: boolean }) {
  if (!rbrInstallPathValid.value.valid) {
    ElMessage.error(rbrInstallPathValid.value.message)
    return
  }
  const loadingEnd = loadingStart('读取 SimRallyCN 配置...')
  readSimRallyCNConfigApi(rbrInstallPath.value)
    .then((iniText) => {
      const config = parse(iniText)
      simRallyCNConfig.value = Object.assign(getDefaultSimRallyCNConfig(), config)
      if (options?.showMessage) {
        ElMessage.success('配置读取成功！')
      }
    })
    .finally(() => loadingEnd())
}

function saveRsfConfig() {
  const iniText = stringify(simRallyCNConfig.value, {
    whitespace: true,
  })
  const loadingEnd = loadingStart('保存 SimRallyCN 配置...')
  writeSimRallyCNConfigApi(rbrInstallPath.value, iniText)
    .then(() => {
      ElMessage.success('保存完毕！')
      refreshRsfConfig()
    })
    .finally(() => loadingEnd())
}

function resetSimRallyCNConfig() {
  simRallyCNConfig.value = Object.assign(simpleClone(simRallyCNConfig.value), getDefaultSimRallyCNConfig())
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
      <el-button type="warning" :icon="RefreshLeft" @click="resetSimRallyCNConfig">默认配置</el-button>
    </div>
    <el-scrollbar class="mt-1">
      <el-descriptions :column="1" border label-width="130">
        <el-descriptions-item label="联机服务器IP">
          <el-input v-model="simRallyCNConfig.livebattle.ServerHost"></el-input>
        </el-descriptions-item>
        <el-descriptions-item label="联机服务器端口">
          <el-input v-model="simRallyCNConfig.livebattle.ServerPort"></el-input>
        </el-descriptions-item>
        <el-descriptions-item label="排行榜">
          <el-switch v-model="simRallyCNConfig.livebattle.LeaderEnable" active-text="已开启" inactive-text="已关闭" inline-prompt />
        </el-descriptions-item>
        <el-descriptions-item label="排行榜位置(X轴)">
          <el-input v-model="simRallyCNConfig.livebattle.LeaderBoardPosX"></el-input>
        </el-descriptions-item>
        <el-descriptions-item label="排行榜位置(Y轴)">
          <el-input v-model="simRallyCNConfig.livebattle.LeaderBoardPosY"></el-input>
        </el-descriptions-item>
        <el-descriptions-item label="进度条">
          <el-switch v-model="simRallyCNConfig.livebattle.ProgressEnable" active-text="已开启" inactive-text="已关闭" inline-prompt />
        </el-descriptions-item>
        <el-descriptions-item label="进度条位置(X轴)">
          <el-input v-model="simRallyCNConfig.livebattle.ProgressBarPosX"></el-input>
        </el-descriptions-item>
        <el-descriptions-item label="进度条位置(Y轴)">
          <el-input v-model="simRallyCNConfig.livebattle.ProgressBarPosY"></el-input>
        </el-descriptions-item>
      </el-descriptions>
    </el-scrollbar>
  </div>
</template>

<style scoped lang="scss"></style>
