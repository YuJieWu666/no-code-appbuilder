<template>
  <v-app>
    <v-app-bar elevation="1">
      <div class="d-flex align-center">
        <div class="logo">
          <span class="logo-text">AppBuilder</span>
        </div>
        <v-divider vertical class="mx-4"></v-divider>
        <span class="text-subtitle-2 text-medium-emphasis">未命名设计</span>
      </div>
      <v-spacer></v-spacer>
      <v-btn
        color="primary"
        @click="handlePreview"
        prepend-icon="mdi-eye"
        class="text-none"
      >
        预览
      </v-btn>
    </v-app-bar>

    <v-main class="editor-content">
      <v-navigation-drawer
        permanent
        location="left"
        width="280"
        elevation="1"
        class="left-panel"
      >
        <v-toolbar
          density="compact"
          color="background"
          border="b"
        >
          <v-toolbar-title class="text-subtitle-2">组件库</v-toolbar-title>
        </v-toolbar>
        <v-container class="pa-4">
          <ComponentLibrary />
        </v-container>
      </v-navigation-drawer>

      <v-container fluid class="center-panel pa-0 fill-height">
        <div class="canvas-container">
          <EditorCanvas ref="editorCanvasRef" />
        </div>
      </v-container>

      <v-navigation-drawer
        permanent
        location="right"
        width="280"
        elevation="1"
        class="right-panel"
      >
        <v-toolbar
          density="compact"
          color="background"
          border="b"
        >
          <v-toolbar-title class="text-subtitle-2">属性设置</v-toolbar-title>
        </v-toolbar>
        <v-container class="pa-4">
          <PropertyPanel />
        </v-container>
      </v-navigation-drawer>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import ComponentLibrary from '../components/ComponentLibrary.vue';
import EditorCanvas from '../components/EditorCanvas.vue';
import PropertyPanel from '../components/PropertyPanel.vue';

const router = useRouter();
const editorCanvasRef = ref(null);

const handlePreview = () => {
  if (editorCanvasRef.value) {
    const components = editorCanvasRef.value.canvasComponents;
    localStorage.setItem('previewComponents', JSON.stringify(components));
    router.push('/preview');
  }
};
</script>

<style scoped>
.logo-text {
  font-size: 18px;
  font-weight: 600;
  background: linear-gradient(45deg, rgb(var(--v-theme-primary)), #667eea);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.center-panel {
  background-color: rgb(var(--v-theme-background));
  position: relative;
}

.canvas-container {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-image: 
    linear-gradient(45deg, var(--v-theme-surface) 25%, transparent 25%),
    linear-gradient(-45deg, var(--v-theme-surface) 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, var(--v-theme-surface) 75%),
    linear-gradient(-45deg, transparent 75%, var(--v-theme-surface) 75%);
  background-size: 20px 20px;
  background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
}

/* 全局组件样式覆盖 */
:deep(.component-library),
:deep(.property-panel) {
  background-color: rgb(var(--v-theme-background));
}

:deep(.component-item),
:deep(.property-item) {
  background-color: rgb(var(--v-theme-surface));
  border: 1px solid rgb(var(--v-theme-outline));
  border-radius: 8px;
  transition: all 0.2s ease;
}

:deep(.component-item:hover),
:deep(.property-item:hover) {
  border-color: rgb(var(--v-theme-primary));
  box-shadow: 0 2px 8px rgba(var(--v-theme-primary), 0.1);
}

:deep(input),
:deep(select) {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid rgb(var(--v-theme-outline));
  border-radius: 6px;
  background-color: rgb(var(--v-theme-surface));
  color: rgb(var(--v-theme-on-surface));
  font-size: 14px;
  transition: all 0.2s ease;
}

:deep(input:focus),
:deep(select:focus) {
  border-color: rgb(var(--v-theme-primary));
  outline: none;
  box-shadow: 0 0 0 3px rgba(var(--v-theme-primary), 0.1);
}

:deep(.label) {
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 4px;
}
</style> 