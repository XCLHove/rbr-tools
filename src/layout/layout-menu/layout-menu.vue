<script lang="ts" setup>
import { getMenus, type Menu } from '@/menu'
import { ElIcon, ElMenuItem, ElSubMenu } from 'element-plus'
import { computed, h } from 'vue'
import router from '@/router'
import { Document as IconDocument, FolderOpened } from '@element-plus/icons-vue'

const defaultActive = computed(() => router.currentRoute.value.path)
const menus = computed(() => getMenus())

function getMenuComponent(menu: Menu) {
  const path = menu.path

  const menuChildren = menu.children || []
  if (menu.isDirectory || menuChildren.length > 0) {
    const icon = menu.icon || (() => h(FolderOpened))
    return h(
      ElSubMenu,
      { index: path },
      {
        title: () => [h(ElIcon, icon), h('span', menu.label)],
        default: () => menuChildren.map((item) => getMenuComponent(item)),
      },
    )
  }

  const icon = menu.icon || (() => h(IconDocument))
  return h(ElMenuItem, { index: path }, { title: () => [h(ElIcon, icon), h('span', menu.label)] })
}
</script>

<template>
  <el-menu :default-active="defaultActive" active-text-color="#38B2AC" background-color="#F7FAFC" class="layout-menu" router text-color="#4A5568">
    <component :is="getMenuComponent(menu)" v-for="menu in menus" :key="menu.path" />
  </el-menu>
</template>

<style lang="scss" scoped>
.layout-menu {
  height: 100%;
  border-right: none;
}
</style>
