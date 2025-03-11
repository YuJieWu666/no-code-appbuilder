<template>
  <div class="event-config-panel">
    <!-- 未选中任何内容时的提示 -->
    <div v-if="!selectedNode && !selectedConnection" class="no-selection">
      <v-icon icon="mdi-gesture-tap-button" size="large" color="medium-emphasis" />
      <p class="text-medium-emphasis">请选择一个节点或连线来配置事件</p>
    </div>

    <!-- 节点配置面板 -->
    <div v-else-if="selectedNode" class="node-config">
      <div class="config-header">
        <v-icon :icon="selectedNode.type === 'component' ? 'mdi-view-dashboard' : 'mdi-cog'" />
        <span class="config-title">{{ selectedNode.name }}</span>
      </div>

      <!-- 组件节点配置 -->
      <template v-if="selectedNode.type === 'component'">
        <div class="config-section">
          <div class="section-title">组件属性</div>
          <div class="mb-4">
            <v-text-field
              v-model="selectedNode.name"
              label="组件名称"
              variant="outlined"
              density="compact"
            />
          </div>
        </div>
      </template>

      <!-- 系统事件节点配置 -->
      <template v-else>
        <div class="config-section">
          <div class="section-title">事件属性</div>
          <div class="mb-4" v-if="selectedNode.type === 'dialog'">
            <v-text-field
              v-model="selectedNode.properties.title"
              label="标题"
              variant="outlined"
              density="compact"
            />
            <v-textarea
              v-model="selectedNode.properties.content"
              label="内容"
              variant="outlined"
              density="compact"
              rows="3"
            />
          </div>
          <div class="mb-4" v-else-if="selectedNode.type === 'notification'">
            <v-select
              v-model="selectedNode.properties.type"
              :items="['info', 'success', 'warning', 'error']"
              label="通知类型"
              variant="outlined"
              density="compact"
            />
            <v-text-field
              v-model="selectedNode.properties.message"
              label="消息内容"
              variant="outlined"
              density="compact"
            />
          </div>
        </div>
      </template>
    </div>

    <!-- 连线配置面板 -->
    <div v-else-if="selectedConnection" class="connection-config">
      <div class="config-header">
        <v-icon icon="mdi-vector-line" />
        <span class="config-title">事件连接</span>
      </div>

      <div class="config-section">
        <div class="section-title">触发事件</div>
        <div class="mb-4">
          <v-select
            v-model="selectedConnection.eventType"
            :items="availableEventTypes"
            item-title="label"
            item-value="value"
            label="事件类型"
            variant="outlined"
            density="compact"
            @update:model-value="updateEventType"
          />
        </div>
      </div>

      <div class="mt-4">
        <v-btn
          color="error"
          variant="outlined"
          block
          @click="deleteConnection"
          prepend-icon="mdi-delete"
        >
          删除连接
        </v-btn>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps } from 'vue';

const props = defineProps({
  selectedNode: {
    type: Object,
    default: null
  },
  selectedConnection: {
    type: Object,
    default: null
  },
  availableEventTypes: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['update-event-type', 'delete-connection']);

const updateEventType = (value) => {
  emit('update-event-type', value);
};

const deleteConnection = () => {
  emit('delete-connection');
};
</script>

<style scoped>
.event-config-panel {
  height: 100%;
  padding: 16px;
}

.no-selection {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  color: rgb(var(--v-medium-emphasis-color));
}

.config-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 24px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgb(var(--v-theme-outline));
}

.config-title {
  font-size: 16px;
  font-weight: 500;
  color: rgb(var(--v-theme-on-surface));
}

.config-section {
  margin-bottom: 24px;
}

.section-title {
  font-size: 14px;
  font-weight: 500;
  color: rgb(var(--v-theme-on-surface-variant));
  margin-bottom: 12px;
}
</style> 