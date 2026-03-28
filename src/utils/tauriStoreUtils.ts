import { load } from '@tauri-apps/plugin-store'
import { getName } from '@tauri-apps/api/app'

export const tauriStoreKey = {
  RBR_INSTALL_PATH: 'RBR_INSTALL_PATH',
}

let store: ReturnType<typeof load> | null = null

export function getTauriStore() {
  if (!store) {
    store = getName().then((appName) => load(`store/${appName}.bin`))
  }
  return store
}
