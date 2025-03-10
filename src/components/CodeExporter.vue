<script setup>
import { ref, watch, computed, onMounted, onUnmounted } from 'vue';

// 接收画布引用作为prop
const props = defineProps({
  canvasRef: {
    type: Object,
    required: true
  }
});

// 生成的代码
const generatedCode = ref('');
// 显示导出弹窗
const showExportModal = ref(false);
// 实际使用的画布组件列表
const actualCanvasComponents = ref([]);

// 直接从DOM获取画布元素
const getCanvasElement = () => {
  // 通过querySelector获取画布元素
  return document.querySelector('.editor-canvas');
};

// 在DOM中查找所有画布上的组件
const findCanvasComponentsFromDOM = () => {
  try {
    // 首先尝试找到编辑区的容器
    const canvasContainer = document.querySelector(".canvas-container");
    if (!canvasContainer) {
      console.error("找不到画布容器(.canvas-container)");
      return [];
    }
    
    // 然后找到编辑器画布
    const editorCanvas = canvasContainer.querySelector(".editor-canvas");
    if (!editorCanvas) {
      console.error("找不到编辑器画布(.editor-canvas)");
      return [];
    }
    
    console.log("开始从DOM收集组件...");
    
    // 记录全局事件存储的组件ID列表
    if (window.__CANVAS_COMPONENTS_EVENTS__) {
      console.log("全局事件存储中的组件ID: ", Object.keys(window.__CANVAS_COMPONENTS_EVENTS__));
    }
    
    // 获取所有画布组件
    const componentElements = editorCanvas.querySelectorAll('.canvas-component');
    console.log(`在画布中找到 ${componentElements.length} 个组件元素`);
    
    if (componentElements.length === 0) {
      return [];
    }
    
    const components = Array.from(componentElements).map(el => {
      // 提取组件类型和ID
      let componentId = '';
      // 从类名中查找component-{id}格式的ID
      const idMatch = Array.from(el.classList).find(cls => /component-[\w-]+/.test(cls));
      if (idMatch) {
        componentId = idMatch.replace('component-', '');
      } else {
        // 尝试查找ID属性
        componentId = el.id || `unknown-${Date.now()}`;
      }
      
      let originalId = componentId;
      
      console.log(`从DOM找到组件: ${componentId}`);
      
      // 提取组件类型
      let componentType = el.getAttribute('data-component-type');
      if (!componentType) {
        // 尝试从类名判断组件类型
        if (el.querySelector('.component-button')) componentType = 'button';
        else if (el.querySelector('.component-text')) componentType = 'text';
        else if (el.querySelector('.component-input')) componentType = 'input';
        else if (el.querySelector('.component-image')) componentType = 'image';
        else if (el.querySelector('.component-toggle')) componentType = 'toggle';
        else {
          // 从ID中提取类型前缀
          const typeMatch = componentId.match(/^(button|text|input|image|toggle)-/);
          componentType = typeMatch ? typeMatch[1] : 'unknown';
        }
      }
      
      // 从样式中获取位置和尺寸
      const style = window.getComputedStyle(el);
      const position = {
        x: parseInt(style.left) || 0,
        y: parseInt(style.top) || 0
      };
      const size = {
        width: parseInt(style.width) || 100,
        height: parseInt(style.height) || 40
      };
      
      // 获取组件的properties
      const properties = {};
      // 从子元素中提取属性
      if (componentType === 'button') {
        const buttonEl = el.querySelector('.component-button');
        properties.text = buttonEl ? buttonEl.textContent : '按钮';
      } else if (componentType === 'text') {
        const textEl = el.querySelector('.component-text');
        properties.text = textEl ? textEl.textContent : '文本';
      } else if (componentType === 'input') {
        const inputEl = el.querySelector('input');
        properties.placeholder = inputEl ? inputEl.placeholder : '请输入';
      }
      
      // 提取一些通用样式属性
      ['color', 'backgroundColor', 'fontSize', 'fontWeight'].forEach(prop => {
        if (style[prop] && style[prop] !== 'rgba(0, 0, 0, 0)' && style[prop] !== 'normal') {
          properties[prop] = style[prop];
        }
      });
      
      // 查找事件数据 - 尝试多种可能的ID格式
      let events = [];
      if (window.__CANVAS_COMPONENTS_EVENTS__) {
        // 尝试原始ID
        if (window.__CANVAS_COMPONENTS_EVENTS__[originalId]) {
          events = window.__CANVAS_COMPONENTS_EVENTS__[originalId];
          console.log(`使用原始ID ${originalId} 找到事件数据`);
        } 
        // 尝试不同格式的ID
        else {
          // 尝试所有可能的ID格式
          const possibleIds = [
            originalId, 
            `component-${originalId}`,
            componentType ? `${componentType}-${originalId.split('-')[1] || ''}` : ''
          ].filter(Boolean);
          
          // 尝试每一种ID格式
          for (const possibleId of possibleIds) {
            if (window.__CANVAS_COMPONENTS_EVENTS__[possibleId]) {
              events = window.__CANVAS_COMPONENTS_EVENTS__[possibleId];
              console.log(`使用ID ${possibleId} 找到事件数据`);
              break;
            }
          }
          
          // 如果还是没找到，尝试模糊匹配
          if (events.length === 0 && componentType) {
            // 查找以组件类型开头的任何ID
            const matchingId = Object.keys(window.__CANVAS_COMPONENTS_EVENTS__).find(
              id => id.startsWith(componentType)
            );
            
            if (matchingId) {
              events = window.__CANVAS_COMPONENTS_EVENTS__[matchingId];
              console.log(`通过模糊匹配 ${matchingId} 找到事件数据`);
            }
          }
        }
      }
      
      if (events && events.length > 0) {
        console.log(`为组件 ${componentId} 找到 ${events.length} 个事件`);
      } else {
        console.log(`组件 ${componentId} 没有找到事件数据`);
      }
      
      return {
        id: originalId,
        type: componentType,
        position,
        size,
        properties,
        events: events || [],
      };
    });
    
    console.log(`从DOM收集到 ${components.length} 个组件`);
    return components;
  } catch (error) {
    console.error("收集组件时发生错误:", error);
    return [];
  }
};

// 监视画布引用变化
watch(() => props.canvasRef?.value, (newVal) => {
  console.log('画布引用已更新:', newVal);
}, { immediate: true, deep: true });

// 每次打开模态框时从画布引用更新组件列表
const updateCanvasComponents = () => {
  console.log('更新组件列表, 画布引用:', props.canvasRef?.value);
  
  if (props.canvasRef?.value?.canvasComponents) {
    try {
      // 直接获取当前画布组件引用
      const currentComponents = props.canvasRef.value.canvasComponents.value;
      console.log('当前画布组件:', currentComponents);
      
      // 创建组件列表的深拷贝
      actualCanvasComponents.value = JSON.parse(JSON.stringify(currentComponents || []));
      console.log('已更新画布组件列表:', actualCanvasComponents.value);
    } catch (error) {
      console.error('获取画布组件时出错:', error);
      
      // 尝试从DOM获取组件
      console.log('尝试从DOM获取组件...');
      const componentsFromDOM = findCanvasComponentsFromDOM();
      if (componentsFromDOM.length > 0) {
        actualCanvasComponents.value = componentsFromDOM;
        console.log('成功从DOM获取到组件:', componentsFromDOM);
      } else {
        actualCanvasComponents.value = [];
      }
    }
  } else {
    console.warn('无法获取画布组件列表, canvasRef:', props.canvasRef);
    
    // 尝试从DOM获取组件
    console.log('尝试从DOM获取组件...');
    const componentsFromDOM = findCanvasComponentsFromDOM();
    if (componentsFromDOM.length > 0) {
      actualCanvasComponents.value = componentsFromDOM;
      console.log('成功从DOM获取到组件:', componentsFromDOM);
    } else {
      actualCanvasComponents.value = [];
    }
  }
};

// 打开导出模态框
const openExportModal = () => {
  console.log('准备打开导出模态框...');
  
  // 清空之前的数据
  generatedCode.value = '';
  
  // 获取最新的画布组件数据
  try {
    // 从DOM中获取组件信息，确保最新状态
    const componentsFromDOM = findCanvasComponentsFromDOM();
    
    if (!componentsFromDOM || componentsFromDOM.length === 0) {
      console.error('未找到画布上的组件');
      alert('画布上没有组件，无法导出代码');
      return;
    }
    
    console.log(`从DOM获取到 ${componentsFromDOM.length} 个组件`);
    
    // 检查组件事件数据
    let totalEventCount = 0;
    for (const comp of componentsFromDOM) {
      if (comp.events && comp.events.length > 0) {
        totalEventCount += comp.events.length;
        console.log(`组件 ${comp.id} 有 ${comp.events.length} 个事件`);
      }
    }
    
    // 最终确认导出的组件数量和事件数量
    console.log(`【最终确认】导出组件数: ${componentsFromDOM.length}, 事件总数: ${totalEventCount}`);
    
    // 如果没有检测到事件但全局存储中有事件数据
    if (totalEventCount === 0 && window.__CANVAS_COMPONENTS_EVENTS__) {
      const globalEventIds = Object.keys(window.__CANVAS_COMPONENTS_EVENTS__);
      
      // 如果全局存储中有事件数据
      if (globalEventIds.length > 0) {
        console.log('发现从DOM中未检测到事件数据，但全局存储中有事件数据');
        console.log('全局事件存储中的组件ID:', globalEventIds);
        
        // 尝试将全局存储中的事件数据映射到组件
        if (componentsFromDOM.length === globalEventIds.length || globalEventIds.length === 1) {
          console.log('尝试从全局事件存储恢复事件数据...');
          
          // 如果只有一个组件和一个事件条目，直接使用
          if (componentsFromDOM.length === 1 && globalEventIds.length === 1) {
            componentsFromDOM[0].events = JSON.parse(JSON.stringify(
              window.__CANVAS_COMPONENTS_EVENTS__[globalEventIds[0]]
            ));
            console.log(`已将全局事件 ${globalEventIds[0]} 恢复到组件 ${componentsFromDOM[0].id}`);
          } 
          // 尝试基于类型匹配
          else {
            for (let i = 0; i < componentsFromDOM.length; i++) {
              const comp = componentsFromDOM[i];
              // 寻找匹配的事件数据
              for (const eventId of globalEventIds) {
                if (eventId.includes(comp.type) || comp.id.includes(eventId) || 
                    (comp.type && eventId.includes(comp.type))) {
                  comp.events = JSON.parse(JSON.stringify(
                    window.__CANVAS_COMPONENTS_EVENTS__[eventId]
                  ));
                  console.log(`已将全局事件 ${eventId} 恢复到组件 ${comp.id}`);
                  break;
                }
              }
            }
          }
          
          // 重新计算事件数量
          totalEventCount = 0;
          for (const comp of componentsFromDOM) {
            if (comp.events && comp.events.length > 0) {
              totalEventCount += comp.events.length;
            }
          }
          console.log(`恢复后事件总数: ${totalEventCount}`);
        }
      }
    }
    
    // 如果还是没有事件，直接手动查看一次全局存储，用于调试
    if (totalEventCount === 0 && window.__CANVAS_COMPONENTS_EVENTS__) {
      console.log('【全局事件存储内容】', JSON.stringify(window.__CANVAS_COMPONENTS_EVENTS__, null, 2));
    }
    
    // 生成代码
    generatedCode.value = generateCode(componentsFromDOM);
    
    // 如果没有代码生成，提示错误
    if (!generatedCode.value) {
      console.error('代码生成失败');
      alert('代码生成失败，请检查控制台错误');
      return;
    }
    
    // 显示模态框
    showExportModal.value = true;
    console.log('导出模态框已打开');
    
  } catch (error) {
    console.error('打开导出模态框时发生错误:', error);
    alert(`导出失败: ${error.message}`);
  }
};

// 关闭导出模态框
const closeExportModal = () => {
  showExportModal.value = false;
};

// 复制代码到剪贴板
const copyToClipboard = () => {
  navigator.clipboard.writeText(generatedCode.value)
    .then(() => {
      alert('代码已复制到剪贴板');
    })
    .catch(err => {
      console.error('复制失败:', err);
    });
};

// 添加一个实用函数，用于记录组件的事件信息
const logComponentEvents = () => {
  console.group('组件事件信息日志');
  console.log(`当前组件数量: ${actualCanvasComponents.value.length}`);
  
  let totalEvents = 0;
  let totalActions = 0;
  
  actualCanvasComponents.value.forEach((comp, index) => {
    const events = comp.events || [];
    let actionCount = 0;
    
    events.forEach(event => {
      if (event.actions) {
        actionCount += event.actions.length;
      }
    });
    
    totalEvents += events.length;
    totalActions += actionCount;
    
    console.log(`组件 ${index + 1} - ID: ${comp.id}, 类型: ${comp.type}`);
    console.log(`  - 事件数量: ${events.length}`);
    console.log(`  - 动作数量: ${actionCount}`);
    
    if (events.length > 0) {
      console.log('  - 事件详情:', JSON.stringify(events));
    }
  });
  
  console.log(`总事件数量: ${totalEvents}`);
  console.log(`总动作数量: ${totalActions}`);
  console.groupEnd();
  
  return { totalEvents, totalActions };
};

// 生成代码
const generateCode = (components) => {
  console.log('generateCode - 组件数量:', components.length);
  
  // 记录组件的事件信息
  const { totalEvents, totalActions } = logComponentEvents();
  console.log(`导出代码中包含 ${totalEvents} 个事件和 ${totalActions} 个动作`);
  
  if (!components || components.length === 0) {
    console.warn('画布上没有组件，将生成默认组件');
    // 如果没有组件，提供一个基础的Vue3组件模板
    return `<script setup>
// 这是由零代码平台生成的Vue3组件
import { ref } from 'vue';

// 这里可以添加你的响应式数据
const count = ref(0);

// 这里可以添加你的方法
const increment = () => {
  count.value++;
};
<\/script>

<template>
  <div class="exported-component">
    <h1>我的组件</h1>
    <p>这是一个基础的Vue3组件</p>
    <p>当前计数: ${'{{ count }}'}</p>
    <button @click="increment">增加</button>
  </div>
</template>

<style scoped>
.exported-component {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  font-family: Arial, sans-serif;
}

h1 {
  color: #4a5568;
  margin-bottom: 20px;
}

button {
  background-color: #4299e1;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  cursor: pointer;
  margin-top: 10px;
}

button:hover {
  background-color: #3182ce;
}
</style>`;
  }
  
  console.log('开始生成组件代码，组件数量:', components.length);
  
  // 生成模板代码
  const templateCode = generateTemplateCode(components);
  
  // 生成脚本代码
  const scriptCode = generateScriptCode(components);
  
  // 生成样式代码
  const styleCode = generateStyleCode(components);
  
  // 组合成最终代码
  return `<script setup>
// 这是由零代码平台生成的Vue3组件
${scriptCode}
<\/script>

<template>
${templateCode}
</template>

<style scoped>
${styleCode}
</style>`;
};

// 生成模板代码
const generateTemplateCode = (components) => {
  let template = '  <div class="exported-canvas">\n';
  
  components.forEach(component => {
    const componentClass = `component-${component.id}`;
    
    // 获取组件的事件处理器标记
    let eventHandlers = '';
    if (component.events && component.events.length > 0) {
      const uniqueEventTypes = new Set();
      component.events.forEach(event => {
        if (!uniqueEventTypes.has(event.type) && event.actions && event.actions.length > 0) {
          uniqueEventTypes.add(event.type);
          eventHandlers += ` @${event.type}="handleEvent('${component.id}', '${event.type}', $event)"`;
        }
      });
    }
    
    // 根据组件类型生成不同的模板
    switch (component.type) {
      case 'button':
        template += `    <button class="${componentClass}"${eventHandlers}>
      ${component.content}
    </button>\n`;
        break;
        
      case 'text':
        template += `    <div class="${componentClass}"${eventHandlers}>
      ${component.content}
    </div>\n`;
        break;
        
      case 'input':
        template += `    <input 
      class="${componentClass}" 
      type="text" 
      v-model="inputValues.${component.id}"
      placeholder="${component.content}"${eventHandlers}
    />\n`;
        break;
        
      case 'image':
        template += `    <img 
      class="${componentClass}"
      src="${component.content || 'https://via.placeholder.com/150'}"
      alt="Image"${eventHandlers}
    />\n`;
        break;
        
      case 'toggle':
        template += `    <label class="${componentClass} toggle-switch"${eventHandlers}>
      <input type="checkbox" v-model="toggleValues.${component.id}" />
      <span class="toggle-slider"></span>
      ${component.content ? `<span class="toggle-label">${component.content}</span>` : ''}
    </label>\n`;
        break;
        
      case 'container':
        template += `    <div class="${componentClass}"${eventHandlers}></div>\n`;
        break;
        
      default:
        template += `    <div class="${componentClass}"${eventHandlers}>
      ${component.name}
    </div>\n`;
    }
  });
  
  template += '  </div>';
  return template;
};

// 生成脚本代码
const generateScriptCode = (components) => {
  let script = 'import { ref } from "vue";\n\n';
  
  // 输入值存储
  script += 'const inputValues = ref({});\n\n';
  
  // Toggle组件状态存储
  script += 'const toggleValues = ref({});\n\n';
  
  // 初始化组件状态
  script += '// 初始化组件状态\n';
  
  const hasInputs = components.some(comp => comp.type === 'input');
  const hasToggles = components.some(comp => comp.type === 'toggle');
  
  if (hasInputs || hasToggles) {
    script += 'const initComponentStates = () => {\n';
    
    if (hasInputs) {
      components.forEach(comp => {
        if (comp.type === 'input') {
          script += `  inputValues.value['${comp.id}'] = '';\n`;
        }
      });
    }
    
    if (hasToggles) {
      components.forEach(comp => {
        if (comp.type === 'toggle') {
          script += `  toggleValues.value['${comp.id}'] = false;\n`;
        }
      });
    }
    
    script += '};\n\n';
    script += 'initComponentStates();\n\n';
  }
  
  // 统计事件信息
  let totalEventCount = 0;
  let totalActionCount = 0;
  components.forEach(comp => {
    if (comp.events && comp.events.length > 0) {
      totalEventCount += comp.events.length;
      comp.events.forEach(evt => {
        if (evt.actions && evt.actions.length > 0) {
          totalActionCount += evt.actions.length;
        }
      });
    }
  });
  console.log(`generateScriptCode: 统计到 ${totalEventCount} 个事件和 ${totalActionCount} 个动作`);
  
  // 生成事件处理函数
  script += 'const handleEvent = (componentId, eventType, event) => {\n';
  script += '  console.log(`组件 ${componentId} 的 ${eventType} 事件被触发`, event);\n\n';
  
  // 检查是否有组件定义了事件
  const hasEvents = components.some(component => 
    component.events && component.events.length > 0
  );
  
  if (hasEvents) {
    script += '  // 根据组件ID和事件类型执行相应的操作\n';
    script += '  switch(componentId) {\n';
    
    // 记录组件事件处理代码生成
    let generatedComponentCount = 0;
    
    components.forEach(component => {
      if (component.events && component.events.length > 0) {
        script += `    case '${component.id}':\n`;
        script += '      switch(eventType) {\n';
        
        // 为每种事件类型生成处理代码
        const eventTypes = new Set();
        let generatedEventTypes = 0;
        
        component.events.forEach(event => {
          if (!eventTypes.has(event.type)) {
            eventTypes.add(event.type);
            generatedEventTypes++;
            
            script += `        case '${event.type}':\n`;
            
            // 筛选该事件类型的所有事件
            const eventsOfType = component.events.filter(e => e.type === event.type);
            
            // 记录找到的动作数量
            let totalActionsForType = 0;
            eventsOfType.forEach(evt => {
              if (evt.actions && evt.actions.length > 0) {
                totalActionsForType += evt.actions.length;
              }
            });
            console.log(`为组件 ${component.id} 的 ${event.type} 事件生成代码, 共 ${totalActionsForType} 个动作`);
            
            // 生成动作代码
            let generatedActionsCount = 0;
            eventsOfType.forEach(event => {
              if (event.actions && event.actions.length > 0) {
                event.actions.forEach(action => {
                  script += generateActionCode(action, 10); // 缩进10个空格
                  generatedActionsCount++;
                });
              }
            });
            
            console.log(`为组件 ${component.id} 的 ${event.type} 事件生成了 ${generatedActionsCount} 个动作代码`);
            
            script += '          break;\n';
          }
        });
        
        console.log(`为组件 ${component.id} 生成了 ${generatedEventTypes} 个事件类型的处理代码`);
        
        script += '        default:\n';
        script += '          break;\n';
        script += '      }\n';
        script += '      break;\n';
        
        generatedComponentCount++;
      }
    });
    
    console.log(`总共为 ${generatedComponentCount} 个组件生成了事件处理代码`);
    
    script += '    default:\n';
    script += '      break;\n';
    script += '  }\n';
  } else {
    console.warn('没有找到任何组件定义了事件，只生成基本的事件处理函数');
  }
  
  script += '};\n';
  
  return script;
};

// 生成动作代码
const generateActionCode = (action, indentSpaces) => {
  const indent = ' '.repeat(indentSpaces);
  let code = '';
  
  switch (action.type) {
    case 'alert':
      const message = action.params?.['消息内容'] || '提示信息';
      code += `${indent}alert('${message}');\n`;
      break;
      
    case 'navigate':
      const url = action.params?.['链接地址'] || '#';
      code += `${indent}window.location.href = '${url}';\n`;
      break;
      
    case 'toggleVisible':
      const targetId = action.params?.['目标组件ID'] || '';
      if (targetId) {
        code += `${indent}// 切换组件可见性的代码\n`;
        code += `${indent}const element = document.querySelector('.component-${targetId}');\n`;
        code += `${indent}if (element) {\n`;
        code += `${indent}  element.style.display = element.style.display === 'none' ? '' : 'none';\n`;
        code += `${indent}}\n`;
      }
      break;
      
    case 'setValue':
      const targetComponentId = action.params?.['目标组件ID'] || '';
      const value = action.params?.['值'] || '';
      if (targetComponentId) {
        code += `${indent}// 设置组件值的代码\n`;
        code += `${indent}inputValues.value['${targetComponentId}'] = '${value}';\n`;
      }
      break;
      
    case 'toggleClass':
      const className = action.params?.['类名'] || 'active';
      code += `${indent}// 切换组件类名\n`;
      code += `${indent}event.currentTarget.classList.toggle('${className}');\n`;
      break;
      
    case 'callFunction':
      const funcName = action.params?.['函数名'] || '';
      const funcParams = action.params?.['参数'] || '';
      if (funcName) {
        code += `${indent}// 调用自定义函数\n`;
        if (funcParams) {
          code += `${indent}// 注意：以下代码需要确保 ${funcName} 函数已定义\n`;
          code += `${indent}if (typeof ${funcName} === 'function') {\n`;
          code += `${indent}  ${funcName}(${funcParams});\n`;
          code += `${indent}} else {\n`;
          code += `${indent}  console.warn('函数 ${funcName} 未定义');\n`;
          code += `${indent}}\n`;
        } else {
          code += `${indent}// 注意：以下代码需要确保 ${funcName} 函数已定义\n`;
          code += `${indent}if (typeof ${funcName} === 'function') {\n`;
          code += `${indent}  ${funcName}();\n`;
          code += `${indent}} else {\n`;
          code += `${indent}  console.warn('函数 ${funcName} 未定义');\n`;
          code += `${indent}}\n`;
        }
      }
      break;
      
    default:
      code += `${indent}// 未知动作类型: ${action.type}\n`;
      break;
  }
  
  return code;
};

// 生成样式代码
const generateStyleCode = (components) => {
  let style = '.exported-canvas {\n';
  style += '  position: relative;\n';
  style += '  width: 100%;\n';
  style += '  height: 100%;\n';
  style += '  min-height: 500px;\n';
  style += '}\n\n';
  
  // 为每个组件生成样式
  components.forEach(component => {
    const componentClass = `component-${component.id}`;
    
    style += `.${componentClass} {\n`;
    style += `  position: absolute;\n`;
    style += `  left: ${component.x}px;\n`;
    style += `  top: ${component.y}px;\n`;
    
    // 针对特定组件类型的特殊处理
    if (component.type === 'toggle') {
      style += `  display: inline-flex;\n`;
      style += `  align-items: center;\n`;
    } else {
      style += `  width: ${component.width}px;\n`;
      style += `  height: ${component.height}px;\n`;
    }
    
    // 添加自定义样式
    if (component.style) {
      Object.entries(component.style).forEach(([key, value]) => {
        // 驼峰转连字符
        const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
        style += `  ${cssKey}: ${value};\n`;
      });
    }
    
    style += '}\n\n';
  });
  
  // 添加一些特定组件类型的通用样式
  const hasImages = components.some(comp => comp.type === 'image');
  if (hasImages) {
    style += 'img {\n';
    style += '  object-fit: cover;\n';
    style += '  max-width: 100%;\n';
    style += '  max-height: 100%;\n';
    style += '}\n\n';
  }
  
  const hasToggles = components.some(comp => comp.type === 'toggle');
  if (hasToggles) {
    // 为toggle组件添加样式
    style += '.toggle-switch {\n';
    style += '  position: relative;\n';
    style += '  display: inline-flex;\n';
    style += '  align-items: center;\n';
    style += '}\n\n';
    
    style += '.toggle-switch input {\n';
    style += '  opacity: 0;\n';
    style += '  width: 0;\n';
    style += '  height: 0;\n';
    style += '}\n\n';
    
    style += '.toggle-slider {\n';
    style += '  position: relative;\n';
    style += '  display: inline-block;\n';
    style += '  width: 40px;\n';
    style += '  height: 20px;\n';
    style += '  background-color: #ccc;\n';
    style += '  border-radius: 20px;\n';
    style += '  transition: .4s;\n';
    style += '  cursor: pointer;\n';
    style += '}\n\n';
    
    style += '.toggle-slider:before {\n';
    style += '  position: absolute;\n';
    style += '  content: "";\n';
    style += '  height: 16px;\n';
    style += '  width: 16px;\n';
    style += '  left: 2px;\n';
    style += '  bottom: 2px;\n';
    style += '  background-color: white;\n';
    style += '  border-radius: 50%;\n';
    style += '  transition: .4s;\n';
    style += '}\n\n';
    
    style += 'input:checked + .toggle-slider {\n';
    style += '  background-color: #4299e1;\n';
    style += '}\n\n';
    
    style += 'input:checked + .toggle-slider:before {\n';
    style += '  transform: translateX(20px);\n';
    style += '}\n\n';
    
    style += '.toggle-label {\n';
    style += '  margin-left: 8px;\n';
    style += '  font-size: 14px;\n';
    style += '}\n\n';
  }
  
  return style;
};

// 下载生成的代码
const downloadCode = () => {
  const blob = new Blob([generatedCode.value], {type: 'text/plain'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'ExportedComponent.vue';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

// 组件挂载后进行初始化
onMounted(() => {
  console.log('CodeExporter组件已挂载');
  console.log('初始canvasRef:', props.canvasRef?.value);
  
  // 设置一个MutationObserver来监视DOM变化
  const canvasObserver = new MutationObserver((mutations) => {
    // 如果DOM发生变化，更新全局组件事件存储
    mutations.forEach(mutation => {
      if (mutation.type === 'childList' || mutation.type === 'attributes') {
        console.log('检测到画布DOM变化，准备更新事件存储');
        
        // 延迟执行，等待其他变更完成
        setTimeout(() => {
          // 获取所有组件
          const components = findCanvasComponentsFromDOM();
          
          // 更新事件全局存储，保留现有事件
          if (!window.__CANVAS_COMPONENTS_EVENTS__) {
            window.__CANVAS_COMPONENTS_EVENTS__ = {};
          }
          
          // 现有事件数据不会被覆盖
          console.log(`找到 ${components.length} 个组件`);
        }, 100);
      }
    });
  });
  
  // 查找画布元素并开始观察
  setTimeout(() => {
    const editorCanvas = document.querySelector('.editor-canvas');
    if (editorCanvas) {
      console.log('开始观察画布DOM变化');
      canvasObserver.observe(editorCanvas, {
        childList: true,
        subtree: true,
        attributes: true
      });
    }
  }, 500);
  
  // 监听组件事件更新事件
  document.addEventListener('component-events-updated', (event) => {
    const { componentId, events } = event.detail;
    
    // 如果本地已经有组件数据，找到对应组件更新事件
    if (actualCanvasComponents.value && actualCanvasComponents.value.length > 0) {
      const componentIndex = actualCanvasComponents.value.findIndex(comp => comp.id === componentId);
      
      if (componentIndex !== -1) {
        // 更新组件的事件数据
        actualCanvasComponents.value[componentIndex].events = JSON.parse(JSON.stringify(events || []));
        console.log(`CodeExporter - 已更新组件 ${componentId} 的事件数据`);
      }
    }
  });
  
  // 定期检查组件事件数据，确保我们有最新的数据
  const checkInterval = setInterval(() => {
    if (window.__CANVAS_COMPONENTS_EVENTS__) {
      const eventKeys = Object.keys(window.__CANVAS_COMPONENTS_EVENTS__);
      if (eventKeys.length > 0) {
        console.log(`事件存储中有 ${eventKeys.length} 个组件的事件数据`);
      }
    }
  }, 5000);
  
  // 组件卸载时清理
  onUnmounted(() => {
    canvasObserver.disconnect();
    clearInterval(checkInterval);
  });
});
</script>

<template>
  <div class="exporter">
    <button class="export-btn" @click="openExportModal">导出代码</button>
    
    <!-- 导出模态框 -->
    <div v-if="showExportModal" class="export-modal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>导出 Vue 组件代码</h3>
          <button class="close-btn" @click="closeExportModal">×</button>
        </div>
        
        <div class="modal-body">
          <pre class="code-preview">{{ generatedCode }}</pre>
        </div>
        
        <div class="modal-footer">
          <button class="copy-btn" @click="copyToClipboard">复制代码</button>
          <button class="download-btn" @click="downloadCode">下载</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.exporter {
  margin-top: 10px;
}

.export-btn {
  background-color: #4299e1;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 5px 10px;
  font-size: 0.9rem;
  cursor: pointer;
  width: 100%;
}

.export-btn:hover {
  background-color: #3182ce;
}

.export-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10000; /* 确保模态框在最上层 */
}

.modal-content {
  background-color: white;
  border-radius: 6px;
  width: 80%;
  max-width: 800px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  position: relative; /* 确保内容相对于模态框定位 */
  z-index: 10001; /* 确保内容在模态框上层 */
}

.modal-header {
  padding: 15px;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  color: #2d3748;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #a0aec0;
  cursor: pointer;
}

.close-btn:hover {
  color: #e53e3e;
}

.modal-body {
  padding: 15px;
  overflow-y: auto;
  flex: 1;
}

.code-preview {
  background-color: #f7fafc;
  padding: 15px;
  border-radius: 4px;
  white-space: pre-wrap;
  font-family: monospace;
  font-size: 0.85rem;
  color: #4a5568;
  overflow-x: auto;
  margin: 0;
}

.modal-footer {
  padding: 15px;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.copy-btn, .download-btn {
  padding: 8px 15px;
  border-radius: 4px;
  font-size: 0.9rem;
  cursor: pointer;
}

.copy-btn {
  background-color: #f7fafc;
  color: #4a5568;
  border: 1px solid #e2e8f0;
}

.copy-btn:hover {
  background-color: #edf2f7;
}

.download-btn {
  background-color: #4299e1;
  color: white;
  border: none;
}

.download-btn:hover {
  background-color: #3182ce;
}
</style> 