<template>
  <div class="event-flow-canvas" @dragover.prevent @drop="onDrop">
    <!-- 渲染组件节点 -->
    <div v-for="node in eventNodes" :key="node.id" 
      class="event-node"
      :class="{ 
        'component-node': node.type === 'component', 
        'system-node': node.type === 'system',
        'selected': selectedNode === node
      }"
      :style="{ left: node.left + 'px', top: node.top + 'px' }"
      @mousedown="startDrag($event, node)"
      @click="selectNode(node)"
    >
      <div class="node-header">
        <v-icon :icon="node.type === 'component' ? 'mdi-view-dashboard' : 'mdi-cog'" size="small" />
        <span class="node-title">{{ node.name }}</span>
      </div>
      <div class="node-content">
        {{ node.properties?.text || node.description }}
      </div>
      <!-- 连线起点和终点 -->
      <div class="node-ports">
        <div 
          class="port port-in" 
          v-if="node.type === 'system'"
          @mousedown.stop="startConnection($event, node, 'target')"
        ></div>
        <div 
          class="port port-out" 
          v-if="node.type === 'component'"
          @mousedown.stop="startConnection($event, node, 'source')"
        ></div>
      </div>
    </div>

    <!-- 渲染连线 -->
    <svg class="connections" :width="canvasWidth" :height="canvasHeight">
      <!-- 正在创建的连线 -->
      <path
        v-if="creatingConnection"
        :d="getCreatingConnectionPath()"
        class="connection-path creating"
      />
      <!-- 已存在的连线 -->
      <g v-for="connection in connections" :key="connection.id">
        <path
          :d="getConnectionPath(connection)"
          class="connection-path"
          :class="{ 'selected': selectedConnection === connection }"
          @click="selectConnection(connection)"
        />
        <!-- 连线上的事件类型标签 -->
        <text
          :x="getConnectionLabelPosition(connection).x"
          :y="getConnectionLabelPosition(connection).y"
          class="connection-label"
        >
          {{ connection.eventType }}
        </text>
      </g>
    </svg>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, defineEmits, defineExpose } from 'vue';

const emit = defineEmits(['node-selected', 'connection-selected']);

const eventNodes = ref([]);
const connections = ref([]);
const canvasWidth = ref(2000);
const canvasHeight = ref(2000);
const draggingNode = ref(null);
const initialPosition = ref({ x: 0, y: 0 });

// 连线相关的状态
const creatingConnection = ref(null);
const mousePosition = ref({ x: 0, y: 0 });
const selectedNode = ref(null);
const selectedConnection = ref(null);

// 可用的事件类型
const availableEventTypes = [
  { value: 'click', label: '点击' },
  { value: 'hover', label: '悬停' },
  { value: 'input', label: '输入' },
  { value: 'focus', label: '获得焦点' },
  { value: 'blur', label: '失去焦点' }
];

// 从样式流中获取组件并转换为事件节点
const initComponentNodes = (components) => {
  if (!components || components.length === 0) return;
  
  // 保留现有的系统事件节点
  const systemNodes = eventNodes.value.filter(node => node.type === 'system');
  
  // 添加或更新组件节点
  const componentNodeIds = new Set(eventNodes.value.filter(node => node.type === 'component').map(node => node.id));
  components.forEach(comp => {
    if (!componentNodeIds.has(comp.id)) {
      eventNodes.value.push({
        id: comp.id,
        type: 'component',
        name: comp.name,
        left: Math.random() * 500,
        top: Math.random() * 300,
        properties: comp.properties,
        events: []
      });
    }
  });
  
  // 移除已不存在的组件节点
  const validComponentIds = new Set(components.map(comp => comp.id));
  eventNodes.value = [
    ...systemNodes,
    ...eventNodes.value.filter(node => 
      node.type === 'component' && validComponentIds.has(node.id)
    )
  ];
  
  // 清理无效的连接
  const validNodeIds = new Set(eventNodes.value.map(node => node.id));
  connections.value = connections.value.filter(conn => 
    validNodeIds.has(conn.from) && validNodeIds.has(conn.to)
  );
};

// 添加系统事件节点
const addSystemNode = (type, name, description, properties = {}) => {
  const newNode = {
    id: 'system-' + Date.now(),
    type: 'system',
    name,
    description,
    left: Math.random() * 500,
    top: Math.random() * 300,
    properties: { ...properties }
  };
  eventNodes.value.push(newNode);
  return newNode;
};

// 开始拖动节点
const startDrag = (event, node) => {
  draggingNode.value = node;
  initialPosition.value = {
    x: event.clientX - node.left,
    y: event.clientY - node.top
  };

  const onMouseMove = (e) => {
    if (draggingNode.value) {
      draggingNode.value.left = e.clientX - initialPosition.value.x;
      draggingNode.value.top = e.clientY - initialPosition.value.y;
    }
  };

  const onMouseUp = () => {
    draggingNode.value = null;
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  };

  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);
};

// 选择节点
const selectNode = (node) => {
  selectedNode.value = node;
  selectedConnection.value = null;
  // 触发节点选择事件
  emit('node-selected', node);
};

// 选择连线
const selectConnection = (connection) => {
  selectedConnection.value = connection;
  selectedNode.value = null;
  // 触发连线选择事件
  emit('connection-selected', connection);
};

// 开始创建连线
const startConnection = (event, node, portType) => {
  event.stopPropagation();
  creatingConnection.value = {
    source: portType === 'source' ? node : null,
    target: portType === 'target' ? node : null
  };
  
  const onMouseMove = (e) => {
    const rect = event.target.closest('.event-flow-canvas').getBoundingClientRect();
    mousePosition.value = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const onMouseUp = (e) => {
    if (creatingConnection.value) {
      const targetElement = document.elementFromPoint(e.clientX, e.clientY);
      const portElement = targetElement?.closest('.port');
      
      if (portElement) {
        const targetNode = eventNodes.value.find(n => {
          const nodeElement = portElement.closest('.event-node');
          return nodeElement && nodeElement.getAttribute('data-node-id') === n.id;
        });

        if (targetNode) {
          finishConnection(targetNode);
        }
      }
      
      creatingConnection.value = null;
    }
    
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  };

  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);
};

// 完成连线创建
const finishConnection = (targetNode) => {
  const source = creatingConnection.value.source || targetNode;
  const target = creatingConnection.value.target || targetNode;

  // 检查是否是有效的连接（组件 -> 系统事件）
  if (source.type === 'component' && target.type === 'system') {
    const newConnection = {
      id: `connection-${Date.now()}`,
      from: source.id,
      to: target.id,
      eventType: 'click', // 默认事件类型
      properties: {} // 用于存储连线的其他属性
    };

    connections.value.push(newConnection);
    selectConnection(newConnection);
  }
};

// 获取正在创建的连线路径
const getCreatingConnectionPath = () => {
  if (!creatingConnection.value) return '';

  const source = creatingConnection.value.source;
  const target = creatingConnection.value.target;
  
  let x1, y1, x2, y2;
  
  if (source) {
    x1 = source.left + 150;
    y1 = source.top + 30;
    x2 = mousePosition.value.x;
    y2 = mousePosition.value.y;
  } else {
    x1 = mousePosition.value.x;
    y1 = mousePosition.value.y;
    x2 = target.left;
    y2 = target.top + 30;
  }

  return `M ${x1} ${y1} C ${(x1 + x2) / 2} ${y1}, ${(x1 + x2) / 2} ${y2}, ${x2} ${y2}`;
};

// 获取连线标签位置
const getConnectionLabelPosition = (connection) => {
  const start = eventNodes.value.find(n => n.id === connection.from);
  const end = eventNodes.value.find(n => n.id === connection.to);
  
  if (!start || !end) return { x: 0, y: 0 };

  const x1 = start.left + 150;
  const y1 = start.top + 30;
  const x2 = end.left;
  const y2 = end.top + 30;

  return {
    x: (x1 + x2) / 2,
    y: (y1 + y2) / 2 - 10
  };
};

// 更新连线的事件类型
const updateConnectionEventType = (connection, eventType) => {
  connection.eventType = eventType;
  // 强制重新渲染
  connections.value = [...connections.value];
};

// 删除连线
const deleteConnection = (connection) => {
  const index = connections.value.findIndex(c => c.id === connection.id);
  if (index !== -1) {
    connections.value.splice(index, 1);
    selectedConnection.value = null;
  }
};

// 处理拖拽放置
const onDrop = (event) => {
  event.preventDefault();
  const eventData = JSON.parse(event.dataTransfer.getData('application/json'));
  
  if (eventData.type === 'system-event') {
    const rect = event.currentTarget.getBoundingClientRect();
    const left = event.clientX - rect.left;
    const top = event.clientY - rect.top;
    
    const newNode = addSystemNode(
      eventData.eventType,
      eventData.name,
      eventData.description,
      eventData.properties
    );
    
    // 设置放置位置
    newNode.left = left;
    newNode.top = top;
  }
};

// 暴露必要的状态和方法给父组件
defineExpose({
  initComponentNodes,
  addSystemNode,
  eventNodes,
  connections,
  selectedNode,
  selectedConnection,
  updateConnectionEventType,
  deleteConnection,
  availableEventTypes
});
</script>

<style scoped>
.event-flow-canvas {
  width: 100%;
  height: 100%;
  position: relative;
  background: #f8fafc;
  overflow: auto;
}

.event-node {
  position: absolute;
  width: 150px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  cursor: move;
  user-select: none;
}

.node-header {
  padding: 8px 12px;
  background: #f1f5f9;
  border-radius: 8px 8px 0 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.node-title {
  font-size: 14px;
  font-weight: 500;
}

.node-content {
  padding: 8px 12px;
  font-size: 12px;
  color: #64748b;
}

.component-node {
  border: 2px solid #3b82f6;
}

.system-node {
  border: 2px solid #10b981;
}

.connections {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
}

.connection-path {
  fill: none;
  stroke: #94a3b8;
  stroke-width: 2;
  cursor: pointer;
  transition: all 0.2s ease;
}

.connection-path.creating {
  stroke-dasharray: 5,5;
  animation: dash 1s linear infinite;
}

.connection-path.selected {
  stroke: rgb(var(--v-theme-primary));
  stroke-width: 3;
}

.connection-label {
  fill: #64748b;
  font-size: 12px;
  text-anchor: middle;
  pointer-events: none;
}

@keyframes dash {
  to {
    stroke-dashoffset: -10;
  }
}

.node-ports {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
}

.port {
  position: absolute;
  width: 10px;
  height: 10px;
  background: white;
  border: 2px solid #94a3b8;
  border-radius: 50%;
  cursor: crosshair;
  transition: transform 0.2s ease;
}

.port:hover {
  transform: scale(1.2);
  border-color: rgb(var(--v-theme-primary));
}

.port-out {
  right: -5px;
  top: 50%;
  transform: translateY(-50%);
}

.port-in {
  left: -5px;
  top: 50%;
  transform: translateY(-50%);
}

.selected {
  box-shadow: 0 0 0 2px rgb(var(--v-theme-primary));
}
</style> 