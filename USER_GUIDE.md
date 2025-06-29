# 🚀 DWSS-BIM Dashboard - 功能清单与操作指南

## 目录
1. [核心功能清单](#核心功能清单)
2. [主界面概览](#主界面概览)
3. [详细操作指南](#详细操作指南)
   - [筛选与搜索](#筛选与搜索)
   - [文件与RISC表单](#文件与risc表单)
   - [BIM模型交互](#bim模型交互)
   - [构件绑定流程](#构件绑定流程)
   - [文件管理](#文件管理)
   - [管理员功能](#管理员功能)
4. [常见问题 (FAQ)](#常见问题-faq)

---

## 核心功能清单

- **✅ BIM模型可视化:** 实时渲染、查看和操作3D模型。
- **✅ 多维度筛选:**
  - **HYD Code筛选:** 按项目、承建商、位置、结构等8个层级精确筛选构件。
  - **RISC表单筛选:** 按状态、创建者、日期范围筛选。
  - **文件列表筛选:** 按名称、类型、上传者、日期范围筛选。
- **✅ 数据联动高亮:**
  - 悬停或点击RISC表单/文件，模型中对应构件自动高亮。
  - 点击模型构件，对应文件/RISC表单自动高亮。
- **✅ 构件绑定系统:**
  - **绑定购物车:** 将文件和模型构件添加到购物车进行关联。
  - **可视化绑定:** 在模型中选择构件，将其与文件进行绑定。
  - **提交与版本管理:** 提交绑定，系统自动记录版本。
- **✅ 文件管理中心:**
  - **从ACC添加文件:**
    - 🗂️ **层级文件夹视图:** 类似Windows资源管理器的界面，轻松查找文件。
    - 👁️ **文件内容预览:** 上传前可预览文件内容。
    - 🏷️ **自动类型匹配:** 上传时自动匹配正确的文件类型。
  - **文件编辑:** 修改文件名、文件类型。
  - **文件删除:** 支持单个或批量删除。
- **✅ 模型构件树:**
  - 以层级列表形式展示所有模型构件。
  - 点击构件树项目，可在模型中快速定位和高亮。
- **✅ 右键快捷菜单:**
  - 在模型中右键点击构件，快速访问"文件管理"、"显示所有对象"等功能。
- **✅ 管理员面板:**
  - **用户管理:** 邀请新用户、管理用户角色。
  - **活动日志:** 追踪系统内的所有重要操作。

---

## 主界面概览

![主界面](https://i.imgur.com/your-main-interface-image.png)

1.  **左侧面板:** 包含HYD Code筛选器、RISC表单列表和文件列表。可折叠。
2.  **中间BIM浏览器:** 显示3D模型，是主要交互区域。
3.  **右侧面板:** 显示模型构件树和绑定购物车。可折叠。
4.  **顶部导航栏:** 项目选择、用户菜单和视图切换。

---

## 详细操作指南

### 筛选与搜索

**目标:** 快速找到您需要的构件、文件或RISC表单。

1.  **HYD Code筛选:**
    - 在左侧面板的"HYD Code筛选"区域，逐级选择`项目`、`承建商`、`位置`等。
    - 每选择一个层级，BIM模型和下方的列表都会实时过滤，仅显示匹配的构件。
    - 点击`清除`按钮可一键重置所有HYD Code筛选。
2.  **RISC表单/文件筛选:**
    - 在RISC表单或文件列表的顶部，您会看到多个筛选框（如状态、创建者、日期）。
    - 输入或选择筛选条件，列表将自动更新。
    - 使用顶部的`搜索框`可进行关键词搜索。

### 文件与RISC表单

1.  **高亮关联构件:**
    - 将鼠标悬停在任意文件或RISC表单上，模型中所有与之关联的构件将自动高亮显示。
2.  **查看详情:**
    - 双击文件或RISC表单，可进入详情页面，查看详细信息和历史版本。

### BIM模型交互

1.  **选择构件:**
    - **单击:** 在模型中单击一个构件以选中它。左侧的文件和RISC列表会自动高亮显示与此构件关联的项目。
    - **多选:** 按住`Ctrl`键并单击，可以选择多个构件。
2.  **右键菜单:**
    - 在模型中的构件上**右键单击**，将弹出一个快捷菜单。
    - **文件管理:** 查看并管理与此构件关联的所有文件。
    - **添加到绑定面板:** 将此构件快速添加到绑定购物车。
    - **显示所有对象:** 取消当前高亮，恢复显示所有模型构件。

### 构件绑定流程

**目标:** 将文件（如施工图、报告）与模型中的具体构件进行关联。

1.  **进入绑定模式:**
    - 在文件列表中，找到您想绑定的文件，点击其右侧的`绑定`图标。
    - 系统将进入"绑定模式"，绑定购物车会自动打开。
2.  **添加构件到购物车:**
    - 在模型中单击需要绑定的构件，构件将被自动添加到右侧的绑定购物车中。
    - 您也可以通过在构件上右键选择"添加到绑定面板"来添加。
3.  **提交绑定:**
    - 确认文件和构件都已正确添加到购物车后，点击购物车底部的`提交绑定`按钮。
    - 系统会保存这次关联，并记录一个新版本。

### 文件管理

**目标:** 管理与构件关联的文件，包括从ACC平台添加新文件。

1.  **打开文件管理:**
    - 在模型中右键单击构件，选择`文件管理`。
2.  **添加新文件 (从ACC):**
    - 在文件管理页面，点击`添加文件`按钮，会弹出"从ACC平台添加文件"的窗口。
    - **浏览文件夹:** 使用层级文件夹视图找到目标文件。点击文件夹前的`>`可展开/折叠。
    - **预览文件:** 点击文件右侧的`👁️`图标，可以预览文件内容，确认无误。
    - **选择文件:** 勾选文件名前的复选框以选择一个或多个文件。
    - **上传:** 点击`下一步` -> `开始上传`，文件将被添加到系统中并与当前构件关联。文件类型会根据其所在的ACC文件夹自动设置。
3.  **编辑与删除:**
    - 在文件列表中，使用`编辑`和`删除`图标来管理已有文件。

### 管理员功能

**仅管理员可见。**

1.  **用户管理:**
    - 从顶部用户菜单进入`管理后台` -> `用户管理`。
    - 在此页面可以邀请新用户，并设置他们的权限（如管理员、普通用户、只读用户）。
2.  **活动日志:**
    - 在管理后台的`活动日志`页面，可以查看系统中发生的所有关键操作记录，便于审计和追踪。

---

## 常见问题 (FAQ)

- **Q: 我如何清除所有筛选和选择？**
  - **A:** 在左侧面板的顶部，有"清除所有筛选和选择"的按钮，可以一键重置视图。

- **Q: 为什么我无法点击"提交绑定"按钮？**
  - **A:** 请确保您已经在绑定购物车中**至少添加了一个文件和一个构件**。两者都必须存在才能提交。

- **Q: 我添加的ACC文件类型不正确怎么办？**
  - **A:** 文件类型是根据其在ACC中的父文件夹自动映射的。如果需要修改，您可以在文件成功添加到系统后，在文件管理列表中使用`编辑`功能手动修改。 