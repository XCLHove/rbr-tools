import { invokeWrapper } from '@/utils/invokeWrapper.ts'

export const readRbrConfigApi = (rbrInstallPath: string) => {
  return invokeWrapper<string>('read_rbr_config', {
    rbrInstallPath,
  })
}

export const writeRbrConfigApi = (rbrInstallPath: string, content: string) => {
  return invokeWrapper<void>('write_rbr_config', {
    rbrInstallPath,
    content,
  })
}

export const listRbri18nFileApi = (rbrInstallPath: string) => {
  return invokeWrapper<string[]>('list_rbri18n_file', {
    rbrInstallPath,
  })
}

export const listFontFamilyApi = () => {
  return invokeWrapper<string[]>('list_font_family')
}
