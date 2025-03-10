<script setup>
import { ref } from 'vue';

// 定义组件分类
const categories = ref([
  {
    name: '基础组件',
    components: [
      { id: 'button', name: '按钮', icon: '▭', type: 'button' },
      { id: 'text', name: '文本', icon: 'T', type: 'text' },
      { id: 'input', name: '输入框', icon: '⌨', type: 'input' },
      { id: 'image', name: '图片', icon: '🖼', type: 'image' }
    ]
  },
  {
    name: '容器组件',
    components: [
      { id: 'container', name: '容器', icon: '⬚', type: 'container' },
      { id: 'form', name: '表单', icon: '📋', type: 'form' }
    ]
  },
  {
    name: '交互组件',
    components: [
      { id: 'toggle', name: '开关', icon: '⚇', type: 'toggle' },
      { id: 'select', name: '下拉选择', icon: '▾', type: 'select' },
      { id: 'slider', name: '滑块', icon: '━', type: 'slider' }
    ]
  }
]);

// 开始拖拽时的处理函数
const onDragStart = (event, component) => {
  // 将组件数据传递给拖拽事件
  event.dataTransfer.setData('application/json', JSON.stringify(component));
  // 设置拖拽效果
  event.dataTransfer.effectAllowed = 'copy';
};
</script>

<template>
  <div class="component-library">
    <div v-for="category in categories" :key="category.name" class="component-category">
      <h3 class="category-title">{{ category.name }}</h3>
      <div class="component-grid">
        <div
          v-for="component in category.components"
          :key="component.id"
          class="component-item"
          draggable="true"
          @dragstart="onDragStart($event, component)"
        >
          <div class="component-icon">{{ component.icon }}</div>
          <div class="component-name">{{ component.name }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.component-library {
  padding: 5px;
}

.component-category {
  margin-bottom: 15px;
}

.category-title {
  font-size: 1rem;
  margin: 5px 0;
  color: #4a5568;
}

.component-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.component-item {
  background-color: white;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  padding: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: move;
  transition: all 0.2s;
}

.component-item:hover {
  background-color: #f0f4f8;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transform: translateY(-2px);
}

.component-icon {
  font-size: 1.5rem;
  margin-bottom: 5px;
  color: #4a5568;
  height: 30px;
  width: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.component-name {
  font-size: 0.8rem;
  color: #4a5568;
  text-align: center;
}
</style> 