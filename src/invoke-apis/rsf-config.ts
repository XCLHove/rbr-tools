import { invokeWrapper } from '@/utils/invokeWrapper.ts'

export const readRsfConfigApi = (rbrInstallPath: string) => {
  return invokeWrapper<string>('read_rsf_config', {
    rbrInstallPath,
  })
}

export const writeRsfConfigApi = (rbrInstallPath: string, content: string) => {
  return invokeWrapper<void>('write_rsf_config', {
    rbrInstallPath,
    content,
  })
}
