<script setup>
import { ref, watch, onMounted, onUnmounted, computed } from "vue";

// 当前选中的组件
const selectedComponent = ref(null);

// 根据组件类型计算可用的属性组
const availableProperties = computed(() => {
  if (!selectedComponent.value) return [];

  // 基础属性组 - 所有组件都有
  const baseProperties = {
    name: "基础属性",
    properties: [
      { key: "properties.text", label: "内容", type: "text" },
      {
        key: "width",
        label: "宽度",
        type: "range",
        min: 50,
        max: 500,
        step: 1,
        unit: "px",
      },
      {
        key: "height",
        label: "高度",
        type: "range",
        min: 20,
        max: 500,
        step: 1,
        unit: "px",
      },
      {
        key: "style.opacity",
        label: "不透明度",
        type: "range",
        min: 0,
        max: 100,
        step: 1,
        unit: "%"
      }
    ],
  };

  // 样式属性组 - 根据组件类型不同而有所不同
  let styleProperties = {
    name: "样式属性",
    properties: [
      { key: "style.backgroundColor", label: "背景颜色", type: "color" },
      { key: "style.color", label: "文字颜色", type: "color" },
      {
        key: "style.borderRadius",
        label: "圆角",
        type: "range",
        min: 0,
        max: 50,
        step: 1,
        unit: "px",
      },
      {
        key: "style.fontSize",
        label: "字体大小",
        type: "range",
        min: 12,
        max: 100,
        step: 1,
        unit: "px",
      },
      {
        key: "style.fontWeight",
        label: "字体粗细",
        type: "select",
        options: [
          { value: "normal", label: "正常" },
          { value: "bold", label: "粗体" },
          { value: "lighter", label: "细体" },
          { value: "bolder", label: "特粗" },
          { value: "100", label: "100" },
          { value: "200", label: "200" },
          { value: "300", label: "300" },
          { value: "400", label: "400" },
          { value: "500", label: "500" },
          { value: "600", label: "600" },
          { value: "700", label: "700" },
          { value: "800", label: "800" },
          { value: "900", label: "900" }
        ],
      },
      {
        key: "style.textAlign",
        label: "对齐方式",
        type: "buttonGroup",
        options: [
          { value: "left", label: "左对齐", icon: "←" },
          { value: "center", label: "居中", icon: "↔" },
          { value: "right", label: "右对齐", icon: "→" },
        ],
      },
      {
        key: "style.boxShadow",
        label: "阴影",
        type: "select",
        options: [
          { value: "none", label: "无" },
          { value: "0 2px 4px rgba(0,0,0,0.1)", label: "浅" },
          { value: "0 4px 8px rgba(0,0,0,0.1)", label: "中" },
          { value: "0 8px 16px rgba(0,0,0,0.1)", label: "深" },
        ],
      },
      {
        key: "style.border",
        label: "边框",
        type: "select",
        options: [
          { value: "none", label: "无" },
          { value: "1px solid #ddd", label: "细线" },
          { value: "2px solid #ddd", label: "粗线" },
          { value: "1px dashed #ddd", label: "虚线" },
        ],
      }
    ],
  };

  // 根据组件类型添加特定的样式属性
  switch (selectedComponent.value.type) {
    case "button":
      styleProperties.properties.push(
        {
          key: "style.transform",
          label: "悬停效果",
          type: "select",
          options: [
            { value: "none", label: "无" },
            { value: "scale(1.05)", label: "放大" },
            { value: "translateY(-2px)", label: "上浮" },
          ],
        },
        {
          key: "style.cursor",
          label: "鼠标样式",
          type: "select",
          options: [
            { value: "pointer", label: "手型" },
            { value: "default", label: "默认" },
          ],
        }
      );
      break;

    case "input":
      styleProperties.properties.push(
        {
          key: "properties.placeholder",
          label: "占位文本",
          type: "text",
        },
        {
          key: "style.padding",
          label: "内边距",
          type: "range",
          min: 0,
          max: 30,
          step: 1,
          unit: "px",
        }
      );
      break;

    case "text":
      styleProperties.properties.push(
        {
          key: "style.lineHeight",
          label: "行高",
          type: "range",
          min: 1,
          max: 3,
          step: 0.1,
          unit: "em",
        },
        {
          key: "style.letterSpacing",
          label: "字间距",
          type: "range",
          min: -2,
          max: 10,
          step: 0.5,
          unit: "px",
        },
        {
          key: "style.textDecoration",
          label: "文本装饰",
          type: "select",
          options: [
            { value: "none", label: "无" },
            { value: "underline", label: "下划线" },
            { value: "line-through", label: "删除线" },
            { value: "overline", label: "上划线" },
          ],
        }
      );
      break;

    case "image":
      styleProperties.properties = [
        {
          key: "properties.src",
          label: "图片地址",
          type: "text",
        },
        {
          key: "properties.alt",
          label: "替代文本",
          type: "text",
        },
        {
          key: "style.objectFit",
          label: "填充方式",
          type: "select",
          options: [
            { value: "contain", label: "包含" },
            { value: "cover", label: "覆盖" },
            { value: "fill", label: "填充" },
            { value: "scale-down", label: "缩小" },
            { value: "none", label: "原始" },
          ],
        },
        {
          key: "style.borderRadius",
          label: "圆角",
          type: "range",
          min: 0,
          max: 50,
          step: 1,
          unit: "%",
        },
        {
          key: "style.filter",
          label: "滤镜效果",
          type: "select",
          options: [
            { value: "none", label: "无" },
            { value: "grayscale(100%)", label: "灰度" },
            { value: "blur(2px)", label: "模糊" },
            { value: "brightness(120%)", label: "明亮" },
            { value: "contrast(120%)", label: "对比度" },
            { value: "sepia(100%)", label: "复古" },
          ],
        }
      ];
      break;
  }

  return [baseProperties, styleProperties];
});

// 获取组件属性值
const getPropertyValue = (component, property) => {
  if (!component) return "";

  // 处理样式属性
  if (property.key.startsWith('style.')) {
    const styleProp = property.key.replace('style.', '');
    let value = component.style[styleProp];
    // 处理带单位的值
    if (typeof value === 'string') {
      if (value.endsWith('px')) {
        return parseInt(value);
      } else if (value.endsWith('em')) {
        return parseFloat(value);
      }
    } else if (styleProp === 'opacity') {
      return Math.round((value || 1) * 100);
    }
    return value || "";
  } else if (property.key.startsWith('properties.')) {
    // 处理 properties 对象中的属性
    const propKey = property.key.replace('properties.', '');
    return component.properties[propKey] || "";
  } else {
    // 处理组件本身的属性
    return component[property.key];
  }
};

// 设置组件属性值
const setPropertyValue = (component, property, value) => {
  if (!component) return;

  // 处理样式属性
  if (property.key.startsWith('style.')) {
    const styleProp = property.key.replace('style.', '');
    // 处理需要单位的属性
    if (['fontSize', 'borderRadius', 'letterSpacing', 'padding'].includes(styleProp) && !isNaN(value)) {
      value = `${value}px`;
    } else if (styleProp === 'lineHeight') {
      value = `${value}em`;
    } else if (styleProp === 'opacity') {
      value = value / 100;
    }
    component.style[styleProp] = value;
  } else if (property.key.startsWith('properties.')) {
    // 处理 properties 对象中的属性
    const propKey = property.key.replace('properties.', '');
    component.properties[propKey] = value;
  } else {
    // 处理组件本身的属性（如 width、height）
    if (['width', 'height'].includes(property.key)) {
      component[property.key] = parseInt(value);
      // 立即触发组件更新事件
      const updateEvent = new CustomEvent("component-updated", {
        detail: {
          componentId: component.id,
          property: property.key,
          value: parseInt(value)
        }
      });
      document.dispatchEvent(updateEvent);
    } else {
      component[property.key] = value;
    }
  }
};

// 处理属性变更
const handlePropertyChange = (property, event) => {
  if (!selectedComponent.value) return;
  
  let value = event.target.value;
  
  // 对于范围类型的输入，确保值是数字
  if (property.type === 'range') {
    value = parseInt(value);
  }

  // 检查组件是否仍然存在于画布中
  const componentExists = document.querySelector(`[data-component-id="${selectedComponent.value.id}"]`);
  if (!componentExists) {
    selectedComponent.value = null;
    return;
  }
  
  // 更新属性值
  setPropertyValue(selectedComponent.value, property, value);

  // 触发属性更新事件
  const updateEvent = new CustomEvent("property-updated", {
    detail: {
      componentId: selectedComponent.value.id,
      propertyName: property.key,
      value: value
    },
  });
  document.dispatchEvent(updateEvent);
};

// 处理按钮组选择
const handleButtonGroupSelect = (property, value) => {
  if (!selectedComponent.value) return;
  setPropertyValue(selectedComponent.value, property, value);
};

// 监听组件选择事件
const onComponentSelected = (event) => {
  selectedComponent.value = event.detail;
};

// 监听组件删除事件
const onComponentDeleted = (event) => {
  if (selectedComponent.value && selectedComponent.value.id === event.detail.componentId) {
    selectedComponent.value = null;
  }
};

// 组件挂载时添加事件监听
onMounted(() => {
  document.addEventListener("component-selected", onComponentSelected);
  document.addEventListener("component-deleted", onComponentDeleted);
});

// 组件卸载时移除事件监听
onUnmounted(() => {
  document.removeEventListener("component-selected", onComponentSelected);
  document.removeEventListener("component-deleted", onComponentDeleted);
});
</script>

<template>
  <div class="property-panel">
    <div v-if="selectedComponent" class="properties-container">
      <div class="component-type">
        <span
          class="type-icon"
          :class="'icon-' + selectedComponent.type"
        ></span>
        <span class="type-value">{{ selectedComponent.name }}</span>
      </div>

      <div
        v-for="category in availableProperties"
        :key="category.name"
        class="property-category"
      >
        <h3 class="category-title">{{ category.name }}</h3>

        <div class="property-list">
          <div
            v-for="property in category.properties"
            :key="property.key"
            class="property-item"
          >
            <label class="property-label">{{ property.label }}</label>

            <div class="property-input">
              <!-- 根据属性类型渲染不同的输入控件 -->
              <input
                v-if="property.type === 'text'"
                type="text"
                :value="getPropertyValue(selectedComponent, property)"
                @input="handlePropertyChange(property, $event)"
                class="text-input"
              />

              <!-- 滑块输入 -->
              <div
                v-else-if="property.type === 'range'"
                class="range-input-container"
              >
                <input
                  type="range"
                  :min="property.min"
                  :max="property.max"
                  :step="property.step"
                  :value="getPropertyValue(selectedComponent, property)"
                  @input="handlePropertyChange(property, $event)"
                  class="range-input"
                />
                <span class="range-value"
                  >{{ getPropertyValue(selectedComponent, property)
                  }}{{ property.unit }}</span
                >
              </div>

              <!-- 颜色选择器 -->
              <div
                v-else-if="property.type === 'color'"
                class="color-picker-container"
              >
                <input
                  type="color"
                  :value="getPropertyValue(selectedComponent, property)"
                  @input="handlePropertyChange(property, $event)"
                  class="color-picker"
                />
                <span class="color-value">{{
                  getPropertyValue(selectedComponent, property)
                }}</span>
              </div>

              <!-- 下拉选择 -->
              <select
                v-else-if="property.type === 'select'"
                :value="getPropertyValue(selectedComponent, property)"
                @change="handlePropertyChange(property, $event)"
                class="select-input"
              >
                <option
                  v-for="option in property.options"
                  :key="option.value"
                  :value="option.value"
                >
                  {{ option.label }}
                </option>
              </select>

              <!-- 按钮组 -->
              <div
                v-else-if="property.type === 'buttonGroup'"
                class="button-group"
              >
                <button
                  v-for="option in property.options"
                  :key="option.value"
                  :class="{
                    active:
                      getPropertyValue(selectedComponent, property) ===
                      option.value,
                  }"
                  @click="handleButtonGroupSelect(property, option.value)"
                  class="group-button"
                  :title="option.label"
                >
                  {{ option.icon }}
                </button>
              </div>

              <!-- 默认文本输入 -->
              <input
                v-else
                type="text"
                :value="getPropertyValue(selectedComponent, property)"
                @input="handlePropertyChange(property, $event)"
                class="text-input"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="no-selection">
      <div class="no-selection-icon">🖱️</div>
      <p>请选择一个组件以编辑其属性</p>
    </div>
  </div>
</template>

<style scoped>
.property-panel {
  padding: 5px 10px;
  height: 100%;
  overflow-y: auto;
  background-color: #f8fafc;
}

.properties-container {
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
}

.property-category {
  margin-bottom: 25px;
}

.category-title {
  font-size: 1rem;
  margin: 5px 0 15px 0;
  color: #4a5568;
  font-weight: 600;
  position: relative;
  padding-left: 12px;
}

.category-title::before {
  content: "";
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 16px;
  background-color: #4299e1;
  border-radius: 2px;
}

.property-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
  background-color: white;
  padding: 15px;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.property-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.property-label {
  color: #4a5568;
  font-size: 0.9rem;
  font-weight: 500;
}

.property-input {
  width: 100%;
}

.text-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 0.85rem;
  transition: border-color 0.2s;
}

.text-input:focus {
  border-color: #4299e1;
  outline: none;
  box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.2);
}

.range-input-container {
  display: flex;
  align-items: center;
  gap: 10px;
}

.range-input {
  flex: 1;
  -webkit-appearance: none;
  height: 6px;
  background: #e2e8f0;
  border-radius: 3px;
  outline: none;
}

.range-input::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  background: #4299e1;
  border-radius: 50%;
  cursor: pointer;
}

.range-value {
  width: 50px;
  text-align: right;
  font-size: 0.85rem;
  color: #4a5568;
}

.color-picker-container {
  display: flex;
  align-items: center;
  gap: 10px;
}

.color-picker {
  width: 30px;
  height: 30px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  padding: 0;
  overflow: hidden;
}

.color-value {
  font-size: 0.85rem;
  color: #4a5568;
  flex: 1;
}

.select-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 0.85rem;
  background-color: white;
  color: #4a5568;
}

.button-group {
  display: flex;
  border-radius: 4px;
  overflow: hidden;
}

.group-button {
  flex: 1;
  padding: 6px 0;
  border: 1px solid #e2e8f0;
  background-color: white;
  color: #4a5568;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
}

.group-button:not(:last-child) {
  border-right: none;
}

.group-button.active {
  background-color: #4299e1;
  color: white;
  border-color: #4299e1;
}

.no-selection {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #a0aec0;
  font-size: 0.95rem;
  text-align: center;
  padding: 20px 0;
}

.no-selection-icon {
  font-size: 2.5rem;
  margin-bottom: 15px;
}
</style>
