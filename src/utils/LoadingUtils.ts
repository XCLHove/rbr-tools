import { ElLoading } from 'element-plus'
import { computed, ref, watch } from 'vue'

let loadingIdIndex = 1
const loadingList: { loadingId: string; loadingText: string }[] = []
let loadingInstance: ReturnType<typeof ElLoading.service> | null = null

function createLoadingId() {
  loadingIdIndex += 1
  return loadingIdIndex.toString()
}

export function loadingStart(loadingText?: string) {
  const loadingId = createLoadingId()
  loadingText ||= '加载中...'
  loadingList.push({ loadingId, loadingText })
  if (!loadingInstance) {
    loadingInstance = ElLoading.service({
      text: loadingText,
    })
  }
  updateLoadingText()

  let loadingEndOnce = () => {
    loadingEndOnce = () => {}
    loadingEnd(loadingId)
  }
  return () => loadingEndOnce()
}

function loadingEnd(loadingId: string) {
  const loadingIndex = loadingList.findIndex((item) => item.loadingId === loadingId)
  if (loadingIndex >= 0) {
    loadingList.splice(loadingIndex, 1)
  }
  if (loadingList.length === 0) {
    loadingInstance?.close()
    loadingInstance = null
    return
  }
  updateLoadingText()
}

function updateLoadingText() {
  const loadingText = loadingList[loadingList.length - 1]?.loadingText || '加载中...'
  loadingInstance?.setText(loadingText)
}

export function useLoading() {
  const defaultText = '加载中...'
  const loadingTextList = ref<{ id: number; text: string }[]>([])
  const loading = computed(() => loadingTextList.value.length > 0)
  const loadingText = ref(defaultText)
  watch(
    () => loadingTextList.value,
    () => {
      return loadingTextList.value[loadingTextList.value.length - 1]?.text || defaultText
    },
    {
      deep: true,
    },
  )

  let idIndex = 0
  const loadingStart = (text?: string) => {
    text = text || defaultText
    const id = idIndex++
    loadingTextList.value.push({
      id,
      text,
    })

    const loadingEnd = () => {
      loadingTextList.value = loadingTextList.value.filter((i) => i.id !== id)
    }
    return loadingEnd
  }

  return {
    loading,
    loadingText,
    loadingStart,
  }
}
