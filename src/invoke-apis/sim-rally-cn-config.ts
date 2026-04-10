import { invokeWrapper } from '@/utils/invokeWrapper.ts'

export const readSimRallyCNConfigApi = (rbrInstallPath: string) => {
  return invokeWrapper<string>('read_sim_rally_cn_config', {
    rbrInstallPath,
  })
}

export const writeSimRallyCNConfigApi = (rbrInstallPath: string, content: string) => {
  return invokeWrapper<void>('write_sim_rally_cn_config', {
    rbrInstallPath,
    content,
  })
}
