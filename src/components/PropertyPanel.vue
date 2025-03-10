<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue';

// 当前选中的组件
const selectedComponent = ref(null);

// 组件属性分类
const propertyCategories = ref([
  {
    name: '基础属性',
    properties: [
      { key: 'width', label: '宽度', type: 'number', unit: 'px' },
      { key: 'height', label: '高度', type: 'number', unit: 'px' },
      { key: 'content', label: '内容', type: 'text' }
    ]
  },
  {
    name: '样式属性',
    properties: [
      { key: 'style.backgroundColor', label: '背景颜色', type: 'color' },
      { key: 'style.color', label: '文字颜色', type: 'color' },
      { key: 'style.fontSize', label: '字体大小', type: 'number', unit: 'px' },
      { key: 'style.borderRadius', label: '圆角', type: 'number', unit: 'px' },
      { key: 'style.border', label: '边框', type: 'text' },
      { key: 'style.padding', label: '内边距', type: 'text' },
      { key: 'style.textAlign', label: '文本对齐', type: 'select', 
        options: [
          { value: 'left', label: '左对齐' },
          { value: 'center', label: '居中' },
          { value: 'right', label: '右对齐' }
        ] 
      }
    ]
  }
]);

// 获取组件属性值
const getPropertyValue = (component, property) => {
  if (!component) return '';
  
  // 处理嵌套属性 (例如: 'style.backgroundColor')
  if (property.key.includes('.')) {
    const keys = property.key.split('.');
    let value = component;
    
    for (const key of keys) {
      if (value && value[key] !== undefined) {
        value = value[key];
      } else {
        return '';
      }
    }
    
    return value;
  }
  
  return component[property.key] || '';
};

// 设置组件属性值
const setPropertyValue = (component, property, value) => {
  if (!component) return;
  
  if (property.key.includes('.')) {
    const keys = property.key.split('.');
    let target = component;
    
    // 遍历直到倒数第二级
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      
      if (!target[key]) {
        target[key] = {};
      }
      
      target = target[key];
    }
    
    // 设置最后一级的值
    const lastKey = keys[keys.length - 1];
    target[lastKey] = value;
  } else {
    component[property.key] = value;
  }
};

// 处理组件属性变更
const handlePropertyChange = (property, event) => {
  if (!selectedComponent.value) return;
  
  let value = event.target.value;
  
  // 转换数字输入
  if (property.type === 'number') {
    value = parseInt(value, 10) || 0;
  }
  
  setPropertyValue(selectedComponent.value, property, value);
};

// 监听组件选择事件
const onComponentSelected = (event) => {
  selectedComponent.value = event.detail;
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
  <div class="property-panel">
    <div v-if="selectedComponent" class="properties-container">
      <div class="component-type">
        <span class="type-label">组件类型:</span>
        <span class="type-value">{{ selectedComponent.name }}</span>
      </div>
      
      <div v-for="category in propertyCategories" :key="category.name" class="property-category">
        <h3 class="category-title">{{ category.name }}</h3>
        
        <div class="property-list">
          <div v-for="property in category.properties" :key="property.key" class="property-item">
            <label class="property-label">{{ property.label }}</label>
            
            <div class="property-input">
              <!-- 根据属性类型渲染不同的输入控件 -->
              <input 
                v-if="property.type === 'text'" 
                type="text" 
                :value="getPropertyValue(selectedComponent, property)"
                @input="handlePropertyChange(property, $event)"
              />
              
              <input 
                v-else-if="property.type === 'number'" 
                type="number" 
                :value="getPropertyValue(selectedComponent, property)"
                @input="handlePropertyChange(property, $event)"
              />
              
              <input 
                v-else-if="property.type === 'color'" 
                type="color" 
                :value="getPropertyValue(selectedComponent, property)"
                @input="handlePropertyChange(property, $event)"
              />
              
              <select 
                v-else-if="property.type === 'select'" 
                :value="getPropertyValue(selectedComponent, property)"
                @change="handlePropertyChange(property, $event)"
              >
                <option 
                  v-for="option in property.options" 
                  :key="option.value" 
                  :value="option.value"
                >
                  {{ option.label }}
                </option>
              </select>
            </div>
            
            <span v-if="property.unit" class="property-unit">{{ property.unit }}</span>
          </div>
        </div>
      </div>
    </div>
    
    <div v-else class="no-selection">
      <p>请选择一个组件以编辑其属性</p>
    </div>
  </div>
</template>

<style scoped>
.property-panel {
  padding: 0 5px;
  height: 100%;
  overflow-y: auto;
}

.properties-container {
  padding: 10px 0;
}

.component-type {
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
}

.type-label {
  font-weight: 500;
  margin-right: 10px;
  color: #4a5568;
  font-size: 0.9rem;
}

.type-value {
  color: #2d3748;
  font-size: 0.9rem;
  font-weight: 600;
}

.property-category {
  margin-bottom: 20px;
}

.category-title {
  font-size: 1rem;
  margin: 10px 0;
  color: #4a5568;
  font-weight: 600;
}

.property-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.property-item {
  display: flex;
  align-items: center;
  font-size: 0.9rem;
}

.property-label {
  width: 80px;
  color: #4a5568;
  font-size: 0.85rem;
}

.property-input {
  flex: 1;
}

.property-input input,
.property-input select {
  width: 100%;
  padding: 4px 8px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 0.85rem;
}

.property-input input[type="color"] {
  padding: 0;
  height: 24px;
}

.property-unit {
  margin-left: 5px;
  color: #718096;
  font-size: 0.8rem;
}

.no-selection {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #a0aec0;
  font-size: 0.9rem;
  text-align: center;
  padding: 20px 0;
}
</style> 