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
      
      <!-- 中间的设计模式切换按钮组 -->
      <div class="mode-switch">
        <v-btn-group>
          <v-btn
            :color="designMode === 'style' ? 'primary' : undefined"
            @click="switchDesignMode('style')"
            class="text-none"
            variant="tonal"
          >
            <v-icon start>mdi-palette</v-icon>
            样式设计
          </v-btn>
          <v-btn
            :color="designMode === 'flow' ? 'primary' : undefined"
            @click="switchDesignMode('flow')"
            class="text-none"
            variant="tonal"
          >
            <v-icon start>mdi-vector-line</v-icon>
            事件流
          </v-btn>
        </v-btn-group>
      </div>

      <v-spacer></v-spacer>

      <!-- 右侧预览按钮 -->
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
          <v-toolbar-title class="text-subtitle-2">
            {{ designMode === 'style' ? '组件库' : '系统事件' }}
          </v-toolbar-title>
        </v-toolbar>
        <v-container class="pa-4">
          <ComponentLibrary v-if="designMode === 'style'" />
          <div v-else class="system-events">
            <v-list>
              <v-list-item
                v-for="event in systemEvents"
                :key="event.type"
                :title="event.name"
                :subtitle="event.description"
                class="mb-2"
                rounded="lg"
                draggable="true"
                @dragstart="handleDragStart($event, event)"
                @click="addSystemEventNode(event)"
              >
                <template v-slot:prepend>
                  <v-icon :icon="event.icon" color="primary"></v-icon>
                </template>
              </v-list-item>
            </v-list>
          </div>
        </v-container>
      </v-navigation-drawer>

      <v-container fluid class="center-panel pa-0 fill-height">
        <div class="canvas-container">
          <EditorCanvas v-if="designMode === 'style'" ref="editorCanvasRef" />
          <EventFlowCanvas v-else ref="eventFlowCanvasRef" />
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
          <v-toolbar-title class="text-subtitle-2">
            {{ designMode === 'style' ? '属性设置' : '事件配置' }}
          </v-toolbar-title>
        </v-toolbar>
        <v-container class="pa-4">
          <PropertyPanel v-if="designMode === 'style'" />
          <EventConfigPanel
            v-else
            :selected-node="selectedEventNode"
            :selected-connection="selectedEventConnection"
            :available-event-types="availableEventTypes"
            @update-event-type="updateEventType"
            @delete-connection="deleteEventConnection"
          />
        </v-container>
      </v-navigation-drawer>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import ComponentLibrary from '../components/ComponentLibrary.vue';
import EditorCanvas from '../components/EditorCanvas.vue';
import EventFlowCanvas from '../components/EventFlowCanvas.vue';
import PropertyPanel from '../components/PropertyPanel.vue';
import EventConfigPanel from '../components/EventConfigPanel.vue';

const router = useRouter();
const editorCanvasRef = ref(null);
const eventFlowCanvasRef = ref(null);
const designMode = ref('style');

// 添加状态管理变量
const styleComponents = ref([]); // 保存样式流中的组件
const eventNodes = ref([]); // 保存事件流中的节点
const eventConnections = ref([]); // 保存事件流中的连接

// 事件流相关的状态
const selectedEventNode = ref(null);
const selectedEventConnection = ref(null);

// 可用的事件类型
const availableEventTypes = [
  { value: 'click', label: '点击' },
  { value: 'hover', label: '悬停' },
  { value: 'input', label: '输入' },
  { value: 'focus', label: '获得焦点' },
  { value: 'blur', label: '失去焦点' }
];

// 系统事件列表
const systemEvents = [
  {
    type: 'dialog',
    name: '弹出框',
    description: '显示一个对话框',
    icon: 'mdi-message-text',
    properties: {
      title: '提示',
      content: '这是一个提示框'
    }
  },
  {
    type: 'notification',
    name: '通知提醒',
    description: '显示一个通知消息',
    icon: 'mdi-bell',
    properties: {
      type: 'info',
      message: '这是一条通知'
    }
  }
];

// 处理预览
const handlePreview = () => {
  if (editorCanvasRef.value) {
    const components = editorCanvasRef.value.canvasComponents;
    localStorage.setItem('previewComponents', JSON.stringify(components));
    router.push('/preview');
  }
};

// 切换设计模式
const switchDesignMode = async (mode) => {
  if (mode === designMode.value) return;

  try {
    // 保存当前模式的状态
    if (designMode.value === 'style' && editorCanvasRef.value) {
      styleComponents.value = JSON.parse(JSON.stringify(editorCanvasRef.value.canvasComponents));
    } else if (designMode.value === 'flow' && eventFlowCanvasRef.value) {
      eventNodes.value = JSON.parse(JSON.stringify(eventFlowCanvasRef.value.eventNodes));
      eventConnections.value = JSON.parse(JSON.stringify(eventFlowCanvasRef.value.connections));
    }

    // 切换模式
    designMode.value = mode;

    // 等待 DOM 更新
    await nextTick();

    // 恢复目标模式的状态
    if (mode === 'style' && editorCanvasRef.value) {
      editorCanvasRef.value.canvasComponents = JSON.parse(JSON.stringify(styleComponents.value));
    } else if (mode === 'flow' && eventFlowCanvasRef.value) {
      if (eventNodes.value.length === 0) {
        // 首次切换到事件流模式时，初始化事件节点
        eventFlowCanvasRef.value.initComponentNodes(styleComponents.value);
      } else {
        // 恢复之前保存的事件流状态
        eventFlowCanvasRef.value.eventNodes = JSON.parse(JSON.stringify(eventNodes.value));
        eventFlowCanvasRef.value.connections = JSON.parse(JSON.stringify(eventConnections.value));
      }
    }
  } catch (error) {
    console.error('切换模式时出错:', error);
  }
};

// 添加系统事件节点
const addSystemEventNode = (event) => {
  if (eventFlowCanvasRef.value) {
    eventFlowCanvasRef.value.addSystemNode(
      event.type,
      event.name,
      event.description
    );
  }
};

// 更新事件类型
const updateEventType = (eventType) => {
  if (eventFlowCanvasRef.value && selectedEventConnection.value) {
    eventFlowCanvasRef.value.updateConnectionEventType(
      selectedEventConnection.value,
      eventType
    );
  }
};

// 删除事件连接
const deleteEventConnection = () => {
  if (eventFlowCanvasRef.value && selectedEventConnection.value) {
    eventFlowCanvasRef.value.deleteConnection(selectedEventConnection.value);
  }
};

// 处理拖拽开始
const handleDragStart = (event, systemEvent) => {
  const eventData = {
    type: 'system-event',
    eventType: systemEvent.type,
    name: systemEvent.name,
    description: systemEvent.description,
    properties: systemEvent.properties
  };
  event.dataTransfer.setData('application/json', JSON.stringify(eventData));
};

// 监听组件变化
watch(editorCanvasRef, (newCanvas) => {
  if (newCanvas && designMode.value === 'style') {
    // 初始化时同步状态
    styleComponents.value = JSON.parse(JSON.stringify(newCanvas.canvasComponents));
  }
}, { immediate: true });

// 监听事件流画布的变化
watch(eventFlowCanvasRef, (newCanvas) => {
  if (newCanvas && designMode.value === 'flow') {
    // 初始化时同步状态
    eventNodes.value = JSON.parse(JSON.stringify(newCanvas.eventNodes));
    eventConnections.value = JSON.parse(JSON.stringify(newCanvas.connections));
  }
}, { immediate: true });

// 监听样式流画布的组件变化
watch(() => editorCanvasRef.value?.canvasComponents, (newComponents) => {
  if (newComponents && designMode.value === 'style') {
    styleComponents.value = JSON.parse(JSON.stringify(newComponents));
  }
}, { deep: true });

// 监听事件流画布的状态变化
watch([
  () => eventFlowCanvasRef.value?.eventNodes,
  () => eventFlowCanvasRef.value?.connections
], ([newNodes, newConnections]) => {
  if (designMode.value === 'flow') {
    if (newNodes) {
      eventNodes.value = JSON.parse(JSON.stringify(newNodes));
    }
    if (newConnections) {
      eventConnections.value = JSON.parse(JSON.stringify(newConnections));
    }
  }
}, { deep: true });
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

.mode-switch {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1;
}

.system-events {
  .v-list-item {
    margin-bottom: 8px;
    border: 1px solid rgb(var(--v-theme-outline));
    transition: all 0.2s ease;

    &:hover {
      border-color: rgb(var(--v-theme-primary));
      background-color: rgb(var(--v-theme-primary), 0.05);
    }
  }
}
</style> 