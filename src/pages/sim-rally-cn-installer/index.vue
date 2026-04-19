<script lang="ts" setup>
import axios from 'axios'
import { computed, onMounted, ref, watch } from 'vue'
import { loadingStart } from '@/utils/LoadingUtils.ts'
import { log_error } from '@/invoke-apis/file-log.ts'
import { dayjs, ElMessage, ElMessageBox } from 'element-plus'
import { writeText } from '@tauri-apps/plugin-clipboard-manager'
import { Refresh } from '@element-plus/icons-vue'
import useRbrToolsStore from '@/stores/useRbrToolsStore.ts'
import { storeToRefs } from 'pinia'
import { Asset, GiteeReleaseInfo } from '@/pages/sim-rally-cn-installer/type.ts'
import { checkSimRallyCNInstallStatusApi, installSimRallyCNApi } from '@/invoke-apis/sim-rally-cn-installer.ts'
import RbrInstallPathText from '@/components/rbr-install-path-text/rbr-install-path-text.vue'

const rbrToolsStore = useRbrToolsStore()
const { rbrInstallPath, rbrInstallPathValid } = storeToRefs(rbrToolsStore)

const user = 'xclhove'
const repo = 'sim-rally-cn-mirror'

const giteeReleaseInfoList = ref<GiteeReleaseInfo[]>([])
const currentReleaseInfo = ref<GiteeReleaseInfo | null>(null)
const latestReleaseInfo = ref<GiteeReleaseInfo | null>(null)
const currentReleaseAsserts = computed(() => {
  const asserts = currentReleaseInfo.value?.assets || []
  return asserts.filter((assert) => assert.name.toUpperCase().includes('SimRallyCN'.toUpperCase()))
})
const simRallyCNInstallStatus = ref<'已安装' | '未安装' | '已禁用' | '未知'>('未知')

async function getRelease() {
  await Promise.all([getLatestRelease(), getReleaseList()])
  currentReleaseInfo.value =
    giteeReleaseInfoList.value.find((info) => info.id === latestReleaseInfo.value?.id) || giteeReleaseInfoList.value[0] || null
}

async function getReleaseList() {
  const loadingEnd = loadingStart('获取插件信息...')
  await axios
    .get<GiteeReleaseInfo[]>(`https://gitee.com/api/v5/repos/${user}/${repo}/releases`, {
      timeout: 5 * 1000,
    })
    .then((r) => {
      giteeReleaseInfoList.value = r.data
    })
    .catch((e) => {
      const errorMessage = e?.message || e?.toString()
      log_error(errorMessage)
      ElMessage.error(`获取插件信息出错：${errorMessage}`)
    })
    .finally(() => loadingEnd())
}

async function getLatestRelease() {
  const loadingEnd = loadingStart('获取插件最新版本信息...')
  await axios
    .get<GiteeReleaseInfo>(`https://gitee.com/api/v5/repos/${user}/${repo}/releases/latest`, {
      timeout: 5 * 1000,
    })
    .then((r) => {
      latestReleaseInfo.value = r.data
    })
    .catch((e) => {
      const errorMessage = e?.message || e?.toString()
      log_error(errorMessage)
      ElMessage.error(`获取插件最新版本信息出错：${errorMessage}`)
    })
    .finally(() => loadingEnd())
}

function dateFormat(date: string) {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss')
}

async function checkSimRallyCNInstallStatus() {
  const loadingEnd = loadingStart('获取插件安装状态...')
  await checkSimRallyCNInstallStatusApi(rbrInstallPath.value)
    .then((r) => {
      simRallyCNInstallStatus.value = r as any
    })
    .finally(() => loadingEnd())
}

async function install(asset: Asset) {
  if (!rbrInstallPathValid.value.valid) {
    ElMessage.error(`请前往配置界面配置正确的 RBR 安装目录！`)
    return
  }

  if (simRallyCNInstallStatus.value === '已安装' || simRallyCNInstallStatus.value === '已禁用') {
    const confirm = await ElMessageBox.confirm('是否重新安装？', '提示')
      .then(() => true)
      .catch(() => false)
    if (!confirm) return
  }

  const loadingEnd = loadingStart('正在安装...')
  installSimRallyCNApi(rbrInstallPath.value, asset.browser_download_url)
    .then(() => {
      checkSimRallyCNInstallStatus()
      ElMessage.success('安装成功！')
    })
    .catch((e) => {
      ElMessage.error(`安装失败：${e?.message || e?.toString()}`)
    })
    .finally(() => loadingEnd())
}

function copyDownloadUrl(asset: Asset) {
  writeText(asset.browser_download_url)
    .then(() => {
      ElMessage.success('已复制下载链接到剪贴板！')
    })
    .catch((e) => {
      const errMsg = e?.message || e?.toString()
      log_error(errMsg)
      ElMessage.error(`复制下载链接到剪贴板出错：${errMsg}`)
    })
}

onMounted(async () => {
  await rbrToolsStore.waitingLoad()
  await checkSimRallyCNInstallStatus()
  await getRelease()
})
</script>

<template>
  <div class="home-page w-full h-full flex flex-col">
    <el-text class="text-center" style="font-size: 32px">SimRallyCN 一键安装</el-text>
    <rbr-install-path-text />
    <div class="flex flex-row items-center mt-1">
      <div>
        <el-tag
          :type="!rbrInstallPathValid.valid ? 'danger' : simRallyCNInstallStatus === '已安装' ? 'success' : 'warning'"
          class="text-nowrap"
          size="large"
        >
          <span style="width: 100px">{{ !rbrInstallPathValid.valid ? rbrInstallPathValid.message : simRallyCNInstallStatus }}</span>
        </el-tag>
      </div>
      <el-select v-model="currentReleaseInfo" placeholder="请选择版本" value-key="id">
        <el-option v-for="item in giteeReleaseInfoList" :key="item.id" :label="item.name" :value="item">
          {{ item.name }}{{ item.id === latestReleaseInfo?.id ? '(最新)' : '' }}
        </el-option>

        <template #prefix>版本</template>
      </el-select>
      <el-button :icon="Refresh" type="primary" @click="getRelease">重新获取插件信息</el-button>
    </div>
    <el-table :data="currentReleaseAsserts" border class="mt-1" default-expand-all show-overflow-tooltip>
      <el-table-column type="expand">
        <template #default="{ row }">
          <el-button link type="primary" @click="copyDownloadUrl(row)">{{ row.browser_download_url }}</el-button>
        </template>
      </el-table-column>
      <el-table-column label="文件名称" prop="name"></el-table-column>
      <el-table-column label="上传时间" prop="updated_at" width="200">
        <template #default="{ row }">
          {{ dateFormat(row.updated_at) }}
        </template>
      </el-table-column>
      <el-table-column align="center" fixed="right" label="操作" width="100">
        <template #default="{ row }">
          <div class="flex justify-center">
            <el-button type="primary" @click="install(row)">安装</el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<style lang="scss" scoped>
.home-page {
}
</style>
