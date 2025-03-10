<script setup>
import { ref, provide } from 'vue';

// 画布上的组件列表
const canvasComponents = ref([]);
// 当前选中的组件
const selectedComponent = ref(null);

// 提供给子组件访问的数据
provide('selectedComponent', selectedComponent);

// 画布拖拽事件处理
const onDragOver = (event) => {
  event.preventDefault();
};

// 拖拽放置事件处理
const onDrop = (event) => {
  event.preventDefault();
  
  try {
    // 获取拖拽的组件数据
    const componentData = JSON.parse(event.dataTransfer.getData('application/json'));
    
    // 计算放置位置（相对于画布）
    const canvasRect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - canvasRect.left;
    const y = event.clientY - canvasRect.top;
    
    // 创建新的组件实例
    const newComponent = {
      ...componentData,
      id: `${componentData.type}-${Date.now()}`, // 唯一ID
      x, // 水平位置
      y, // 垂直位置
      width: 120, // 默认宽度
      height: 40, // 默认高度
      style: getDefaultStyleForType(componentData.type),
      content: getDefaultContentForType(componentData.type)
    };
    
    // 添加到画布组件列表
    canvasComponents.value.push(newComponent);
    
    // 选中新添加的组件
    selectedComponent.value = newComponent;
    
    // 触发组件选择事件
    emitComponentSelected();
  } catch (error) {
    console.error('放置组件时出错:', error);
  }
};

// 为组件类型获取默认样式
const getDefaultStyleForType = (type) => {
  const baseStyle = {
    backgroundColor: '#ffffff',
    color: '#333333',
    borderRadius: '4px',
    border: '1px solid #e2e8f0',
    padding: '8px',
    fontSize: '14px',
    textAlign: 'center'
  };
  
  switch (type) {
    case 'button':
      return {
        ...baseStyle,
        backgroundColor: '#4299e1',
        color: '#ffffff',
        fontWeight: 'bold',
        cursor: 'pointer'
      };
    case 'text':
      return {
        ...baseStyle,
        border: 'none',
        backgroundColor: 'transparent',
        textAlign: 'left'
      };
    case 'input':
      return {
        ...baseStyle,
        backgroundColor: '#f8fafc',
        textAlign: 'left'
      };
    default:
      return baseStyle;
  }
};

// 为组件类型获取默认内容
const getDefaultContentForType = (type) => {
  switch (type) {
    case 'button':
      return '按钮';
    case 'text':
      return '文本内容';
    case 'input':
      return '输入框';
    case 'image':
      return '图片';
    case 'container':
      return '';
    default:
      return type;
  }
};

// 选择组件
const selectComponent = (component) => {
  selectedComponent.value = component;
  emitComponentSelected();
};

// 发送组件选择事件
const emitComponentSelected = () => {
  // 使用自定义事件通知父组件
  document.dispatchEvent(new CustomEvent('component-selected', {
    detail: selectedComponent.value
  }));
};

// 监听组件选择事件
const handleComponentSelected = (event) => {
  selectedComponent.value = event.detail;
};

// 组件样式计算
const getComponentStyle = (component) => {
  return {
    position: 'absolute',
    left: `${component.x}px`,
    top: `${component.y}px`,
    width: `${component.width}px`,
    height: `${component.height}px`,
    ...component.style
  };
};

// 当组件移动时更新位置
const onComponentMove = (event, component) => {
  if (event.buttons !== 1 || selectedComponent.value !== component) return;
  
  component.x += event.movementX;
  component.y += event.movementY;
  
  // 防止组件移出画布
  if (component.x < 0) component.x = 0;
  if (component.y < 0) component.y = 0;
};
</script>

<template>
  <div 
    class="editor-canvas" 
    @dragover="onDragOver" 
    @drop="onDrop"
  >
    <!-- 渲染画布上的组件 -->
    <div 
      v-for="component in canvasComponents" 
      :key="component.id"
      class="canvas-component"
      :class="{ selected: selectedComponent === component }"
      :style="getComponentStyle(component)"
      @mousedown="selectComponent(component)"
      @mousemove="onComponentMove($event, component)"
    >
      <!-- 根据组件类型显示不同内容 -->
      <div v-if="component.type === 'button'" class="component-button">
        {{ component.content }}
      </div>
      <div v-else-if="component.type === 'text'" class="component-text">
        {{ component.content }}
      </div>
      <div v-else-if="component.type === 'input'" class="component-input">
        <input type="text" :placeholder="component.content" />
      </div>
      <div v-else-if="component.type === 'image'" class="component-image">
        <div class="placeholder-image">{{ component.content }}</div>
      </div>
      <div v-else class="component-default">
        {{ component.content || component.name }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.editor-canvas {
  width: 100%;
  height: 100%;
  position: relative;
  background-color: white;
  border: 1px dashed #cbd5e0;
  border-radius: 4px;
  overflow: auto;
}

.canvas-component {
  position: absolute;
  box-sizing: border-box;
  user-select: none;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.canvas-component.selected {
  outline: 2px solid #4299e1;
  z-index: 10;
}

.component-button {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.component-text {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
}

.component-input {
  width: 100%;
  height: 100%;
}

.component-input input {
  width: 100%;
  height: 100%;
  border: none;
  outline: none;
  background: transparent;
  padding: 0 8px;
}

.component-image {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f0f4f8;
}

.placeholder-image {
  color: #a0aec0;
  font-size: 12px;
}

.component-default {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style> 