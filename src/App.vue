<script setup>
// 导入组件
import { ref, onMounted, nextTick, watch } from "vue";
import ComponentLibrary from "./components/ComponentLibrary.vue";
import EditorCanvas from "./components/EditorCanvas.vue";
import PropertyPanel from "./components/PropertyPanel.vue";
import FunctionFlowEditor from "./components/FunctionFlowEditor.vue";
import CodeExporter from "./components/CodeExporter.vue";

// 创建EditorCanvas的引用
const editorCanvasRef = ref(null);

// 标签页控制
const activeTab = ref("properties"); // 默认显示属性面板

// 切换标签
const switchTab = (tabName) => {
  activeTab.value = tabName;
};

// 组件挂载后检查引用
onMounted(async () => {
  console.log("App组件已挂载");

  // 等待DOM更新完成
  await nextTick();

  // 初始化全局事件存储
  initGlobalEventStorage();

  // 确保 editorCanvasRef 存在且其 canvasComponents 已经初始化后再设置监听
  if (editorCanvasRef.value?.canvasComponents) {
    console.log("设置画布组件变化监听");
    // 通过watch监听组件变化
    watch(
      () => editorCanvasRef.value.canvasComponents.value,
      (newComponents) => {
        if (newComponents) {
          // 添加空值检查
          console.log("画布组件发生变化，当前组件数量:", newComponents.length);
        }
      },
      { deep: true }
    );
  }
});

// 当前选中的组件列表，可以传递给CodeExporter
const getCurrentCanvasComponents = () => {
  if (editorCanvasRef.value?.canvasComponents?.value) {
    return editorCanvasRef.value.canvasComponents.value;
  }
  return [];
};

const initGlobalEventStorage = () => {
  // 确保全局事件存储变量存在
  if (typeof window !== "undefined") {
    // 清空先前的存储
    window.__CANVAS_COMPONENTS_EVENTS__ = {};

    console.log("全局事件存储已初始化");

    // 监听组件事件更新事件
    document.addEventListener("component-events-updated", (e) => {
      const { componentId, events } = e.detail;

      // 确保存储对象存在
      if (!window.__CANVAS_COMPONENTS_EVENTS__) {
        window.__CANVAS_COMPONENTS_EVENTS__ = {};
      }

      // 更新事件数据到全局存储
      if (events && events.length > 0) {
        window.__CANVAS_COMPONENTS_EVENTS__[componentId] = JSON.parse(
          JSON.stringify(events)
        );
        console.log(
          `全局事件存储：组件 ${componentId} 的事件已更新，现有 ${events.length} 个事件`
        );
      } else {
        // 如果没有事件，从存储中移除
        delete window.__CANVAS_COMPONENTS_EVENTS__[componentId];
        console.log(`全局事件存储：组件 ${componentId} 的事件已移除`);
      }
    });

    console.log("已添加全局事件更新监听器");
  }
};

// 计算当前选中组件的数量，用于显示在UI上
const selectedComponentCount = ref(0);

// 监听组件选择事件
onMounted(() => {
  document.addEventListener("component-selected", (event) => {
    selectedComponentCount.value = 1; // 现在只支持选择一个组件
  });

  // 监听未选择事件
  document.addEventListener("component-deselected", () => {
    selectedComponentCount.value = 0;
  });
});
</script>

<template>
  <div class="app-container">
    <!-- 顶部导航栏 -->
    <header class="header">
      <h1>零代码应用构建平台</h1>
      <div class="header-info">
        <span v-if="selectedComponentCount > 0" class="selected-count">
          已选择 {{ selectedComponentCount }} 个组件
        </span>
      </div>
      <div class="header-actions">
        <CodeExporter :canvas-ref="editorCanvasRef" />
      </div>
    </header>

    <div class="main-content">
      <!-- 左侧组件选择区 -->
      <aside class="sidebar left-sidebar">
        <h2>组件库</h2>
        <ComponentLibrary />
      </aside>

      <!-- 中间编辑区域 -->
      <main class="editor-area">
        <h2>编辑区域</h2>
        <div class="canvas-container">
          <!-- 这里是拖拽组件的画布 -->
          <EditorCanvas ref="editorCanvasRef" />
        </div>
      </main>

      <!-- 右侧属性和功能编辑区 -->
      <aside class="sidebar right-sidebar">
        <div class="right-tabs">
          <div class="tab-headers">
            <div
              class="tab-header"
              :class="{ active: activeTab === 'properties' }"
              @click="switchTab('properties')"
            >
              属性设置
            </div>
            <div
              class="tab-header"
              :class="{ active: activeTab === 'events' }"
              @click="switchTab('events')"
            >
              功能流
            </div>
          </div>

          <div class="tab-content" v-show="activeTab === 'properties'">
            <PropertyPanel />
          </div>

          <div class="tab-content" v-show="activeTab === 'events'">
            <FunctionFlowEditor />
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>

<style>
.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;
  background-color: #f5f5f5;
  position: relative;
}

.header {
  background-color: #4a5568;
  color: white;
  padding: 10px 20px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  z-index: 10;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header h1 {
  margin: 0;
  font-size: 1.5rem;
}

.header-info {
  color: #e2e8f0;
  font-size: 0.9rem;
}

.selected-count {
  background-color: rgba(255, 255, 255, 0.2);
  padding: 3px 8px;
  border-radius: 12px;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.main-content {
  display: flex;
  flex: 1;
  overflow: hidden;
  position: relative;
}

.sidebar {
  width: 250px;
  padding: 15px;
  overflow-y: auto;
  background-color: white;
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.1);
  z-index: 5;
}

.left-sidebar {
  border-right: 1px solid #e2e8f0;
}

.right-sidebar {
  border-left: 1px solid #e2e8f0;
}

.sidebar h2 {
  font-size: 1.2rem;
  margin-top: 0;
  padding-bottom: 10px;
  border-bottom: 1px solid #e2e8f0;
}

.editor-area {
  flex: 1;
  padding: 15px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 1;
}

.canvas-container {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  position: relative;
}

.right-tabs {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.tab-headers {
  display: flex;
  border-bottom: 1px solid #e2e8f0;
  margin-bottom: 10px;
}

.tab-header {
  padding: 8px 15px;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  color: #718096;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.2s ease;
}

.tab-header.active {
  color: #4299e1;
  border-bottom-color: #4299e1;
}

.tab-header:hover:not(.active) {
  background-color: #f7fafc;
  color: #4a5568;
}

.tab-content {
  flex: 1;
  overflow-y: auto;
}

/* 重置全局样式 */
body {
  margin: 0;
  padding: 0;
  display: block;
  place-items: unset;
  min-width: unset;
  min-height: unset;
}

#app {
  max-width: none;
  margin: 0;
  padding: 0;
  text-align: left;
}
</style>

<script>
// 在组件挂载后添加标签页切换功能
document.addEventListener("DOMContentLoaded", () => {
  const tabHeaders = document.querySelectorAll(".tab-header");
  const tabContents = document.querySelectorAll(".tab-content");

  tabHeaders.forEach((header, index) => {
    header.addEventListener("click", () => {
      // 移除所有活动状态
      tabHeaders.forEach((h) => h.classList.remove("active"));
      tabContents.forEach((c) => (c.style.display = "none"));

      // 激活当前标签
      header.classList.add("active");
      tabContents[index].style.display = "block";
    });
  });
});

//初始化全局事件存储
window.__CANVAS_COMPONENTS_EVENTS__ = {};

// 监听组件事件更新事件
document.addEventListener("component-events-updated", (event) => {
  const { componentId, events } = event.detail;

  // 更新全局事件存储
  if (!window.__CANVAS_COMPONENTS_EVENTS__) {
    window.__CANVAS_COMPONENTS_EVENTS__ = {};
  }

  if (events && events.length > 0) {
    window.__CANVAS_COMPONENTS_EVENTS__[componentId] = JSON.parse(
      JSON.stringify(events)
    );
    console.log(`App - 全局事件存储已更新组件 ${componentId} 的事件数据`);
  } else {
    // 如果事件被清空，从存储中移除该组件的事件数据
    if (window.__CANVAS_COMPONENTS_EVENTS__[componentId]) {
      delete window.__CANVAS_COMPONENTS_EVENTS__[componentId];
      console.log(`App - 已从全局事件存储中移除组件 ${componentId} 的事件数据`);
    }
  }
});
</script>
