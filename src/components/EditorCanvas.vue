<script setup>
import { ref, provide, defineExpose, onMounted } from 'vue';

// 画布上的组件列表
const canvasComponents = ref([]);
// 当前选中的组件
const selectedComponent = ref(null);
// 当前正在调整大小
const isResizing = ref(false);
// 调整大小的方向
const resizeDirection = ref('');
// 记录调整大小开始时的位置
const resizeStartPosition = ref({ x: 0, y: 0 });

// 提供给子组件访问的数据
provide('selectedComponent', selectedComponent);
// 提供canvasComponents给CodeExporter组件使用
provide('canvasComponents', canvasComponents);

// 暴露canvasComponents给父组件
defineExpose({
  canvasComponents
});

// 画布拖拽事件处理
const onDragOver = (event) => {
  event.preventDefault();
  // 设置放置效果为"复制"，这让用户知道可以放置组件
  event.dataTransfer.dropEffect = 'copy';
};

// 拖拽放置事件处理
const onDrop = (event) => {
  event.preventDefault();
  event.stopPropagation();  // 阻止事件冒泡，避免触发document上的拖拽事件
  
  console.log('组件放置事件触发');
  
  try {
    // 获取拖拽的组件数据
    const jsonData = event.dataTransfer.getData('application/json');
    console.log('拖拽数据:', jsonData);
    
    if (!jsonData) {
      console.error('没有获取到有效的拖拽数据');
      return;
    }
    
    const componentData = JSON.parse(jsonData);
    
    // 计算放置位置（相对于画布）
    const canvasRect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - canvasRect.left;
    const y = event.clientY - canvasRect.top;
    
    console.log(`放置位置: x=${x}, y=${y}`);
    
    // 创建新的组件实例
    const newComponent = createComponent(componentData);
    
    // 触发组件选择事件
    emitComponentSelected();
  } catch (error) {
    console.error('放置组件时出错:', error);
  }
};

// 创建一个新的组件实例
const createComponent = (componentData) => {
  // 创建一个唯一ID，不带component-前缀
  const componentId = `${componentData.type}-${Date.now()}`;
  
  // 创建新组件对象
  const newComponent = {
    id: componentId,
    type: componentData.type,
    left: componentData.left || 0,
    top: componentData.top || 0,
    width: componentData.width || 100,
    height: componentData.height || 40,
    properties: { ...componentData.properties || {} },
    events: []
  };
  
  // 根据组件类型设置默认属性
  if (componentData.type === 'button') {
    newComponent.properties.text = newComponent.properties.text || '按钮';
    newComponent.properties.backgroundColor = newComponent.properties.backgroundColor || '#3490dc';
    newComponent.properties.color = newComponent.properties.color || '#ffffff';
    newComponent.properties.borderRadius = newComponent.properties.borderRadius || '4px';
    newComponent.properties.fontSize = newComponent.properties.fontSize || '14px';
  } else if (componentData.type === 'text') {
    newComponent.properties.text = newComponent.properties.text || '文本内容';
    newComponent.properties.color = newComponent.properties.color || '#333333';
    newComponent.properties.fontSize = newComponent.properties.fontSize || '16px';
    newComponent.properties.textAlign = newComponent.properties.textAlign || 'left';
  } else if (componentData.type === 'input') {
    newComponent.properties.placeholder = newComponent.properties.placeholder || '请输入内容';
    newComponent.properties.borderColor = newComponent.properties.borderColor || '#e2e8f0';
    newComponent.properties.borderRadius = newComponent.properties.borderRadius || '4px';
    newComponent.properties.fontSize = newComponent.properties.fontSize || '14px';
  } else if (componentData.type === 'image') {
    newComponent.properties.src = newComponent.properties.src || 'https://via.placeholder.com/150';
    newComponent.properties.alt = newComponent.properties.alt || '图片';
    newComponent.width = newComponent.width || 150;
    newComponent.height = newComponent.height || 150;
  } else if (componentData.type === 'toggle') {
    newComponent.properties.label = newComponent.properties.label || '开关';
    newComponent.properties.checked = newComponent.properties.checked === true;
    newComponent.properties.activeColor = newComponent.properties.activeColor || '#4299e1';
    newComponent.properties.inactiveColor = newComponent.properties.inactiveColor || '#cbd5e0';
  }
  
  // 添加到canvasComponents数组并选择它
  canvasComponents.value.push(newComponent);
  selectComponent(newComponent.id);
  
  console.log(`组件已创建: ${newComponent.id}`);
  return newComponent;
};

// 选择组件
const selectComponent = (componentOrId, event) => {
  // 确保事件存在并且不是从调整大小的手柄触发的
  if (event && event.target?.classList?.contains('resize-handle')) {
    return;
  }
  
  // 如果传入的是组件ID，则从canvasComponents中查找该组件
  if (typeof componentOrId === 'string') {
    const componentById = canvasComponents.value.find(comp => comp.id === componentOrId);
    if (componentById) {
      selectedComponent.value = componentById;
      console.log(`通过ID选择组件: ${componentOrId}`);
    } else {
      console.warn(`找不到ID为 ${componentOrId} 的组件`);
      return;
    }
  } else {
    // 直接传入的是组件对象
    selectedComponent.value = componentOrId;
    console.log(`直接选择组件对象: ${componentOrId.id}`);
  }
  
  emitComponentSelected();
};

// 发送组件选择事件
const emitComponentSelected = () => {
  // 确保selectedComponent存在且为对象
  if (!selectedComponent.value || typeof selectedComponent.value !== 'object') {
    console.warn('无法发送选择事件：selectedComponent不是有效对象', selectedComponent.value);
    return;
  }
  
  // 确保selectedComponent中包含events数组
  if (!Array.isArray(selectedComponent.value.events)) {
    selectedComponent.value.events = [];
  }
  
  try {
    // 创建一个CustomEvent，并确保detail中包含完整的组件数据
    const selectedComponentData = { ...selectedComponent.value };
    
    // 使用自定义事件通知父组件和其他相关组件
    document.dispatchEvent(new CustomEvent('component-selected', {
      detail: selectedComponentData
    }));
    
    // 如果当前选中的组件有事件，确保是最新的事件被传递
    if (selectedComponentData && selectedComponentData.id) {
      // 存储到window对象上，以便在需要时访问
      if (!window.__CANVAS_COMPONENTS_EVENTS__) {
        window.__CANVAS_COMPONENTS_EVENTS__ = {};
      }
      window.__CANVAS_COMPONENTS_EVENTS__[selectedComponentData.id] = 
        JSON.parse(JSON.stringify(selectedComponentData.events || []));
      
      console.log(`已将组件 ${selectedComponentData.id} 的事件数据存储到全局变量`);
    }
  } catch (error) {
    console.error('发送组件选择事件时出错:', error);
  }
};

// 监听组件选择事件
const handleComponentSelected = (event) => {
  selectedComponent.value = event.detail;
};

// 组件样式计算
const getComponentStyle = (component) => {
  return {
    position: 'absolute',
    left: `${component.left}px`,
    top: `${component.top}px`,
    width: `${component.width}px`,
    height: `${component.height}px`,
    ...component.properties
  };
};

// 当组件移动时更新位置
const onComponentMove = (event, component) => {
  if (event.buttons !== 1 || selectedComponent.value !== component || isResizing.value) return;
  
  component.left += event.movementX;
  component.top += event.movementY;
  
  // 防止组件移出画布
  if (component.left < 0) component.left = 0;
  if (component.top < 0) component.top = 0;
};

// 阻止画布上点击事件的冒泡，以免与背景点击混淆
const stopPropagation = (event) => {
  event.stopPropagation();
};

// 开始调整大小
const startResize = (event, direction) => {
  event.stopPropagation();
  isResizing.value = true;
  resizeDirection.value = direction;
  
  // 记录开始位置
  resizeStartPosition.value = {
    x: event.clientX,
    y: event.clientY,
    width: selectedComponent.value.width,
    height: selectedComponent.value.height,
    x0: selectedComponent.value.left,
    y0: selectedComponent.value.top
  };
  
  // 添加document级别的鼠标移动和释放事件监听
  document.addEventListener('mousemove', handleResize);
  document.addEventListener('mouseup', endResize);
};

// 调整大小逻辑
const handleResize = (event) => {
  if (!isResizing.value || !selectedComponent.value) return;
  
  const deltaX = event.clientX - resizeStartPosition.value.x;
  const deltaY = event.clientY - resizeStartPosition.value.y;
  
  const component = selectedComponent.value;
  const startPos = resizeStartPosition.value;
  
  // 根据不同方向来调整大小
  switch (resizeDirection.value) {
    case 'e': // 右侧
      component.width = Math.max(20, startPos.width + deltaX);
      break;
    case 's': // 底部
      component.height = Math.max(20, startPos.height + deltaY);
      break;
    case 'se': // 右下角
      component.width = Math.max(20, startPos.width + deltaX);
      component.height = Math.max(20, startPos.height + deltaY);
      break;
    case 'n': // 顶部
      const newHeightN = Math.max(20, startPos.height - deltaY);
      component.top = startPos.y0 + (startPos.height - newHeightN);
      component.height = newHeightN;
      break;
    case 'w': // 左侧
      const newWidthW = Math.max(20, startPos.width - deltaX);
      component.left = startPos.x0 + (startPos.width - newWidthW);
      component.width = newWidthW;
      break;
    case 'nw': // 左上角
      const newWidthNW = Math.max(20, startPos.width - deltaX);
      const newHeightNW = Math.max(20, startPos.height - deltaY);
      component.left = startPos.x0 + (startPos.width - newWidthNW);
      component.top = startPos.y0 + (startPos.height - newHeightNW);
      component.width = newWidthNW;
      component.height = newHeightNW;
      break;
    case 'ne': // 右上角
      component.width = Math.max(20, startPos.width + deltaX);
      const newHeightNE = Math.max(20, startPos.height - deltaY);
      component.top = startPos.y0 + (startPos.height - newHeightNE);
      component.height = newHeightNE;
      break;
    case 'sw': // 左下角
      const newWidthSW = Math.max(20, startPos.width - deltaX);
      component.left = startPos.x0 + (startPos.width - newWidthSW);
      component.width = newWidthSW;
      component.height = Math.max(20, startPos.height + deltaY);
      break;
  }
};

// 结束调整大小
const endResize = () => {
  isResizing.value = false;
  
  // 移除事件监听
  document.removeEventListener('mousemove', handleResize);
  document.removeEventListener('mouseup', endResize);
};

// 点击画布背景时取消组件选择
const onCanvasClick = (event) => {
  // 只有当点击的是画布本身时才取消选择
  if (event.target.classList.contains('editor-canvas')) {
    selectedComponent.value = null;
  }
};

// 组件挂载后添加事件监听
onMounted(() => {
  // 清空可能存在的旧数据
  canvasComponents.value = [];
  
  // 添加防止拖拽组件出画布的处理
  document.addEventListener('dragover', (event) => {
    // 在document上阻止默认拖拽行为，避免浏览器默认处理
    event.preventDefault();
  });
  
  // 添加事件更新监听
  document.addEventListener('component-events-updated', (event) => {
    const { componentId, events } = event.detail;
    
    // 在canvasComponents中查找对应的组件
    const componentIndex = canvasComponents.value.findIndex(comp => comp.id === componentId);
    if (componentIndex !== -1) {
      // 更新组件的事件数据
      console.log(`EditorCanvas - 更新组件 ${componentId} 的事件数据:`, events);
      canvasComponents.value[componentIndex].events = JSON.parse(JSON.stringify(events || []));
    }
  });
  
  console.log('EditorCanvas组件已挂载，组件列表已初始化');
});
</script>

<template>
  <div 
    id="editor-canvas-wrapper" 
    class="editor-canvas" 
    @dragover="onDragOver" 
    @drop="onDrop"
    @click="onCanvasClick"
  >
    <!-- 渲染画布上的组件 -->
    <div 
      v-for="component in canvasComponents" 
      :key="component.id"
      class="canvas-component"
      :class="{ selected: selectedComponent === component }"
      :style="getComponentStyle(component)"
      :data-component-id="component.id"
      :data-component-type="component.type"
      @mousedown="selectComponent(component, $event)"
      @mousemove="onComponentMove($event, component)"
      @click="stopPropagation"
    >
      <!-- 根据组件类型显示不同内容 -->
      <div v-if="component.type === 'button'" class="component-button">
        {{ component.properties.text }}
      </div>
      <div v-else-if="component.type === 'text'" class="component-text">
        {{ component.properties.text }}
      </div>
      <div v-else-if="component.type === 'input'" class="component-input">
        <input type="text" :placeholder="component.properties.placeholder" />
      </div>
      <div v-else-if="component.type === 'image'" class="component-image">
        <div class="placeholder-image">{{ component.properties.alt }}</div>
      </div>
      <div v-else-if="component.type === 'toggle'" class="component-toggle">
        <div class="toggle-track">
          <div class="toggle-thumb"></div>
        </div>
        <span class="toggle-label">{{ component.properties.label }}</span>
      </div>
      <div v-else class="component-default">
        {{ component.properties.text || component.type }}
      </div>
      
      <!-- 组件选中时显示的调整大小手柄 -->
      <template v-if="selectedComponent === component">
        <div 
          class="resize-handle resize-e" 
          @mousedown.stop="startResize($event, 'e')" 
          title="调整宽度"
        ></div>
        <div 
          class="resize-handle resize-s" 
          @mousedown.stop="startResize($event, 's')" 
          title="调整高度"
        ></div>
        <div 
          class="resize-handle resize-se" 
          @mousedown.stop="startResize($event, 'se')" 
          title="调整大小"
        ></div>
        <div 
          class="resize-handle resize-w" 
          @mousedown.stop="startResize($event, 'w')" 
          title="调整宽度"
        ></div>
        <div 
          class="resize-handle resize-n" 
          @mousedown.stop="startResize($event, 'n')" 
          title="调整高度"
        ></div>
        <div 
          class="resize-handle resize-nw" 
          @mousedown.stop="startResize($event, 'nw')" 
          title="调整大小"
        ></div>
        <div 
          class="resize-handle resize-ne" 
          @mousedown.stop="startResize($event, 'ne')" 
          title="调整大小"
        ></div>
        <div 
          class="resize-handle resize-sw" 
          @mousedown.stop="startResize($event, 'sw')" 
          title="调整大小"
        ></div>
      </template>
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
  z-index: 1; /* 确保画布的z-index低于模态框 */
}

.canvas-component {
  position: absolute;
  box-sizing: border-box;
  user-select: none;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  z-index: 2; /* 确保组件可以被点击和交互 */
  cursor: move;
  transition: transform 0.1s, box-shadow 0.2s;
}

.canvas-component:hover {
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}

.canvas-component.selected {
  outline: 2px solid #4299e1;
  z-index: 10;
  box-shadow: 0 0 0 4px rgba(66, 153, 225, 0.2);
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

.component-toggle {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 10px;
}

.toggle-track {
  width: 40px;
  height: 20px;
  background-color: #cbd5e0;
  border-radius: 10px;
  position: relative;
  transition: background-color 0.2s;
}

.toggle-thumb {
  width: 16px;
  height: 16px;
  background-color: white;
  border-radius: 50%;
  position: absolute;
  top: 2px;
  left: 2px;
  transition: transform 0.2s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.toggle-label {
  margin-left: 10px;
  font-size: 0.85rem;
}

.component-default {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 调整大小的手柄样式 */
.resize-handle {
  position: absolute;
  width: 8px;
  height: 8px;
  background-color: white;
  border: 1px solid #4299e1;
  z-index: 20;
}

/* 东南西北四个方向的手柄 */
.resize-e {
  top: 50%;
  right: -4px;
  transform: translateY(-50%);
  cursor: e-resize;
}

.resize-s {
  bottom: -4px;
  left: 50%;
  transform: translateX(-50%);
  cursor: s-resize;
}

.resize-w {
  top: 50%;
  left: -4px;
  transform: translateY(-50%);
  cursor: w-resize;
}

.resize-n {
  top: -4px;
  left: 50%;
  transform: translateX(-50%);
  cursor: n-resize;
}

/* 四个角落的手柄 */
.resize-se {
  bottom: -4px;
  right: -4px;
  cursor: se-resize;
}

.resize-sw {
  bottom: -4px;
  left: -4px;
  cursor: sw-resize;
}

.resize-ne {
  top: -4px;
  right: -4px;
  cursor: ne-resize;
}

.resize-nw {
  top: -4px;
  left: -4px;
  cursor: nw-resize;
}
</style> 