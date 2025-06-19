// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { ChevronDown, Search, Filter, Plus, Eye, Edit, Trash2, Settings, Download, Upload, Link, Users, Activity, Home, Menu, X, CheckCircle, AlertCircle, Clock, FileText, Folder, Calendar, GitCompare, Info, ArrowLeft, ChevronRight, ArrowRight, List, Layers, ChevronsLeft, ChevronsRight, ShoppingCart, Target, Mail, History } from 'lucide-react';

// 定义接口
interface HydCode {
  project: string;
  contractor: string;
  location: string;
  structure: string;
  space: string;
  grid: string;
  cat: string;
}

interface ObjectGroup {
  id: string;
  name: string;
  version: string;
  components: string[];
  hydCode: HydCode;
  properties: {
    position: string;
    material: string;
    totalVolume?: string;
    totalHeight?: string;
    totalLength?: string;
    status: string;
  };
}

interface RiscForm {
  id: string;
  requestNo: string;
  updateDate: string;
  status: string;
  bindingStatus: 'history' | 'deleted' | 'current';
  linkedToCurrent: boolean;
  objects: string[];
  createdBy: string;
  hydCode: HydCode;
  changes?: string[];
}

interface FileItem {
  id: number;
  name: string;
  uploadDate: string;
  updateDate: string;
  type: string;
  bindingStatus: 'history' | 'deleted' | 'current';
  uploadedBy: string;
  linkedToCurrent: boolean;
  objects: string[];
  hydCode: HydCode;
  changes?: string[];
}

interface CompareData {
  item: RiscForm | FileItem;
  type: string;
  currentVersion: string;
  targetVersion: string;
}

interface ModelVersion {
  value: string;
  label: string;
  date: string;
}

interface ActivityLog {
  id: number;
  timestamp: string;
  user: string;
  role: string;
  action: string;
  target: string;
  targetDetail: string;
  details: string;
  ip: string;
}

interface BindingCart {
  files: FileItem[];
  objects: ObjectGroup[];
  hasHistoricalObjects: boolean;
}

const DWSSBIMDashboard = () => {
  const [currentUser, setCurrentUser] = useState('Administrator');
  const [selectedProject, setSelectedProject] = useState('HY202404');
  const [isBindingMode, setIsBindingMode] = useState(false);
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedRISC, setSelectedRISC] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedObjectGroup, setSelectedObjectGroup] = useState(null);
  const [viewMode, setViewMode] = useState('current');
  const [selectedModelVersion, setSelectedModelVersion] = useState('current');
  
  // 高亮系统 - 重新设计
  const [filterHighlightSet, setFilterHighlightSet] = useState([]); // 筛选高亮集
  const [manualHighlightSet, setManualHighlightSet] = useState([]); // 手动高亮集
  // 最终高亮集通过计算得出：filterHighlightSet ∪ manualHighlightSet
  
  const [hoveredObjects, setHoveredObjects] = useState([]);
  const [hoveredItem, setHoveredItem] = useState(null);
  const [hoveredItemType, setHoveredItemType] = useState(null);
  
  // 添加缺失的状态变量
  const [bindingCart, setBindingCart] = useState({ files: [], objects: [], hasHistoricalObjects: false });
  const [showBindingCart, setShowBindingCart] = useState(false);
  const [detailItem, setDetailItem] = useState(null);
  
  const [showQuickCompare, setShowQuickCompare] = useState(false);
  const [compareData, setCompareData] = useState(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showAdminInviteModal, setShowAdminInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('');
  
  // 新增管理员页面状态
  const [adminSubView, setAdminSubView] = useState('users'); // 'users' | 'logs'
  
  // 日期选择器状态
  const [showRiscDatePicker, setShowRiscDatePicker] = useState(false);
  const [showFileDatePicker, setShowFileDatePicker] = useState(false);
  
  // 筛选条件
  const [hydCodeFilter, setHydCodeFilter] = useState({
    project: 'HY202404',
    contractor: '',
    location: '',
    structure: '',
    space: '',
    grid: '',
    cat: ''
  });
  
  const [riscFilters, setRiscFilters] = useState({
    status: '',
    startDate: '',
    endDate: '',
    searchText: ''
  });
  
  const [fileFilters, setFileFilters] = useState({
    type: '',
    startDate: '',
    endDate: '',
    searchText: '',
    showMyFiles: false
  });

  // 模型版本列表
  const modelVersions: ModelVersion[] = [
    { value: 'current', label: '当前版本 (Latest)', date: '2025-03-08' },
    { value: 'v2.5', label: 'Version 2.5', date: '2025-02-20' },
    { value: 'v2.0', label: 'Version 2.0', date: '2025-01-15' },
    { value: 'v1.8', label: 'Version 1.8', date: '2024-12-10' },
    { value: 'v1.5', label: 'Version 1.5', date: '2024-11-05' }
  ];

  // 模拟数据 - 单个构件（替换对象组）
  const [components, setComponents] = useState([
    // Foundation components
    { 
      id: 'F-A-001', 
      name: 'Foundation Block A1', 
      version: 'current', 
      objectGroup: 'OBJ-GROUP-001',
      hydCode: { project: 'HY202404', contractor: 'CSG', location: 'SITE-A', structure: 'FOUNDATION', space: 'WC_B8', grid: 'ST_FD', cat: 'CONCRETE' },
      properties: { 
        position: 'Zone A Foundation Area Block 1', 
        material: 'C40混凝土', 
        volume: '15.2m³',
        status: 'current'
      }
    },
    { 
      id: 'F-A-002', 
      name: 'Foundation Block A2', 
      version: 'current', 
      objectGroup: 'OBJ-GROUP-001',
      hydCode: { project: 'HY202404', contractor: 'CSG', location: 'SITE-A', structure: 'FOUNDATION', space: 'WC_B8', grid: 'ST_FD', cat: 'CONCRETE' },
      properties: { 
        position: 'Zone A Foundation Area Block 2', 
        material: 'C40混凝土', 
        volume: '15.2m³',
        status: 'current'
      }
    },
    { 
      id: 'F-A-003', 
      name: 'Foundation Block A3', 
      version: 'current', 
      objectGroup: 'OBJ-GROUP-001',
      hydCode: { project: 'HY202404', contractor: 'CSG', location: 'SITE-A', structure: 'FOUNDATION', space: 'WC_B8', grid: 'ST_FD', cat: 'CONCRETE' },
      properties: { 
        position: 'Zone A Foundation Area Block 3', 
        material: 'C40混凝土', 
        volume: '15.2m³',
        status: 'current'
      }
    },
    // Column components  
    { 
      id: 'COL-B-012-BASE', 
      name: 'Column B12 Base', 
      version: 'current', 
      objectGroup: 'OBJ-GROUP-002',
      hydCode: { project: 'HY202404', contractor: 'CSG', location: 'SITE-A', structure: 'FRAME', space: 'WC_B8', grid: 'ST_FD', cat: 'CONCRETE' },
      properties: { 
        position: 'Grid B-12 Column Base', 
        material: 'C45混凝土', 
        height: '1.0m',
        status: 'current'
      }
    },
    { 
      id: 'COL-B-012-MAIN', 
      name: 'Column B12 Main', 
      version: 'current', 
      objectGroup: 'OBJ-GROUP-002',
      hydCode: { project: 'HY202404', contractor: 'CSG', location: 'SITE-A', structure: 'FRAME', space: 'WC_B8', grid: 'ST_FD', cat: 'CONCRETE' },
      properties: { 
        position: 'Grid B-12 Column Main', 
        material: 'C45混凝土', 
        height: '2.0m',
        status: 'current'
      }
    },
    { 
      id: 'COL-B-012-CAP', 
      name: 'Column B12 Cap', 
      version: 'current', 
      objectGroup: 'OBJ-GROUP-002',
      hydCode: { project: 'HY202404', contractor: 'CSG', location: 'SITE-A', structure: 'FRAME', space: 'WC_B8', grid: 'ST_FD', cat: 'CONCRETE' },
      properties: { 
        position: 'Grid B-12 Column Cap', 
        material: 'C45混凝土', 
        height: '0.5m',
        status: 'current'
      }
    },
    // Beam components
    { 
      id: 'BEAM-C-025-01', 
      name: 'Beam C25-1', 
      version: 'current', 
      objectGroup: 'OBJ-GROUP-003',
      hydCode: { project: 'HY202404', contractor: 'CSG', location: 'SITE-A', structure: 'FRAME', space: 'WC_B9', grid: 'ST_FE', cat: 'CONCRETE' },
      properties: { 
        position: 'Level 3 Beam Network Segment 1', 
        material: 'C40混凝土', 
        length: '5.1m',
        status: 'current'
      }
    },
    { 
      id: 'BEAM-C-025-02', 
      name: 'Beam C25-2', 
      version: 'current', 
      objectGroup: 'OBJ-GROUP-003',
      hydCode: { project: 'HY202404', contractor: 'CSG', location: 'SITE-A', structure: 'FRAME', space: 'WC_B9', grid: 'ST_FE', cat: 'CONCRETE' },
      properties: { 
        position: 'Level 3 Beam Network Segment 2', 
        material: 'C40混凝土', 
        length: '5.1m',
        status: 'current'
      }
    },
    { 
      id: 'BEAM-C-025-03', 
      name: 'Beam C25-3', 
      version: 'current', 
      objectGroup: 'OBJ-GROUP-003',
      hydCode: { project: 'HY202404', contractor: 'CSG', location: 'SITE-A', structure: 'FRAME', space: 'WC_B9', grid: 'ST_FE', cat: 'CONCRETE' },
      properties: { 
        position: 'Level 3 Beam Network Segment 3', 
        material: 'C40混凝土', 
        length: '5.0m',
        status: 'current'
      }
    },
    // Historical components
    { 
      id: 'F-A-001-OLD', 
      name: 'Foundation Block A1 (Old)', 
      version: 'v1.8', 
      objectGroup: 'OBJ-GROUP-001-OLD',
      hydCode: { project: 'HY202404', contractor: 'CSG', location: 'SITE-A', structure: 'FOUNDATION', space: 'WC_B8', grid: 'ST_FD', cat: 'CONCRETE' },
      properties: { 
        position: 'Zone A Foundation Area Block 1 (Old)', 
        material: 'C35混凝土', 
        volume: '19.1m³',
        status: 'history'
      }
    },
    { 
      id: 'F-A-002-OLD', 
      name: 'Foundation Block A2 (Old)', 
      version: 'v1.8', 
      objectGroup: 'OBJ-GROUP-001-OLD',
      hydCode: { project: 'HY202404', contractor: 'CSG', location: 'SITE-A', structure: 'FOUNDATION', space: 'WC_B8', grid: 'ST_FD', cat: 'CONCRETE' },
      properties: { 
        position: 'Zone A Foundation Area Block 2 (Old)', 
        material: 'C35混凝土', 
        volume: '19.1m³',
        status: 'history'
      }
    }
  ]);

  const [riscForms, setRiscForms] = useState<RiscForm[]>([
    { 
      id: 'TRN0001-RISC-TRC-B-5-00002', 
      requestNo: 'TRN0001-RISC-TRC-B-5-00002', 
      updateDate: '2025-03-08', 
      status: 'Approved', 
      bindingStatus: 'current', 
      linkedToCurrent: true, 
      objects: ['F-A-001', 'F-A-002', 'COL-B-012-BASE', 'COL-B-012-MAIN'], 
      createdBy: 'John Doe',
      hydCode: { project: 'HY202404', contractor: 'CSG', location: 'SITE-A', structure: 'FOUNDATION', space: 'WC_B8', grid: 'ST_FD', cat: 'CONCRETE' }
    },
    { 
      id: 'RN0001-RISC-TRC-CS-02000A', 
      requestNo: 'RN0001-RISC-TRC-CS-02000A', 
      updateDate: '2025-02-20', 
      status: 'Approved', 
      bindingStatus: 'current', 
      linkedToCurrent: true, 
      objects: ['COL-B-012-MAIN', 'COL-B-012-CAP'], 
      createdBy: 'Jane Smith',
      hydCode: { project: 'HY202404', contractor: 'CSG', location: 'SITE-A', structure: 'FRAME', space: 'WC_B8', grid: 'ST_FD', cat: 'CONCRETE' }
    },
    { 
      id: 'RN0001-RISC-TRC-CS-02001', 
      requestNo: 'RN0001-RISC-TRC-CS-02001', 
      updateDate: '2025-02-20', 
      status: 'Submitted', 
      bindingStatus: 'history', 
      linkedToCurrent: false, 
      objects: ['F-A-001-OLD', 'F-A-002-OLD'], 
      createdBy: 'Mike Johnson', 
      changes: ['构件位置调整', '材料参数更新'],
      hydCode: { project: 'HY202404', contractor: 'CSG', location: 'SITE-A', structure: 'FOUNDATION', space: 'WC_B8', grid: 'ST_FD', cat: 'CONCRETE' }
    },
    { 
      id: 'RN0001-RISC-TRC-CS-02003', 
      requestNo: 'RN0001-RISC-TRC-CS-02003', 
      updateDate: '2024-12-20', 
      status: 'Rejected', 
      bindingStatus: 'deleted', 
      linkedToCurrent: false, 
      objects: ['OBJ-GROUP-004-DELETED'], 
      createdBy: 'Tom Chen', 
      changes: ['此构件已在新版本删除'],
      hydCode: { project: 'HY202404', contractor: 'CSG', location: 'SITE-A', structure: 'FRAME', space: 'WC_B9', grid: 'ST_FE', cat: 'CONCRETE' }
    }
  ]);

  const [files, setFiles] = useState<FileItem[]>([
    { 
      id: 1, 
      name: '0479 Method Statement_MS073 for Construction of Footing of Walkway Covers at Rock Hill Street.pdf', 
      uploadDate: '2024-11-08', 
      updateDate: '2024-12-15', 
      type: 'Method Statement', 
      bindingStatus: 'current', 
      uploadedBy: 'John Doe', 
      linkedToCurrent: true, 
      objects: ['F-A-001', 'F-A-002', 'COL-B-012-BASE'],
      hydCode: { project: 'HY202404', contractor: 'CSG', location: 'SITE-A', structure: 'FOUNDATION', space: 'WC_B8', grid: 'ST_FD', cat: 'CONCRETE' }
    },
    { 
      id: 2, 
      name: '0487 Method Statement_MS019 for Lifting Operation of Footbridge at Tsui Ping Road.pdf', 
      uploadDate: '2024-10-25', 
      updateDate: '2024-10-25', 
      type: 'Method Statement', 
      bindingStatus: 'current', 
      uploadedBy: 'Jane Smith', 
      linkedToCurrent: true, 
      objects: ['BEAM-C-025-01', 'BEAM-C-025-02', 'BEAM-C-025-03'],
      hydCode: { project: 'HY202404', contractor: 'CSG', location: 'SITE-A', structure: 'FRAME', space: 'WC_B9', grid: 'ST_FE', cat: 'CONCRETE' }
    },
    { 
      id: 3, 
      name: '0535 Material Submission of Particulars of Bond Breaker Tape.pdf', 
      uploadDate: '2024-09-15', 
      updateDate: '2024-09-20', 
      type: 'Material Submission', 
      bindingStatus: 'deleted', 
      uploadedBy: 'Mike Johnson', 
      linkedToCurrent: false, 
      objects: ['OBJ-GROUP-006-DELETED'], 
      changes: ['此构件已在新版本删除'],
      hydCode: { project: 'HY202404', contractor: 'CSG', location: 'SITE-A', structure: 'FOUNDATION', space: 'WC_B8', grid: 'ST_FD', cat: 'CONCRETE' }
    },
    { 
      id: 4, 
      name: '0521 Historical Working Drawing v1.pdf', 
      uploadDate: '2024-08-20', 
      updateDate: '2024-08-25', 
      type: 'Working Drawings', 
      bindingStatus: 'history', 
      uploadedBy: 'Sarah Wilson', 
      linkedToCurrent: false, 
      objects: ['F-A-001-OLD', 'F-A-002-OLD'], 
      changes: ['构件位置调整', '几何形状优化'],
      hydCode: { project: 'HY202404', contractor: 'CSG', location: 'SITE-A', structure: 'FOUNDATION', space: 'WC_B8', grid: 'ST_FD', cat: 'CONCRETE' }
    },
    { 
      id: 5, 
      name: '0498 Test Result for Foundation Concrete.pdf', 
      uploadDate: '2024-10-12', 
      updateDate: '2024-10-15', 
      type: 'Test Result', 
      bindingStatus: 'current', 
      uploadedBy: 'Administrator', 
      linkedToCurrent: true, 
      objects: ['F-A-001', 'F-A-003'],
      hydCode: { project: 'HY202404', contractor: 'CSG', location: 'SITE-A', structure: 'FOUNDATION', space: 'WC_B8', grid: 'ST_FD', cat: 'CONCRETE' }
    },
    { 
      id: 6, 
      name: '0512 Quality Control Report QC045.pdf', 
      uploadDate: '2024-11-15', 
      updateDate: '2024-11-20', 
      type: 'Test Result', 
      bindingStatus: 'current', 
      uploadedBy: 'Administrator', 
      linkedToCurrent: true, 
      objects: ['COL-B-012-BASE', 'COL-B-012-MAIN'],
      hydCode: { project: 'HY202404', contractor: 'CSG', location: 'SITE-A', structure: 'FRAME', space: 'WC_B8', grid: 'ST_FD', cat: 'CONCRETE' }
    }
  ]);

  // 管理员后台用户数据
  const [adminUsers, setAdminUsers] = useState([
    { id: 1, name: 'John Doe', email: 'john.doe@example.com', role: 'Authorized User', status: 'Active', lastLogin: '2025-03-08 09:15' },
    { id: 2, name: 'Jane Smith', email: 'jane.smith@example.com', role: 'Authorized User', status: 'Active', lastLogin: '2025-03-08 08:30' },
    { id: 3, name: 'Mike Johnson', email: 'mike.johnson@example.com', role: 'View-only User', status: 'Active', lastLogin: '2025-03-07 16:45' },
    { id: 4, name: 'Sarah Wilson', email: 'sarah.wilson@example.com', role: 'Authorized User', status: 'Inactive', lastLogin: '2025-03-05 14:20' },
    { id: 5, name: 'Tom Chen', email: 'tom.chen@example.com', role: 'Admin', status: 'Active', lastLogin: '2025-03-08 10:00' }
  ]);

  // 活动日志数据
  const [activityLogs, setActivityLogs] = useState([
    { id: 1, timestamp: '2025-03-08 14:30:15', user: 'Administrator', role: 'Admin', action: 'FILE_BIND_SUBMIT', target: 'File', targetDetail: '施工图.pdf', details: '将文件 "施工图.pdf" 与构件 "OBJ-GROUP-001, OBJ-GROUP-002" 进行了关联', ip: '192.168.1.100' },
    { id: 2, timestamp: '2025-03-08 13:15:22', user: 'John Doe', role: 'Authorized User', action: 'RISC_CREATE_REQUEST', target: 'RISC Form', targetDetail: 'TRN0001-RISC-TRC-B-5-00003', details: '创建了新的RISC表单 "TRN0001-RISC-TRC-B-5-00003"', ip: '192.168.1.101' },
    { id: 3, timestamp: '2025-03-08 12:45:33', user: 'Jane Smith', role: 'Authorized User', action: 'FILE_UPLOAD', target: 'File', targetDetail: '材料测试报告.pdf', details: '上传了文件 "材料测试报告.pdf"', ip: '192.168.1.102' },
    { id: 4, timestamp: '2025-03-08 11:20:18', user: 'Mike Johnson', role: 'View-only User', action: 'LOGIN_SUCCESS', target: 'User', targetDetail: 'mike.johnson@example.com', details: '用户成功登录系统', ip: '192.168.1.103' },
    { id: 5, timestamp: '2025-03-08 10:55:44', user: 'Administrator', role: 'Admin', action: 'USER_ROLE_CHANGE', target: 'User', targetDetail: 'sarah.wilson@example.com', details: '将用户 "Sarah Wilson" 的角色从 "View-only User" 变更为 "Authorized User"', ip: '192.168.1.100' }
  ]);

  // 用户搜索状态
  const [userSearchText, setUserSearchText] = useState('');
  
  // 活动日志筛选状态
  const [logFilters, setLogFilters] = useState({
    user: '',
    role: '',
    startDate: '',
    endDate: '',
    searchText: ''
  });

  // HyD Code筛选选项
  const hydCodeOptions = {
    project: ['HY202404', 'HY202405'],
    contractor: ['CSG', 'AECOM', 'HKJV'],
    location: ['SITE-A', 'SITE-B', 'SITE-C'],
    structure: ['FOUNDATION', 'FRAME', 'ROOF', 'WALL'],
    space: ['WC_B8', 'WC_B9', 'WC_C1', 'WC_C2'],
    grid: ['ST_FD', 'ST_FE', 'ST_GD', 'ST_GE'],
    cat: ['CONCRETE', 'STEEL', 'TIMBER', 'COMPOSITE']
  };

  // 检查用户是否有绑定权限
  const hasBindingPermission = () => {
    return currentUser === 'Administrator' || currentUser === 'John Doe' || currentUser === 'Jane Smith';
  };

  // 检查用户是否为管理员
  const isAdmin = () => {
    return currentUser === 'Administrator';
  };

  // 检查用户是否为普通用户（View-only User）
  const isViewOnlyUser = () => {
    return currentUser === 'Mike Johnson';
  };

  // 计算最终高亮集 (Final Highlight Set = Filter Highlight Set ∪ Manual Highlight Set)
  const getFinalHighlightSet = () => {
    const finalSet = [...new Set([...filterHighlightSet, ...manualHighlightSet])];
    return finalSet;
  };

  // 检查是否有HyD Code筛选激活
  const hasHydCodeFilter = () => {
    return Object.keys(hydCodeFilter).some(key => {
      if (key === 'project') return false; // project不算在激活筛选中
      return hydCodeFilter[key as keyof HydCode] !== '';
    });
  };

  // 清除所有筛选功能
  const clearAllRiscFilters = () => {
    setRiscFilters({
      status: '',
      startDate: '',
      endDate: '',
      searchText: ''
    });
  };

  const clearAllFileFilters = () => {
    setFileFilters({
      type: '',
      startDate: '',
      endDate: '',
      searchText: '',
      showMyFiles: false
    });
  };

  const clearAllHydCodeFilters = () => {
    setHydCodeFilter({
      project: 'HY202404',
      contractor: '',
      location: '',
      structure: '',
      space: '',
      grid: '',
      cat: ''
    });
    // 手动清除HyD Code筛选时，清空筛选高亮集，但保留手动高亮集
    setFilterHighlightSet([]);
  };

  // 过滤RISC表单 - 基于最终高亮集筛选
  const getFilteredRiscForms = () => {
    let filtered = riscForms.filter(form => {
      // 首先检查是否有有效的对象关联
      const hasValidObjects = form.objects.some(objId => {
        return components.some(obj => obj.id === objId);
      });
      
      if (!hasValidObjects) return false;
      
      if (riscFilters.status && form.status !== riscFilters.status) return false;
      if (riscFilters.startDate && new Date(form.updateDate) < new Date(riscFilters.startDate)) return false;
      if (riscFilters.endDate && new Date(form.updateDate) > new Date(riscFilters.endDate)) return false;
      if (riscFilters.searchText && !form.requestNo.toLowerCase().includes(riscFilters.searchText.toLowerCase())) return false;
      if (!matchesHydCodeFilter(form.hydCode)) return false;
      return true;
    });

    // 根据最终高亮集筛选
    const finalHighlightSet = getFinalHighlightSet();
    if (finalHighlightSet.length > 0) {
      filtered = filtered.filter(form => 
        form.objects.some(objId => finalHighlightSet.includes(objId))
      );
    }

    return filtered;
  };

  // 过滤文件 - 基于最终高亮集筛选
  const getFilteredFiles = () => {
    let filtered = files.filter(file => {
      // 首先检查是否有有效的对象关联
      const hasValidObjects = file.objects.some(objId => {
        return components.some(obj => obj.id === objId);
      });
      
      if (!hasValidObjects) return false;
      
      if (fileFilters.type && file.type !== fileFilters.type) return false;
      if (fileFilters.startDate && new Date(file.uploadDate) < new Date(fileFilters.startDate)) return false;
      if (fileFilters.endDate && new Date(file.uploadDate) > new Date(fileFilters.endDate)) return false;
      if (fileFilters.searchText && !file.name.toLowerCase().includes(fileFilters.searchText.toLowerCase())) return false;
      if (fileFilters.showMyFiles && file.uploadedBy !== currentUser) return false;
      if (!matchesHydCodeFilter(file.hydCode)) return false;
      return true;
    });

    // 根据最终高亮集筛选
    const finalHighlightSet = getFinalHighlightSet();
    if (finalHighlightSet.length > 0) {
      filtered = filtered.filter(file => 
        file.objects.some(objId => finalHighlightSet.includes(objId))
      );
    }

    return filtered;
  };

  // 过滤构件 - 现在返回所有构件，但标记哪些符合筛选条件
  const getFilteredObjectGroups = () => {
    // 根据选择的模型版本获取所有构件
    let allComponents = components.filter(obj => {
      if (selectedModelVersion === 'current') {
        return obj.version === 'current';
      } else {
        return obj.version === selectedModelVersion || obj.version === 'v1.8';
      }
    });
    
    return allComponents;
  };

  // 获取符合HyD Code筛选条件的构件ID列表
  const getHydCodeFilteredComponents = () => {
    if (!hasHydCodeFilter()) return [];
    
    return components
      .filter(obj => {
        if (selectedModelVersion === 'current') {
          return obj.version === 'current';
        } else {
          return obj.version === selectedModelVersion || obj.version === 'v1.8';
        }
      })
      .filter(obj => matchesHydCodeFilter(obj.hydCode))
      .map(obj => obj.id);
  };

  // 过滤用户列表
  const getFilteredUsers = () => {
    if (!userSearchText) return adminUsers;
    
    return adminUsers.filter(user => 
      user.name.toLowerCase().includes(userSearchText.toLowerCase()) ||
      user.email.toLowerCase().includes(userSearchText.toLowerCase())
    );
  };

  // 过滤活动日志
  const getFilteredLogs = () => {
    return activityLogs.filter(log => {
      if (logFilters.user && !log.user.toLowerCase().includes(logFilters.user.toLowerCase())) return false;
      if (logFilters.role && log.role !== logFilters.role) return false;
      if (logFilters.startDate && new Date(log.timestamp) < new Date(logFilters.startDate)) return false;
      if (logFilters.endDate && new Date(log.timestamp) > new Date(logFilters.endDate)) return false;
      if (logFilters.searchText && 
          !log.targetDetail.toLowerCase().includes(logFilters.searchText.toLowerCase()) &&
          !log.details.toLowerCase().includes(logFilters.searchText.toLowerCase())) return false;
      return true;
    });
  };

  // HyD Code匹配函数
  const matchesHydCodeFilter = (objHydCode: HydCode): boolean => {
    return Object.keys(hydCodeFilter).every(key => {
      if (!hydCodeFilter[key as keyof HydCode]) return true;
      return objHydCode[key as keyof HydCode] === hydCodeFilter[key as keyof HydCode];
    });
  };

  // 处理HyD Code变化 - 重置规则（最高优先级）
  const handleHydCodeChange = (level: keyof HydCode, value: string): void => {
    const newFilter = { ...hydCodeFilter, [level]: value };
    setHydCodeFilter(newFilter);
    
    // 筛选器变更的重置规则（最高优先级）：
    // 1. 清空手动高亮集
    setManualHighlightSet([]);
    
    // 2. 重新计算筛选高亮集
    const newFilterHighlightSet = components
      .filter(obj => {
        if (selectedModelVersion === 'current') {
          return obj.version === 'current';
        } else {
          return obj.version === selectedModelVersion || obj.version === 'v1.8';
        }
      })
      .filter(obj => {
        return Object.keys(newFilter).every(key => {
          if (key === 'project') return true; // project字段不参与筛选
          if (!newFilter[key as keyof HydCode]) return true;
          return obj.hydCode[key as keyof HydCode] === newFilter[key as keyof HydCode];
        });
      })
      .map(obj => obj.id);
    
    setFilterHighlightSet(newFilterHighlightSet);
    
    // 清除其他状态
    setSelectedRISC(null);
    setSelectedFile(null);
    setHoveredObjects([]);
    setHoveredItem(null);
    setHoveredItemType(null);
  };

  // 处理RISC筛选条件变化
  const handleRiscFilterChange = (field, value) => {
    setRiscFilters(prev => ({ ...prev, [field]: value }));
  };

  // 处理文件筛选条件变化
  const handleFileFilterChange = (field, value) => {
    setFileFilters(prev => ({ ...prev, [field]: value }));
  };

  // 处理鼠标悬浮
  const handleItemHover = (item: RiscForm | FileItem | any, type: string): void => {
    // 在绑定模式下不显示悬浮效果
    if (isBindingMode) return;
    
    setHoveredItem(item);
    setHoveredItemType(type);
    
    if ('objects' in item) {
      setHoveredObjects(item.objects);
    }
  };

  const handleItemLeave = (): void => {
    // 清除悬浮状态
    setHoveredItem(null);
    setHoveredItemType(null);
    setHoveredObjects([]);
  };

  // 处理列表条目点击 - 新的退出确认流程
  const handleListItemClick = (item: RiscForm | FileItem, type: string): void => {
    // 在绑定模式下，点击文件项本身不添加到绑定购物车
    if (isBindingMode && type === 'file') {
      return;
    }

    // 检查是否在筛选模式下
    if (hasHydCodeFilter()) {
      // 弹出确认框
      const confirmMessage = `检测到您正在使用HyD Code筛选。\n\n是否要退出当前的HyD Code筛选，并仅根据此条目来选择构件？\n\n点击"确定"将清除当前筛选并仅显示与此条目相关的内容。\n点击"取消"保持当前筛选状态。`;
      
      if (confirm(confirmMessage)) {
        // 用户选择退出筛选模式
        // 1. 清空所有状态
        setHydCodeFilter({
          project: 'HY202404',
          contractor: '',
          location: '',
          structure: '',
          space: '',
          grid: '',
          cat: ''
        });
        setFilterHighlightSet([]);
        
        // 2. 建立新的手动高亮集
        setManualHighlightSet(item.objects);
        
        // 3. 更新选择状态
        if (type === 'risc') {
          setSelectedRISC(item.id);
          setSelectedFile(null);
        } else if (type === 'file') {
          setSelectedFile(item.id);
          setSelectedRISC(null);
        }
      }
      // 如果用户选择"取消"，则不做任何操作
      return;
    }

    // 非筛选模式下的正常点击逻辑
    if (type === 'risc') {
      const riscItem = item as RiscForm;
      if (selectedRISC === riscItem.id) {
        // 取消选中
        setSelectedRISC(null);
        setSelectedFile(null);
        setManualHighlightSet([]);
      } else {
        // 选中新的RISC
        setSelectedRISC(riscItem.id);
        setSelectedFile(null);
        setManualHighlightSet(riscItem.objects);
      }
    } else if (type === 'file') {
      const fileItem = item as FileItem;
      if (selectedFile === fileItem.id) {
        // 取消选中
        setSelectedFile(null);
        setSelectedRISC(null);
        setManualHighlightSet([]);
      } else {
        // 选中新的文件
        setSelectedFile(fileItem.id);
        setSelectedRISC(null);
        setManualHighlightSet(fileItem.objects);
      }
    }
  };

  // 处理BIM视图构件点击 - 修改手动高亮集
  const handleComponentClick = (component: any): void => {
    // 在绑定模式下，点击构件会添加到绑定购物车
    if (isBindingMode) {
      addObjectToCart(component);
      return;
    }

    // 检查构件是否在手动高亮集中
    const isInManualSet = manualHighlightSet.includes(component.id);
    
    if (isInManualSet) {
      // 从手动高亮集中移除
      setManualHighlightSet(prev => prev.filter(id => id !== component.id));
      
      // 如果手动高亮集变空，清除选择状态
      if (manualHighlightSet.length === 1) { // 移除后会变成0
        setSelectedRISC(null);
        setSelectedFile(null);
      }
    } else {
      // 添加到手动高亮集
      setManualHighlightSet(prev => [...prev, component.id]);
      
      // 清除之前的RISC和文件选择，因为现在是手动多选模式
      setSelectedRISC(null);
      setSelectedFile(null);
    }
  };

  // 处理双击 - 快速对比功能
  const handleDoubleClick = (item: RiscForm | FileItem, type: string): void => {
    // 如果点击的是历史版本项，显示快速对比
    if ('bindingStatus' in item && (item.bindingStatus === 'history' || item.bindingStatus === 'deleted')) {
      setCompareData({
        item: item as RiscForm | FileItem,
        type,
        currentVersion: selectedModelVersion,
        targetVersion: item.bindingStatus === 'history' ? 'v1.8' : 'deleted'
      });
      setShowQuickCompare(true);
    } else {
      // 普通双击导航到详情页
      handleNavigateToDetail(item, type);
    }
  };

  // 添加到绑定购物车（只允许文件）- 修改后不再允许从绑定购物车添加文件
  const addToBindingCart = (item: FileItem, type: string): void => {
    if (type !== 'file') return;

    // 如果已经在绑定模式且购物车中存在其他文件，需要确认是否替换
    if (isBindingMode && bindingCart.files.length === 1 && bindingCart.files[0].id !== item.id) {
      const confirmReplace = confirm(`绑定购物车已包含文件"${bindingCart.files[0].name}"。\n\n您确定要清除当前绑定并改为绑定文件"${item.name}"吗？`);
      if (!confirmReplace) {
        return; // 用户取消
      }
    }
    
    // 权限检查
    if (currentUser !== 'Administrator' && item.uploadedBy !== currentUser) {
      alert('您只能修改自己上传的文件的绑定关系');
      return;
    }

    // 清空当前购物车并设置新文件
    const linkedObjects = components.filter(obj => item.objects.includes(obj.id));
    const hasHistoricalObjects = linkedObjects.some(obj => obj.version !== 'current');

    setBindingCart({
      files: [item],
      objects: linkedObjects,
      hasHistoricalObjects
    });

    // 进入绑定模式
    setIsBindingMode(true);

    // 如果有历史对象，自动切换到历史版本视图
    if (hasHistoricalObjects && item.bindingStatus === 'history') {
      setSelectedModelVersion('v1.8');
      setViewMode('historical');
    }
  };

  // 添加对象到购物车
  const addObjectToCart = (obj: any): void => {
    setBindingCart(prev => {
      const newCart = { ...prev };
      
      // 如果是首次添加对象，记录版本信息
      const targetVersion = obj.version;
      
      // 版本一致性检查 - 特殊处理：历史版本文件可以与不同版本对象绑定，但对象之间必须版本一致
      if (newCart.objects.length > 0) {
        const existingVersion = newCart.objects[0].version;
        if (obj.version !== existingVersion) {
          // 如果有历史版本文件在购物车中，允许跨版本绑定，但仍需用户确认
          const hasHistoricalFile = newCart.files.some(f => f.bindingStatus === 'history');
          let confirmMessage;
          
          if (hasHistoricalFile) {
            confirmMessage = `检测到历史版本文件的跨版本绑定。\n\n当前绑定中的构件版本: ${existingVersion}\n尝试添加的构件版本: ${obj.version}\n\n历史版本文件支持与不同版本构件绑定，但所有构件必须属于同一版本。\n\n是否清除当前所有已选构件，并添加新构件？`;
          } else {
            confirmMessage = `不能将不同版本的构件添加到同一个绑定中。\n\n当前绑定中的构件版本: ${existingVersion}\n尝试添加的构件版本: ${obj.version}\n\n是否清除当前所有已选构件，并添加新构件？`;
          }
          
          if (confirm(confirmMessage)) {
            // 清空现有对象，添加新对象
            newCart.objects = [obj];
            newCart.hasHistoricalObjects = obj.version !== 'current';
            return newCart;
          } else {
            return prev; // 用户取消，不进行更改
          }
        }
      }
      
      // 更新购物车中的对象
      if (!newCart.objects.find(o => o.id === obj.id)) {
        newCart.objects.push(obj);
      } else {
        newCart.objects = newCart.objects.filter(o => o.id !== obj.id);
      }
      
      // 检查是否包含历史对象
      newCart.hasHistoricalObjects = newCart.objects.some(o => o.version !== 'current');
      
      return newCart;
    });
  };

  // 从绑定购物车移除
  const removeFromBindingCart = (item: FileItem | any, type: string): void => {
    setBindingCart(prev => {
      const newCart = { ...prev };
      if (type === 'file') {
        const fileItem = item as FileItem;
        newCart.files = newCart.files.filter(f => f.id !== fileItem.id);
        // 移除文件时，也清除对象
        newCart.objects = [];
        newCart.hasHistoricalObjects = false;
      } else if (type === 'object') {
        const objItem = item;
        newCart.objects = newCart.objects.filter(o => o.id !== objItem.id);
        // 重新检查是否还有历史对象
        newCart.hasHistoricalObjects = newCart.objects.some(o => o.version !== 'current');
      }
      return newCart;
    });
  };

  // 修改现有绑定
  const editExistingBinding = (file: FileItem): void => {
    if (!hasBindingPermission()) {
      alert('您没有权限修改绑定关系');
      return;
    }
    
    // 清空当前购物车
    setBindingCart({ files: [], objects: [], hasHistoricalObjects: false });
    
    // 添加要修改的文件及其关联的对象
    const linkedObjects = components.filter(obj => file.objects.includes(obj.id));
    const hasHistoricalObjects = linkedObjects.some(obj => obj.version !== 'current');
    
    setBindingCart({
      files: [file],
      objects: linkedObjects,
      hasHistoricalObjects
    });
    
    // 如果文件关联了历史对象，自动切换到历史版本视图
    if (hasHistoricalObjects && file.bindingStatus === 'history') {
      setSelectedModelVersion('v1.8');
      setViewMode('historical');
      setHoveredObjects(file.objects);
    }
    
    // 激活绑定模式
    setIsBindingMode(true);
  };

  // 退出绑定模式
  const exitBindingMode = () => {
    setIsBindingMode(false);
    setBindingCart({ files: [], objects: [], hasHistoricalObjects: false });
    
    // 如果之前是在历史视图，恢复到当前视图
    if (viewMode === 'historical') {
      setSelectedModelVersion('current');
      setViewMode('current');
    }
  };

  // 提交绑定
  const submitBinding = (): void => {
    const totalFiles = bindingCart.files.length;
    const totalObjects = bindingCart.objects.length;
    
    if (totalFiles !== 1) {
      alert('请选择一个文件进行绑定');
      return;
    }
    
    if (totalObjects === 0) {
      alert('请至少选择一个构件进行绑定');
      return;
    }
    
    // 检查对象版本一致性
    if (totalObjects > 1) {
      const firstVersion = bindingCart.objects[0].version;
      const allSameVersion = bindingCart.objects.every(obj => obj.version === firstVersion);
      if (!allSameVersion) {
        alert('绑定的所有构件必须属于同一版本。请移除不一致的构件后重试。');
        return;
      }
    }
    
    let confirmMessage = '您将执行以下绑定操作：\n\n';
    confirmMessage += `• 文件 "${bindingCart.files[0].name.substring(0, 40)}..." 将关联到 ${totalObjects} 个构件\n`;
    
    confirmMessage += '\n关联的构件：\n';
    bindingCart.objects.forEach(obj => {
      confirmMessage += `  - ${obj.name} (${obj.version})${obj.version !== 'current' ? ' [历史版本]' : ''}\n`;
    });
    
    if (bindingCart.hasHistoricalObjects) {
      confirmMessage += '\n⚠️ 警告：您正在绑定历史版本的构件。\n';
      confirmMessage += '此操作将使文件关联到历史版本，在当前版本视图下可能无法正常显示关联关系。\n';
    }
    
    confirmMessage += '\n此操作将覆盖这个文件原有的关联关系。\n\n是否确认提交？';
    
    if (confirm(confirmMessage)) {
      const objectIds = bindingCart.objects.map(obj => obj.id);
      const currentTime = new Date();
      const updateDate = currentTime.toISOString().split('T')[0];
      
      // 检查是否是历史版本文件绑定到当前版本对象
      const isHistoricalFileBindingToCurrent = bindingCart.files.some(f => f.bindingStatus === 'history') && 
                                               bindingCart.objects.every(obj => obj.version === 'current');
      
      // 更新文件绑定和更新日期
      bindingCart.files.forEach(file => {
        setFiles(prev => prev.map(f => 
          f.id === file.id 
            ? { 
                ...f, 
                objects: objectIds, 
                bindingStatus: isHistoricalFileBindingToCurrent ? 'current' : (bindingCart.hasHistoricalObjects ? 'history' : 'current'), 
                linkedToCurrent: isHistoricalFileBindingToCurrent || !bindingCart.hasHistoricalObjects,
                updateDate: updateDate // 更新日期
              }
            : f
        ));
      });
      
      // 记录活动日志
      const logEntry: ActivityLog = {
        id: Date.now(),
        timestamp: currentTime.toLocaleString('zh-CN'),
        user: currentUser,
        role: currentUser === 'Administrator' ? 'Admin' : 'Authorized User',
        action: 'FILE_BINDING_SUBMIT',
        target: 'File Binding',
        targetDetail: `${totalFiles} files, ${totalObjects} objects`,
        details: `将文件 "${bindingCart.files[0].name.substring(0, 30)}..." 与 ${totalObjects} 个构件进行了关联${
          isHistoricalFileBindingToCurrent ? '（历史文件升级为当前版本）' : 
          bindingCart.hasHistoricalObjects ? '（历史版本）' : ''
        }`,
        ip: '192.168.1.100'
      };
      
      setActivityLogs(prev => [logEntry, ...prev]);
      
      exitBindingMode();
      alert('绑定关系已成功提交！' + (isHistoricalFileBindingToCurrent ? '\n历史版本文件已升级为当前版本。' : ''));
    }
  };

  // 处理导航到详情页面
  const handleNavigateToDetail = (item, type) => {
    setDetailItem(item);
    setCurrentView(type === 'risc' ? 'risc-detail' : 'file-detail');
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
    setDetailItem(null);
  };

  // 处理模型版本变化
  const handleModelVersionChange = (version) => {
    setSelectedModelVersion(version);
    if (version === 'current') {
      setViewMode('current');
    } else {
      setViewMode('historical');
    }
    // 清除当前选择
    setHoveredObjects([]);
    setSelectedRISC(null);
    setSelectedFile(null);
    
    // 如果在绑定模式，且有历史对象，需要特殊处理
    if (isBindingMode && bindingCart.hasHistoricalObjects) {
      if (version === 'current') {
        // 警告用户
        alert('当前绑定购物车中包含历史版本构件，请注意在当前视图下可能无法正确显示这些构件。');
      }
    }
  };

  // 发送邀请
  const handleSendInvite = () => {
    if (!inviteEmail || !inviteRole) {
      alert('请填写邮箱和选择角色');
      return;
    }
    
    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteEmail)) {
      alert('请输入有效的邮箱地址');
      return;
    }
    
    // 模拟发送邀请
    alert(`已向 ${inviteEmail} 发送邀请邮件，角色为：${inviteRole}`);
    setShowAdminInviteModal(false);
    setInviteEmail('');
    setInviteRole('');
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'Approved': return 'bg-green-100 text-green-800';
      case 'Submitted': return 'bg-blue-100 text-blue-800';
      case 'Rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // 检查实际绑定状态 - 只有当关联对象在历史版本存在但在当前版本已删除时才显示deleted
  const getActualBindingStatus = (item) => {
    if (!item.objects || item.objects.length === 0) return item.bindingStatus;
    
    // 检查是否有对象在当前版本中已被删除
    const hasDeletedObjects = item.objects.some(objId => {
      // 检查历史版本中是否存在此对象
      const existsInHistory = components.some(obj => obj.id === objId && obj.version !== 'current');
      // 检查当前版本中是否不存在此对象（或其对应的当前版本）
      const currentVersionId = objId.replace('-OLD', '');
      const existsInCurrent = components.some(obj => obj.id === currentVersionId && obj.version === 'current');
      
      return existsInHistory && !existsInCurrent;
    });
    
    if (hasDeletedObjects) {
      return 'deleted';
    }
    
    return item.bindingStatus;
  };

  const getBindingIcon = (item) => {
    const actualStatus = getActualBindingStatus(item);
    switch (actualStatus) {
      case 'current': return null;
      case 'history': return <Clock className="w-4 h-4 text-orange-500" />;
      case 'deleted': return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return null;
    }
  };

  const getBindingIconTooltip = (item) => {
    const actualStatus = getActualBindingStatus(item);
    switch (actualStatus) {
      case 'current': return null;
      case 'history': return '历史版本关联';
      case 'deleted': return '关联已删除的构件';
      default: return null;
    }
  };

  // 日期选择器卡片组件 - 左侧面板版本
  const DatePickerCardLeft = ({ isVisible, onClose, startDate, endDate, onStartDateChange, onEndDateChange, title }) => {
    if (!isVisible) return null;

    return (
      <div className="absolute top-full left-0 mt-1 bg-white border rounded-lg shadow-xl p-4 z-[9999] w-64">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-gray-700">{title}</h4>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            title="关闭日期选择器"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">开始日期</label>
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              className="w-full border rounded px-2 py-1 text-xs"
              title="选择开始日期"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">结束日期</label>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              className="w-full border rounded px-2 py-1 text-xs"
              title="选择结束日期"
            />
          </div>
          <div className="flex justify-end space-x-2 pt-2 border-t">
            <button 
              onClick={() => {
                onStartDateChange('');
                onEndDateChange('');
              }}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              清除
            </button>
            <button 
              onClick={onClose}
              className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
            >
              确定
            </button>
          </div>
        </div>
      </div>
    );
  };

  // 日期选择器卡片组件 - 右侧面板版本
  const DatePickerCardRight = ({ isVisible, onClose, startDate, endDate, onStartDateChange, onEndDateChange, title }) => {
    if (!isVisible) return null;

    return (
      <div className="absolute top-full right-0 mt-1 bg-white border rounded-lg shadow-xl p-4 z-[9999] w-64">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-gray-700">{title}</h4>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            title="关闭日期选择器"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">开始日期</label>
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              className="w-full border rounded px-2 py-1 text-xs"
              title="选择开始日期"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">结束日期</label>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              className="w-full border rounded px-2 py-1 text-xs"
              title="选择结束日期"
            />
          </div>
          <div className="flex justify-end space-x-2 pt-2 border-t">
            <button 
              onClick={() => {
                onStartDateChange('');
                onEndDateChange('');
              }}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              清除
            </button>
            <button 
              onClick={onClose}
              className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
            >
              确定
            </button>
          </div>
        </div>
      </div>
    );
  };

  // 邀请用户模态框
  const InviteUserModal = () => {
    if (!showInviteModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">邀请成员</h3>
            <button 
              onClick={() => {
                setShowInviteModal(false);
                setInviteEmail('');
                setInviteRole('');
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                分配角色
              </label>
              <div className="text-xs text-gray-500 mb-2">* 配备角色</div>
              <select 
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                title="选择用户角色"
              >
                <option value="">项目成员 ×</option>
                <option value="View-only User">普通用户 (View-only User)</option>
                <option value="Authorized User">授权用户 (Authorized User)</option>
                <option value="Admin">管理员 (Admin)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                输入邮箱
              </label>
              <div className="text-xs text-gray-500 mb-2">* 输入邮箱</div>
              <div className="relative">
                <input 
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="在此处输入邀请人员邮箱地址，例如 abc@jarvis.com"
                  className="w-full border rounded-md px-3 py-2 pr-16 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                  <button className="p-1 text-green-600 hover:text-green-700" title="验证邮箱">
                    <CheckCircle className="w-4 h-4" />
                  </button>
                  <button className="p-1 text-gray-400 hover:text-gray-600" title="发送邮件">
                    <Mail className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="mt-2 flex items-center text-xs text-blue-600">
                <Info className="w-3 h-3 mr-1" />
                <span>输入邀请人员邮箱，可通过换行分隔不同的成员批量邀请</span>
              </div>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end">
            <button 
              onClick={handleSendInvite}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              发送邀请
            </button>
          </div>
        </div>
      </div>
    );
  };

  // 快速对比组件
  const QuickComparePanel = () => {
    if (!showQuickCompare || !compareData) return null;

    const { item, type, currentVersion, targetVersion } = compareData;
    const isRISC = type === 'risc';
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
          <div className="p-6 border-b bg-blue-50">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center">
                <GitCompare className="w-5 h-5 mr-2" />
                快速对比 - {isRISC ? 'RISC表单' : '文件'} 版本视图
              </h3>
              <button 
                onClick={() => setShowQuickCompare(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
                title="关闭对比窗口"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            {/* 基本信息 */}
            <div className="mb-6">
              <h4 className="font-medium mb-3">{isRISC ? 'RISC表单' : '文件'}信息</h4>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">{isRISC ? '请求编号：' : '文件名：'}</span>
                    <span className="font-medium">{isRISC ? (item as RiscForm).requestNo : (item as FileItem).name}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">状态：</span>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      item.bindingStatus === 'history' ? 'bg-orange-100 text-orange-800' : 
                      item.bindingStatus === 'deleted' ? 'bg-red-100 text-red-800' : 
                      'bg-green-100 text-green-800'
                    }`}>
                      {item.bindingStatus === 'history' ? '历史版本' : 
                       item.bindingStatus === 'deleted' ? '已删除' : '当前版本'}
                    </span>
                  </div>
                  {!isRISC && (
                    <>
                      <div>
                        <span className="text-gray-600">上传日期：</span>
                        <span className="font-medium">{(item as FileItem).uploadDate}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">更新日期：</span>
                        <span className="font-medium">{item.updateDate}</span>
                      </div>
                    </>
                  )}
                  {isRISC && (
                    <>
                      <div>
                        <span className="text-gray-600">更新日期：</span>
                        <span className="font-medium">{item.updateDate}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">创建者：</span>
                        <span className="font-medium">{(item as RiscForm).createdBy}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* 关联对象对比 */}
            <div className="mb-6">
              <h4 className="font-medium mb-3">关联对象对比</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <h5 className="text-sm font-medium mb-2 text-blue-700">当前版本 ({currentVersion})</h5>
                  {item.bindingStatus === 'deleted' ? (
                    <div className="text-gray-500 text-sm">无（对象已删除）</div>
                  ) : (
                    <div className="space-y-2">
                      {components
                        .filter(obj => obj.version === 'current' && item.objects.some(id => id.replace('-OLD', '') === obj.id))
                        .map(obj => (
                          <div key={obj.id} className="bg-blue-50 p-2 rounded text-sm">
                            <div className="font-medium">{obj.name}</div>
                            <div className="text-xs text-gray-600">
                              构件数：{obj.components.length} | {obj.properties.material}
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
                <div className="border rounded-lg p-4">
                  <h5 className="text-sm font-medium mb-2 text-orange-700">历史版本 ({targetVersion})</h5>
                  <div className="space-y-2">
                    {item.objects.map(objId => {
                      const obj = components.find(o => o.id === objId);
                      return obj ? (
                        <div key={obj.id} className="bg-orange-50 p-2 rounded text-sm">
                          <div className="font-medium">{obj.name}</div>
                          <div className="text-xs text-gray-600">
                            构件数：{obj.components.length} | {obj.properties.material}
                          </div>
                        </div>
                      ) : (
                        <div key={objId} className="bg-red-50 p-2 rounded text-sm text-red-600">
                          {objId} (已删除)
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* 变更说明 */}
            {item.changes && item.changes.length > 0 && (
              <div className="mb-6">
                <h4 className="font-medium mb-3">变更说明</h4>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {item.changes.map((change, idx) => (
                      <li key={idx}>{change}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* 操作按钮 */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button 
                onClick={() => {
                  setShowQuickCompare(false);
                  handleDoubleClick(item, type);
                }}
                className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
              >
                切换到历史版本查看
              </button>
              <button 
                onClick={() => setShowQuickCompare(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 登录页面
  const LoginPage = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">DWSS-BIM</h1>
          <p className="text-gray-600">数字工程监督系统 - BIM 集成平台</p>
        </div>
        
        <button 
          onClick={() => setCurrentView('project-map')}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
        >
          ACC/BIM360 Account Sign in
        </button>
        
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            首次登录需要授权访问您的CDE账户
          </p>
        </div>
      </div>
    </div>
  );

  // 项目地图页面
  const ProjectMapPage = () => (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">DWSS - BIM Dashboard</h1>
          <button 
            onClick={() => setCurrentView('dashboard')}
            className="text-blue-600 hover:text-blue-800"
          >
            进入仪表板
          </button>
        </div>
      </div>
      
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-lg font-medium mb-4">项目地图</h2>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-yellow-100 p-4 rounded-lg border-l-4 border-yellow-400">
                <h3 className="font-medium text-yellow-800">BUS-BUS INTERCHANGE AT ABERDEEN TUNNEL</h3>
              </div>
              <div className="bg-blue-100 p-4 rounded-lg border-l-4 border-blue-400">
                <h3 className="font-medium text-blue-800">WALKWAY COVER AT CENTRAL & WESTERN DISTRICT</h3>
              </div>
              <div className="bg-green-100 p-4 rounded-lg border-l-4 border-green-400">
                <h3 className="font-medium text-green-800">WALKWAY COVER AT KWAI TSING DISTRICT</h3>
              </div>
              <div className="bg-orange-100 p-4 rounded-lg border-l-4 border-orange-400">
                <h3 className="font-medium text-orange-800">FOOTBRIDGE ACROSS TSUI PING ROAD</h3>
              </div>
            </div>
            
            <div className="bg-gray-100 h-64 rounded-lg flex items-center justify-center">
              <p className="text-gray-500">香港项目分布地图</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // 管理员后台页面
  const AdminPage = () => {
    // 管理员页面内的邀请用户模态框
    const AdminInviteUserModal = () => {
      if (!showAdminInviteModal) return null;

      return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">邀请成员</h3>
              <button 
                onClick={() => {
                  setShowAdminInviteModal(false);
                  setInviteEmail('');
                  setInviteRole('');
                }}
                className="text-gray-400 hover:text-gray-600"
                title="关闭"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  分配角色
                </label>
                <div className="text-xs text-gray-500 mb-2">* 配备角色</div>
                <select 
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  title="选择用户角色"
                >
                  <option value="">项目成员 ×</option>
                  <option value="View-only User">普通用户 (View-only User)</option>
                  <option value="Authorized User">授权用户 (Authorized User)</option>
                  <option value="Admin">管理员 (Admin)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  输入邮箱
                </label>
                <div className="text-xs text-gray-500 mb-2">* 输入邮箱</div>
                <div className="relative">
                  <input 
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="在此处输入邀请人员邮箱地址，例如 abc@jarvis.com"
                    className="w-full border rounded-md px-3 py-2 pr-16 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                    <button className="p-1 text-green-600 hover:text-green-700" title="验证邮箱">
                      <CheckCircle className="w-4 h-4" />
                    </button>
                    <button className="p-1 text-gray-400 hover:text-gray-600" title="发送邮件">
                      <Mail className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="mt-2 flex items-center text-xs text-blue-600">
                  <Info className="w-3 h-3 mr-1" />
                  <span>输入邀请人员邮箱，可通过换行分隔不同的成员批量邀请</span>
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button 
                onClick={handleSendInvite}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                发送邀请
              </button>
            </div>
          </div>
        </div>
      );
    };

    // 用户管理页面
    const UserManagementPage = () => (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium">用户与角色管理</h2>
          <button 
            onClick={() => setShowAdminInviteModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            邀请用户
          </button>
        </div>
        
        {/* 用户搜索 */}
        <div className="mb-4">
          <input 
            type="text"
            value={userSearchText}
            onChange={(e) => setUserSearchText(e.target.value)}
            placeholder="按成员名字搜索..."
            className="w-full border rounded px-3 py-2 text-sm"
          />
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left py-3 px-4 font-medium text-sm">用户</th>
                <th className="text-left py-3 px-4 font-medium text-sm">邮箱</th>
                <th className="text-left py-3 px-4 font-medium text-sm">角色</th>
                <th className="text-left py-3 px-4 font-medium text-sm">状态</th>
                <th className="text-left py-3 px-4 font-medium text-sm">操作</th>
              </tr>
            </thead>
            <tbody>
              {getFilteredUsers().map(user => (
                <tr key={user.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium text-sm">{user.name}</td>
                  <td className="py-3 px-4 text-xs text-gray-600">{user.email}</td>
                  <td className="py-3 px-4">
                    <select 
                      value={user.role} 
                      className="border rounded px-2 py-1 text-xs"
                      title="修改用户角色"
                      onChange={(e) => {
                        setAdminUsers(prev => prev.map(u => 
                          u.id === user.id ? {...u, role: e.target.value} : u
                        ));
                      }}
                    >
                      <option value="View-only User">普通用户</option>
                      <option value="Authorized User">授权用户</option>
                      <option value="Admin">管理员</option>
                    </select>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      user.status === 'Active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {user.status === 'Active' ? '活跃' : '非活跃'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <button className="text-red-600 hover:text-red-800 text-xs" title="删除用户">删除</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );

    // 活动日志页面
    const ActivityLogsPage = () => (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium">活动日志</h2>
          <button className="bg-gray-100 px-3 py-1 rounded text-sm hover:bg-gray-200" title="导出CSV文件">
            导出CSV
          </button>
        </div>
        
        {/* 基础筛选 */}
        <div className="space-y-3 mb-4">
          <div className="grid grid-cols-2 gap-2">
            <input 
              type="text"
              value={logFilters.user}
              onChange={(e) => setLogFilters(prev => ({ ...prev, user: e.target.value }))}
              placeholder="按用户筛选..."
              className="border rounded px-3 py-1.5 text-xs"
            />
            <select 
              value={logFilters.role}
              onChange={(e) => setLogFilters(prev => ({ ...prev, role: e.target.value }))}
              className="border rounded px-3 py-1.5 text-xs"
              title="按角色筛选"
            >
              <option value="">所有角色</option>
              <option value="Admin">管理员</option>
              <option value="Authorized User">授权用户</option>
              <option value="View-only User">普通用户</option>
            </select>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <input 
              type="date"
              value={logFilters.startDate}
              onChange={(e) => setLogFilters(prev => ({ ...prev, startDate: e.target.value }))}
              className="border rounded px-3 py-1.5 text-xs"
              title="开始日期"
            />
            <input 
              type="date"
              value={logFilters.endDate}
              onChange={(e) => setLogFilters(prev => ({ ...prev, endDate: e.target.value }))}
              className="border rounded px-3 py-1.5 text-xs"
              title="结束日期"
            />
          </div>
          
          <input 
            type="text"
            value={logFilters.searchText}
            onChange={(e) => setLogFilters(prev => ({ ...prev, searchText: e.target.value }))}
            placeholder="全文搜索（目标详情/操作详情）..."
            className="w-full border rounded px-3 py-1.5 text-xs"
          />
        </div>
        
        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-gray-50">
              <tr className="border-b">
                <th className="text-left py-2 px-3">时间</th>
                <th className="text-left py-2 px-3">用户</th>
                <th className="text-left py-2 px-3">操作</th>
                <th className="text-left py-2 px-3">详情</th>
              </tr>
            </thead>
            <tbody>
              {getFilteredLogs().map(log => (
                <tr key={log.id} className="border-b hover:bg-gray-50">
                  <td className="py-2 px-3 text-gray-500 whitespace-nowrap">{log.timestamp}</td>
                  <td className="py-2 px-3">
                    <div className="font-medium">{log.user}</div>
                    <div className="text-xs text-gray-500">{log.role}</div>
                  </td>
                  <td className="py-2 px-3">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-2 px-3">
                    <div className="text-xs">{log.targetDetail}</div>
                    <div className="text-xs text-gray-500">{log.details}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <h1 className="text-xl font-semibold">管理员后台</h1>
              {/* 子页面导航 */}
              <div className="flex space-x-4">
                <button
                  onClick={() => setAdminSubView('users')}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    adminSubView === 'users'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  用户管理
                </button>
                <button
                  onClick={() => setAdminSubView('logs')}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    adminSubView === 'logs'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  活动日志
                </button>
              </div>
            </div>
            <button 
              onClick={() => setCurrentView('dashboard')}
              className="text-blue-600 hover:text-blue-800"
            >
              返回仪表板
            </button>
          </div>
        </div>
        
        <div className="p-6">
          {adminSubView === 'users' ? <UserManagementPage /> : <ActivityLogsPage />}
        </div>
      </div>
    );
  };

  // RISC表单详情页
  const RiscDetailPage = () => {
    if (!detailItem) return null;
    
    // 确保detailItem是RiscForm类型
    const riscItem = detailItem as RiscForm;

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm px-6 py-4">
          <div className="flex items-center space-x-4">
            <button 
              onClick={handleBackToDashboard}
              className="text-blue-600 hover:text-blue-800 flex items-center"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              返回仪表板
            </button>
            <div className="text-gray-500 flex items-center">
              <ChevronRight className="w-4 h-4" />
              <span>RISC表单详情</span>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-xl font-semibold">{riscItem.requestNo}</h1>
                <div className="flex items-center mt-2 space-x-4">
                  <span className={`px-2 py-1 rounded-full text-sm ${getStatusBadgeColor(riscItem.status)}`}>
                    {riscItem.status}
                  </span>
                  <span className="text-sm text-gray-500">更新日期: {riscItem.updateDate}</span>
                  <span className="text-sm text-gray-500">创建者: {riscItem.createdBy}</span>
                </div>
              </div>
              
              <div className="flex space-x-2">
                {riscItem.bindingStatus === 'history' && (
                  <button
                    onClick={() => {
                      setCompareData({
                        item: riscItem,
                        type: 'risc',
                        currentVersion: 'current',
                        targetVersion: 'v1.8'
                      });
                      setShowQuickCompare(true);
                    }}
                    className="flex items-center px-3 py-2 bg-orange-100 text-orange-700 rounded hover:bg-orange-200"
                  >
                    <GitCompare className="w-4 h-4 mr-2" />
                    版本对比
                  </button>
                )}
              </div>
            </div>
            
            <div className="border-t pt-4">
              <h2 className="text-lg font-medium mb-3">关联对象组</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {riscItem.objects.map(objId => {
                  const objectData = components.find(obj => obj.id === objId);
                  return (
                    <div key={objId} className="border rounded p-4">
                      <h3 className="font-medium text-blue-700">{objId}</h3>
                      {objectData && (
                        <div className="mt-2 text-sm">
                          <div className="flex items-center">
                            <span>名称: {objectData.name}</span>
                            {objectData.version !== 'current' && (
                              <span className="ml-2 px-2 py-0.5 bg-orange-100 text-orange-800 rounded-full text-xs flex items-center">
                                <History className="w-3 h-3 mr-1" />
                                历史版本
                              </span>
                            )}
                          </div>
                          <div>版本: {objectData.version}</div>
                          <div>构件数: {objectData.components.length}</div>
                          <div className="mt-1 text-xs text-gray-500">
                            <div>位置: {objectData.properties.position}</div>
                            <div>材料: {objectData.properties.material}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="border-t mt-6 pt-4">
              <h2 className="text-lg font-medium mb-3">RISC表单内容</h2>
              <div className="bg-gray-100 p-4 rounded">
                <p className="text-sm text-gray-600">此处显示RISC表单的详细内容...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 文件详情页
  const FileDetailPage = () => {
    if (!detailItem) return null;
    
    // 确保detailItem是FileItem类型
    const fileItem = detailItem as FileItem;

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm px-6 py-4">
          <div className="flex items-center space-x-4">
            <button 
              onClick={handleBackToDashboard}
              className="text-blue-600 hover:text-blue-800 flex items-center"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              返回仪表板
            </button>
            <div className="text-gray-500 flex items-center">
              <ChevronRight className="w-4 h-4" />
              <span>文件详情</span>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-lg font-semibold">{fileItem.name}</h1>
                <div className="flex items-center mt-2 space-x-4">
                  <span className="px-2 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                    {fileItem.type}
                  </span>
                  <span className="text-sm text-gray-500">上传日期: {fileItem.uploadDate}</span>
                  <span className="text-sm text-gray-500">更新日期: {fileItem.updateDate}</span>
                  <span className="text-sm text-gray-500">上传者: {fileItem.uploadedBy}</span>
                </div>
              </div>
              
              <div className="flex space-x-2">
                {fileItem.bindingStatus === 'history' && (
                  <button
                    onClick={() => {
                      setCompareData({
                        item: fileItem,
                        type: 'file',
                        currentVersion: 'current',
                        targetVersion: 'v1.8'
                      });
                      setShowQuickCompare(true);
                    }}
                    className="flex items-center px-3 py-2 bg-orange-100 text-orange-700 rounded hover:bg-orange-200"
                  >
                    <GitCompare className="w-4 h-4 mr-2" />
                    版本对比
                  </button>
                )}
                {hasBindingPermission() && (fileItem.bindingStatus === 'current' || fileItem.bindingStatus === 'history') && 
                 (currentUser === 'Administrator' || fileItem.uploadedBy === currentUser) && (
                  <button
                    onClick={() => editExistingBinding(fileItem)}
                    className="flex items-center px-3 py-2 bg-green-100 text-green-700 rounded hover:bg-green-200"
                  >
                    <Link className="w-4 h-4 mr-2" />
                    修改绑定
                  </button>
                )}
                <button className="flex items-center px-3 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200">
                  <Download className="w-4 h-4 mr-2" />
                  下载文件
                </button>
              </div>
            </div>
            
            <div className="border-t pt-4">
              <h2 className="text-lg font-medium mb-3">关联对象组</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {fileItem.objects.map(objId => {
                  const objectData = components.find(obj => obj.id === objId);
                  return (
                    <div key={objId} className="border rounded p-4">
                      <h3 className="font-medium text-blue-700">{objId}</h3>
                      {objectData && (
                        <div className="mt-2 text-sm">
                          <div className="flex items-center">
                            <span>名称: {objectData.name}</span>
                            {objectData.version !== 'current' && (
                              <span className="ml-2 px-2 py-0.5 bg-orange-100 text-orange-800 rounded-full text-xs flex items-center">
                                <History className="w-3 h-3 mr-1" />
                                历史版本
                              </span>
                            )}
                          </div>
                          <div>版本: {objectData.version}</div>
                          <div>构件数: {objectData.components.length}</div>
                          <div className="mt-1 text-xs text-gray-500">
                            <div>位置: {objectData.properties.position}</div>
                            <div>材料: {objectData.properties.material}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="border-t mt-6 pt-4">
              <h2 className="text-lg font-medium mb-3">文件预览</h2>
              <div className="bg-gray-100 p-4 rounded min-h-[400px] flex items-center justify-center">
                <div className="text-center">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">文件预览暂不可用</p>
                  <button className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium">
                    点击下载查看
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 绑定管理面板 - 悬浮购物车
  const BindingManagementPanel = () => {
    const objectCount = bindingCart.objects.length;
    
    if (!isBindingMode) return null;
    
    // 只在右侧栏收起时显示悬浮购物车
    if (rightPanelCollapsed) {
      return (
        <div className="fixed bottom-6 right-6 z-50">
          <button
            onClick={() => setShowBindingCart(!showBindingCart)}
            className="bg-blue-600 text-white rounded-full p-3 shadow-lg hover:bg-blue-700 relative"
          >
            <ShoppingCart className="w-6 h-6" />
            {objectCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {objectCount}
              </span>
            )}
          </button>
          
          {showBindingCart && (
            <div className="absolute bottom-full right-0 mb-2 bg-white rounded-lg shadow-xl p-4 w-80 max-h-96 overflow-y-auto">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium">绑定管理</h3>
                <button 
                  onClick={() => setShowBindingCart(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <BindingCartContent />
              
              {/* 确保浮动面板上也有绑定按钮 */}
              <div className="flex space-x-2 mt-4">
                <button 
                  onClick={submitBinding}
                  className="flex-1 bg-blue-600 text-white text-xs py-2 px-3 rounded hover:bg-blue-700 disabled:bg-gray-400"
                  disabled={bindingCart.files.length !== 1 || bindingCart.objects.length === 0}
                >
                  提交绑定
                </button>
                <button 
                  onClick={exitBindingMode}
                  className="flex-1 bg-gray-600 text-white text-xs py-2 px-3 rounded hover:bg-gray-700"
                >
                  取消
                </button>
              </div>
            </div>
          )}
        </div>
      );
    }
    
    return null;
  };

  // 绑定购物车内容
  const BindingCartContent = () => {
    const totalItems = bindingCart.files.length + bindingCart.objects.length;
    const hasFile = bindingCart.files.length > 0;
    const hasObjects = bindingCart.objects.length > 0;
    
    return (
      <div className="space-y-4">
        {/* 统计信息 */}
        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="text-sm font-medium text-blue-800 mb-2">绑定统计</div>
          <div className="text-xs text-blue-600 space-y-1">
            <div>文件: {bindingCart.files.length} 个</div>
            <div>构件: {bindingCart.objects.length} 个</div>
            {bindingCart.objects.length > 0 && (
              <div className="text-xs text-gray-600 mt-2">
                构件版本: {bindingCart.objects[0]?.version || 'N/A'}
                {bindingCart.hasHistoricalObjects && (
                  <span className="ml-2 px-2 py-0.5 bg-orange-100 text-orange-800 rounded-full text-xs flex items-center inline-flex">
                    <History className="w-3 h-3 mr-1" />
                    包含历史版本
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* 文件 */}
        {bindingCart.files.length > 0 && (
          <div>
            <div className="text-xs font-medium text-gray-600 mb-2 flex items-center">
              <FileText className="w-3 h-3 mr-1" />
              选中的文件
            </div>
            <div className="space-y-2">
              {bindingCart.files.map(file => (
                <div key={file.id} className="bg-blue-50 p-2 rounded text-xs">
                  <div className="font-medium truncate">{file.name.substring(0, 40)}...</div>
                  <div className="text-xs text-gray-500">{file.type}</div>
                  {file.uploadedBy === currentUser && (
                    <div className="text-xs text-blue-600">我上传的</div>
                  )}
                  {file.bindingStatus === 'history' && (
                    <div className="text-xs text-orange-600 flex items-center">
                      <History className="w-3 h-3 mr-1" />
                      历史绑定
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* 对象组 */}
        {bindingCart.objects.length > 0 && (
          <div>
            <div className="text-xs font-medium text-gray-600 mb-2 flex items-center">
              <Layers className="w-3 h-3 mr-1" />
              构件 ({bindingCart.objects.length})
            </div>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {bindingCart.objects.map(obj => (
                <div key={obj.id} className={`flex items-center justify-between p-2 rounded text-xs ${
                  obj.version !== 'current' ? 'bg-orange-50' : 'bg-blue-50'
                }`}>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate flex items-center">
                      {obj.name}
                      {obj.version !== 'current' && (
                        <span className="ml-1">
                          <History className="w-3 h-3 text-orange-600" aria-label="历史版本" />
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">{obj.version}</div>
                    <div className="text-xs text-gray-500">{obj.components.length} 构件</div>
                  </div>
                  <button 
                    onClick={() => removeFromBindingCart(obj, 'object')}
                    className="text-red-500 hover:text-red-700 ml-2"
                    title="从绑定购物车中移除"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* 版本警告 */}
        {bindingCart.objects.length > 0 && !bindingCart.objects.every(obj => obj.version === bindingCart.objects[0].version) && (
          <div className="bg-red-50 border border-red-200 p-2 rounded">
            <div className="text-xs text-red-800 font-medium">⚠️ 版本冲突</div>
            <div className="text-xs text-red-600">所选构件不属于同一版本，请重新选择</div>
          </div>
        )}
        
        {/* 历史版本提示 */}
        {bindingCart.hasHistoricalObjects && (
          <div className="bg-orange-50 border border-orange-200 p-2 rounded">
            <div className="text-xs text-orange-800 font-medium flex items-center">
              <History className="w-3 h-3 mr-1" />
              历史版本绑定
            </div>
            <div className="text-xs text-orange-600">您正在绑定历史版本的构件。此绑定将被标记为历史绑定。</div>
          </div>
        )}
        
        {/* 提示信息 */}
        {bindingCart.files.length === 0 && (
          <div className="text-xs text-gray-500 text-center">
            请先选择一个要绑定的文件
          </div>
        )}
        {bindingCart.files.length > 0 && bindingCart.objects.length === 0 && (
          <div className="text-xs text-gray-500 text-center">
            请选择至少一个构件进行绑定
          </div>
        )}
      </div>
    );
  };

  if (currentView === 'login') return <LoginPage />;
  if (currentView === 'project-map') return <ProjectMapPage />;
  if (currentView === 'admin') return <AdminPage />;
  if (currentView === 'risc-detail') return <RiscDetailPage />;
  if (currentView === 'file-detail') return <FileDetailPage />;

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* 顶部导航栏 */}
      <div className="bg-white shadow-sm px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-semibold">DWSS-BIM 仪表板</h1>
          <span className="text-sm text-gray-500">项目: {selectedProject}</span>
          {viewMode === 'historical' && (
            <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs flex items-center">
              <History className="w-3 h-3 mr-1" />
              历史版本视图
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => setCurrentView('project-map')}
            className="p-2 text-gray-600 hover:text-gray-900"
            title="项目地图"
          >
            <Home className="w-5 h-5" />
          </button>
          {isAdmin() && (
            <button 
              onClick={() => setCurrentView('admin')}
              className="p-2 text-gray-600 hover:text-gray-900"
              title="管理员后台"
            >
              <Settings className="w-5 h-5" />
            </button>
          )}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">当前用户:</span>
            <select 
              value={currentUser}
              onChange={(e) => setCurrentUser(e.target.value)}
              className="border rounded px-2 py-1 text-sm"
              title="切换当前用户"
            >
              <option value="Administrator">管理员</option>
              <option value="John Doe">John Doe (授权用户)</option>
              <option value="Jane Smith">Jane Smith (授权用户)</option>
              <option value="Mike Johnson">Mike Johnson (普通用户)</option>
            </select>
          </div>
          <button 
            onClick={() => setCurrentView('login')}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            退出登录
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* 左侧栏 */}
        <div className={`bg-white shadow-sm transition-all duration-300 ${leftPanelCollapsed ? 'w-12' : 'w-80'} flex flex-col`}>
          <div className="p-4 border-b flex items-center justify-between flex-shrink-0">
            {!leftPanelCollapsed && <h2 className="font-medium">筛选与管理</h2>}
            <button 
              onClick={() => setLeftPanelCollapsed(!leftPanelCollapsed)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              {leftPanelCollapsed ? <ChevronsRight className="w-4 h-4" /> : <ChevronsLeft className="w-4 h-4" />}
            </button>
          </div>

          {!leftPanelCollapsed && (
            <div className="flex-1 overflow-hidden flex flex-col">
              <div className="flex-1 p-4 space-y-6 overflow-y-auto">
                {/* HyD Code 高级筛选 - 仅授权用户和管理员可见 */}
                {!isViewOnlyUser() && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium flex items-center">
                        <Filter className="w-4 h-4 mr-2" />
                        HyD Code 高级筛选
                      </h3>
                      {hasHydCodeFilter() && (
                        <button
                          onClick={clearAllHydCodeFilters}
                          className="text-xs text-red-600 hover:text-red-800"
                          title="清除所有HyD Code筛选"
                        >
                          清除
                        </button>
                      )}
                    </div>
                    <div className="space-y-2">
                      {Object.keys(hydCodeOptions).map(level => (
                        <div key={level}>
                          <label className="block text-xs text-gray-600 mb-1 capitalize">{level}</label>
                          <select 
                            value={hydCodeFilter[level]}
                            onChange={(e) => handleHydCodeChange(level as keyof HydCode, e.target.value)}
                            className={`w-full border rounded px-2 py-1 text-sm ${
                              level === 'project' ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''
                            }`}
                            disabled={level === 'project'}
                            title={level === 'project' ? 'Project字段不可选择' : `选择${level}`}
                          >
                            <option value="">请选择...</option>
                            {hydCodeOptions[level].map(option => (
                              <option key={option} value={option}>{option}</option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 text-xs text-blue-600">
                      匹配构件: {getHydCodeFilteredComponents().length}
                      {getFinalHighlightSet().length > 0 && (
                        <span className="ml-2 text-purple-600">
                          (最终高亮: {getFinalHighlightSet().length})
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* RISC 表单列表 */}
                <div className="flex flex-col min-h-0 flex-1">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium flex items-center">
                      <FileText className="w-4 h-4 mr-2" />
                      RISC 表单
                    </h3>
                    {(riscFilters.status || riscFilters.startDate || riscFilters.endDate || riscFilters.searchText) && (
                      <button
                        onClick={clearAllRiscFilters}
                        className="text-xs text-red-600 hover:text-red-800"
                        title="清除所有RISC筛选"
                      >
                        清除
                      </button>
                    )}
                  </div>
                  
                  {/* RISC 筛选 */}
                  <div className="space-y-2 mb-4 border-b pb-4 flex-shrink-0">
                    <div className="flex items-center">
                      <div className="flex-1 mr-2">
                        <input 
                          type="text" 
                          placeholder="搜索请求编号..." 
                          value={riscFilters.searchText}
                          onChange={(e) => handleRiscFilterChange('searchText', e.target.value)}
                          className="w-full border rounded px-3 py-1.5 text-xs"
                        />
                      </div>
                      <button className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded" title="搜索">
                        <Search className="w-3.5 h-3.5 text-gray-600" />
                      </button>
                    </div>
                    
                    <select 
                      value={riscFilters.status}
                      onChange={(e) => handleRiscFilterChange('status', e.target.value)}
                      className="w-full border rounded px-2 py-1.5 text-xs"
                      title="筛选RISC状态"
                    >
                      <option value="">所有状态</option>
                      <option value="Approved">已批准</option>
                      <option value="Submitted">已提交</option>
                      <option value="Rejected">已拒绝</option>
                    </select>
                    
                    {/* 日期筛选 - 日历图标 */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">日期筛选</span>
                      <div className="relative">
                        <button 
                          onClick={() => setShowRiscDatePicker(!showRiscDatePicker)}
                          className="p-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
                          title="选择日期范围"
                        >
                          <Calendar className="w-4 h-4" />
                        </button>
                        
                        <DatePickerCardLeft
                          isVisible={showRiscDatePicker}
                          onClose={() => setShowRiscDatePicker(false)}
                          startDate={riscFilters.startDate}
                          endDate={riscFilters.endDate}
                          onStartDateChange={(date) => handleRiscFilterChange('startDate', date)}
                          onEndDateChange={(date) => handleRiscFilterChange('endDate', date)}
                          title="RISC表单日期筛选"
                        />
                      </div>
                    </div>
                    
                    {/* 显示当前选择的日期范围 */}
                    {(riscFilters.startDate || riscFilters.endDate) && (
                      <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                        {riscFilters.startDate && `从: ${riscFilters.startDate}`}
                        {riscFilters.startDate && riscFilters.endDate && ' '}
                        {riscFilters.endDate && `到: ${riscFilters.endDate}`}
                      </div>
                    )}
                  </div>
                  
                  {/* RISC 列表 */}
                  <div className="flex-1 min-h-0 overflow-hidden">
                    <div className="border rounded-md overflow-hidden h-full flex flex-col">
                      <table className="w-full text-xs">
                        <thead className="bg-gray-50 border-b flex-shrink-0">
                          <tr>
                            <th className="text-left py-2 px-3 font-medium text-gray-600">RequestNo.</th>
                            <th className="text-left py-2 px-3 font-medium text-gray-600">Update Time</th>
                            <th className="text-left py-2 px-3 font-medium text-gray-600">Status</th>
                            <th className="w-8"></th>
                          </tr>
                        </thead>
                      </table>
                      <div className="flex-1 overflow-y-auto">
                        <table className="w-full text-xs">
                          <tbody className="divide-y divide-gray-200">
                            {getFilteredRiscForms().length > 0 ? (
                              getFilteredRiscForms().map(form => (
                                <tr 
                                  key={form.id}
                                  className={`cursor-pointer transition-all duration-200 ${
                                    selectedRISC === form.id ? 'bg-blue-50' : 'hover:bg-gray-50'
                                  } ${hoveredItem?.id === form.id ? 'ring-2 ring-purple-200' : ''}`}
                                  onClick={() => handleListItemClick(form, 'risc')}
                                  onDoubleClick={() => handleDoubleClick(form, 'risc')}
                                  onMouseEnter={() => handleItemHover(form, 'risc')}
                                  onMouseLeave={handleItemLeave}
                                >
                                  <td className="py-2 px-3">
                                    <a 
                                      href="#" 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleNavigateToDetail(form, 'risc');
                                      }}
                                      className="text-blue-600 font-medium hover:underline"
                                    >
                                      {form.requestNo}
                                    </a>
                                  </td>
                                  <td className="py-2 px-3 text-gray-500">
                                    {form.updateDate}
                                  </td>
                                  <td className="py-2 px-3">
                                    <span className={`px-2 py-0.5 rounded-full ${
                                      form.status === 'Approved' ? 'bg-green-100 text-green-600' : 
                                      form.status === 'Submitted' ? 'bg-blue-100 text-blue-600' : 
                                      'bg-red-100 text-red-600'
                                    }`}>
                                      {form.status}
                                    </span>
                                  </td>
                                  <td className="py-2 px-3">
                                    {form.bindingStatus !== 'current' && (
                                      <div className="group relative">
                                        {getBindingIcon(form)}
                                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 mb-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                                          {getBindingIconTooltip(form)}
                                        </div>
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={4} className="text-center py-4 text-sm text-gray-500">
                                  没有符合条件的RISC表单
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 中央BIM查看器 */}
        <div className="flex-1 bg-gray-100 relative">
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="text-center w-full max-w-6xl">
              {getFilteredObjectGroups().length > 0 ? (
                <div className="bg-white p-6 rounded-lg shadow-lg w-full">
                  {/* 模型版本选择器 */}
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-medium text-gray-700">BIM 模型视图</h3>
                    <select 
                      value={selectedModelVersion}
                      onChange={(e) => handleModelVersionChange(e.target.value)}
                      className="border rounded px-3 py-1 text-sm"
                      title="选择模型版本"
                    >
                      {modelVersions.map(version => (
                        <option key={version.value} value={version.value}>
                          {version.label} - {version.date}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className={`w-full h-96 relative ${
                    viewMode === 'current' 
                      ? 'bg-gradient-to-br from-yellow-200 to-orange-300' 
                      : 'bg-gradient-to-br from-orange-300 to-red-400'
                  } rounded-lg mb-4 flex flex-col items-center justify-start p-4 overflow-y-auto`}>
                    <div className="text-center w-full">
                      <div className="text-lg font-medium text-gray-700 mb-4 flex items-center justify-center">
                        {viewMode === 'current' ? '当前版本' : '历史版本'}
                        {viewMode === 'historical' && (
                          <span className="ml-2 px-2 py-0.5 bg-orange-100 text-orange-800 rounded-full text-xs flex items-center">
                            <History className="w-3 h-3 mr-1" />
                            {selectedModelVersion}
                          </span>
                        )}
                      </div>
                      
                      {/* 构件网格显示 */}
                      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-4 w-full">
                        {getFilteredObjectGroups().map(component => {
                          // 获取各种状态
                          const finalHighlightSet = getFinalHighlightSet();
                          const isInFinalSet = finalHighlightSet.includes(component.id);
                          const isInFilterSet = filterHighlightSet.includes(component.id);
                          const isInManualSet = manualHighlightSet.includes(component.id);
                          const isHovered = hoveredObjects.includes(component.id);
                          const isInCart = bindingCart.objects.find(o => o.id === component.id);
                          
                          // 颜色优先级逻辑
                          let colorClass = '';
                          let borderClass = '';
                          let scaleClass = '';
                          
                          // 1. 悬浮高光 - 最高优先级
                          if (isHovered) {
                            // 当视图中无任何持续高亮时：悬浮显示蓝色临时高亮
                            if (finalHighlightSet.length === 0) {
                              colorClass = 'bg-blue-400 text-white shadow-md';
                              borderClass = 'border-blue-500';
                              scaleClass = 'transform scale-102';
                            }
                            // 当视图中存在任何持续高亮时：悬浮显示黄色临时高亮，覆盖蓝色
                            else {
                              colorClass = 'bg-yellow-400 text-gray-800 shadow-md';
                              borderClass = 'border-yellow-500';
                              scaleClass = 'transform scale-102';
                            }
                          }
                          // 2. 蓝色持续高光 - 第二优先级（最终高亮集）
                          else if (isInFinalSet) {
                            colorClass = 'bg-blue-500 text-white shadow-lg';
                            borderClass = 'border-blue-600';
                            scaleClass = 'transform scale-105';
                          }
                          // 3. 绑定购物车绿色 - 第三优先级
                          else if (isInCart) {
                            colorClass = 'bg-green-400 text-white shadow-md';
                            borderClass = 'border-green-500';
                            scaleClass = '';
                          }
                          // 4. 默认状态 - 最低优先级
                          else {
                            colorClass = 'bg-white bg-opacity-90 text-gray-700 hover:bg-opacity-100';
                            borderClass = 'border-gray-300 hover:border-gray-400';
                            scaleClass = '';
                          }
                          
                          return (
                            <div 
                              key={component.id}
                              className={`p-3 rounded-lg cursor-pointer transition-all relative border-2 ${colorClass} ${borderClass} ${scaleClass}`}
                              onClick={() => handleComponentClick(component)}
                              title={`${component.name} (${component.objectGroup})`}
                            >
                              <div className="text-xs font-medium truncate flex items-center justify-between mb-1">
                                <span className="truncate">{component.name}</span>
                                {component.version !== 'current' && !isHovered && !isInFinalSet && !isInCart && (
                                  <History className="w-3 h-3 text-orange-600 flex-shrink-0 ml-1" />
                                )}
                              </div>
                              <div className="text-xs opacity-75 truncate">{component.objectGroup}</div>
                              <div className="text-xs opacity-60">v: {component.version}</div>
                              
                              {/* 状态指示器 */}
                              <div className="absolute top-1 right-1 flex space-x-1">
                                {isInFilterSet && (
                                  <div className="w-2 h-2 bg-blue-800 rounded-full" title="HyD Code筛选"></div>
                                )}
                                {isInManualSet && (
                                  <div className="w-2 h-2 bg-blue-400 rounded-full" title="手动选中"></div>
                                )}
                                {isInCart && (
                                  <div className="w-2 h-2 bg-green-600 rounded-full" title="在绑定购物车中"></div>
                                )}
                                {isHovered && (
                                  <div className={`w-2 h-2 rounded-full ${
                                    finalHighlightSet.length === 0
                                      ? 'bg-blue-200' 
                                      : 'bg-yellow-600'
                                  }`} title="悬浮高光"></div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      
                      <div className="text-xs text-gray-600">
                        显示 {getFilteredObjectGroups().length} 个构件
                        {hasHydCodeFilter() && (
                          <span className="ml-2 text-blue-600">
                            (HyD Code筛选: {filterHighlightSet.length} 个)
                          </span>
                        )}
                        {manualHighlightSet.length > 0 && (
                          <span className="ml-2 text-purple-600">
                            (手动选择: {manualHighlightSet.length} 个)
                          </span>
                        )}
                      </div>
                      
                      {getFinalHighlightSet().length > 0 && (
                        <div className="text-xs text-blue-600 mt-2 font-medium">
                          最终高亮集: {getFinalHighlightSet().length} 个构件
                        </div>
                      )}
                      {hoveredObjects.length > 0 && (
                        <div className={`text-xs mt-2 font-medium ${
                          getFinalHighlightSet().length === 0
                            ? 'text-blue-600' 
                            : 'text-yellow-600'
                        }`}>
                          悬浮预览: {hoveredObjects.length} 个构件 {getFinalHighlightSet().length === 0 ? '(蓝色)' : '(黄色覆盖)'}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {selectedRISC && (
                    <div className="text-xs text-blue-600 border-t pt-2">
                      关联RISC: {selectedRISC}
                    </div>
                  )}
                  {selectedFile && (
                    <div className="text-xs text-green-600 border-t pt-2">
                      关联文件: {files.find(f => f.id === selectedFile)?.name.substring(0, 30)}...
                    </div>
                  )}
                  
                  {hoveredItem && (
                    <div className="text-xs text-yellow-600 border-t pt-2">
                      悬浮预览: {hoveredItemType === 'risc' ? hoveredItem.requestNo : hoveredItem.name?.substring(0, 30) + '...'}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-gray-500">
                  <div className="text-lg mb-2">无可显示的BIM构件</div>
                  <div className="text-sm">请调整筛选条件或选择其他模型版本</div>
                </div>
              )}
            </div>
          </div>

          {/* 绑定模式状态 */}
          {isBindingMode && (
            <div className="absolute top-4 right-4 flex flex-col items-end space-y-2">
              <div className="bg-blue-100 border border-blue-300 px-3 py-2 rounded-lg text-sm">
                <div className="font-medium text-blue-800 flex items-center">
                  <Target className="w-4 h-4 mr-2" />
                  绑定模式已激活
                </div>
                <div className="text-xs text-blue-600 mt-1">
                  选择一个文件和多个构件进行绑定
                </div>
                {bindingCart.hasHistoricalObjects && (
                  <div className="mt-1 text-xs text-orange-600 flex items-center">
                    <History className="w-3 h-3 mr-1" />
                    已选择历史版本构件
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 右侧栏 */}
        <div className={`bg-white shadow-sm transition-all duration-300 ${rightPanelCollapsed ? 'w-12' : 'w-80'} flex flex-col`}>
          <div className="p-4 border-b flex items-center justify-between flex-shrink-0">
            {!rightPanelCollapsed && <h2 className="font-medium">文件管理</h2>}
            <button 
              onClick={() => setRightPanelCollapsed(!rightPanelCollapsed)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              {rightPanelCollapsed ? <ChevronsLeft className="w-4 h-4" /> : <ChevronsRight className="w-4 h-4" />}
            </button>
          </div>

          {!rightPanelCollapsed && (
            <div className="flex-1 overflow-hidden flex flex-col">
              <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                {/* 文件筛选 */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium">文件列表</h3>
                    <div className="flex items-center space-x-2">
                      {(fileFilters.type || fileFilters.startDate || fileFilters.endDate || fileFilters.searchText || fileFilters.showMyFiles) && (
                        <button
                          onClick={clearAllFileFilters}
                          className="text-xs text-red-600 hover:text-red-800"
                          title="清除所有文件筛选"
                        >
                          清除
                        </button>
                      )}
                      {hasBindingPermission() && (
                        <button className="p-1 text-gray-600 hover:text-gray-900" title="添加文件">
                          <Plus className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-4 border-b pb-4">
                    <div className="flex items-center">
                      <div className="flex-1 mr-2">
                        <input 
                          type="text" 
                          placeholder="搜索文件名..." 
                          value={fileFilters.searchText}
                          onChange={(e) => handleFileFilterChange('searchText', e.target.value)}
                          className="w-full border rounded px-3 py-1.5 text-xs"
                        />
                      </div>
                      <button className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded" title="搜索">
                        <Search className="w-3.5 h-3.5 text-gray-600" />
                      </button>
                    </div>
                    
                    <select 
                      value={fileFilters.type}
                      onChange={(e) => handleFileFilterChange('type', e.target.value)}
                      className="w-full border rounded px-3 py-1.5 text-xs"
                      title="筛选文件类型"
                    >
                      <option value="">所有类型</option>
                      <option value="Method Statement">施工方案</option>
                      <option value="Material Submission">物料提交</option>
                      <option value="Working Drawings">施工图纸</option>
                      <option value="Test Result">测试报告</option>
                    </select>
                    
                    {/* 我上传的文件筛选 - 仅管理员和授权用户可见 */}
                    {!isViewOnlyUser() && (
                      <div className="flex items-center">
                        <input 
                          type="checkbox"
                          id="showMyFiles"
                          checked={fileFilters.showMyFiles}
                          onChange={(e) => handleFileFilterChange('showMyFiles', e.target.checked)}
                          className="mr-2 rounded"
                        />
                        <label htmlFor="showMyFiles" className="text-xs text-gray-700 cursor-pointer">
                          我上传的文件
                        </label>
                      </div>
                    )}
                    
                    {/* 日期筛选 - 日历图标 */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">日期筛选</span>
                      <div className="relative">
                        <button 
                          onClick={() => setShowFileDatePicker(!showFileDatePicker)}
                          className="p-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
                          title="选择日期范围"
                        >
                          <Calendar className="w-4 h-4" />
                        </button>
                        
                        <DatePickerCardRight
                          isVisible={showFileDatePicker}
                          onClose={() => setShowFileDatePicker(false)}
                          startDate={fileFilters.startDate}
                          endDate={fileFilters.endDate}
                          onStartDateChange={(date) => handleFileFilterChange('startDate', date)}
                          onEndDateChange={(date) => handleFileFilterChange('endDate', date)}
                          title="文件日期筛选"
                        />
                      </div>
                    </div>
                    
                    {/* 显示当前选择的日期范围 */}
                    {(fileFilters.startDate || fileFilters.endDate) && (
                      <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                        {fileFilters.startDate && `从: ${fileFilters.startDate}`}
                        {fileFilters.startDate && fileFilters.endDate && ' '}
                        {fileFilters.endDate && `到: ${fileFilters.endDate}`}
                      </div>
                    )}
                  </div>
                </div>

                {/* 文件列表 */}
                <div className="flex-1 min-h-0">
                  {/* 绑定模式状态指示器 - 现在显示在文件列表上方 */}
                  {isBindingMode && (
                    <div className="bg-blue-100 border border-blue-300 px-3 py-2 rounded-lg text-sm mb-3">
                      <div className="font-medium text-blue-800 flex items-center justify-between">
                        <div className="flex items-center">
                          <Target className="w-4 h-4 mr-2" />
                          绑定模式已激活
                        </div>
                        <button 
                          onClick={exitBindingMode}
                          className="bg-red-600 text-white text-xs py-1 px-2 rounded hover:bg-red-700"
                        >
                          退出
                        </button>
                      </div>
                      <div className="text-xs text-blue-600 mt-1">
                        选择一个文件和多个构件进行绑定
                      </div>
                      {bindingCart.hasHistoricalObjects && (
                        <div className="mt-1 text-xs text-orange-600 flex items-center">
                          <History className="w-3 h-3 mr-1" />
                          已选择历史版本构件
                        </div>
                      )}
                    </div>
                  )}
                  <div className="space-y-2 overflow-y-auto file-list-container">
                    {getFilteredFiles().length > 0 ? (
                      getFilteredFiles().map(file => {
                        const isInCart = bindingCart.files.find(f => f.id === file.id);
                        const canModify = currentUser === 'Administrator' || file.uploadedBy === currentUser;
                        
                        return (
                          <div 
                            key={file.id}
                            className={`p-3 border rounded-md cursor-pointer transition-all duration-200 ${
                              selectedFile === file.id ? 'bg-blue-50 border-blue-200' : 'bg-white hover:bg-gray-50'
                            } ${hoveredItem?.id === file.id ? 'ring-1 ring-purple-200' : ''} ${
                              isInCart ? 'bg-green-50 border-green-200' : ''
                            }`}
                            onClick={() => handleListItemClick(file, 'file')}
                            onDoubleClick={() => handleDoubleClick(file, 'file')}
                            onMouseEnter={() => handleItemHover(file, 'file')}
                            onMouseLeave={handleItemLeave}
                          >
                            <div className="flex items-center">
                              <div className="mr-3 flex-shrink-0">
                                {file.type === 'Method Statement' && (
                                  <div className="w-10 h-10 bg-red-100 rounded-md flex items-center justify-center">
                                    <FileText className="w-5 h-5 text-red-500" />
                                  </div>
                                )}
                                {file.type === 'Material Submission' && (
                                  <div className="w-10 h-10 bg-blue-100 rounded-md flex items-center justify-center">
                                    <FileText className="w-5 h-5 text-blue-500" />
                                  </div>
                                )}
                                {file.type === 'Working Drawings' && (
                                  <div className="w-10 h-10 bg-green-100 rounded-md flex items-center justify-center">
                                    <FileText className="w-5 h-5 text-green-500" />
                                  </div>
                                )}
                                {file.type === 'Test Result' && (
                                  <div className="w-10 h-10 bg-purple-100 rounded-md flex items-center justify-center">
                                    <FileText className="w-5 h-5 text-purple-500" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <a 
                                  href="#"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleNavigateToDetail(file, 'file');
                                  }}
                                  className="text-sm font-medium text-gray-900 hover:text-blue-600 block truncate"
                                  title={file.name}
                                >
                                  {file.name}
                                </a>
                                <div className="flex items-center mt-1">
                                  <span className={`text-xs ${
                                    file.type === 'Method Statement' ? 'text-red-500' :
                                    file.type === 'Material Submission' ? 'text-blue-500' :
                                    file.type === 'Working Drawings' ? 'text-green-500' :
                                    'text-purple-500'
                                  }`}>
                                    {file.type}
                                  </span>
                                  <span className="text-xs text-gray-500 ml-4">
                                    上传: {file.uploadDate}
                                  </span>
                                </div>
                                <div className="text-xs text-gray-500">
                                  更新: {file.updateDate}
                                </div>
                                {file.uploadedBy === currentUser && (
                                  <div className="text-xs text-blue-600 mt-1">
                                    我上传的文件
                                  </div>
                                )}
                                {file.bindingStatus === 'history' && (
                                  <div className="text-xs text-orange-600 mt-1 flex items-center">
                                    <History className="w-3 h-3 mr-1" />
                                    历史版本绑定
                                  </div>
                                )}
                              </div>
                              <div className="ml-2 flex items-center space-x-1">
                                {!isBindingMode && hasBindingPermission() && (file.bindingStatus === 'current' || file.bindingStatus === 'history') && canModify && (
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      editExistingBinding(file);
                                    }}
                                    className="text-green-600 hover:text-green-800 p-1"
                                    title="修改绑定关系"
                                  >
                                    <Link className="w-4 h-4" />
                                  </button>
                                )}
                                {file.bindingStatus !== 'current' && (
                                  <div className="group relative">
                                    {getBindingIcon(file)}
                                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 mb-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                                      {getBindingIconTooltip(file)}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-4 text-sm text-gray-500">
                        没有符合条件的文件
                      </div>
                    )}
                  </div>
                </div>
                
                {/* 绑定管理面板 - 在右侧文件列表下方 */}
                {isBindingMode && (
                  <div className="border-t pt-4 mt-4 flex-shrink-0">
                    <h3 className="text-sm font-medium mb-3 flex items-center">
                      <Link className="w-4 h-4 mr-2" />
                      绑定管理面板
                    </h3>
                    <BindingCartContent />
                    
                    {/* 绑定操作按钮 - 确保始终显示 */}
                    <div className="flex space-x-2 mt-4">
                      <button 
                        onClick={submitBinding}
                        className="flex-1 bg-blue-600 text-white text-xs py-2 px-3 rounded hover:bg-blue-700 disabled:bg-gray-400"
                        disabled={bindingCart.files.length !== 1 || bindingCart.objects.length === 0}
                      >
                        提交绑定
                      </button>
                      <button 
                        onClick={exitBindingMode}
                        className="flex-1 bg-gray-600 text-white text-xs py-2 px-3 rounded hover:bg-gray-700"
                      >
                        取消
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 快速对比面板 */}
      <QuickComparePanel />
      
      {/* 绑定管理面板 - 悬浮购物车 */}
      <BindingManagementPanel />
    </div>
  );
};

export default DWSSBIMDashboard;