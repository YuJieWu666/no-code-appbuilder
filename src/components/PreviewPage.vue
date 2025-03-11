<template>
  <div class="preview-container">
    <div class="preview-header">
      <button class="back-button" @click="goBack">返回编辑</button>
    </div>
    <div class="preview-canvas">
      <div
        v-for="component in components"
        :key="component.id"
        class="preview-component"
        :style="getComponentStyle(component)"
      >
        <!-- 按钮组件 -->
        <button
          v-if="component.type === 'button'"
          :style="{
            width: '100%',
            height: '100%',
            backgroundColor: component.style.backgroundColor,
            color: component.style.color,
            borderRadius: component.style.borderRadius,
            fontSize: component.style.fontSize,
            fontWeight: component.style.fontWeight,
            textAlign: component.style.textAlign,
            border: component.style.border || 'none',
            cursor: component.style.cursor || 'pointer',
            boxShadow: component.style.boxShadow,
            opacity: component.style.opacity
          }"
        >
          {{ component.properties.text }}
        </button>

        <!-- 文本组件 -->
        <div
          v-else-if="component.type === 'text'"
          :style="{
            width: '100%',
            height: '100%',
            color: component.style.color,
            fontSize: component.style.fontSize,
            fontWeight: component.style.fontWeight,
            textAlign: component.style.textAlign,
            lineHeight: component.style.lineHeight,
            letterSpacing: component.style.letterSpacing,
            textDecoration: component.style.textDecoration,
            opacity: component.style.opacity,
            border: component.style.border,
            boxShadow: component.style.boxShadow,
            backgroundColor: component.style.backgroundColor,
            borderRadius: component.style.borderRadius,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            overflow: 'hidden'
          }"
        >
          {{ component.properties.text }}
        </div>

        <!-- 输入框组件 -->
        <input
          v-else-if="component.type === 'input'"
          type="text"
          :placeholder="component.properties.placeholder"
          :value="component.properties.text"
          :style="{
            width: '100%',
            height: '100%',
            backgroundColor: component.style.backgroundColor,
            color: component.style.color,
            borderRadius: component.style.borderRadius,
            fontSize: component.style.fontSize,
            textAlign: component.style.textAlign,
            border: component.style.border || '1px solid #ddd',
            outline: 'none',
            padding: component.style.padding,
            opacity: component.style.opacity,
            boxShadow: component.style.boxShadow
          }"
        />

        <!-- 图片组件 -->
        <img
          v-else-if="component.type === 'image'"
          :src="component.properties.src"
          :alt="component.properties.alt"
          :style="{
            width: '100%',
            height: '100%',
            objectFit: component.style.objectFit || 'cover',
            borderRadius: component.style.borderRadius,
            border: component.style.border,
            boxShadow: component.style.boxShadow,
            opacity: component.style.opacity,
            filter: component.style.filter
          }"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const components = ref([]);

// 获取组件样式
const getComponentStyle = (component) => {
  return {
    position: 'absolute',
    left: `${component.left}px`,
    top: `${component.top}px`,
    width: `${component.width}px`,
    height: `${component.height}px`,
    ...component.style
  };
};

// 返回编辑页面
const goBack = () => {
  router.push('/');
};

onMounted(() => {
  // 从 localStorage 获取组件数据
  const savedComponents = localStorage.getItem('previewComponents');
  if (savedComponents) {
    components.value = JSON.parse(savedComponents);
  }
});
</script>

<style scoped>
.preview-container {
  width: 100%;
  height: 100vh;
  background-color: #f7fafc;
  position: relative;
}

.preview-header {
  padding: 16px;
  background-color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.back-button {
  padding: 8px 16px;
  background-color: #4299e1;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.back-button:hover {
  background-color: #3182ce;
}

.preview-canvas {
  width: 100%;
  height: calc(100vh - 64px);
  position: relative;
  overflow: auto;
  padding: 20px;
}

.preview-component {
  position: absolute;
  box-sizing: border-box;
  user-select: none;
}
</style> 