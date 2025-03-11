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
  <router-view></router-view>
</template>

<style>
body {
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

#app {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
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
