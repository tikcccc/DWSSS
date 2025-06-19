# HyD Code 高光交互逻辑更新

## 🎯 更新概述

根据您的需求，我已经完全重新设计了HyD Code筛选下的高光交互逻辑，实现了复杂的优先级系统和智能的用户交互体验。

## ✨ 核心交互逻辑

### 🔍 HyD Code筛选的优先级系统

#### 新的筛选逻辑
**HyD Code筛选 + 高光构件的组合优先级**：
- ✅ **最高优先级**: 高光构件绑定的RISC和文件
- ✅ **次优先级**: HyD Code匹配的RISC和文件  
- ✅ **自动扩展**: 超出HyD Code范围但与高光构件绑定的条目也会显示

### 🎨 三种交互情况详解

#### 📍 情况1: 视图中无任何构件持续高亮
**特征**：
- 无持续蓝色高光构件
- 或者条目没被单击选中

**交互行为**：
- 🔵 **鼠标悬浮条目** → 对应构件显示**蓝色临时高光**
- 🔘 **鼠标单击条目** → 弹出确认框："是否退出HyD Code筛选？"
  - ✅ **确定** → 清除HyD Code筛选，按此条目重新筛选
  - ❌ **取消** → 保持当前筛选状态

#### 📍 情况2: 视图中有持续高亮的构件
**特征**：
- 存在蓝色持续高光构件

**交互行为**：
- 🟡 **鼠标悬浮条目** → 对应构件显示**黄色临时高光**（覆盖蓝色）
- 🔘 **鼠标单击BIM构件**：
  - **点击非高亮构件** → 变成蓝色持续高光，其他保持不变
  - **点击已高亮构件** → 取消蓝色持续高光，其他保持不变
- 🔘 **鼠标单击条目** → 同情况1的确认逻辑

#### 📍 情况3: HyD Code筛选条件变化
**特征**：
- 任何HyD Code字段被修改

**交互行为**：
- 🗑️ **立即清除** → 所有之前的持续高光和选中效果
- 🔄 **重新计算** → 仅显示当前HyD Code条件的结果
- 📋 **更新列表** → RISC和文件列表仅显示匹配项

## 🛠 技术实现要点

### 新的过滤逻辑

#### RISC表单过滤算法
```typescript
if (hasHydCodeFilter()) {
  if (finalHighlightSet.length > 0) {
    // HyD Code + 高亮构件：显示与高亮构件相关的条目
    filtered = filtered.filter(form => 
      form.objects.some(objId => finalHighlightSet.includes(objId)) ||
      form.objects.some(objId => components.some(obj => obj.id === objId))
    );
  } else {
    // 仅HyD Code：显示符合HyD Code且有有效对象的条目
    filtered = filtered.filter(form => 
      form.objects.some(objId => {
        const component = components.find(obj => obj.id === objId);
        return component && matchesHydCodeFilter(component.hydCode);
      })
    );
  }
}
```

#### 文件过滤算法
- 📋 **相同逻辑应用于文件列表**
- ✅ **保证一致性**：RISC和文件使用相同的过滤规则

### 智能交互处理

#### 条目点击逻辑优化
```typescript
// 检测HyD Code筛选状态
if (hasHydCodeFilter()) {
  const finalHighlightSet = getFinalHighlightSet();
  
  // 根据高光状态决定行为
  if (finalHighlightSet.length === 0 || (selectedRISC === null && selectedFile === null)) {
    // 情况1处理逻辑
  } else {
    // 情况2处理逻辑  
  }
}
```

#### 构件点击逻辑增强
```typescript
if (hasHydCodeFilter()) {
  const isComponentInManualSet = manualHighlightSet.includes(component.id);
  
  if (isComponentInManualSet) {
    // 取消蓝色持续高光
    setManualHighlightSet(prev => prev.filter(id => id !== component.id));
  } else {
    // 添加蓝色持续高光
    setManualHighlightSet(prev => [...prev, component.id]);
  }
}
```

### 高光颜色系统

#### 颜色优先级规则
1. 🟡 **黄色悬浮高光** - 最高优先级（存在蓝色持续高光时）
2. 🔵 **蓝色悬浮高光** - 高优先级（无持续高光时）
3. 🔵 **蓝色持续高光** - 中优先级（最终高亮集）
4. 🟢 **绿色购物车** - 低优先级（绑定模式）
5. ⚪ **白色默认** - 最低优先级

#### 视觉反馈增强
- **实时状态指示器**：右上角小圆点显示不同状态
- **智能提示信息**：底部显示当前高光集统计
- **颜色覆盖逻辑**：黄色临时高光覆盖蓝色持续高光

## 🎮 用户体验场景

### 场景1: 初次使用HyD Code筛选
1. **用户选择** `contractor: "CSG"` → 自动高亮相关构件
2. **筛选结果** → 显示所有CSG承包商的RISC表单和文件
3. **悬浮预览** → 鼠标悬浮条目显示蓝色构件高光
4. **手动扩展** → 点击非高光构件添加到选择中

### 场景2: 在HyD Code筛选基础上精细选择
1. **已有筛选** → `structure: "FOUNDATION"` 已激活
2. **手动选择** → 点击特定构件添加蓝色持续高光
3. **智能扩展** → 相关RISC和文件自动出现在列表中
4. **黄色预览** → 悬浮其他条目显示黄色临时高光

### 场景3: 退出筛选模式
1. **触发条件** → 点击任何RISC或文件条目
2. **确认提示** → 系统询问是否退出HyD Code筛选
3. **用户选择** → 确定后清除所有筛选，按条目重新筛选
4. **状态重置** → 视图恢复到条目相关的构件高光

## 🔄 状态管理优化

### 关键状态变量
- `filterHighlightSet` - HyD Code筛选产生的高光集
- `manualHighlightSet` - 手动点击产生的高光集  
- `hoveredObjects` - 鼠标悬浮产生的临时高光
- `selectedRISC/selectedFile` - 当前选中的条目

### 状态同步逻辑
- ✅ **HyD Code变更** → 立即清除手动高光集
- ✅ **条目点击** → 根据情况更新或清除筛选
- ✅ **构件点击** → 智能更新手动高光集
- ✅ **悬浮效果** → 不影响持久状态

## 🚀 性能优化

### 计算优化
- **最终高光集缓存**：`getFinalHighlightSet()` 结果复用
- **筛选结果缓存**：避免重复计算HyD Code匹配
- **事件防抖**：悬浮事件优化，减少不必要的重渲染

### 渲染优化
- **条件渲染**：仅在必要时更新组件状态
- **智能更新**：状态变化时精确更新相关组件
- **批量操作**：多个状态更新合并为单次渲染

## 📊 功能验证

### 测试场景验证
1. ✅ **HyD Code筛选** → 构件和列表正确筛选
2. ✅ **悬浮颜色切换** → 蓝色/黄色正确显示
3. ✅ **点击交互** → 确认框和状态切换正常
4. ✅ **状态清除** → HyD Code变更时正确重置
5. ✅ **优先级系统** → 高光构件绑定条目优先显示

## 🌐 应用访问

**本地开发地址**: http://localhost:3001

立即体验新的HyD Code高光交互系统！

## 📝 使用提示

### 最佳实践
1. **先选择HyD Code筛选** → 获得基础构件集合
2. **手动精选构件** → 点击特定构件添加到高光
3. **利用智能扩展** → 系统自动显示相关RISC和文件
4. **使用黄色预览** → 悬浮查看其他条目关联构件
5. **适时退出筛选** → 专注于特定条目的详细分析

### 注意事项
- 🔄 **HyD Code变更会清除所有手动选择**
- 🎯 **高光构件优先级最高，会扩展显示列表**
- 🟡 **黄色高光仅在有蓝色持续高光时出现**
- ✅ **确认框操作不可撤销，请谨慎选择** 