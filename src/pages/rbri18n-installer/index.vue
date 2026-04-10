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
import PageReadme from '@/components/page-readme/page-readme.vue'
import ReadmeUrl from './README.md?url'
import { decodeMulti } from '@/utils/base64Utils.ts'
import DonationCodeValidateDialog from '@/components/donation-code-validate-dialog/donation-code-validate-dialog.vue'

const rbrToolsStore = useRbrToolsStore()
const { rbrInstallPath, rbrInstallPathValid } = storeToRefs(rbrToolsStore)

const user = 'geekerlw'
const repo = 'RBRi18n'

const githubReleaseInfoList = ref<GithubReleaseInfo[]>([])
const currentReleaseInfo = ref<GithubReleaseInfo | null>(null)
const latestReleaseInfo = ref<GithubReleaseInfo | null>(null)
const currentReleaseAsserts = computed(() => currentReleaseInfo.value?.assets || [])
const i18nInstallStatus = ref<'已安装' | '未安装' | '未知'>('未知')

const mirrorUrlList = ref<string[]>([decodeMulti('YUhSMGNITTZMeTluYVhSb2RXSXVlR05zYUc5MlpTNTBiM0E9')])
const mirror = ref({
  enable: false,
  url: mirrorUrlList.value[0],
})

watch(
  () => githubReleaseInfoList.value,
  () => {
    currentReleaseInfo.value = githubReleaseInfoList.value[0] ?? null
  },
)

async function getRelease() {
  await Promise.all([getLatestRelease(), getReleaseList()])
}

async function getReleaseList() {
  const loadingEnd = loadingStart('获取插件信息...')
  await axios
    .get<GithubReleaseInfo[]>(`https://api.github.com/repos/${user}/${repo}/releases`, {
      timeout: 5 * 1000,
    })
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

async function getLatestRelease() {
  const loadingEnd = loadingStart('获取插件最新版本信息...')
  await axios
    .get<GithubReleaseInfo>(`https://api.github.com/repos/${user}/${repo}/releases/latest`, {
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
  installRBRi18nApi(rbrInstallPath.value, replaceWithMirrorUrl(asset.browser_download_url))
    .then(() => {
      checkRBRi18nInstallStatus()
      ElMessage.success('安装成功！')
    })
    .catch((e) => {
      ElMessage.error(`安装失败：${e?.message || e?.toString()}`)
    })
    .finally(() => loadingEnd())
}

function copyDownloadUrl(asset: Asset) {
  writeText(replaceWithMirrorUrl(asset.browser_download_url))
    .then(() => {
      ElMessage.success('已复制下载链接到剪贴板！')
    })
    .catch((e) => {
      const errMsg = e?.message || e?.toString()
      log_error(errMsg)
      ElMessage.error(`复制下载链接到剪贴板出错：${errMsg}`)
    })
}

function mirrorUrlFetchSuggestions(queryString: string, callback: Function) {
  const list = mirrorUrlList.value
    .filter((url) => url.includes(queryString))
    .map((url) => ({
      value: url,
    }))
  callback(list)
}

function replaceWithMirrorUrl(url: string) {
  if (!mirror.value.enable) return url
  if (!mirror.value.url) return url
  return url.replace('https://github.com', mirror.value.url)
}

function onChangeMirrorEnable(enable: boolean) {
  if (!enable) return
  ElMessage.warning('使用镜像时建议关闭加速器或相关程序否则会下载失败！')
}

onMounted(async () => {
  await rbrToolsStore.waitingLoad()
  await checkRBRi18nInstallStatus()
  await getRelease()
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
      <el-button :icon="Refresh" type="primary" @click="getRelease">重新获取插件信息</el-button>
    </div>
    <div class="flex mt-1">
      <el-checkbox v-model="mirror.enable" label="使用镜像地址(推荐开启)" :value="true" @change="(v: any) => onChangeMirrorEnable(v)"></el-checkbox>
      <el-autocomplete
        :disabled="!mirror.enable"
        v-model="mirror.url"
        placeholder="请输入镜像地址"
        :fetch-suggestions="mirrorUrlFetchSuggestions"
      ></el-autocomplete>
    </div>
    <el-table :data="currentReleaseAsserts" border class="mt-1" default-expand-all show-overflow-tooltip>
      <el-table-column type="expand">
        <template #default="{ row }">
          <el-button link type="primary" @click="copyDownloadUrl(row)">{{ replaceWithMirrorUrl(row.browser_download_url) }}</el-button>
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
    <page-readme :url="ReadmeUrl" />

    <donation-code-validate-dialog />
  </div>
</template>

<style lang="scss" scoped>
.home-page {
}
</style>
