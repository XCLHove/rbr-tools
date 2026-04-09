<script setup lang="ts">
import RbrInstallPathText from '@/components/rbr-install-path-text/rbr-install-path-text.vue'
import { CircleCheck, Refresh, RefreshLeft } from '@element-plus/icons-vue'
import { computed, onMounted, ref } from 'vue'
import useRbrToolsStore from '@/stores/useRbrToolsStore.ts'
import { storeToRefs } from 'pinia'
import { listFontFamilyApi, listRbri18nFileApi, readRbrConfigApi, writeRbrConfigApi } from '@/invoke-apis/rbri18n-config.ts'
import { ElMessage } from 'element-plus'
import { parse, stringify } from 'ini'
import { loadingStart } from '@/utils/LoadingUtils.ts'
import { Option } from '@/types/element-plus-data.ts'
import { simpleClone } from '@/utils/simpleClone.ts'

const rbrConfig = ref(getDefaultRbri18nConfig())
const DisableCategories = computed({
  get() {
    return rbrConfig.value.RBRi18n.DisableCategories.split(',').filter((v) => v.trim())
  },
  set(value) {
    rbrConfig.value.RBRi18n.DisableCategories = value.join(',')
  },
})

const rbrToolsStore = useRbrToolsStore()
const { rbrInstallPath, rbrInstallPathValid } = storeToRefs(rbrToolsStore)

const languageOptionLabelMap = new Map<string, string>([
  ['zh', '中文（简体）'],
  ['zh-Hant', '中文（繁體）'],
  ['pt', 'Português'],
  ['fi', 'Suomi'],
  ['ru', 'Русский'],
  ['jp', '日本語'],
  ['hu', 'Magyar'],
])
const languageOptions = ref<Option[]>([])
const disableCategoriesOptions = ref<Option[]>([])
const fontFamilyOptions = ref<Option[]>([])

function getDefaultRbri18nConfig() {
  return {
    RBRi18n: {
      Language: 'zh',
      FontFamily: 'SimHei',
      FontSizeSmall: '7',
      FontSizeBig: '8',
      FontSizeDebug: '6',
      FontSizeHeading: '8',
      FontSizeMenu: '8',
      ColorBackground: 'FF323232',
      ColorSelection: 'FFFF0000',
      ColorIcon: 'FFC8C8C8',
      ColorText: 'FFFFFFFF',
      ColorHeading: 'FFFFFFFF',
      DisableCategories: '',
    },
  }
}

function refreshRbrConfig(options?: { showMessage?: boolean }) {
  if (!rbrInstallPathValid.value.valid) {
    ElMessage.error(rbrInstallPathValid.value.message)
    return
  }
  const loadingEnd = loadingStart('读取 RBR 配置...')
  readRbrConfigApi(rbrInstallPath.value)
    .then((iniText) => {
      const config = parse(iniText)
      rbrConfig.value = Object.assign(getDefaultRbri18nConfig(), config)
      if (options?.showMessage) {
        ElMessage.success('配置读取成功！')
      }
    })
    .finally(() => loadingEnd())
}

function saveRbrConfig() {
  const iniText = stringify(rbrConfig.value, {
    whitespace: true,
  })
  const loadingEnd = loadingStart('保存 RBR 配置...')
  writeRbrConfigApi(rbrInstallPath.value, iniText)
    .then(() => {
      ElMessage.success('保存完毕！')
      refreshRbrConfig()
    })
    .finally(() => loadingEnd())
}

function resetRbri18nConfig() {
  rbrConfig.value = Object.assign(simpleClone(rbrConfig.value), getDefaultRbri18nConfig())
  ElMessage.success('已重置为默认配置，请自行保存！')
}

function getFontFamilyOptions() {
  const loadingEnd = loadingStart('获取字体列表...')
  listFontFamilyApi()
    .then((fontFamilyList) => {
      fontFamilyOptions.value = fontFamilyList.map((fontFamily) => {
        return {
          label: fontFamily,
          value: fontFamily,
        }
      })
    })
    .finally(() => loadingEnd())
}

function getLanguageOptions() {
  if (!rbrInstallPathValid.value.valid) {
    ElMessage.error(rbrInstallPathValid.value.message)
    return
  }
  const loadingEnd = loadingStart('获取语言列表...')
  listRbri18nFileApi(rbrInstallPath.value)
    .then((fileList) => {
      fileList = fileList.filter((fileName) => fileName.endsWith('.json'))
      languageOptions.value = fileList
        .map((fileName) => fileName.split('.')[1] || fileName)
        .map((language) => {
          const label = languageOptionLabelMap.get(language)
          return {
            label: label || language,
            value: language,
          }
        })
    })
    .finally(() => loadingEnd())
}

function getDisableCategoriesOptions() {
  const loadingEnd = loadingStart('获取禁用特定翻译类别列表...')
  Promise.resolve()
    .then(() => {
      disableCategoriesOptions.value = [
        {
          label: '车辆',
          value: 'cars',
        },
        {
          label: '赛段',
          value: 'stages',
        },
        {
          label: '菜单',
          value: 'menu',
        },
        {
          label: '选项',
          value: 'options',
        },
        {
          label: '调教',
          value: 'tuning',
        },
        {
          label: 'rally',
          value: 'rally',
        },
        {
          label: '天气',
          value: 'weather',
        },
        {
          label: '教程',
          value: 'tutorial',
        },
        {
          label: '每日竞赛',
          value: 'dailystages',
        },
        {
          label: '杂项',
          value: 'misc',
        },
      ]
    })
    .finally(() => loadingEnd())
}

onMounted(async () => {
  await rbrToolsStore.waitingLoad()
  refreshRbrConfig()
  getDisableCategoriesOptions()
  getLanguageOptions()
  getFontFamilyOptions()
})
</script>

<template>
  <div class="w-full h-full flex flex-col">
    <div class="flex mt-1">
      <rbr-install-path-text />
      <el-button type="primary" :icon="Refresh" @click="refreshRbrConfig({ showMessage: true })">刷新配置</el-button>
      <el-button type="success" :icon="CircleCheck" @click="saveRbrConfig">保存配置</el-button>
      <el-button type="warning" :icon="RefreshLeft" @click="resetRbri18nConfig">默认配置</el-button>
    </div>
    <el-scrollbar class="mt-1">
      <el-descriptions :column="1" border label-width="150">
        <el-descriptions-item label="语言">
          <el-select v-model="rbrConfig.RBRi18n.Language" :options="languageOptions" filterable></el-select>
        </el-descriptions-item>
        <el-descriptions-item label="禁用特定翻译类别">
          <el-select
            v-model="DisableCategories"
            multiple
            collapse-tags-tooltip
            :options="disableCategoriesOptions"
            filterable
            placeholder="暂未禁用"
          ></el-select>
        </el-descriptions-item>
        <el-descriptions-item label="字体">
          <el-select v-model="rbrConfig.RBRi18n.FontFamily" :options="fontFamilyOptions" filterable></el-select>
        </el-descriptions-item>
        <el-descriptions-item label="字体大小(大)">
          <el-input v-model="rbrConfig.RBRi18n.FontSizeBig"></el-input>
        </el-descriptions-item>
        <el-descriptions-item label="字体大小(小)">
          <el-input v-model="rbrConfig.RBRi18n.FontSizeSmall"></el-input>
        </el-descriptions-item>
        <el-descriptions-item label="字体大小(调试)">
          <el-input v-model="rbrConfig.RBRi18n.FontSizeDebug"></el-input>
        </el-descriptions-item>
        <el-descriptions-item label="字体大小(标题)">
          <el-input v-model="rbrConfig.RBRi18n.FontSizeHeading"></el-input>
        </el-descriptions-item>
        <el-descriptions-item label="字体大小(菜单)">
          <el-input v-model="rbrConfig.RBRi18n.FontSizeMenu"></el-input>
        </el-descriptions-item>
        <el-descriptions-item label="颜色(背景)">
          <el-color-picker v-model="rbrConfig.RBRi18n.ColorBackground"></el-color-picker>
        </el-descriptions-item>
        <el-descriptions-item label="颜色(标题)">
          <el-color-picker v-model="rbrConfig.RBRi18n.ColorHeading"></el-color-picker>
        </el-descriptions-item>
        <el-descriptions-item label="颜色(图标)">
          <el-color-picker v-model="rbrConfig.RBRi18n.ColorIcon"></el-color-picker>
        </el-descriptions-item>
        <el-descriptions-item label="颜色(选项)">
          <el-color-picker v-model="rbrConfig.RBRi18n.ColorSelection"></el-color-picker>
        </el-descriptions-item>
        <el-descriptions-item label="颜色(文字)">
          <el-color-picker v-model="rbrConfig.RBRi18n.ColorText"></el-color-picker>
        </el-descriptions-item>
      </el-descriptions>
    </el-scrollbar>
  </div>
</template>

<style scoped lang="scss"></style>
