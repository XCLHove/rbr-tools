<script lang="ts" setup>
import axios from 'axios'
import { computed, onMounted, ref, watch } from 'vue'
import { Asset, GithubReleaseInfo } from '@/pages/index/type.ts'
import { loadingStart } from '@/utils/LoadingUtils.ts'
import { log_error } from '@/invoke-apis/file-log.ts'
import { dayjs, ElMessage, ElMessageBox } from 'element-plus'
import { checkRBRi18nInstallStatusApi, installRBRi18nApi } from '@/invoke-apis/rbri18n-installer.ts'
import { writeText } from '@tauri-apps/plugin-clipboard-manager'
import { Refresh } from '@element-plus/icons-vue'
import useRbrToolsStore from '@/stores/useRbrToolsStore.ts'
import { storeToRefs } from 'pinia'
import RbrInstallPathText from '@/components/rbr-install-path-text/rbr-install-path-text.vue'

const rbrToolsStore = useRbrToolsStore()
const { rbrInstallPath, rbrInstallPathValid } = storeToRefs(rbrToolsStore)

const user = 'geekerlw'
const repo = 'RBRi18n'

const githubReleaseInfoList = ref<GithubReleaseInfo[]>([])
const currentReleaseInfo = ref<GithubReleaseInfo | null>(null)
const latestReleaseInfo = ref<GithubReleaseInfo | null>(null)
const currentReleaseAsserts = computed(() => currentReleaseInfo.value?.assets || [])
const i18nInstallStatus = ref<'已安装' | '未安装' | '未知'>('未知')

watch(
  () => githubReleaseInfoList.value,
  () => {
    currentReleaseInfo.value = githubReleaseInfoList.value[0] ?? null
  },
)

function getGithubReleaseList() {
  const loadingEnd = loadingStart('获取插件信息...')
  axios
    .get<GithubReleaseInfo[]>(`https://api.github.com/repos/${user}/${repo}/releases`)
    .then((r) => {
      githubReleaseInfoList.value = r.data
    })
    .catch((e) => {
      const errorMessage = e?.message || e?.toString()
      log_error(errorMessage)
      ElMessage.error(`获取插件信息出错：${errorMessage}`)
    })
    .finally(() => loadingEnd())
}

async function getLatestReleaseInfo() {
  const loadingEnd = loadingStart('获取插件最新版本信息...')
  await axios
    .get<GithubReleaseInfo>(`https://api.github.com/repos/${user}/${repo}/releases/latest`)
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

async function checkRBRi18nInstallStatus() {
  const loadingEnd = loadingStart('获取插件安装状态...')
  await checkRBRi18nInstallStatusApi(rbrInstallPath.value)
    .then((r) => {
      i18nInstallStatus.value = r as any
    })
    .finally(() => loadingEnd())
}

async function install(asset: Asset) {
  if (!rbrInstallPathValid.value.valid) {
    ElMessage.error(`请前往配置界面配置正确的 RBR 安装目录！`)
    return
  }

  if (i18nInstallStatus.value === '已安装') {
    const confirm = await ElMessageBox.confirm('是否重新安装？', '提示')
      .then(() => true)
      .catch(() => false)
    if (!confirm) return
  }

  const loadingEnd = loadingStart('正在安装...')
  installRBRi18nApi(rbrInstallPath.value, asset.browser_download_url)
    .then((r) => {
      checkRBRi18nInstallStatus()
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

function getRBRi18nInfo() {
  getLatestReleaseInfo()
  getGithubReleaseList()
}

onMounted(async () => {
  await rbrToolsStore.waitingLoad()
  await checkRBRi18nInstallStatus()
  getLatestReleaseInfo()
  getGithubReleaseList()
})
</script>

<template>
  <div class="home-page w-full h-full flex flex-col">
    <el-text class="text-center" style="font-size: 32px">RBR 汉化一键安装</el-text>
    <rbr-install-path-text />
    <div class="flex flex-row items-center mt-1">
      <div>
        <el-tag
          :type="!rbrInstallPathValid.valid ? 'danger' : i18nInstallStatus === '已安装' ? 'success' : 'warning'"
          class="text-nowrap"
          size="large"
        >
          <span style="width: 100px">{{ !rbrInstallPathValid.valid ? rbrInstallPathValid.message : i18nInstallStatus }}</span>
        </el-tag>
      </div>
      <el-select v-model="currentReleaseInfo" placeholder="请选择版本" value-key="id">
        <el-option v-for="item in githubReleaseInfoList" :key="item.id" :label="item.name" :value="item">
          {{ item.name }}{{ item.id === latestReleaseInfo?.id ? '(最新)' : '' }}({{ dateFormat(item.updated_at) }})
        </el-option>

        <template #prefix>版本</template>
      </el-select>
      <el-button :icon="Refresh" type="primary" @click="getRBRi18nInfo">重新获取插件信息</el-button>
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
