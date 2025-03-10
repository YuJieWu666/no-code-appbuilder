<script setup>
import { ref } from 'vue';

// 定义组件列表（简化版）
const components = ref([
  { id: 'button', name: '按钮', type: 'button' },
  { id: 'text', name: '文本', type: 'text' },
  { id: 'input', name: '输入框', type: 'input' },
  { id: 'image', name: '图片', type: 'image' },
  { id: 'toggle', name: '开关', type: 'toggle' }
]);

// 开始拖拽时的处理函数
const onDragStart = (event, component) => {
  // 记录当前正在拖拽的组件
  console.log('开始拖拽组件:', component);
  
  // 将组件数据转为JSON字符串
  const componentData = JSON.stringify(component);
  
  // 将组件数据传递给拖拽事件
  event.dataTransfer.setData('application/json', componentData);
  // 设置拖拽效果
  event.dataTransfer.effectAllowed = 'copy';
};
</script>

<template>
  <div class="component-library">
    <ul class="component-list">
      <li
        v-for="component in components"
        :key="component.id"
        class="component-item"
        draggable="true"
        @dragstart="onDragStart($event, component)"
      >
        {{ component.name }}
      </li>
    </ul>
  </div>
</template>

<style scoped>
.component-library {
  padding: 5px;
}

.component-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.component-item {
  padding: 12px 15px;
  margin-bottom: 8px;
  background-color: white;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  cursor: move;
  transition: all 0.2s;
  font-size: 0.95rem;
  color: #4a5568;
  display: flex;
  align-items: center;
}

.component-item:hover {
  background-color: #f0f4f8;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transform: translateY(-1px);
  border-left: 3px solid #4299e1;
}

.component-item:active {
  background-color: #ebf4ff;
}
</style> 