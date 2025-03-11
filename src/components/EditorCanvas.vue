<script setup>
import {
  ref,
  provide,
  defineExpose,
  onMounted,
  nextTick,
  onUnmounted,
  reactive,
  watch,
} from "vue";

// 画布上的组件列表
const canvasComponents = ref([]);
// 当前选中的组件
const selectedComponent = ref(null);
// 当前正在调整大小
const isResizing = ref(false);
// 调整大小的方向
const resizeDirection = ref("");
// 记录调整大小开始时的位置
const resizeStartPosition = ref({ x: 0, y: 0 });
// 画布缩放比例
const canvasScale = ref(1);
// 画布的位置偏移
const canvasOffset = ref({ x: 0, y: 0 });
// 是否显示对齐辅助线
const showAlignmentGuides = ref(true);
// 对齐辅助线位置
const alignmentGuides = ref({
  vertical: [],
  horizontal: [],
});
// 是否正在移动组件
const isMoving = ref(false);
// 历史记录 - 用于撤销/重做
const history = ref([]);
// 当前历史记录索引
const currentHistoryIndex = ref(-1);

// 提供给子组件访问的数据
provide("selectedComponent", selectedComponent);
// 提供canvasComponents给CodeExporter组件使用
provide("canvasComponents", canvasComponents);

// 暴露canvasComponents给父组件
defineExpose({
  canvasComponents,
});

// 保存当前状态到历史记录
const saveToHistory = () => {
  // 如果我们在历史记录的中间位置做了变更，需要删除当前点之后的所有历史记录
  if (currentHistoryIndex.value < history.value.length - 1) {
    history.value = history.value.slice(0, currentHistoryIndex.value + 1);
  }

  // 创建组件状态的深拷贝
  const state = JSON.parse(JSON.stringify(canvasComponents.value));

  // 添加到历史记录
  history.value.push(state);
  currentHistoryIndex.value = history.value.length - 1;

  // 限制历史记录长度，避免内存占用过大
  if (history.value.length > 30) {
    history.value.shift();
    currentHistoryIndex.value--;
  }
};

// 撤销操作
const undo = () => {
  if (currentHistoryIndex.value > 0) {
    currentHistoryIndex.value--;
    canvasComponents.value = JSON.parse(
      JSON.stringify(history.value[currentHistoryIndex.value])
    );
  }
};

// 重做操作
const redo = () => {
  if (currentHistoryIndex.value < history.value.length - 1) {
    currentHistoryIndex.value++;
    canvasComponents.value = JSON.parse(
      JSON.stringify(history.value[currentHistoryIndex.value])
    );
  }
};

// 画布拖拽事件处理
const onDragOver = (event) => {
  event.preventDefault();
  event.dataTransfer.dropEffect = "copy";

  // 显示放置位置指示器
  const canvasRect = event.currentTarget.getBoundingClientRect();
  const x =
    (event.clientX - canvasRect.left) / canvasScale.value -
    canvasOffset.value.x;
  const y =
    (event.clientY - canvasRect.top) / canvasScale.value - canvasOffset.value.y;

  // 更新对齐辅助线
  if (showAlignmentGuides.value) {
    updateAlignmentGuides(x, y);
  }
};

// 更新对齐辅助线
const updateAlignmentGuides = (x, y, width = 100, height = 40) => {
  alignmentGuides.value = {
    vertical: [],
    horizontal: [],
  };

  const threshold = 5;
  const centerX = x + width / 2;
  const centerY = y + height / 2;
  const right = x + width;
  const bottom = y + height;

  canvasComponents.value.forEach((comp) => {
    const otherCenterX = comp.left + comp.width / 2;
    const otherCenterY = comp.top + comp.height / 2;
    const otherRight = comp.left + comp.width;
    const otherBottom = comp.top + comp.height;

    // 垂直对齐检测
    if (Math.abs(x - comp.left) < threshold) {
      alignmentGuides.value.vertical.push({
        position: comp.left,
        start: Math.min(y, comp.top) - 20,
        end: Math.max(bottom, otherBottom) + 20,
      });
    }

    if (Math.abs(centerX - otherCenterX) < threshold) {
      alignmentGuides.value.vertical.push({
        position: otherCenterX,
        start: Math.min(y, comp.top) - 20,
        end: Math.max(bottom, otherBottom) + 20,
      });
    }

    if (Math.abs(right - otherRight) < threshold) {
      alignmentGuides.value.vertical.push({
        position: otherRight,
        start: Math.min(y, comp.top) - 20,
        end: Math.max(bottom, otherBottom) + 20,
      });
    }

    // 水平对齐检测
    if (Math.abs(y - comp.top) < threshold) {
      alignmentGuides.value.horizontal.push({
        position: comp.top,
        start: Math.min(x, comp.left) - 20,
        end: Math.max(right, otherRight) + 20,
      });
    }

    if (Math.abs(centerY - otherCenterY) < threshold) {
      alignmentGuides.value.horizontal.push({
        position: otherCenterY,
        start: Math.min(x, comp.left) - 20,
        end: Math.max(right, otherRight) + 20,
      });
    }

    if (Math.abs(bottom - otherBottom) < threshold) {
      alignmentGuides.value.horizontal.push({
        position: otherBottom,
        start: Math.min(x, comp.left) - 20,
        end: Math.max(right, otherRight) + 20,
      });
    }
  });
};

// 拖拽放置事件处理
const onDrop = (event) => {
  event.preventDefault();
  event.stopPropagation();

  try {
    const jsonData = event.dataTransfer.getData("application/json");
    console.log("拖放数据:", jsonData);

    if (!jsonData) {
      console.error("没有获取到有效的拖拽数据");
      return;
    }

    const componentData = JSON.parse(jsonData);
    console.log("解析后的组件数据:", componentData);

    // 确保组件类型存在且正确
    if (!componentData.type) {
      console.error("组件类型未定义");
      return;
    }

    // 计算放置位置（相对于画布）
    const canvasRect = event.currentTarget.getBoundingClientRect();
    const x =
      (event.clientX - canvasRect.left) / canvasScale.value -
      canvasOffset.value.x;
    const y =
      (event.clientY - canvasRect.top) / canvasScale.value -
      canvasOffset.value.y;

    // 创建新组件数据，确保包含所有必要的属性
    const newComponentData = {
      type: componentData.type,
      left: x,
      top: y,
      width: componentData.width || 100,
      height: componentData.height || 40,
      properties: {
        text: componentData.type === "button" ? "按钮" : "文本内容",
        ...componentData.properties,
      },
    };

    // 创建新组件
    const newComponent = createComponent(newComponentData);
    console.log("创建的新组件:", newComponent);

    // 保存到历史记录
    saveToHistory();
  } catch (error) {
    console.error("放置组件时出错:", error);
  }
};

// 修改 createComponent 函数
const createComponent = (componentData) => {
  const componentId = `${componentData.type}-${Date.now()}`;

  // 创建新组件对象，使用 reactive 确保深层响应性
  const newComponent = reactive({
    id: componentId,
    type: componentData.type,
    left: componentData.left || 0,
    top: componentData.top || 0,
    width: componentData.width || 100,
    height: componentData.height || 40,
    style: reactive({
      backgroundColor: "#3490dc",
      color: "#ffffff",
      borderRadius: "4px",
      fontSize: "14px",
      fontWeight: "normal",
      textAlign: "center",
      border: "none",
      cursor: "pointer",
      boxSizing: "border-box",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      ...componentData.style
    }),
    properties: reactive({
      text: componentData.type === "button" ? "按钮" : "文本内容",
      ...componentData.properties
    }),
    events: []
  });

  // 添加到组件列表
  canvasComponents.value.push(newComponent);
  
  // 选中新创建的组件
  selectComponent(newComponent);

  return newComponent;
};

// 选择组件
const selectComponent = (componentOrId, event) => {
  // 确保事件存在并且不是从调整大小的手柄触发的
  if (event && event.target?.classList?.contains("resize-handle")) {
    return;
  }

  // 如果传入的是组件ID，则从canvasComponents中查找该组件
  if (typeof componentOrId === "string") {
    const componentById = canvasComponents.value.find(
      (comp) => comp.id === componentOrId
    );
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
  if (!selectedComponent.value || typeof selectedComponent.value !== "object") {
    console.warn(
      "无法发送选择事件：selectedComponent不是有效对象",
      selectedComponent.value
    );
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
    document.dispatchEvent(
      new CustomEvent("component-selected", {
        detail: selectedComponentData,
      })
    );

    // 如果当前选中的组件有事件，确保是最新的事件被传递
    if (selectedComponentData && selectedComponentData.id) {
      // 存储到window对象上，以便在需要时访问
      if (!window.__CANVAS_COMPONENTS_EVENTS__) {
        window.__CANVAS_COMPONENTS_EVENTS__ = {};
      }
      window.__CANVAS_COMPONENTS_EVENTS__[selectedComponentData.id] =
        JSON.parse(JSON.stringify(selectedComponentData.events || []));

      console.log(
        `已将组件 ${selectedComponentData.id} 的事件数据存储到全局变量`
      );
    }
  } catch (error) {
    console.error("发送组件选择事件时出错:", error);
  }
};

// 监听组件选择事件
const handleComponentSelected = (event) => {
  selectedComponent.value = event.detail;
};

// 修改组件样式计算函数
const getComponentStyle = (component) => {
  return {
    position: "absolute",
    left: `${component.left}px`,
    top: `${component.top}px`,
    width: `${component.width}px`,
    height: `${component.height}px`,
    ...component.style
  };
};

// 当组件移动时更新位置
const onComponentMove = (event, component) => {
  if (
    event.buttons !== 1 ||
    selectedComponent.value !== component ||
    isResizing.value
  )
    return;

  // 设置移动状态
  if (!isMoving.value) {
    isMoving.value = true;
    // 开始移动时显示对齐辅助线
    showAlignmentGuides.value = true;
  }

  // 计算移动距离，考虑缩放比例
  const movementX = event.movementX / canvasScale.value;
  const movementY = event.movementY / canvasScale.value;

  // 计算新位置
  let newLeft = component.left + movementX;
  let newTop = component.top + movementY;

  // 防止组件移出画布
  if (newLeft < 0) newLeft = 0;
  if (newTop < 0) newTop = 0;

  // 更新对齐辅助线并进行吸附
  if (showAlignmentGuides.value) {
    const { snappedX, snappedY } = checkSnapping(
      newLeft,
      newTop,
      component.width,
      component.height
    );
    newLeft = snappedX !== null ? snappedX : newLeft;
    newTop = snappedY !== null ? snappedY : newTop;
  }

  // 更新组件位置
  component.left = newLeft;
  component.top = newTop;

  // 更新对齐辅助线
  updateAlignmentGuides(
    component.left,
    component.top,
    component.width,
    component.height
  );
};

// 添加位置吸附检查函数
const checkSnapping = (x, y, width, height) => {
  const threshold = 5;
  let snappedX = null;
  let snappedY = null;

  const centerX = x + width / 2;
  const right = x + width;
  const centerY = y + height / 2;
  const bottom = y + height;

  // 检查与其他组件的对齐
  canvasComponents.value.forEach((comp) => {
    if (comp === selectedComponent.value) return;

    const otherCenterX = comp.left + comp.width / 2;
    const otherRight = comp.left + comp.width;
    const otherCenterY = comp.top + comp.height / 2;
    const otherBottom = comp.top + comp.height;

    // 水平对齐检查
    if (Math.abs(x - comp.left) < threshold) snappedX = comp.left;
    if (Math.abs(centerX - otherCenterX) < threshold)
      snappedX = otherCenterX - width / 2;
    if (Math.abs(right - otherRight) < threshold) snappedX = otherRight - width;

    // 垂直对齐检查
    if (Math.abs(y - comp.top) < threshold) snappedY = comp.top;
    if (Math.abs(centerY - otherCenterY) < threshold)
      snappedY = otherCenterY - height / 2;
    if (Math.abs(bottom - otherBottom) < threshold)
      snappedY = otherBottom - height;
  });

  return { snappedX, snappedY };
};

// 添加移动结束的处理
const onComponentMoveEnd = () => {
  if (isMoving.value) {
    isMoving.value = false;
    // 移动结束时隐藏对齐辅助线
    showAlignmentGuides.value = false;
    // 清除对齐辅助线
    alignmentGuides.value = { vertical: [], horizontal: [] };
    // 保存当前状态到历史记录
    saveToHistory();
  }
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
    y0: selectedComponent.value.top,
  };

  // 添加document级别的鼠标移动和释放事件监听
  document.addEventListener("mousemove", handleResize);
  document.addEventListener("mouseup", endResize);
};

// 调整大小逻辑
const handleResize = (event) => {
  if (!isResizing.value || !selectedComponent.value) return;

  // 显示对齐辅助线
  showAlignmentGuides.value = true;

  const deltaX = event.clientX - resizeStartPosition.value.x;
  const deltaY = event.clientY - resizeStartPosition.value.y;

  const component = selectedComponent.value;
  const startPos = resizeStartPosition.value;

  // 根据不同方向来调整大小
  switch (resizeDirection.value) {
    case "e": // 右侧
      component.width = Math.max(20, startPos.width + deltaX);
      break;
    case "s": // 底部
      component.height = Math.max(20, startPos.height + deltaY);
      break;
    case "se": // 右下角
      component.width = Math.max(20, startPos.width + deltaX);
      component.height = Math.max(20, startPos.height + deltaY);
      break;
    case "n": // 顶部
      const newHeightN = Math.max(20, startPos.height - deltaY);
      component.top = startPos.y0 + (startPos.height - newHeightN);
      component.height = newHeightN;
      break;
    case "w": // 左侧
      const newWidthW = Math.max(20, startPos.width - deltaX);
      component.left = startPos.x0 + (startPos.width - newWidthW);
      component.width = newWidthW;
      break;
    case "nw": // 左上角
      const newWidthNW = Math.max(20, startPos.width - deltaX);
      const newHeightNW = Math.max(20, startPos.height - deltaY);
      component.left = startPos.x0 + (startPos.width - newWidthNW);
      component.top = startPos.y0 + (startPos.height - newHeightNW);
      component.width = newWidthNW;
      component.height = newHeightNW;
      break;
    case "ne": // 右上角
      component.width = Math.max(20, startPos.width + deltaX);
      const newHeightNE = Math.max(20, startPos.height - deltaY);
      component.top = startPos.y0 + (startPos.height - newHeightNE);
      component.height = newHeightNE;
      break;
    case "sw": // 左下角
      const newWidthSW = Math.max(20, startPos.width - deltaX);
      component.left = startPos.x0 + (startPos.width - newWidthSW);
      component.width = newWidthSW;
      component.height = Math.max(20, startPos.height + deltaY);
      break;
  }

  // 更新对齐辅助线
  updateAlignmentGuides(
    component.left,
    component.top,
    component.width,
    component.height
  );
};

// 结束调整大小
const endResize = () => {
  isResizing.value = false;
  // 隐藏对齐辅助线
  showAlignmentGuides.value = false;
  alignmentGuides.value = { vertical: [], horizontal: [] };

  // 移除事件监听
  document.removeEventListener("mousemove", handleResize);
  document.removeEventListener("mouseup", endResize);

  // 保存当前状态到历史记录
  saveToHistory();
};

// 点击画布背景时取消组件选择
const onCanvasClick = (event) => {
  // 只有当点击的是画布本身时才取消选择
  if (event.target.classList.contains("editor-canvas")) {
    selectedComponent.value = null;
  }
};

// 组件挂载后添加事件监听
onMounted(() => {
  // 清空可能存在的旧数据
  canvasComponents.value = [];

  // 添加防止拖拽组件出画布的处理
  document.addEventListener("dragover", (event) => {
    // 在document上阻止默认拖拽行为，避免浏览器默认处理
    event.preventDefault();
  });

  // 添加事件更新监听
  document.addEventListener("component-events-updated", (event) => {
    const { componentId, events } = event.detail;

    // 在canvasComponents中查找对应的组件
    const componentIndex = canvasComponents.value.findIndex(
      (comp) => comp.id === componentId
    );
    if (componentIndex !== -1) {
      // 更新组件的事件数据
      console.log(`EditorCanvas - 更新组件 ${componentId} 的事件数据:`, events);
      canvasComponents.value[componentIndex].events = JSON.parse(
        JSON.stringify(events || [])
      );
    }
  });

  // 添加键盘事件监听
  document.addEventListener("keydown", handleKeyDown);

  // 添加画布缩放和平移事件监听
  const canvas = document.getElementById("editor-canvas-wrapper");
  if (canvas) {
    canvas.addEventListener("wheel", handleWheel, { passive: false });
    canvas.addEventListener("mousemove", handleCanvasDrag);
    canvas.addEventListener("contextmenu", (e) => e.preventDefault());
  }

  console.log("EditorCanvas组件已挂载，组件列表已初始化");

  // 在组件卸载时移除事件监听
  onUnmounted(() => {
    document.removeEventListener("keydown", handleKeyDown);
    if (canvas) {
      canvas.removeEventListener("wheel", handleWheel);
      canvas.removeEventListener("mousemove", handleCanvasDrag);
    }
  });

  // 监听属性更新事件
  document.addEventListener("property-updated", handlePropertyUpdate);

  // 监听组件更新事件
  document.addEventListener("component-updated", handleComponentUpdate);
});

// 添加画布缩放功能
const handleWheel = (event) => {
  if (event.ctrlKey || event.metaKey) {
    event.preventDefault();
    const delta = event.deltaY > 0 ? -0.1 : 0.1;
    const newScale = Math.max(0.5, Math.min(2, canvasScale.value + delta));

    // 计算鼠标位置相对于画布的偏移
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // 更新缩放和偏移
    canvasScale.value = newScale;

    // 根据鼠标位置调整画布偏移
    canvasOffset.value.x =
      x - (x - canvasOffset.value.x) * (newScale / (newScale - delta));
    canvasOffset.value.y =
      y - (y - canvasOffset.value.y) * (newScale / (newScale - delta));
  }
};

// 添加画布平移功能
const handleCanvasDrag = (event) => {
  if (event.buttons === 2 || (event.buttons === 1 && event.altKey)) {
    event.preventDefault();
    canvasOffset.value.x += event.movementX;
    canvasOffset.value.y += event.movementY;
  }
};

// 修改handleKeyDown函数，只保留删除功能
const handleKeyDown = (event) => {
  if (!selectedComponent.value) return;

  // 检查是否在属性面板中编辑
  const isEditingProperty = event.target.tagName.toLowerCase() === 'input' || 
                           event.target.tagName.toLowerCase() === 'textarea';
  
  if ((event.key === "Delete" || event.key === "Backspace") && !isEditingProperty) {
    event.preventDefault();
    deleteSelectedComponent();
  }
};

// 修改deleteSelectedComponent函数
const deleteSelectedComponent = () => {
  if (selectedComponent.value) {
    const index = canvasComponents.value.findIndex(
      (comp) => comp.id === selectedComponent.value.id
    );
    if (index !== -1) {
      canvasComponents.value.splice(index, 1);
      // 发送组件删除事件
      document.dispatchEvent(new CustomEvent('component-deleted', {
        detail: { componentId: selectedComponent.value.id }
      }));
      selectedComponent.value = null;
      // 保存当前状态到历史记录
      saveToHistory();
    }
  }
};

// 处理属性更新事件
const handlePropertyUpdate = (event) => {
  const { componentId, propertyName, value } = event.detail;
  const componentIndex = canvasComponents.value.findIndex(
    (comp) => comp.id === componentId
  );

  if (componentIndex !== -1) {
    const component = canvasComponents.value[componentIndex];

    if (propertyName.includes(".")) {
      const keys = propertyName.split(".");
      let target = component;

      // 遍历直到倒数第二级
      for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        if (!target[key]) {
          target[key] = {};
        }
        target = target[key];
      }

      // 使用数组方法触发响应式更新
      const lastKey = keys[keys.length - 1];
      target[lastKey] = value;
      canvasComponents.value.splice(componentIndex, 1, { ...component });
    } else {
      if (!component.properties) {
        component.properties = {};
      }
      // 使用数组方法触发响应式更新
      component.properties[propertyName] = value;
      canvasComponents.value.splice(componentIndex, 1, { ...component });
    }

    // 保存到历史记录
    saveToHistory();
  }
};

// 组件卸载时移除事件监听
onUnmounted(() => {
  document.removeEventListener("property-updated", handlePropertyUpdate);
  document.removeEventListener("component-updated", handleComponentUpdate);
});

// 修改 handleComponentUpdate 函数
const handleComponentUpdate = (event) => {
  const { componentId, property, value } = event.detail;
  const component = canvasComponents.value.find(comp => comp.id === componentId);
  
  if (component) {
    // 更新组件属性
    if (property.startsWith('style.')) {
      const styleProp = property.split('.')[1];
      if (!component.style) {
        component.style = {};
      }
      component.style[styleProp] = value;
    } else if (['width', 'height'].includes(property)) {
      // 直接更新宽高属性
      component[property] = value;
    } else {
      if (!component.properties) {
        component.properties = {};
      }
      component.properties[property] = value;
    }
    
    // 强制重新渲染
    canvasComponents.value = [...canvasComponents.value];
    
    // 保存到历史记录
    saveToHistory();
  }
};
</script>

<template>
  <div
    id="editor-canvas-wrapper"
    class="editor-canvas"
    @dragover="onDragOver"
    @drop="onDrop"
    @click="onCanvasClick"
    :style="{
      transform: `scale(${canvasScale}) translate(${canvasOffset.x}px, ${canvasOffset.y}px)`,
      transformOrigin: '0 0',
    }"
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
      @mouseup="onComponentMoveEnd"
    >
      <!-- 根据组件类型显示不同内容 -->
      <div v-if="component.type === 'button'" class="component-button">
        <button
          :style="{
            width: '100%',
            height: '100%',
            backgroundColor: component.style.backgroundColor,
            color: component.style.color,
            borderRadius: component.style.borderRadius,
            fontSize: component.style.fontSize,
            fontWeight: component.style.fontWeight,
            textAlign: component.style.textAlign,
            border: 'none',
            outline: 'none',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }"
        >
          {{ component.properties.text }}
        </button>
      </div>

      <div 
        v-else-if="component.type === 'text'" 
        class="component-text" 
        :style="{
          width: '100%',
          height: '100%',
          color: component.style.color,
          fontSize: component.style.fontSize,
          fontWeight: component.style.fontWeight,
          textAlign: component.style.textAlign,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          overflow: 'hidden'
        }"
      >
        {{ component.properties.text }}
      </div>

      <div v-else-if="component.type === 'input'" class="component-input">
        <input 
          type="text" 
          :placeholder="component.properties.placeholder || '请输入...'"
          :style="{
            width: '100%',
            height: '100%',
            backgroundColor: component.style.backgroundColor,
            color: component.style.color,
            borderRadius: component.style.borderRadius,
            fontSize: component.style.fontSize,
            textAlign: component.style.textAlign,
            border: component.style.border || '1px solid #ddd',
            outline: 'none'
          }"
          v-model="component.properties.text"
        />
      </div>

      <div 
        v-else-if="component.type === 'image'" 
        class="component-image" 
        :style="{
          width: '100%',
          height: '100%',
          borderRadius: component.style.borderRadius,
          overflow: 'hidden'
        }"
      >
        <img 
          :src="component.properties.src || 'https://via.placeholder.com/150'" 
          :alt="component.properties.alt || '图片'"
          :style="{
            width: '100%',
            height: '100%',
            objectFit: component.style.objectFit || 'cover'
          }"
        />
      </div>

      <div 
        v-else 
        class="component-default" 
        :style="{
          width: '100%',
          height: '100%',
          backgroundColor: component.style.backgroundColor,
          color: component.style.color,
          fontSize: component.style.fontSize,
          fontWeight: component.style.fontWeight,
          textAlign: component.style.textAlign,
          borderRadius: component.style.borderRadius
        }"
      >
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

    <!-- 添加对齐辅助线 -->
    <template v-if="showAlignmentGuides">
      <div
        v-for="(guide, index) in alignmentGuides.vertical"
        :key="`v-${index}`"
        class="alignment-guide vertical"
        :style="{
          left: `${guide.position}px`,
          top: `${guide.start}px`,
          height: `${guide.end - guide.start}px`,
        }"
      ></div>
      <div
        v-for="(guide, index) in alignmentGuides.horizontal"
        :key="`h-${index}`"
        class="alignment-guide horizontal"
        :style="{
          top: `${guide.position}px`,
          left: `${guide.start}px`,
          width: `${guide.end - guide.start}px`,
        }"
      ></div>
    </template>
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
  transition: transform 0.1s ease;
  will-change: transform;
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
  transition: transform 0.1s ease, box-shadow 0.2s ease;
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

.component-button,
.component-text,
.component-input,
.component-image,
.component-default {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
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

/* 添加对齐辅助线样式 */
.alignment-guide {
  position: absolute;
  background-color: #4299e1;
  pointer-events: none;
  z-index: 1000;
}

.alignment-guide.vertical {
  width: 1px;
}

.alignment-guide.horizontal {
  height: 1px;
}

/* 添加画布缩放样式 */
.editor-canvas {
  transition: transform 0.1s ease;
  will-change: transform;
}

/* 添加组件移动时的过渡效果 */
.canvas-component {
  transition: transform 0.1s ease, box-shadow 0.2s ease;
}
</style>
