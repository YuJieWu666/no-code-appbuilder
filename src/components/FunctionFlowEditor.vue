<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

// 当前选中的组件
const selectedComponent = ref(null);

// 组件的事件类型
const eventTypes = ref([
  { id: 'click', name: '点击' },
  { id: 'dblclick', name: '双击' },
  { id: 'mouseover', name: '鼠标悬停' },
  { id: 'mouseout', name: '鼠标离开' }
]);

// 可用的动作类型
const actionTypes = ref([
  { id: 'alert', name: '显示提示', params: ['消息内容'] },
  { id: 'navigate', name: '页面跳转', params: ['链接地址'] },
  { id: 'toggleVisible', name: '切换可见性', params: ['目标组件ID'] },
  { id: 'setValue', name: '设置值', params: ['目标组件ID', '值'] }
]);

// 当前组件的事件列表
const componentEvents = ref([]);

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
    type: 'click', // 默认事件类型
    actions: [] // 初始化空动作列表
  };
  
  componentEvents.value.push(newEvent);
  selectedComponent.value.events = componentEvents.value;
};

// 添加动作到事件
const addAction = (event) => {
  const newAction = {
    id: `action-${Date.now()}`,
    type: actionTypes.value[0].id, // 默认第一个动作类型
    params: {} // 参数
  };
  
  event.actions.push(newAction);
};

// 移除事件
const removeEvent = (eventIndex) => {
  componentEvents.value.splice(eventIndex, 1);
  selectedComponent.value.events = componentEvents.value;
};

// 移除动作
const removeAction = (event, actionIndex) => {
  event.actions.splice(actionIndex, 1);
};

// 更新事件类型
const updateEventType = (event, newType) => {
  event.type = newType;
};

// 更新动作类型
const updateActionType = (action, newType) => {
  action.type = newType;
  action.params = {}; // 重置参数
};

// 更新动作参数
const updateActionParam = (action, paramName, value) => {
  if (!action.params) {
    action.params = {};
  }
  
  action.params[paramName] = value;
};

// 获取动作类型定义
const getActionTypeDefinition = (actionType) => {
  return actionTypes.value.find(type => type.id === actionType);
};

// 组件挂载时添加事件监听
onMounted(() => {
  document.addEventListener('component-selected', onComponentSelected);
});

// 组件卸载时移除事件监听
onUnmounted(() => {
  document.removeEventListener('component-selected', onComponentSelected);
});
</script>

<template>
  <div class="function-flow-editor">
    <div v-if="selectedComponent" class="flow-container">
      <div class="editor-header">
        <h3>事件流编辑器</h3>
        <button class="add-event-btn" @click="addEvent">添加事件</button>
      </div>
      
      <div v-if="componentEvents.length > 0" class="events-list">
        <div v-for="(event, eventIndex) in componentEvents" :key="event.id" class="event-item">
          <div class="event-header">
            <div class="event-type">
              <label>当组件</label>
              <select v-model="event.type" @change="updateEventType(event, $event.target.value)">
                <option v-for="type in eventTypes" :key="type.id" :value="type.id">
                  {{ type.name }}
                </option>
              </select>
              <label>时</label>
            </div>
            <button class="remove-btn" @click="removeEvent(eventIndex)">×</button>
          </div>
          
          <div class="actions-list">
            <div v-for="(action, actionIndex) in event.actions" :key="action.id" class="action-item">
              <div class="action-header">
                <select v-model="action.type" @change="updateActionType(action, $event.target.value)">
                  <option v-for="type in actionTypes" :key="type.id" :value="type.id">
                    {{ type.name }}
                  </option>
                </select>
                <button class="remove-btn small" @click="removeAction(event, actionIndex)">×</button>
              </div>
              
              <div class="action-params">
                <div v-for="param in getActionTypeDefinition(action.type)?.params" :key="param" class="param-item">
                  <label>{{ param }}:</label>
                  <input
                    type="text"
                    :value="action.params && action.params[param]"
                    @input="updateActionParam(action, param, $event.target.value)"
                  />
                </div>
              </div>
            </div>
            
            <button v-if="event.actions.length < 5" class="add-action-btn" @click="addAction(event)">
              添加动作
            </button>
          </div>
        </div>
      </div>
      
      <div v-else class="no-events">
        <p>该组件暂无事件，点击"添加事件"来创建</p>
      </div>
    </div>
    
    <div v-else class="no-selection">
      <p>请选择一个组件以编辑功能流</p>
    </div>
  </div>
</template>

<style scoped>
.function-flow-editor {
  padding: 0 5px;
  height: 100%;
  overflow-y: auto;
}

.flow-container {
  padding: 10px 0;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.editor-header h3 {
  margin: 0;
  font-size: 1rem;
  color: #4a5568;
}

.add-event-btn {
  background-color: #4299e1;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 5px 10px;
  font-size: 0.8rem;
  cursor: pointer;
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
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  overflow: hidden;
}

.event-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background-color: #edf2f7;
  border-bottom: 1px solid #e2e8f0;
}

.event-type {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.9rem;
}

.event-type select {
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  padding: 3px 5px;
  font-size: 0.85rem;
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

.actions-list {
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.action-item {
  background-color: white;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  padding: 8px;
}

.action-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.action-header select {
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  padding: 3px 5px;
  font-size: 0.85rem;
  flex: 1;
}

.action-params {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.param-item {
  display: flex;
  align-items: center;
  font-size: 0.85rem;
}

.param-item label {
  width: 80px;
  color: #4a5568;
}

.param-item input {
  flex: 1;
  padding: 3px 5px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 0.85rem;
}

.add-action-btn {
  background-color: #ebf4ff;
  color: #4299e1;
  border: 1px dashed #bee3f8;
  border-radius: 4px;
  padding: 5px;
  font-size: 0.8rem;
  cursor: pointer;
  margin-top: 5px;
}

.add-action-btn:hover {
  background-color: #bee3f8;
}

.no-events, .no-selection {
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #a0aec0;
  font-size: 0.9rem;
  text-align: center;
}
</style> 