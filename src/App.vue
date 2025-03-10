<script setup>
// 导入组件
import ComponentLibrary from './components/ComponentLibrary.vue';
import EditorCanvas from './components/EditorCanvas.vue';
import PropertyPanel from './components/PropertyPanel.vue';
import FunctionFlowEditor from './components/FunctionFlowEditor.vue';
</script>

<template>
  <div class="app-container">
    <!-- 顶部导航栏 -->
    <header class="header">
      <h1>零代码应用构建平台</h1>
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
          <EditorCanvas />
        </div>
      </main>
      
      <!-- 右侧属性和功能编辑区 -->
      <aside class="sidebar right-sidebar">
        <div class="right-tabs">
          <div class="tab-headers">
            <div class="tab-header active">属性设置</div>
            <div class="tab-header">功能流</div>
          </div>
          
          <div class="tab-content">
            <PropertyPanel />
          </div>
          
          <div class="tab-content" style="display: none;">
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
}

.header {
  background-color: #4a5568;
  color: white;
  padding: 10px 20px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  z-index: 10;
}

.header h1 {
  margin: 0;
  font-size: 1.5rem;
}

.main-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.sidebar {
  width: 250px;
  padding: 15px;
  overflow-y: auto;
  background-color: white;
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.1);
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
}

.canvas-container {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
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
}

.tab-header.active {
  color: #4299e1;
  border-bottom-color: #4299e1;
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

/* 添加标签页切换的JavaScript */
</style>

<script>
// 在组件挂载后添加标签页切换功能
document.addEventListener('DOMContentLoaded', () => {
  const tabHeaders = document.querySelectorAll('.tab-header');
  const tabContents = document.querySelectorAll('.tab-content');
  
  tabHeaders.forEach((header, index) => {
    header.addEventListener('click', () => {
      // 移除所有活动状态
      tabHeaders.forEach(h => h.classList.remove('active'));
      tabContents.forEach(c => c.style.display = 'none');
      
      // 激活当前标签
      header.classList.add('active');
      tabContents[index].style.display = 'block';
    });
  });
});
</script>
