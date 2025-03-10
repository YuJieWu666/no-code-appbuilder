<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';

// 当前选中的组件
const selectedComponent = ref(null);

// 组件的事件类型
const eventTypes = ref([
  { id: 'click', name: '点击', icon: '👆' },
  { id: 'dblclick', name: '双击', icon: '👆👆' },
  { id: 'mouseover', name: '鼠标悬停', icon: '⭕' },
  { id: 'mouseout', name: '鼠标离开', icon: '↪️' },
  { id: 'change', name: '值改变', icon: '✏️' }
]);

// 可用的动作类型
const actionTypes = ref([
  { id: 'alert', name: '显示提示', params: ['消息内容'], icon: '💬' },
  { id: 'navigate', name: '页面跳转', params: ['链接地址'], icon: '🔗' },
  { id: 'toggleVisible', name: '切换可见性', params: ['目标组件ID'], icon: '👁️' },
  { id: 'setValue', name: '设置值', params: ['目标组件ID', '值'], icon: '✍️' },
  { id: 'toggleClass', name: '切换类名', params: ['类名'], icon: '🔀' },
  { id: 'callFunction', name: '调用函数', params: ['函数名', '参数'], icon: '🔄' },
]);

// 当前组件的事件列表
const componentEvents = ref([]);

// 获取组件上可用的事件类型
const availableEventTypes = computed(() => {
  if (!selectedComponent.value) return eventTypes.value;
  
  // 根据组件类型筛选可用的事件类型
  const componentType = selectedComponent.value.type;
  switch (componentType) {
    case 'input':
      return eventTypes.value.filter(et => 
        ['click', 'dblclick', 'change', 'mouseover', 'mouseout'].includes(et.id));
    case 'button':
      return eventTypes.value.filter(et => 
        ['click', 'dblclick', 'mouseover', 'mouseout'].includes(et.id));
    case 'toggle':
      return eventTypes.value.filter(et => 
        ['click', 'change', 'mouseover', 'mouseout'].includes(et.id));
    default:
      return eventTypes.value;
  }
});

// 获取当前画布上的所有组件ID
const canvasComponentIds = computed(() => {
  try {
    // 首先查找画布容器
    const canvasContainer = document.querySelector(".canvas-container");
    if (!canvasContainer) return [];
    
    // 然后找到编辑器画布
    const editorCanvas = canvasContainer.querySelector(".editor-canvas");
    if (!editorCanvas) return [];
    
    // 获取所有组件
    const components = editorCanvas.querySelectorAll('.canvas-component');
    const ids = [];
    
    components.forEach(comp => {
      // 首先尝试从data属性获取ID
      const dataId = comp.getAttribute('data-component-id');
      if (dataId) {
        ids.push(dataId);
        return;
      }
      
      // 再尝试从class属性获取ID
      const idMatch = comp.className.match(/component-([a-zA-Z0-9-_]+)/);
      if (idMatch && idMatch[1]) {
        ids.push(idMatch[1]);
        return;
      }
      
      // 最后尝试使用ID属性
      if (comp.id) {
        ids.push(comp.id);
      }
    });
    
    return ids;
  } catch (error) {
    console.error('获取画布组件ID时出错:', error);
    return [];
  }
});

// 监听组件选择事件
const onComponentSelected = (event) => {
  selectedComponent.value = event.detail;
  
  // 初始化组件事件
  if (selectedComponent.value) {
    // 如果组件没有events属性，则初始化为空数组
    if (!selectedComponent.value.events) {
      selectedComponent.value.events = [];
    }
    
    componentEvents.value = selectedComponent.value.events;
  } else {
    componentEvents.value = [];
  }
};

// 添加新事件
const addEvent = () => {
  if (!selectedComponent.value) return;
  
  const newEvent = {
    id: `event-${Date.now()}`,
    type: availableEventTypes.value[0].id, // 默认第一个可用的事件类型
    actions: [] // 初始化空动作列表
  };
  
  componentEvents.value.push(newEvent);
  selectedComponent.value.events = componentEvents.value;
  
  // 更新全局变量中的事件数据
  updateGlobalComponentEvents();
};

// 添加动作到事件
const addAction = (event) => {
  const newAction = {
    id: `action-${Date.now()}`,
    type: actionTypes.value[0].id, // 默认第一个动作类型
    params: {} // 参数
  };
  
  event.actions.push(newAction);
  
  // 更新全局变量中的事件数据
  updateGlobalComponentEvents();
};

// 移除事件
const removeEvent = (eventIndex) => {
  componentEvents.value.splice(eventIndex, 1);
  selectedComponent.value.events = componentEvents.value;
  
  // 更新全局变量中的事件数据
  updateGlobalComponentEvents();
};

// 移除动作
const removeAction = (event, actionIndex) => {
  event.actions.splice(actionIndex, 1);
  
  // 更新全局变量中的事件数据
  updateGlobalComponentEvents();
};

// 更新事件类型
const updateEventType = (event, newType) => {
  event.type = newType;
  
  // 更新全局变量中的事件数据
  updateGlobalComponentEvents();
};

// 更新动作类型
const updateActionType = (action, newType) => {
  action.type = newType;
  action.params = {}; // 重置参数
  
  // 更新全局变量中的事件数据
  updateGlobalComponentEvents();
};

// 更新动作参数
const updateActionParam = (action, paramName, value) => {
  if (!action.params) {
    action.params = {};
  }
  
  action.params[paramName] = value;
  
  // 更新全局变量中的事件数据
  updateGlobalComponentEvents();
};

// 获取动作类型定义
const getActionTypeDefinition = (actionType) => {
  return actionTypes.value.find(type => type.id === actionType);
};

// 获取事件类型的显示名称
const getEventTypeName = (typeId) => {
  const type = eventTypes.value.find(t => t.id === typeId);
  return type ? type.name : typeId;
};

// 获取动作类型的显示名称
const getActionTypeName = (typeId) => {
  const type = actionTypes.value.find(t => t.id === typeId);
  return type ? type.name : typeId;
};

// 获取事件类型的图标
const getEventTypeIcon = (typeId) => {
  const type = eventTypes.value.find(t => t.id === typeId);
  return type ? type.icon : '➡️';
};

// 获取动作类型的图标
const getActionTypeIcon = (typeId) => {
  const type = actionTypes.value.find(t => t.id === typeId);
  return type ? type.icon : '➡️';
};

// 组件挂载时添加事件监听
onMounted(() => {
  document.addEventListener('component-selected', onComponentSelected);
});

// 组件卸载时移除事件监听
onUnmounted(() => {
  document.removeEventListener('component-selected', onComponentSelected);
});

// 更新全局组件事件变量的辅助函数
const updateGlobalComponentEvents = () => {
  if (!selectedComponent.value || !selectedComponent.value.id) return;
  
  // 更新到全局变量
  if (!window.__CANVAS_COMPONENTS_EVENTS__) {
    window.__CANVAS_COMPONENTS_EVENTS__ = {};
  }
  
  // 获取组件ID，处理可能的有无前缀的情况
  let componentId = selectedComponent.value.id;
  let rawId = componentId;
  
  // 处理可能带有"component-"前缀的情况
  if (componentId.startsWith('component-')) {
    rawId = componentId.replace('component-', '');
  } else {
    // 如果没有前缀，则在全局存储中同时保存带前缀和不带前缀的两个版本
    window.__CANVAS_COMPONENTS_EVENTS__[`component-${componentId}`] = 
      JSON.parse(JSON.stringify(selectedComponent.value.events || []));
  }
  
  // 使用深拷贝确保数据一致性
  window.__CANVAS_COMPONENTS_EVENTS__[rawId] = 
    JSON.parse(JSON.stringify(selectedComponent.value.events || []));
  
  // 同时保存以type开头的ID版本，用于模糊匹配
  const typeBasedId = selectedComponent.value.type + '-' + rawId.split('-')[1];
  if (typeBasedId !== rawId) {
    window.__CANVAS_COMPONENTS_EVENTS__[typeBasedId] = 
      JSON.parse(JSON.stringify(selectedComponent.value.events || []));
  }
  
  // 触发一个事件，通知其他组件事件数据已更新
  document.dispatchEvent(new CustomEvent('component-events-updated', {
    detail: {
      componentId: rawId,
      events: selectedComponent.value.events
    }
  }));
  
  console.log(`已更新组件 ${rawId} 的事件数据，包含 ${selectedComponent.value.events.length} 个事件`);
  console.log(`当前全局事件存储中有 ${Object.keys(window.__CANVAS_COMPONENTS_EVENTS__).length} 个条目`);
};
</script>

<template>
  <div class="function-flow-editor">
    <div v-if="selectedComponent" class="flow-container">
      <div class="component-type">
        <span class="type-icon" :class="'icon-' + selectedComponent.type"></span>
        <span class="type-value">{{ selectedComponent.name }}</span>
        <button class="add-event-btn" @click="addEvent">添加事件</button>
      </div>
      
      <div v-if="componentEvents.length > 0" class="events-list">
        <div v-for="(event, eventIndex) in componentEvents" :key="event.id" class="event-item">
          <div class="event-header">
            <div class="event-type">
              <span class="event-icon">{{ getEventTypeIcon(event.type) }}</span>
              <select v-model="event.type" @change="updateEventType(event, $event.target.value)" class="event-select">
                <option v-for="type in availableEventTypes" :key="type.id" :value="type.id">
                  {{ type.icon }} {{ type.name }}
                </option>
              </select>
            </div>
            <button class="remove-btn" @click="removeEvent(eventIndex)" title="删除事件">×</button>
          </div>
          
          <div class="actions-container">
            <div class="event-description">
              当组件<b>{{ getEventTypeName(event.type) }}</b>时执行：
            </div>
            
            <div class="actions-list">
              <div v-for="(action, actionIndex) in event.actions" :key="action.id" class="action-item">
                <div class="action-header">
                  <span class="action-icon">{{ getActionTypeIcon(action.type) }}</span>
                  <select v-model="action.type" @change="updateActionType(action, $event.target.value)" class="action-select">
                    <option v-for="type in actionTypes" :key="type.id" :value="type.id">
                      {{ type.icon }} {{ type.name }}
                    </option>
                  </select>
                  <button class="remove-btn small" @click="removeAction(event, actionIndex)" title="删除动作">×</button>
                </div>
                
                <div class="action-params">
                  <div v-for="param in getActionTypeDefinition(action.type)?.params" :key="param" class="param-item">
                    <label>{{ param }}:</label>
                    
                    <!-- 目标组件ID选择器 -->
                    <select 
                      v-if="param === '目标组件ID' && canvasComponentIds.length > 0"
                      :value="action.params && action.params[param]"
                      @change="updateActionParam(action, param, $event.target.value)"
                      class="param-select"
                    >
                      <option value="">-- 选择组件 --</option>
                      <option v-for="id in canvasComponentIds" :key="id" :value="id">
                        {{ id }}
                      </option>
                    </select>
                    
                    <!-- 普通输入框 -->
                    <input
                      v-else
                      type="text"
                      :value="action.params && action.params[param]"
                      @input="updateActionParam(action, param, $event.target.value)"
                      class="param-input"
                      :placeholder="param === '消息内容' ? '请输入提示内容' : 
                               param === '链接地址' ? 'https://example.com' : 
                               param === '值' ? '要设置的值' : ''"
                    />
                  </div>
                </div>
              </div>
              
              <button class="add-action-btn" @click="addAction(event)">
                <span class="add-icon">+</span> 添加动作
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div v-else class="no-events">
        <div class="empty-icon">📋</div>
        <p>该组件暂无事件</p>
        <p class="sub-text">点击「添加事件」按钮来创建新的事件</p>
      </div>
    </div>
    
    <div v-else class="no-selection">
      <div class="no-selection-icon">🖱️</div>
      <p>请选择一个组件以编辑功能流</p>
    </div>
  </div>
</template>

<style scoped>
.function-flow-editor {
  padding: 5px 10px;
  height: 100%;
  overflow-y: auto;
  background-color: #f8fafc;
}

.flow-container {
  padding: 15px 5px;
}

.component-type {
  background-color: white;
  padding: 12px 15px;
  margin-bottom: 20px;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
}

.type-icon {
  width: 20px;
  height: 20px;
  margin-right: 10px;
  background-color: #4299e1;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 12px;
}

.type-value {
  font-weight: 600;
  color: #2d3748;
  font-size: 0.95rem;
  flex: 1;
}

.add-event-btn {
  background-color: #4299e1;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 6px 12px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.add-event-btn:hover {
  background-color: #3182ce;
}

.events-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.event-item {
  background-color: white;
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.event-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 15px;
  background-color: #edf2f7;
  border-bottom: 1px solid #e2e8f0;
}

.event-type {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.9rem;
}

.event-icon {
  font-size: 1.2rem;
}

.event-select {
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  padding: 5px 8px;
  font-size: 0.85rem;
  background-color: white;
  color: #4a5568;
}

.event-select:focus {
  outline: none;
  border-color: #4299e1;
  box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.2);
}

.event-description {
  padding: 8px 15px;
  font-size: 0.9rem;
  color: #4a5568;
  border-bottom: 1px solid #f0f4f8;
}

.actions-container {
  padding-bottom: 15px;
}

.actions-list {
  padding: 15px;
}

.action-item {
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  margin-bottom: 10px;
  overflow: hidden;
}

.action-header {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background-color: #f0f4f8;
  border-bottom: 1px solid #e2e8f0;
}

.action-icon {
  margin-right: 8px;
  font-size: 1rem;
}

.action-select {
  flex: 1;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 0.85rem;
  background-color: white;
  color: #4a5568;
}

.action-select:focus {
  outline: none;
  border-color: #4299e1;
  box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.2);
}

.action-params {
  padding: 12px;
}

.param-item {
  margin-bottom: 8px;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.param-item label {
  font-size: 0.85rem;
  color: #4a5568;
  font-weight: 500;
}

.param-input, .param-select {
  width: 100%;
  padding: 6px 10px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 0.85rem;
  color: #2d3748;
}

.param-input:focus, .param-select:focus {
  outline: none;
  border-color: #4299e1;
  box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.2);
}

.add-action-btn {
  width: 100%;
  padding: 8px;
  background-color: #ebf8ff;
  color: #4299e1;
  border: 1px dashed #bee3f8;
  border-radius: 4px;
  font-size: 0.85rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  transition: all 0.2s;
}

.add-action-btn:hover {
  background-color: #bee3f8;
}

.add-icon {
  font-size: 1rem;
  font-weight: bold;
}

.remove-btn {
  background: none;
  border: none;
  color: #a0aec0;
  font-size: 1.2rem;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  margin-left: 8px;
}

.remove-btn:hover {
  background-color: #fed7d7;
  color: #e53e3e;
}

.remove-btn.small {
  font-size: 1rem;
  width: 20px;
  height: 20px;
}

.no-events, .no-selection {
  height: 300px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #a0aec0;
  font-size: 0.95rem;
  text-align: center;
  padding: 20px 0;
  background-color: white;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.no-selection-icon, .empty-icon {
  font-size: 2.5rem;
  margin-bottom: 15px;
}

.sub-text {
  font-size: 0.85rem;
  margin-top: 5px;
  color: #a0aec0;
}
</style> 