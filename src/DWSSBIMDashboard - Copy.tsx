﻿// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import { ChevronDown, Search, Filter, Plus, Eye, Edit, Trash2, Settings, Download, Upload, Link, Users, Activity, Home, Menu, X, CheckCircle, AlertCircle, Clock, FileText, Folder, Calendar, GitCompare, Info, HelpCircle, ArrowLeft, ChevronRight, ArrowRight, List, Layers, ChevronsLeft, ChevronsRight, ShoppingCart, Target, Mail, History, Lock, RefreshCw } from 'lucide-react';
import userGuideContent from '../USER_GUIDE.md?raw';

// Error Boundary Component
class ErrorBoundaryComponent extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Component rendering error:", error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-red-50 flex flex-col items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-lg w-full">
            <h2 className="text-xl font-bold text-red-600 mb-4">Application Error Occurred</h2>
            <div className="bg-gray-100 p-4 rounded mb-4 overflow-auto max-h-64">
              <pre className="text-sm text-gray-800">{this.state.error && this.state.error.toString()}</pre>
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Define interfaces
interface HydCode {
  project: string;
  contractor: string;
  location: string;
  structure: string;
  space: string;
  grid: string;
  cat: string;
}

interface Component {
  id: string;
  name: string;
  version: string;
  modelVersionId: string; // New: Model version ID the component belongs to
  objectGroup: string;
  hydCode: HydCode;
  properties: {
    position: string;
    material: string;
    volume?: string;
    height?: string;
    length?: string;
    status: string;
  };
}

interface ObjectGroup {
  id: string;
  name: string;
  version: string;
  modelVersionId: string; // New: Model version ID the object group belongs to
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
  bindingStatus: 'history' | 'current';
  linkedToCurrent: boolean;
  objects: string[]; // Component ID list
  boundModelVersionId?: string; // New: Model version ID when bound
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
  bindingStatus: 'history' | 'current';
  uploadedBy: string;
  linkedToCurrent: boolean;
  objects: string[]; // Component ID list
  boundModelVersionId?: string; // New: Model version ID when bound
  hydCode: HydCode;
  changes?: string[];
  version?: number;
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
  objects: Component[];
  hasHistoricalObjects: boolean;
}

// Add historical component information interface
interface HistoricalComponentInfo {
  componentId: string;
  currentVersionId: string;
  historicalVersionId: string;
  fileInfo: FileItem | RiscForm;
  fileType: 'file' | 'risc';
  changes: string[];
}

// Add floating panel state interface
interface FloatingPanel {
  visible: boolean;
  componentInfo: HistoricalComponentInfo | null;
  isHistoricalView: boolean; // Whether currently in historical view mode
}

const DWSSBIMDashboard = () => {
  const [currentUser, setCurrentUser] = useState('Administrator');
  const [selectedProject, setSelectedProject] = useState('HY202404');
  const [isBindingMode, setIsBindingMode] = useState(false);
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedRISC, setSelectedRISC] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<number | null>(null);
  const [selectedObjectGroup, setSelectedObjectGroup] = useState<any>(null);
  const [viewMode, setViewMode] = useState('current');
  const [selectedModelVersion, setSelectedModelVersion] = useState('current');
  
  // Component tree state
  const [showComponentTree, setShowComponentTree] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  const [highlightedComponentId, setHighlightedComponentId] = useState<string | null>(null);
  
  // Model tree highlight state - New independent highlight state
  const [treeHighlightedComponentId, setTreeHighlightedComponentId] = useState<string | null>(null);
  const [treeHighlightedGroupName, setTreeHighlightedGroupName] = useState<string | null>(null);
  
  // Model tree white/gray display state - New state management
  const [treeWhiteComponents, setTreeWhiteComponents] = useState<string[]>([]); // List of component IDs displayed in white
  const [treeWhiteGroups, setTreeWhiteGroups] = useState<string[]>([]); // List of group names displayed in white
  const [treeShowAllWhite, setTreeShowAllWhite] = useState(true); // Whether all should be displayed in white (initial state)
  const [showUserGuide, setShowUserGuide] = useState(false); // User guide popup state
  
  // Add historical view related states
  const [floatingPanel, setFloatingPanel] = useState<FloatingPanel>({
    visible: false,
    componentInfo: null,
    isHistoricalView: false
  });
  
  // Add floating panel position and drag state
  const [panelPosition, setPanelPosition] = useState({ x: 0, y: 100 }); // Position relative to BIM view
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  // Add original model version state for historical view switching
  const [originalModelVersion, setOriginalModelVersion] = useState('current');
  
  // Right-click menu state
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    componentId: string | null;
    isFromTree?: boolean; // New flag indicating if from model tree
  }>({
    visible: false,
    x: 0,
    y: 0,
    componentId: null,
    isFromTree: false
  });
  
  // File management page state
  const [showFileManagement, setShowFileManagement] = useState(false);
  const [selectedComponentsForFiles, setSelectedComponentsForFiles] = useState<string[]>([]);
  
  // Highlight system - Redesigned
  const [filterHighlightSet, setFilterHighlightSet] = useState<string[]>([]); // Filter highlight set
  const [manualHighlightSet, setManualHighlightSet] = useState<string[]>([]); // Manual highlight set
  // Final highlight set is calculated as: filterHighlightSet ∪ manualHighlightSet
  
  const [hoveredObjects, setHoveredObjects] = useState<string[]>([]);
  const [hoveredItem, setHoveredItem] = useState<any>(null);
  const [hoveredItemType, setHoveredItemType] = useState<string | null>(null);
  
  // Add missing state variables
  const [bindingCart, setBindingCart] = useState<BindingCart>({ files: [], objects: [], hasHistoricalObjects: false });
  const [showBindingCart, setShowBindingCart] = useState(false);
  const [detailItem, setDetailItem] = useState<any>(null);
  
  const [showQuickCompare, setShowQuickCompare] = useState(false);
  const [compareData, setCompareData] = useState(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showAdminInviteModal, setShowAdminInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('');
  
  // Add admin page state
  const [adminSubView, setAdminSubView] = useState('users'); // 'users' | 'logs'
  
  // Date picker state
  const [showRiscDatePicker, setShowRiscDatePicker] = useState(false);
  const [showFileDatePicker, setShowFileDatePicker] = useState(false);
  
  // Filter conditions
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
    searchText: '',
    showCurrentModelBinding: false // New: Only show items bound to current model
  });
  
  const [fileFilters, setFileFilters] = useState({
    type: '',
    startDate: '',
    endDate: '',
    searchText: '',
    showMyFiles: false,
    showCurrentModelBinding: false // New: Only show items bound to current model
  });

  // Model version list
  const modelVersions: ModelVersion[] = [
    { value: 'current', label: 'Current Version (Latest)', date: '2025-03-08' },
    { value: 'v1.8', label: 'Version 1.8', date: '2024-12-10' }
  ];

  // Mock data - Individual components (replacing object groups)
  const [components, setComponents] = useState<Component[]>([
    // Foundation components
    { 
      id: 'F-A-001', 
      name: 'Foundation Block A1', 
      version: 'current', 
      modelVersionId: 'current',
      objectGroup: 'OBJ-GROUP-001',
      hydCode: { project: 'HY202404', contractor: 'CSG', location: 'SITE-A', structure: 'FOUNDATION', space: 'WC_B8', grid: 'ST_FD', cat: 'CONCRETE' },
      properties: { 
        position: 'Zone A Foundation Area Block 1', 
        material: 'C40 Concrete', 
        volume: '15.2m³',
        status: 'current'
      }
    },
    { 
      id: 'F-A-002', 
      name: 'Foundation Block A2', 
      version: 'current', 
      modelVersionId: 'current',
      objectGroup: 'OBJ-GROUP-001',
      hydCode: { project: 'HY202404', contractor: 'CSG', location: 'SITE-A', structure: 'FOUNDATION', space: 'WC_B8', grid: 'ST_FD', cat: 'CONCRETE' },
      properties: { 
        position: 'Zone A Foundation Area Block 2', 
        material: 'C40 Concrete', 
        volume: '15.2m³',
        status: 'current'
      }
    },
    { 
      id: 'F-A-003', 
      name: 'Foundation Block A3', 
      version: 'current', 
      modelVersionId: 'current',
      objectGroup: 'OBJ-GROUP-001',
      hydCode: { project: 'HY202404', contractor: 'CSG', location: 'SITE-A', structure: 'FOUNDATION', space: 'WC_B8', grid: 'ST_FD', cat: 'CONCRETE' },
      properties: { 
        position: 'Zone A Foundation Area Block 3', 
        material: 'C40 Concrete', 
        volume: '15.2m³',
        status: 'current'
      }
    },
    // Column components  
    { 
      id: 'COL-B-012-BASE', 
      name: 'Column B12 Base', 
      version: 'current', 
      modelVersionId: 'current',
      objectGroup: 'OBJ-GROUP-002',
      hydCode: { project: 'HY202404', contractor: 'CSG', location: 'SITE-A', structure: 'FRAME', space: 'WC_B8', grid: 'ST_FD', cat: 'CONCRETE' },
      properties: { 
        position: 'Grid B-12 Column Base', 
        material: 'C45 Concrete', 
        height: '1.0m',
        status: 'current'
      }
    },
    { 
      id: 'COL-B-012-MAIN', 
      name: 'Column B12 Main', 
      version: 'current', 
      modelVersionId: 'current',
      objectGroup: 'OBJ-GROUP-002',
      hydCode: { project: 'HY202404', contractor: 'CSG', location: 'SITE-A', structure: 'FRAME', space: 'WC_B8', grid: 'ST_FD', cat: 'CONCRETE' },
      properties: { 
        position: 'Grid B-12 Column Main', 
        material: 'C45 Concrete', 
        height: '2.0m',
        status: 'current'
      }
    },
    { 
      id: 'COL-B-012-CAP', 
      name: 'Column B12 Cap', 
      version: 'current', 
      modelVersionId: 'current',
      objectGroup: 'OBJ-GROUP-002',
      hydCode: { project: 'HY202404', contractor: 'CSG', location: 'SITE-A', structure: 'FRAME', space: 'WC_B8', grid: 'ST_FD', cat: 'CONCRETE' },
      properties: { 
        position: 'Grid B-12 Column Cap', 
        material: 'C45 Concrete', 
        height: '0.5m',
        status: 'current'
      }
    },
    // Beam components
    { 
      id: 'BEAM-C-025-01', 
      name: 'Beam C25-1', 
      version: 'current', 
      modelVersionId: 'current',
      objectGroup: 'OBJ-GROUP-003',
      hydCode: { project: 'HY202404', contractor: 'CSG', location: 'SITE-A', structure: 'FRAME', space: 'WC_B9', grid: 'ST_FE', cat: 'CONCRETE' },
      properties: { 
        position: 'Level 3 Beam Network Segment 1', 
        material: 'C40 Concrete', 
        length: '5.1m',
        status: 'current'
      }
    },
    { 
      id: 'BEAM-C-025-02', 
      name: 'Beam C25-2', 
      version: 'current', 
      modelVersionId: 'current',
      objectGroup: 'OBJ-GROUP-003',
      hydCode: { project: 'HY202404', contractor: 'CSG', location: 'SITE-A', structure: 'FRAME', space: 'WC_B9', grid: 'ST_FE', cat: 'CONCRETE' },
      properties: { 
        position: 'Level 3 Beam Network Segment 2', 
        material: 'C40 Concrete', 
        length: '5.2m',
        status: 'current'
      }
    },
    { 
      id: 'BEAM-C-025-03', 
      name: 'Beam C25-3', 
      version: 'current', 
      modelVersionId: 'current',
      objectGroup: 'OBJ-GROUP-003',
      hydCode: { project: 'HY202404', contractor: 'CSG', location: 'SITE-A', structure: 'FRAME', space: 'WC_B9', grid: 'ST_FE', cat: 'CONCRETE' },
      properties: { 
        position: 'Level 3 Beam Network Segment 3', 
        material: 'C40 Concrete', 
        length: '5.0m',
        status: 'current'
      }
    },
    // Historical components - Updated to same ID as current components but different version
    { 
      id: 'F-A-001', // Same ID as current component
      name: 'Foundation Block A1 (Historical)', 
      version: 'v1.8', 
      modelVersionId: 'v1.8', // Historical version ID
      objectGroup: 'OBJ-GROUP-001',
      hydCode: { project: 'HY202404', contractor: 'CSG', location: 'SITE-A', structure: 'FOUNDATION', space: 'WC_B8', grid: 'ST_FD', cat: 'CONCRETE' },
      properties: { 
        position: 'Zone A Foundation Area Block 1 (Historical)', 
        material: 'C35 Concrete', 
        volume: '19.1m³',
        status: 'history'
      }
    },
    { 
      id: 'F-A-002', // Same ID as current component
      name: 'Foundation Block A2 (Historical)', 
      version: 'v1.8', 
      modelVersionId: 'v1.8', // Historical version ID
      objectGroup: 'OBJ-GROUP-001',
      hydCode: { project: 'HY202404', contractor: 'CSG', location: 'SITE-A', structure: 'FOUNDATION', space: 'WC_B8', grid: 'ST_FD', cat: 'CONCRETE' },
      properties: { 
        position: 'Zone A Foundation Area Block 2 (Historical)', 
        material: 'C35 Concrete', 
        volume: '19.1m³',
        status: 'history'
      }
    },
    // New deleted item example - RISC form
    { 
      id: 'DEL0001-RISC-TMP-B-5-00001', 
      requestNo: 'DEL0001-RISC-TMP-B-5-00001', 
      updateDate: '2024-11-15', 
      status: 'Approved', 
      bindingStatus: 'history', 
      linkedToCurrent: false, 
      objects: ['TEMP-COL-B-999'], // Temporary column component, deleted in latest version
      createdBy: 'Sarah Wilson',
      changes: ['Temporary column component deleted', 'Component removed due to design optimization', 'RISC form archived and saved'],
      hydCode: { project: 'HY202404', contractor: 'CSG', location: 'SITE-A', structure: 'FRAME', space: 'WC_C2', grid: 'ST_GE', cat: 'CONCRETE' },
      boundModelVersionId: 'v1.8'
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
      hydCode: { project: 'HY202404', contractor: 'CSG', location: 'SITE-A', structure: 'FOUNDATION', space: 'WC_B8', grid: 'ST_FD', cat: 'CONCRETE' },
      boundModelVersionId: 'current'
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
      hydCode: { project: 'HY202404', contractor: 'CSG', location: 'SITE-A', structure: 'FRAME', space: 'WC_B8', grid: 'ST_FD', cat: 'CONCRETE' },
      boundModelVersionId: 'current'
    },
    { 
      id: 'RN0001-RISC-TRC-CS-02001', 
      requestNo: 'RN0001-RISC-TRC-CS-02001', 
      updateDate: '2025-02-20', 
      status: 'Submitted', 
      bindingStatus: 'history', 
      linkedToCurrent: true, // Changed to true for testing floating panel functionality
      objects: ['F-A-002'], // Associated with current component
      createdBy: 'Mike Johnson', 
      changes: ['Component position adjusted', 'Material parameters updated'],
      hydCode: { project: 'HY202404', contractor: 'CSG', location: 'SITE-A', structure: 'FOUNDATION', space: 'WC_B8', grid: 'ST_FD', cat: 'CONCRETE' },
      boundModelVersionId: 'v1.8'
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
      hydCode: { project: 'HY202404', contractor: 'CSG', location: 'SITE-A', structure: 'FOUNDATION', space: 'WC_B8', grid: 'ST_FD', cat: 'CONCRETE' },
      boundModelVersionId: 'current'
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
      hydCode: { project: 'HY202404', contractor: 'CSG', location: 'SITE-A', structure: 'FRAME', space: 'WC_B9', grid: 'ST_FE', cat: 'CONCRETE' },
      boundModelVersionId: 'current'
    },
    { 
      id: 4, 
      name: '0521 Historical Working Drawing v1.pdf', 
      uploadDate: '2024-08-20', 
      updateDate: '2024-08-25', 
      type: 'Working Drawings', 
      bindingStatus: 'history', 
      uploadedBy: 'Sarah Wilson', 
      linkedToCurrent: true, // Changed to true for testing floating panel functionality
      objects: ['F-A-001'], // Associated with current component
      changes: ['Component position adjusted', 'Geometric shape optimized'],
      hydCode: { project: 'HY202404', contractor: 'CSG', location: 'SITE-A', structure: 'FOUNDATION', space: 'WC_B8', grid: 'ST_FD', cat: 'CONCRETE' },
      boundModelVersionId: 'v1.8'
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
      hydCode: { project: 'HY202404', contractor: 'CSG', location: 'SITE-A', structure: 'FOUNDATION', space: 'WC_B8', grid: 'ST_FD', cat: 'CONCRETE' },
      boundModelVersionId: 'current'
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
      hydCode: { project: 'HY202404', contractor: 'CSG', location: 'SITE-A', structure: 'FRAME', space: 'WC_B8', grid: 'ST_FD', cat: 'CONCRETE' },
      boundModelVersionId: 'current'
    },
    { 
      id: 7, 
      name: '0520 Old Method Statement for Concrete Pouring.pdf', 
      uploadDate: '2025-01-10', 
      updateDate: '2025-01-10', 
      type: 'Method Statement', 
      bindingStatus: 'history', 
      uploadedBy: 'John Doe', 
      linkedToCurrent: false, 
      objects: ['DEL-COMP-001', 'DEL-COMP-002'], // Originally bound components, but deleted in latest version
      changes: ['Component deleted from latest version', 'Original associated components: DEL-COMP-001, DEL-COMP-002'],
      hydCode: { project: 'HY202404', contractor: 'CSG', location: 'SITE-A', structure: 'FOUNDATION', space: 'WC_B8', grid: 'ST_FD', cat: 'CONCRETE' },
      boundModelVersionId: 'v1.8'
    },
    { 
      id: 8, 
      name: '0525 Obsolete Safety Report.pdf', 
      uploadDate: '2025-02-15', 
      updateDate: '2025-02-15', 
      type: 'Test Result', 
      bindingStatus: 'history', 
      uploadedBy: 'Administrator', 
      linkedToCurrent: false, 
      objects: ['OLD-STEEL-BEAM-001'], // Originally bound steel beam component, but deleted in latest version
      changes: ['Component deleted from latest version', 'Original associated steel beam component removed in design modification'],
      hydCode: { project: 'HY202404', contractor: 'CSG', location: 'SITE-A', structure: 'FRAME', space: 'WC_B9', grid: 'ST_FE', cat: 'STEEL' },
      boundModelVersionId: 'v1.8'
    },
    // Example of deleted item
    { 
      id: 9, 
      name: '0530 Removed Foundation Inspection Report.pdf', 
      uploadDate: '2024-12-01', 
      updateDate: '2024-12-01', 
      type: 'Inspection Report', 
      bindingStatus: 'history', 
      uploadedBy: 'Mike Johnson', 
      linkedToCurrent: false, 
      objects: ['TEMP-FOUND-101', 'TEMP-FOUND-102'], // Temporary foundation components, deleted in latest version
      changes: ['Temporary foundation components deleted', 'Components removed due to design change', 'Related inspection report archived'],
      hydCode: { project: 'HY202404', contractor: 'CSG', location: 'SITE-A', structure: 'FOUNDATION', space: 'WC_C1', grid: 'ST_GD', cat: 'CONCRETE' },
      boundModelVersionId: 'v1.8'
    }
  ]);

  // Admin backend user data
  const [adminUsers, setAdminUsers] = useState([
    { id: 1, name: 'John Doe', email: 'john.doe@example.com', role: 'Authorized User', lastLogin: '2025-03-08 09:15' },
    { id: 2, name: 'Jane Smith', email: 'jane.smith@example.com', role: 'Authorized User', lastLogin: '2025-03-08 08:30' },
    { id: 3, name: 'Mike Johnson', email: 'mike.johnson@example.com', role: 'View-only User', lastLogin: '2025-03-07 16:45' },
    { id: 4, name: 'Sarah Wilson', email: 'sarah.wilson@example.com', role: 'Authorized User', lastLogin: '2025-03-05 14:20' },
    { id: 5, name: 'Tom Chen', email: 'tom.chen@example.com', role: 'Admin', lastLogin: '2025-03-08 10:00' }
  ]);

  // Activity log data
  const [activityLogs, setActivityLogs] = useState([
    { id: 1, timestamp: '2025-03-08 14:30:15', user: 'Administrator', role: 'Admin', action: 'FILE_BIND_SUBMIT', target: 'File', targetDetail: 'Construction Drawing.pdf', details: 'Associated file "Construction Drawing.pdf" with components "OBJ-GROUP-001, OBJ-GROUP-002"', ip: '192.168.1.100' },
    { id: 2, timestamp: '2025-03-08 13:15:22', user: 'John Doe', role: 'Authorized User', action: 'RISC_CREATE_REQUEST', target: 'RISC Form', targetDetail: 'TRN0001-RISC-TRC-B-5-00003', details: 'Created new RISC form "TRN0001-RISC-TRC-B-5-00003"', ip: '192.168.1.101' },
    { id: 3, timestamp: '2025-03-08 12:45:33', user: 'Jane Smith', role: 'Authorized User', action: 'FILE_UPLOAD', target: 'File', targetDetail: 'Material Test Report.pdf', details: 'Uploaded file "Material Test Report.pdf"', ip: '192.168.1.102' },
    { id: 4, timestamp: '2025-03-08 11:20:18', user: 'Mike Johnson', role: 'View-only User', action: 'LOGIN_SUCCESS', target: 'User', targetDetail: 'mike.johnson@example.com', details: 'User successfully logged into system', ip: '192.168.1.103' },
    { id: 5, timestamp: '2025-03-08 10:55:44', user: 'Administrator', role: 'Admin', action: 'USER_ROLE_CHANGE', target: 'User', targetDetail: 'sarah.wilson@example.com', details: 'Changed user "Sarah Wilson" role from "View-only User" to "Authorized User"', ip: '192.168.1.100' }
  ]);

  // User search state
  const [userSearchText, setUserSearchText] = useState('');
  
  // Activity log filter state
  const [logFilters, setLogFilters] = useState({
    user: '',
    role: '',
    startDate: '',
    endDate: '',
    searchText: ''
  });

  // HyD Code filter options
  const hydCodeOptions = {
    project: ['HY202404', 'HY202405'],
    contractor: ['CSG', 'AECOM', 'HKJV'],
    location: ['SITE-A', 'SITE-B', 'SITE-C'],
    structure: ['FOUNDATION', 'FRAME', 'ROOF', 'WALL'],
    space: ['WC_B8', 'WC_B9', 'WC_C1', 'WC_C2'],
    grid: ['ST_FD', 'ST_FE', 'ST_GD', 'ST_GE'],
    cat: ['CONCRETE', 'STEEL', 'TIMBER', 'COMPOSITE']
  };

  // Check if user has binding permission
  const hasBindingPermission = () => {
    return currentUser === 'Administrator' || currentUser === 'John Doe' || currentUser === 'Jane Smith';
  };

  // Check if user is admin
  const isAdmin = () => {
    return currentUser === 'Administrator';
  };

  // Check if user is a view-only user
  const isViewOnlyUser = () => {
    return currentUser === 'Mike Johnson';
  };

  // Calculate final highlight set (Final Highlight Set = Filter Highlight Set ∪ Manual Highlight Set)
  const getFinalHighlightSet = () => {
    const finalSet = [...new Set([...filterHighlightSet, ...manualHighlightSet])];
    return finalSet;
  };

  // Check if HyD Code filter is active - Updated to support historical view
  const hasHydCodeFilter = () => {
    // HYDCODE is not available in historical view mode
    if (floatingPanel.isHistoricalView) return false;
    
    return Object.keys(hydCodeFilter).some(key => {
      if (key === 'project') return false; // project is not counted in active filters
      return hydCodeFilter[key as keyof HydCode] !== '';
    });
  };

  // Clear all filter functions
  const clearAllRiscFilters = () => {
    setRiscFilters({
      status: '',
      startDate: '',
      endDate: '',
      searchText: '',
      showCurrentModelBinding: false
    });
  };

  const clearAllFileFilters = () => {
    setFileFilters({
      type: '',
      startDate: '',
      endDate: '',
      searchText: '',
      showMyFiles: false,
      showCurrentModelBinding: false
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
    // When manually clearing HyD Code filters, clear the filter highlight set but keep the manual highlight set
    setFilterHighlightSet([]);
  };

  // Clear all user selections - New feature
  const clearAllUserSelections = () => {
    // Clear all filter conditions
    setHydCodeFilter({
      project: 'HY202404',
      contractor: '',
      location: '',
      structure: '',
      space: '',
      grid: '',
      cat: ''
    });
    setRiscFilters({
      status: '',
      startDate: '',
      endDate: '',
      searchText: '',
      showCurrentModelBinding: false
    });
    setFileFilters({
      type: '',
      startDate: '',
      endDate: '',
      searchText: '',
      showMyFiles: false,
      showCurrentModelBinding: false
    });
    
    // Clear all highlights and selection states
    setFilterHighlightSet([]);
    setManualHighlightSet([]);
    setSelectedRISC(null);
    setSelectedFile(null);
    setHoveredObjects([]);
    setHoveredItem(null);
    setHoveredItemType(null);
  };

  // Clear all RISC filters and related selections - Enhanced version
  const clearAllRiscFiltersAndSelections = () => {
    setRiscFilters({
      status: '',
      startDate: '',
      endDate: '',
      searchText: '',
      showCurrentModelBinding: false
    });
    
    // If a RISC is currently selected, also clear related highlights
    if (selectedRISC) {
      setSelectedRISC(null);
      // Only clear manual highlights related to this RISC, keep other filter-generated highlights
      const currentRisc = riscForms.find(r => r.id === selectedRISC);
      if (currentRisc) {
        setManualHighlightSet(prev => 
          prev.filter(id => !currentRisc.objects.includes(id))
        );
      }
    }
  };

  // Clear all file filters and related selections - Enhanced version
  const clearAllFileFiltersAndSelections = () => {
    setFileFilters({
      type: '',
      startDate: '',
      endDate: '',
      searchText: '',
      showMyFiles: false,
      showCurrentModelBinding: false
    });
    
    // If a file is currently selected, also clear related highlights
    if (selectedFile) {
      setSelectedFile(null);
      // Only clear manual highlights related to this file, keep other filter-generated highlights
      const currentFile = files.find(f => f.id === selectedFile);
      if (currentFile) {
        setManualHighlightSet(prev => 
          prev.filter(id => !currentFile.objects.includes(id))
        );
      }
    }
  };

  // Filter RISC forms - Fixed HyD Code + highlighted component priority logic + historical view support
  const getFilteredRiscForms = () => {
    let allRiscForms = riscForms;
    
    // Historical version view mode: only show items that match both component ID and version ID
    if (viewMode === 'historical' && selectedModelVersion !== 'current') {
      // Get component IDs list in current historical view
      const currentViewComponentIds = components
        .filter(c => c.modelVersionId === selectedModelVersion)
        .map(c => c.id);
      
      allRiscForms = riscForms.filter(form => {
        // Check if item's bound component IDs exist in current historical view
        const hasMatchingComponents = form.objects.some(objId => 
          currentViewComponentIds.includes(objId)
        );
        
        // Check if item's bound version ID matches current selected historical version
        const hasMatchingVersion = form.boundModelVersionId === selectedModelVersion;
        
        // Only show items that satisfy both component ID and version ID conditions
        return hasMatchingComponents && hasMatchingVersion;
      });
    } else if (floatingPanel.isHistoricalView && floatingPanel.componentInfo) {
      // Floating panel historical view mode: only show items related to current floating panel component
      allRiscForms = riscForms.filter(form => 
        form.objects.includes(floatingPanel.componentInfo!.componentId) ||
        (form.bindingStatus === 'history' && form.linkedToCurrent)
      );
    } else {
      // Current view mode: show all RISC and file forms
      // Keep existing logic unchanged
    }

    let filtered = allRiscForms.filter(form => {
      // Basic filter conditions (excluding object associations)
      if (riscFilters.status && form.status !== riscFilters.status) return false;
      if (riscFilters.startDate && new Date(form.updateDate) < new Date(riscFilters.startDate)) return false;
      if (riscFilters.endDate && new Date(form.updateDate) > new Date(riscFilters.endDate)) return false;
      if (riscFilters.searchText && !form.requestNo.toLowerCase().includes(riscFilters.searchText.toLowerCase())) return false;
      
      // Current model binding filter: only show items bound to current model
      if (riscFilters.showCurrentModelBinding) {
        const actualStatus = getActualBindingStatus ? getActualBindingStatus(form) : form.bindingStatus;
        if (actualStatus !== 'current') return false;
      }
      
      return true;
    });

    // Object association filtering - Highlighted component priority logic (same logic for binding mode and normal mode)
    const finalHighlightSet = getFinalHighlightSet();
    
    if (hasHydCodeFilter()) {
      // Case: HyD Code filter is active
      if (finalHighlightSet.length > 0) {
        // Highest priority for highlighted components: show items related to any highlighted component, even if outside HyD Code range
        filtered = filtered.filter(form => 
          form.objects.some(objId => finalHighlightSet.includes(objId))
        );
      } else {
        // No highlighted components under HyD Code filter: show all RISC forms that meet basic filter conditions
        // Skip HyD Code related object filtering, let users see all RISC forms
        // filtered already contains all items meeting basic filter conditions, no further filtering needed
      }
    } else {
      // Case: No HyD Code filter
      if (finalHighlightSet.length > 0) {
        // Only highlighted components: show items related to highlighted components
        filtered = filtered.filter(form => 
          form.objects.some(objId => finalHighlightSet.includes(objId))
        );
      } else {
        // No filters: show all items with valid objects
        filtered = filtered.filter(form => 
          form.objects.some(objId => components.some(obj => obj.id === objId))
        );
      }
    }

    return filtered;
  };

  // Filter files - Fixed HyD Code + highlighted component priority logic + historical view support
  const getFilteredFiles = () => {
    let allFiles = files;
    
    // Historical view mode: only show items related to current floating panel component
    if (viewMode === 'historical' && selectedModelVersion !== 'current') {
      // Get component IDs list in current historical view
      const currentViewComponentIds = components
        .filter(c => c.modelVersionId === selectedModelVersion)
        .map(c => c.id);
      
      allFiles = files.filter(file => {
        // Check if item's bound component IDs exist in current historical view
        const hasMatchingComponents = file.objects.some(objId => 
          currentViewComponentIds.includes(objId)
        );
        
        // Check if item's bound version ID matches current selected historical version
        const hasMatchingVersion = file.boundModelVersionId === selectedModelVersion;
        
        // Only show items that satisfy both component ID and version ID conditions
        return hasMatchingComponents && hasMatchingVersion;
      });
    } else if (floatingPanel.isHistoricalView && floatingPanel.componentInfo) {
      allFiles = files.filter(file => 
        file.objects.includes(floatingPanel.componentInfo!.componentId) ||
        (file.bindingStatus === 'history' && file.linkedToCurrent)
      );
    } else {
      // Current view mode: show all RISC and file forms
      // Keep existing logic unchanged
    }

    let filtered = allFiles.filter(file => {
      // Basic filter conditions (excluding object associations)
      if (fileFilters.type && file.type !== fileFilters.type) return false;
      if (fileFilters.startDate && new Date(file.uploadDate) < new Date(fileFilters.startDate)) return false;
      if (fileFilters.endDate && new Date(file.uploadDate) > new Date(fileFilters.endDate)) return false;
      if (fileFilters.searchText && !file.name.toLowerCase().includes(fileFilters.searchText.toLowerCase())) return false;
      if (fileFilters.showMyFiles && file.uploadedBy !== currentUser) return false;
      
      // Current model binding filter: only show items bound to current model
      if (fileFilters.showCurrentModelBinding) {
        const actualStatus = getActualBindingStatus ? getActualBindingStatus(file) : file.bindingStatus;
        if (actualStatus !== 'current') return false;
      }
      
      return true;
    });

    // Object association filtering - Highlighted component priority logic (same logic for binding mode and normal mode)
    const finalHighlightSet = getFinalHighlightSet();
    
    if (hasHydCodeFilter()) {
      // Case: HyD Code filter is active
      if (finalHighlightSet.length > 0) {
        // Highest priority for highlighted components: show items related to any highlighted component, even if outside HyD Code range
        filtered = filtered.filter(file => 
          file.objects.some(objId => finalHighlightSet.includes(objId))
        );
      } else {
        // No highlighted components under HyD Code filter: show all files that meet basic filter conditions
        // Skip HyD Code related object filtering, let users see all files
        // filtered already contains all items meeting basic filter conditions, no further filtering needed
      }
    } else {
      // Case: No HyD Code filter
      if (finalHighlightSet.length > 0) {
        // Only highlighted components: show items related to highlighted components
        filtered = filtered.filter(file => 
          file.objects.some(objId => finalHighlightSet.includes(objId))
        );
      } else {
        // No filters: show all items with valid objects
        filtered = filtered.filter(file => 
          file.objects.some(objId => components.some(obj => obj.id === objId))
        );
      }
    }

    // In binding mode, always put files from binding cart at the front
    if (isBindingMode && bindingCart.files.length > 0) {
      const bindingFileIds = new Set(bindingCart.files.map(f => f.id));
      const bindingFiles = filtered.filter(file => bindingFileIds.has(file.id));
      const otherFiles = filtered.filter(file => !bindingFileIds.has(file.id));
      
      // Ensure binding files are shown even if they don't meet filter conditions
      const allBindingFiles = bindingCart.files.filter(bindingFile => {
        // Check basic filter conditions, but allow binding files to bypass object association filtering
        if (fileFilters.type && bindingFile.type !== fileFilters.type) return false;
        if (fileFilters.startDate && new Date(bindingFile.uploadDate) < new Date(fileFilters.startDate)) return false;
        if (fileFilters.endDate && new Date(bindingFile.uploadDate) > new Date(fileFilters.endDate)) return false;
        if (fileFilters.searchText && !bindingFile.name.toLowerCase().includes(fileFilters.searchText.toLowerCase())) return false;
        if (fileFilters.showMyFiles && bindingFile.uploadedBy !== currentUser) return false;
        return true;
      });
      
      // Merge and deduplicate
      const uniqueOtherFiles = otherFiles.filter(file => !bindingFileIds.has(file.id));
      filtered = [...allBindingFiles, ...uniqueOtherFiles];
    }

    return filtered;
  };

  // Filter components - Updated to filter based on modelVersionId
  const getFilteredObjectGroups = () => {
    // Get all components based on selected model version
    return components.filter(obj => obj.modelVersionId === selectedModelVersion);
  };

  // Get list of component IDs that match HyD Code filter conditions
  const getHydCodeFilteredComponents = () => {
    if (!hasHydCodeFilter()) return [];
    
    return components
      .filter(obj => obj.modelVersionId === selectedModelVersion)
      .filter(obj => matchesHydCodeFilter(obj.hydCode))
      .map(obj => obj.id);
  };

  // Filter user list
  const getFilteredUsers = () => {
    if (!userSearchText) return adminUsers;
    
    return adminUsers.filter(user => 
      user.name.toLowerCase().includes(userSearchText.toLowerCase()) ||
      user.email.toLowerCase().includes(userSearchText.toLowerCase())
    );
  };

  // Filter activity logs
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

  // HyD Code matching function
  const matchesHydCodeFilter = (objHydCode: HydCode): boolean => {
    return Object.keys(hydCodeFilter).every(key => {
      if (!hydCodeFilter[key as keyof HydCode]) return true;
      return objHydCode[key as keyof HydCode] === hydCodeFilter[key as keyof HydCode];
    });
  };

  // Handle HyD Code changes - Reset rules (highest priority)
  const handleHydCodeChange = (level: keyof HydCode, value: string): void => {
    // Clear model tree highlight state
    clearTreeHighlight();
    
    const newHydCodeFilter = { ...hydCodeFilter, [level]: value };
    setHydCodeFilter(newHydCodeFilter);
    
    // Filter change reset rules (highest priority) - Same logic for binding mode and normal mode
    // 1. Clear manual highlight set
    setManualHighlightSet([]);
    
    // 2. Recalculate filter highlight set
    // Check if any non-project fields have values in new filter conditions
    const hasAnyFilter = Object.keys(newHydCodeFilter).some(key => {
      if (key === 'project') return false; // project field is not used in filtering
      return newHydCodeFilter[key as keyof HydCode] !== '';
    });
    
    let newFilterHighlightSet: string[] = [];
    
    // Only calculate filter highlight set when there are actual filter conditions
    if (hasAnyFilter) {
      newFilterHighlightSet = components
        .filter(obj => obj.modelVersionId === selectedModelVersion)
        .filter(obj => {
          return Object.keys(newHydCodeFilter).every(key => {
            if (key === 'project') return true; // project field is not used in filtering
            if (!newHydCodeFilter[key as keyof HydCode]) return true;
            return obj.hydCode[key as keyof HydCode] === newHydCodeFilter[key as keyof HydCode];
          });
        })
        .map(obj => obj.id);
    }
    
    setFilterHighlightSet(newFilterHighlightSet);
    
    // Clear other states
    setSelectedRISC(null);
    setSelectedFile(null);
    setHoveredObjects([]);
    setHoveredItem(null);
    setHoveredItemType(null);
  };

  // Handle RISC filter condition changes
  const handleRiscFilterChange = (field: string, value: string) => {
    setRiscFilters(prev => ({ ...prev, [field]: value }));
  };

  // Handle file filter condition changes
  const handleFileFilterChange = (field: string, value: string | boolean) => {
    setFileFilters(prev => ({ ...prev, [field]: value }));
  };

  // Handle mouse hover - Hover highlight feature removed
  const handleItemHover = (item: RiscForm | FileItem | any, type: string): void => {
    // Hover highlight feature no longer provided
  };

  const handleItemLeave = (): void => {
    // Hover highlight feature no longer provided
  };

  // Handle list item click - Redesigned HyD Code interaction logic + historical component support
  const handleListItemClick = (item: RiscForm | FileItem, type: string): void => {
    // Clear model tree highlight state
    clearTreeHighlight();
    
          // Check if this is a deleted item (historical binding and component no longer exists)
      if ('bindingStatus' in item && item.bindingStatus === 'history' && !item.linkedToCurrent) {
        // Click on deleted item: show historical view floating panel but don't highlight any components (since they no longer exist)
        const boundModelVersionId = item.boundModelVersionId || 'v1.8'; // Model version ID when binding was created
        const currentModelVersionId = 'current'; // Current latest version ID
        
        // Set selection state
        setSelectedRISC(type === 'risc' ? item.id : null);
        setSelectedFile(type === 'file' ? item.id : null);
        setManualHighlightSet([]); // Don't highlight any components since they no longer exist
        
        // Show floating panel with deleted item information
        const historicalInfo: HistoricalComponentInfo = {
          componentId: item.objects.length > 0 ? item.objects[0] : 'DELETED-COMPONENT',
          currentVersionId: currentModelVersionId,
          historicalVersionId: boundModelVersionId,
          fileInfo: item,
          fileType: type as 'file' | 'risc',
          changes: item.changes || ['Component has been deleted from latest version', 'Components associated with this item no longer exist in current model']
        };
        
        // Show floating panel
        setFloatingPanel({
          visible: true,
          componentInfo: historicalInfo,
          isHistoricalView: false // Initially show current view
        });
        
        // Save original model version
        setOriginalModelVersion(selectedModelVersion);
        return;
      }

          // Check if this is an item with historical component binding
      if ('bindingStatus' in item && item.bindingStatus === 'history' && item.linkedToCurrent) {
        // Click on item with historical component binding: highlight components with same ID in current view
        const componentIds = item.objects; // List of bound component IDs
        const boundModelVersionId = item.boundModelVersionId || 'v1.8'; // Model version ID when binding was created
        const currentModelVersionId = 'current'; // Current latest version ID
        
        if (componentIds.length > 0) {
          // Highlight components with same ID in current view (regardless of current view version)
          const currentViewComponents = components.filter(c => 
            componentIds.includes(c.id) && c.modelVersionId === selectedModelVersion
          );
          
          if (currentViewComponents.length > 0) {
            setManualHighlightSet(currentViewComponents.map(c => c.id));
            setSelectedRISC(type === 'risc' ? item.id : null);
            setSelectedFile(type === 'file' ? item.id : null);
            
            // If item's bound version ID is not latest version, show floating panel
            if (boundModelVersionId !== currentModelVersionId) {
              // Create historical component info using first component
              const firstComponentId = componentIds[0];
              const historicalInfo: HistoricalComponentInfo = {
                componentId: firstComponentId,
                currentVersionId: currentModelVersionId,
                historicalVersionId: boundModelVersionId,
                fileInfo: item,
                fileType: type as 'file' | 'risc',
                changes: item.changes || ['Version difference information', 'Component properties updated']
              };
              
              // Show floating panel
              setFloatingPanel({
                visible: true,
                componentInfo: historicalInfo,
                isHistoricalView: false // Initially show current view
              });
              
              // Save original model version
              setOriginalModelVersion(selectedModelVersion);
            }
          }
        }
        return;
      }
    
          // Handle normal item click
      if ('objects' in item && item.objects.length > 0) {
        const componentIds = item.objects;
        const boundModelVersionId = item.boundModelVersionId || 'current';
        const currentModelVersionId = 'current';
        
        // Always highlight components with matching IDs in current view
        const currentViewComponents = components.filter(c => 
          componentIds.includes(c.id) && c.modelVersionId === selectedModelVersion
        );
      
      if (currentViewComponents.length > 0) {
        setManualHighlightSet(currentViewComponents.map(c => c.id));
        
        // 如果条目的绑定版本ID不是最新版本，显示浮窗
        if (boundModelVersionId !== currentModelVersionId) {
          const firstComponentId = componentIds[0];
          const historicalInfo: HistoricalComponentInfo = {
            componentId: firstComponentId,
            currentVersionId: currentModelVersionId,
            historicalVersionId: boundModelVersionId,
            fileInfo: item,
            fileType: type as 'file' | 'risc',
            changes: item.changes || ['版本差异信息', '构件属性更新']
          };
          
          // 显示浮窗
          setFloatingPanel({
            visible: true,
            componentInfo: historicalInfo,
            isHistoricalView: false
          });
          
          setOriginalModelVersion(selectedModelVersion);
        }
      }
    }
    
    // 检查是否在HyD Code筛选模式下
    if (hasHydCodeFilter()) {
      const finalHighlightSet = getFinalHighlightSet();
      
      // 情况1：视图中无任何构件持续高亮，或者条目没被单击选中
      if (finalHighlightSet.length === 0 || (selectedRISC === null && selectedFile === null)) {
        const confirmMessage = `检测到您正在使用HyD Code筛选。\n\n是否要退出当前的HyD Code筛选，并仅根据此条目来选择构件？\n\n点击"确定"将清除当前筛选并仅显示与此条目相关的内容。\n点击"取消"保持当前筛选状态。`;
        
        if (confirm(confirmMessage)) {
          // 用户选择退出筛选模式
          // 1. 清空所有HyD Code筛选状态
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
        return;
      }
      
      // 情况2：视图中有持续高亮的构件
      // 提示用户是否退出HyD Code筛选
      const confirmMessage = `检测到您正在使用HyD Code筛选。\n\n是否要退出当前的HyD Code筛选，并仅根据此条目来选择构件？\n\n点击"确定"将清除当前筛选并仅显示与此条目相关的内容。\n点击"取消"保持当前筛选状态。`;
      
      if (confirm(confirmMessage)) {
        // 用户选择退出筛选模式
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
        setManualHighlightSet(item.objects);
        
        if (type === 'risc') {
          setSelectedRISC(item.id);
          setSelectedFile(null);
        } else if (type === 'file') {
          setSelectedFile(item.id);
          setSelectedRISC(null);
        }
      }
      return;
    }

    // 非HyD Code筛选模式下的正常点击逻辑
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
        // 高光当前视图中相同构件ID的构件
        const currentViewComponents = components.filter(c => 
          riscItem.objects.includes(c.id) && c.modelVersionId === selectedModelVersion
        );
        setManualHighlightSet(currentViewComponents.map(c => c.id));
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
        // 高光当前视图中相同构件ID的构件
        const currentViewComponents = components.filter(c => 
          fileItem.objects.includes(c.id) && c.modelVersionId === selectedModelVersion
        );
        setManualHighlightSet(currentViewComponents.map(c => c.id));
      }
    }
  };

  // 处理BIM视图构件点击 - 绑定模式和普通模式逻辑一致
  const handleComponentClick = (component: Component, event?: React.MouseEvent): void => {
    // 清除模型树高亮状态
    clearTreeHighlight();
    
    // 如果是右键点击，显示上下文菜单
    if (event && event.type === 'contextmenu') {
      event.preventDefault();
      
      // 无论构件是否在高亮集中，都显示上下文菜单
      // 这样即使是左键选中后再右键点击也能显示菜单
      setContextMenu({
        visible: true,
        x: event.clientX,
        y: event.clientY,
        componentId: component.id,
        isFromTree: false
      });
      return;
    }
    
    // 检查是否在HyD Code筛选模式下
    if (hasHydCodeFilter()) {
      const finalHighlightSet = getFinalHighlightSet();
      const isComponentInFinalSet = finalHighlightSet.includes(component.id);
      const isComponentInManualSet = manualHighlightSet.includes(component.id);
      const isComponentInFilterSet = filterHighlightSet.includes(component.id);
      
      if (isComponentInFinalSet) {
        // 点击已经在最终高亮集中的构件：取消此构件的高亮状态
        
        // 如果构件在手动高亮集中，从手动高亮集中移除
        if (isComponentInManualSet) {
          const newManualHighlightSet = manualHighlightSet.filter(id => id !== component.id);
          setManualHighlightSet(newManualHighlightSet);
        }
        
        // 如果构件仅在筛选高亮集中（HyD Code筛选产生的），从筛选高亮集中移除
        else if (isComponentInFilterSet) {
          const newFilterHighlightSet = filterHighlightSet.filter(id => id !== component.id);
          setFilterHighlightSet(newFilterHighlightSet);
        }
        
        // 清除选择状态，因为不再有单一的条目与之对应
        setSelectedRISC(null);
        setSelectedFile(null);
      } else {
        // 点击非高亮的构件：添加到手动高亮集
        setManualHighlightSet(prev => [...prev, component.id]);
        
        // 清除选择状态，因为现在是混合选择模式
        setSelectedRISC(null);
        setSelectedFile(null);
      }
      return;
    }

    // 非HyD Code筛选模式下的正常点击逻辑
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

    // 绑定模式下的额外处理：在构件高亮变化后，自动处理购物车逻辑
    if (isBindingMode) {
      // 这里可以添加绑定模式下的特殊处理，比如自动添加到购物车等
      // 但高亮逻辑保持与普通模式一致
    }
  };

  // 处理双击 - 快速对比功能
  const handleDoubleClick = (item: RiscForm | FileItem, type: string): void => {
    // 直接导航到详情页，不再处理快速对比（已由单击处理）
    handleNavigateToDetail(item, type);
  };

  // 开始新的绑定关系（针对无绑定的文件）- 取消文件锁定设计
  const addToBindingCart = (item: FileItem, type: string): void => {
    // 历史视图下不允许进入绑定模式
    if (viewMode === 'historical') {
      alert('历史视图下不允许进入绑定模式。请先切换到当前版本后再开始绑定。');
      return;
    }
    
    // 检查用户权限
    if (!hasBindingPermission()) {
      alert('您没有权限进行绑定操作');
      return;
    }

    // 如果是要编辑的文件，检查是否有权限编辑
    if (item.objects.length > 0) {
      if (item.uploadedBy !== currentUser && !isAdmin()) {
        alert('您只能编辑自己上传的文件');
      return;
      }
    }

    // 检查是否已在绑定模式中且有不同文件
    if (isBindingMode && bindingCart.files.length === 1 && bindingCart.files[0].id !== item.id) {
      if (confirm('当前绑定购物车中已有其他文件。是否清空购物车并开始新的绑定？')) {
        exitBindingMode();
      } else {
        return;
      }
    }

    // 进入绑定模式
    setIsBindingMode(true);
    // 只加载与当前选择版本匹配的构件到购物车
    const matchingObjects = item.objects
      .map(objId => components.find(c => c.id === objId))
      .filter(obj => obj && obj.modelVersionId === selectedModelVersion) as Component[];
    
    setBindingCart({
      files: [item],
      objects: matchingObjects,
      hasHistoricalObjects: matchingObjects.some(obj => obj.modelVersionId !== 'current')
    });
    setShowBindingCart(true);
    
    // 高光绑定文件相关的构件
    setManualHighlightSet(item.objects);
  };

  // 添加对象到购物车
  const addObjectToCart = (obj: Component): void => {
    setBindingCart(prev => {
      const newCart = { ...prev };
      
      // 如果是首次添加对象，记录版本信息
      const targetModelVersion = obj.modelVersionId;
      
      // 版本一致性检查 - 特殊处理：文件可以与任何版本的构件绑定，但所有构件必须属于同一版本
      if (newCart.objects.length > 0) {
        const existingModelVersion = newCart.objects[0].modelVersionId;
        if (obj.modelVersionId !== existingModelVersion) {
          // 构件版本不一致的处理
          const confirmMessage = `不能将不同版本的构件添加到同一个绑定中。\n\n当前绑定中的构件模型版本: ${existingModelVersion}\n尝试添加的构件模型版本: ${obj.modelVersionId}\n\n一个文件可以绑定到任何版本的构件，但所有构件必须属于同一个版本。\n\n是否清除当前所有已选构件，并添加新构件？`;
          
          if (confirm(confirmMessage)) {
            // 清空现有对象，添加新对象
            newCart.objects = [obj];
            newCart.hasHistoricalObjects = obj.modelVersionId !== 'current';
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
      newCart.hasHistoricalObjects = newCart.objects.some(o => o.modelVersionId !== 'current');
      
      return newCart;
    });
  };

  // 修改现有绑定 - 取消文件锁定设计
  const editExistingBinding = (file: FileItem): void => {
    if (!hasBindingPermission()) {
      alert('您没有权限修改绑定关系');
      return;
    }
    
    // 权限检查：授权用户只能修改自己上传的文件
    if (currentUser !== 'Administrator' && file.uploadedBy !== currentUser) {
      alert('您只能修改自己上传的文件的绑定关系');
      return;
    }
    
    // 取消文件锁定逻辑 - 直接允许切换到新文件
    
    // 获取文件关联的构件，但只加载与当前选择版本匹配的构件
    const linkedObjects = components.filter(obj => 
      file.objects.includes(obj.id) && obj.modelVersionId === selectedModelVersion
    );
    const hasHistoricalObjects = linkedObjects.some(obj => obj.modelVersionId !== 'current');
    
    // 设置绑定购物车 - 切换文件，构件预加载
    setBindingCart({
      files: [file],
      objects: linkedObjects,
      hasHistoricalObjects
    });
    
    // 将关联的构件设置为手动高亮集
    setManualHighlightSet(file.objects);
    
    // 清除筛选高亮集以避免混淆
    setFilterHighlightSet([]);
    setHydCodeFilter({
      project: 'HY202404',
      contractor: '',
      location: '',
      structure: '',
      space: '',
      grid: '',
      cat: ''
    });
    
    // 注释掉自动版本切换逻辑 - 绑定模式下始终保持在当前版本视图
    // 这样可以确保绑定面板只显示当前版本的构件，避免混合显示历史构件
    // if (hasHistoricalObjects && file.bindingStatus === 'history') {
    //   setSelectedModelVersion('v1.8');
    //   setViewMode('historical');
    // }
    
    // 激活绑定模式
    setIsBindingMode(true);
    
    // 成功提示
    alert(`进入绑定编辑模式\n\n文件："${file.name.substring(0, 40)}..."\n当前关联 ${linkedObjects.length} 个构件\n\n您可以通过筛选或手动选择来高亮其他构件，然后使用"添加所有高亮构件"按钮进行批量添加。`);
  };

  // 退出绑定模式
  const exitBindingMode = () => {
    setIsBindingMode(false);
    setBindingCart({ files: [], objects: [], hasHistoricalObjects: false });
    
    // 清除悬浮状态
    setHoveredObjects([]);
    setHoveredItem(null);
    setHoveredItemType(null);
    
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
      const firstModelVersion = bindingCart.objects[0].modelVersionId;
      const allSameVersion = bindingCart.objects.every(obj => obj.modelVersionId === firstModelVersion);
      if (!allSameVersion) {
        alert('绑定的所有构件必须属于同一版本，但文件可以绑定到任何版本的构件。请移除不一致的构件后重试。');
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
      confirmMessage += '\n⚠️ 提示：您正在绑定历史版本的构件。\n';
      confirmMessage += '一个文件可以绑定到任何版本的构件，但所有构件必须属于同一版本。\n';
      confirmMessage += '此绑定操作将使文件关联到历史版本，在相应版本视图下才能看到对应的构件。\n';
    }
    
    confirmMessage += '\n此操作将覆盖这个文件原有的关联关系。\n\n是否确认提交？';
    
    if (confirm(confirmMessage)) {
      const objectIds = bindingCart.objects.map(obj => obj.id);
      const currentTime = new Date();
      const updateDate = currentTime.toISOString().split('T')[0];
      
      // 检查是否是历史版本文件绑定到当前版本对象
      const isHistoricalFileBindingToCurrent = bindingCart.files.some(f => f.bindingStatus === 'history') && 
                                               bindingCart.objects.every(obj => obj.modelVersionId === 'current');
      
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

  // 绑定模式下的页面退出确认函数
  const confirmExitBindingMode = (actionDescription: string): boolean => {
    if (!isBindingMode) return true;
    
    const objectCount = bindingCart.objects.length;
    const hasChanges = objectCount > 0 || bindingCart.files.length > 0;
    
    if (hasChanges) {
      const confirmMessage = `您正在绑定模式中，有未保存的绑定关系：\n\n` +
        `• 文件: ${bindingCart.files.length} 个\n` +
        `• 构件: ${objectCount} 个\n\n` +
        `${actionDescription}将会丢失当前的绑定编辑。\n\n` +
        `是否确认离开绑定模式？`;
      
      if (confirm(confirmMessage)) {
        exitBindingMode();
        return true;
      }
      return false;
    } else {
      // 没有实际更改，直接退出绑定模式
      exitBindingMode();
      return true;
    }
  };

  // 处理导航到详情页面 - 添加绑定模式检查
  const handleNavigateToDetail = (item, type) => {
    if (!confirmExitBindingMode('导航到详情页面')) {
      return;
    }
    setDetailItem(item);
    setCurrentView(type === 'risc' ? 'risc-detail' : 'file-detail');
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
    setDetailItem(null);
  };

  // 处理模型版本变化
  const handleModelVersionChange = (version) => {
    // 绑定模式下不允许切换到历史版本
    if (isBindingMode && version !== 'current') {
      alert('绑定模式下不允许切换到历史版本。请先退出绑定模式后再切换版本。');
      return;
    }
    
    setSelectedModelVersion(version);
    if (version === 'current') {
      setViewMode('current');
    } else {
      setViewMode('historical');
    }
    
    // 切换版本时，清除所有高光项和筛选项（相当于按了清除按钮）
    clearAllUserSelections();
    
    // 如果在绑定模式，且有历史对象，需要特殊处理
    if (isBindingMode && bindingCart.hasHistoricalObjects) {
      if (version === 'current') {
        // 警告用户
        alert('当前绑定购物车中包含历史版本构件，请注意在当前视图下可能无法正确显示这些构件。');
      }
    }
  };

  // 历史视图切换函数
  const handleToggleHistoricalView = () => {
    if (!floatingPanel.componentInfo) return;
    
    const newIsHistoricalView = !floatingPanel.isHistoricalView;
    
    setFloatingPanel(prev => ({
      ...prev,
      isHistoricalView: newIsHistoricalView
    }));
    
    if (newIsHistoricalView) {
      // 切换到历史视图模式
      setSelectedModelVersion(floatingPanel.componentInfo.historicalVersionId);
      setViewMode('historical');
      
      // 在历史视图中，高光绑定的构件
      // 由于历史构件绑定通常保持相同的构件ID，我们直接高光这个ID
      setManualHighlightSet([floatingPanel.componentInfo.componentId]);
    } else {
      // 切换回当前视图模式 - 修复：始终切换到current版本
      const targetVersion = floatingPanel.componentInfo.currentVersionId; // 使用历史构件信息中的当前版本ID
      setSelectedModelVersion(targetVersion);
      setViewMode(targetVersion === 'current' ? 'current' : 'historical');
      
      // 在当前视图中，高光对应的当前版本构件
      // 查找ID相同版本为current的构件，如果找不到则高光原ID
      const currentComponent = components.find(c => 
        c.id === floatingPanel.componentInfo.componentId && 
        c.modelVersionId === targetVersion
      );
      
      if (currentComponent) {
        setManualHighlightSet([currentComponent.id]);
      } else {
        // 如果找不到当前版本构件，仍然尝试高光相同ID的构件
        setManualHighlightSet([floatingPanel.componentInfo.componentId]);
      }
    }
  };

  // 关闭历史视图浮窗
  const handleCloseFloatingPanel = () => {
    // 保存当前的历史版本状态
    const wasInHistoricalView = floatingPanel.isHistoricalView;
    const currentHistoricalVersion = selectedModelVersion;
    
    setFloatingPanel({
      visible: false,
      componentInfo: null,
      isHistoricalView: false
    });
    
    // 如果当前在历史视图模式，保持在当前历史版本而不恢复到原始版本
    if (wasInHistoricalView && currentHistoricalVersion !== 'current') {
      // 保持当前的历史版本视图
      setViewMode('historical');
      // selectedModelVersion 已经是正确的历史版本，无需修改
    }
    
    // 保持当前的选中状态和高光效果，不清除它们
    // 注释掉以下清除操作：
    // setManualHighlightSet([]);
    // setSelectedRISC(null);
    // setSelectedFile(null);
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

  // 检查实际绑定状态 - 支持三种绑定状态：current、history、deleted
  const getActualBindingStatus = (item) => {
    // 如果是历史绑定状态
    if (item.bindingStatus === 'history') {
      // 如果linkedToCurrent为false，表示构件在最新版本中已不存在 - 删除条目
      if (!item.linkedToCurrent) {
        return 'deleted';
      }
      // 如果linkedToCurrent为true，表示构件在最新版本中仍存在 - 历史条目
      return 'history';
    }
    // 默认返回当前状态
    return item.bindingStatus;
  };

  const getBindingIcon = (item) => {
    const actualStatus = getActualBindingStatus(item);
    switch (actualStatus) {
      case 'current': return null;
      case 'history': return <Clock className="w-4 h-4 text-orange-500" />;
      case 'deleted': return <Trash2 className="w-4 h-4 text-red-500" />;
      default: return null;
    }
  };

  const getBindingIconTooltip = (item) => {
    const actualStatus = getActualBindingStatus(item);
    switch (actualStatus) {
      case 'current': return null;
      case 'history': return '历史版本关联';
      case 'deleted': return '删除条目 - 构件已不存在';
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
                      'bg-green-100 text-green-800'
                    }`}>
                      {item.bindingStatus === 'history' ? '历史版本' : '当前版本'}
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
                  <div className="space-y-2">
                    {components
                      .filter(obj => obj.modelVersionId === 'current' && item.objects.some(id => id.replace('-OLD', '') === obj.id))
                      .map(obj => (
                        <div key={obj.id} className="bg-blue-50 p-2 rounded text-sm">
                          <div className="font-medium">{obj.name}</div>
                          <div className="text-xs text-gray-600">
                            对象组：{obj.objectGroup} | {obj.properties.material}
                          </div>
                        </div>
                      ))}
                  </div>
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
                            对象组：{obj.objectGroup} | {obj.properties.material}
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
                  // 切换到对应的模型版本
                  if (item.bindingStatus === 'history') {
                    setSelectedModelVersion('v1.8');
                    setViewMode('historical');
                  } else {
                    setSelectedModelVersion('current');
                    setViewMode('current');
                  }
                  
                  // 高亮显示关联的构件
                  setManualHighlightSet(item.objects);
                  
                  // 清除其他选择状态
                  if (type === 'risc') {
                    setSelectedRISC(item.id);
                    setSelectedFile(null);
                  } else {
                    setSelectedFile(item.id);
                    setSelectedRISC(null);
                  }
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center"
              >
                <Layers className="w-4 h-4 mr-2" />
                跳转到关联模型
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
          onClick={() => {
            if (confirmExitBindingMode('登录')) {
              setCurrentView('project-map');
            }
          }}
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
            onClick={() => {
              if (confirmExitBindingMode('进入仪表板')) {
                setCurrentView('dashboard');
              }
            }}
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
              onClick={() => {
                if (confirmExitBindingMode('返回仪表板')) {
                  setCurrentView('dashboard');
                }
              }}
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
                <button className="flex items-center px-3 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200">
                  <Download className="w-4 h-4 mr-2" />
                  下载文件
                </button>
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
            <div className="absolute bottom-full right-0 mb-2 bg-white rounded-lg shadow-xl p-4 w-80 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium">绑定管理</h3>
                <button 
                  onClick={() => setShowBindingCart(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="overflow-y-auto max-h-[60vh]">
                <BindingCartContent />
              </div>
              
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
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {bindingCart.objects.map((obj, index) => (
                <div 
                  key={`${obj.id}-${index}-${bindingCart.objects.length}`} // 更强的key值确保重新渲染
                  className="bg-gray-50 p-3 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors duration-200 relative"
                  title={`构件: ${obj.name}`}
                >
                  <div className="flex items-center justify-between">
                    <div 
                      className="flex-1 min-w-0 pr-3 cursor-default"
                      title={`悬浮查看构件在BIM视图中的位置: ${obj.name}`}
                    >
                      <div className="text-sm font-medium text-gray-900 flex items-center">
                        {obj.name}
                        {obj.modelVersionId !== 'current' && (
                          <History className="w-3 h-3 text-orange-600 flex-shrink-0 ml-1" />
                        )}
                      </div>
                      <div className="text-xs opacity-75 truncate">{obj.objectGroup}</div>
                      <div className="text-xs opacity-60">v: {obj.modelVersionId}</div>
                    </div>
                    {/* 使用新的删除按钮组件 */}
                    <DeleteComponentButton component={obj} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* 版本警告 */}
        {bindingCart.objects.length > 0 && !bindingCart.objects.every(obj => obj.modelVersionId === bindingCart.objects[0].modelVersionId) && (
          <div className="bg-red-50 border border-red-200 p-2 rounded">
            <div className="text-xs text-red-800 font-medium">⚠️ 版本冲突</div>
            <div className="text-xs text-red-600">同一绑定中的所有构件必须属于同一版本，但文件可以绑定到任何版本的构件。请移除不一致版本的构件。</div>
          </div>
        )}
        
        {/* 历史版本提示 */}
        {bindingCart.hasHistoricalObjects && (
          <div className="bg-orange-50 border border-orange-200 p-2 rounded">
            <div className="text-xs text-orange-800 font-medium flex items-center">
              <History className="w-3 h-3 mr-1" />
              历史版本绑定
            </div>
            <div className="text-xs text-orange-600">您正在绑定历史版本的构件。一个文件可以绑定到任何版本的构件，但所有构件必须来自同一版本。此绑定将在相应版本视图下可见。</div>
          </div>
        )}
        
        {/* 提示信息 */}
        {bindingCart.files.length === 0 && (
          <div className="text-xs text-gray-500 text-center">
            请选择一个要绑定的文件
          </div>
        )}
        {bindingCart.files.length > 0 && bindingCart.objects.length === 0 && (
          <div className="text-xs text-gray-500 text-center">
            请选择至少一个构件进行绑定<br/>
            <span className="text-blue-600">提示：可以随时切换文件</span>
          </div>
        )}
      </div>
    );
  };

  // 添加状态变量，用于控制"添加所有高亮构件"按钮的显示
  const [showAddAllHighlightedButton, setShowAddAllHighlightedButton] = useState(true);

  // 添加所有高亮构件到购物车 - 修复版本，添加后清除高亮
  const addAllHighlightedToCart = (): void => {
    if (!isBindingMode) return;
    
    // 暂时隐藏按钮，避免用户重复点击
    setShowAddAllHighlightedButton(false);
    
    const finalHighlightSet = getFinalHighlightSet();
    if (finalHighlightSet.length === 0) {
      alert('没有高亮的构件可以添加。请先选择或筛选构件。');
      // 恢复按钮显示
      setShowAddAllHighlightedButton(true);
      return;
    }

    // 获取所有高亮的构件对象
    const highlightedComponents = components.filter(comp => 
      finalHighlightSet.includes(comp.id) && 
      comp.modelVersionId === selectedModelVersion
    );

    if (highlightedComponents.length === 0) {
      alert('高亮的构件在当前模型版本中不可用。');
      // 恢复按钮显示
      setShowAddAllHighlightedButton(true);
      return;
    }

    // 自动过滤掉已在购物车中的构件
    const newComponents = highlightedComponents.filter(comp => 
      !bindingCart.objects.some(obj => obj.id === comp.id)
    );
    
    const alreadyInCartCount = highlightedComponents.length - newComponents.length;
    
    if (newComponents.length === 0) {
      alert(`所有 ${highlightedComponents.length} 个高亮构件已在购物车中，无需重复添加。`);
      // 恢复按钮显示
      setShowAddAllHighlightedButton(true);
      return;
    }
    
    // 检查新构件的版本一致性
    const modelVersions = [...new Set(newComponents.map(comp => comp.modelVersionId))];
    if (versions.length > 1) {
      const confirmMessage = `检测到高亮构件包含多个版本：${versions.join(', ')}\n\n绑定的所有构件必须属于同一版本，但文件可以绑定到任何版本的构件。\n\n是否只添加版本为"${versions[0]}"的构件？`;
      if (confirm(confirmMessage)) {
        const sameVersionComponents = newComponents.filter(comp => comp.version === versions[0]);
        addMultipleComponentsToCart(sameVersionComponents, alreadyInCartCount);
        // 添加成功后清除高亮
        clearAllHighlightsAfterAdd();
      } else {
        // 用户取消，恢复按钮显示
        setShowAddAllHighlightedButton(true);
      }
      return;
    }
    
    // 检查与购物车中现有构件的版本一致性
    if (bindingCart.objects.length > 0) {
      const cartVersion = bindingCart.objects[0].version;
      if (versions[0] !== cartVersion) {
        const confirmMessage = `购物车中已有版本为"${cartVersion}"的构件。\n高亮构件版本为"${versions[0]}"。\n\n同一绑定中的所有构件必须属于同一版本，但文件可以绑定到任何版本的构件。\n\n是否清空购物车并添加高亮构件？`;
        if (confirm(confirmMessage)) {
          setBindingCart(prev => ({
            ...prev,
            objects: newComponents,
            hasHistoricalObjects: newComponents.some(comp => comp.modelVersionId !== 'current')
          }));
          // 添加成功后清除高亮
          clearAllHighlightsAfterAdd();
          let message = `成功添加 ${newComponents.length} 个构件到绑定购物车`;
          if (alreadyInCartCount > 0) {
            message += `\n(已自动略过 ${alreadyInCartCount} 个已在购物车中的构件)`;
          }
          alert(message);
        } else {
          // 用户取消，恢复按钮显示
          setShowAddAllHighlightedButton(true);
        }
        return;
      }
    }

    // 直接添加到购物车
    addMultipleComponentsToCart(newComponents, alreadyInCartCount);
    // 添加成功后清除高亮
    clearAllHighlightsAfterAdd();
  };

  // 清除所有高亮状态的辅助函数
  const clearAllHighlightsAfterAdd = (): void => {
    // 在绑定模式下，点击添加构件后，确保所有高亮效果都被清除
    
    // 清除手动高亮集
    setManualHighlightSet([]);
    
    // 清除筛选高亮集
    setFilterHighlightSet([]);
    
    // 清除HyD Code筛选（如果有的话）
    setHydCodeFilter({
      project: 'HY202404',
      contractor: '',
      location: '',
      structure: '',
      space: '',
      grid: '',
      cat: ''
    });
    
    // 清除选择状态
    setSelectedRISC(null);
    setSelectedFile(null);
    
    // 清除悬浮状态
    setHoveredObjects([]);
    setHoveredItem(null);
    setHoveredItemType(null);
    
    // 延迟1秒后恢复"添加所有高亮构件"按钮
    setTimeout(() => {
      setShowAddAllHighlightedButton(true);
    }, 1000);
  };

  // 批量添加构件到购物车的辅助函数
  const addMultipleComponentsToCart = (componentsToAdd: Component[], alreadyInCartCount: number = 0): void => {
    setBindingCart(prev => {
      const existingIds = new Set(prev.objects.map(obj => obj.id));
      const newComponents = componentsToAdd.filter(comp => !existingIds.has(comp.id));
      
      const updatedObjects = [...prev.objects, ...newComponents];
      const hasHistoricalObjects = updatedObjects.some(obj => obj.modelVersionId !== 'current');
      
      return {
        ...prev,
        objects: updatedObjects,
        hasHistoricalObjects
      };
    });

    // 显示成功消息
    const addedCount = componentsToAdd.filter(comp => 
      !bindingCart.objects.find(existing => existing.id === comp.id)
    ).length;
    
    if (addedCount > 0) {
      let message = `成功添加 ${addedCount} 个构件到绑定购物车`;
      if (alreadyInCartCount > 0) {
        message += `\n(已自动略过 ${alreadyInCartCount} 个已在购物车中的构件)`;
      }
      alert(message);
    } else if (alreadyInCartCount > 0) {
      alert(`所有 ${alreadyInCartCount} 个构件已在购物车中，无需重复添加`);
    } else {
      alert('选中的构件已经在购物车中');
    }
  };

  // 添加浏览器页面离开时的提示
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (isBindingMode) {
        const objectCount = bindingCart.objects.length;
        const hasChanges = objectCount > 0 || bindingCart.files.length > 0;
        
        if (hasChanges) {
          const message = '您正在绑定模式中，离开页面将丢失未保存的绑定关系。确定要离开吗？';
          event.preventDefault();
          event.returnValue = message;
          return message;
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isBindingMode, bindingCart.objects.length, bindingCart.files.length]);

  // 添加全局点击监听器来清除模型树高亮状态
  useEffect(() => {
    const handleGlobalClick = (event: MouseEvent) => {
      // 如果点击的是模型树内部或右键菜单，不清除高亮
      const target = event.target as HTMLElement;
      const isTreeClick = target.closest('[data-tree-container="true"]') || 
                         target.closest('.fixed.bg-white.rounded-md.shadow-lg'); // 右键菜单
      
      if (!isTreeClick && (treeHighlightedComponentId || treeHighlightedGroupName)) {
        // 只清除高亮状态，不重置白色/灰色显示状态
        setTreeHighlightedComponentId(null);
        setTreeHighlightedGroupName(null);
      }
    };

    document.addEventListener('click', handleGlobalClick);
    return () => document.removeEventListener('click', handleGlobalClick);
  }, [treeHighlightedComponentId, treeHighlightedGroupName]);

  const getComponentTree = () => {
    const filteredComponents = getFilteredObjectGroups();
    
    // 按对象组分组
    const groupedComponents: { [key: string]: Component[] } = {};
    
    filteredComponents.forEach(component => {
      if (!groupedComponents[component.objectGroup]) {
        groupedComponents[component.objectGroup] = [];
      }
      groupedComponents[component.objectGroup].push(component);
    });
    
    return groupedComponents;
  };
  
  // 切换组件组的展开/折叠状态
  const toggleGroupExpand = (groupName: string) => {
    setExpandedGroups(prev => {
      if (prev.includes(groupName)) {
        return prev.filter(g => g !== groupName);
      } else {
        return [...prev, groupName];
      }
    });
  };
  
  // 切换组件树显示
  const toggleComponentTree = () => {
    // 关闭模型树时清除高亮状态
    if (showComponentTree) {
      clearTreeHighlight();
      // 关闭模型树时重置为显示所有白色状态
      showAllTreeObjectsWhite();
    }
    
    if (!showComponentTree) {
      // 显示模型树时，自动收纳左侧栏
      setLeftPanelCollapsed(true);
      setShowComponentTree(true);
    } else {
      // 隐藏模型树时，恢复左侧栏展开状态
      setLeftPanelCollapsed(false);
      setShowComponentTree(false);
    }
  };
  
  // 模型树中构件的左键点击处理
  const handleTreeComponentClick = (component: Component, event?: React.MouseEvent): void => {
    // 如果是右键点击，显示上下文菜单
    if (event && event.type === 'contextmenu') {
      event.preventDefault();
      event.stopPropagation();
      
      // 如果当前构件不是白色显示，临时设置为白色以便右键菜单能正确显示选项
      if (!treeShowAllWhite && !treeWhiteComponents.includes(component.id)) {
        // 临时设置此构件为白色状态
        setTreeWhiteComponents(prev => [...prev, component.id]);
      }
      
      setContextMenu({
        visible: true,
        x: event.clientX,
        y: event.clientY,
        componentId: component.id,
        isFromTree: true
      });
      return;
    }
    
    // 左键点击：设置只有此构件为白色，其他为灰色
    if (event) {
      event.stopPropagation();
    }
    
    setTreeShowAllWhite(false);
    setTreeWhiteComponents([component.id]);
    setTreeWhiteGroups([]);
    
    // 保持原有的高亮逻辑用于其他功能
    setTreeHighlightedComponentId(component.id);
    setTreeHighlightedGroupName(component.objectGroup);
  };
  
  // 模型树中组的左键点击处理
  const handleTreeGroupClick = (groupName: string, event?: React.MouseEvent): void => {
    // 如果是右键点击，显示上下文菜单
    if (event && event.type === 'contextmenu') {
      event.preventDefault();
      event.stopPropagation();
      
      // 设置当前右键的组名，用于判断是否为白色
      setTreeHighlightedGroupName(groupName);
      
      // 如果当前组不是白色显示，临时设置为白色以便右键菜单能正确显示选项
      if (!treeShowAllWhite && !treeWhiteGroups.includes(groupName)) {
        // 获取此组下的所有构件
        const groupComponents = components.filter(c => c.objectGroup === groupName);
        // 临时设置此组及其构件为白色状态
        setTreeWhiteGroups(prev => [...prev, groupName]);
        setTreeWhiteComponents(prev => [...prev, ...groupComponents.map(c => c.id)]);
      }
      
      setContextMenu({
        visible: true,
        x: event.clientX,
        y: event.clientY,
        componentId: null,
        isFromTree: true
      });
      return;
    }

    // 左键点击：设置此组及其下所有构件为白色，其他为灰色
    if (event) {
      event.stopPropagation();
    }
    
    setTreeShowAllWhite(false);
    setTreeWhiteGroups([groupName]);
    // 获取此组下的所有构件
    const groupComponents = components.filter(c => c.objectGroup === groupName);
    setTreeWhiteComponents(groupComponents.map(c => c.id));
    
    // 保持原有的高亮逻辑用于其他功能
    setTreeHighlightedComponentId(null);
    setTreeHighlightedGroupName(groupName);
  };
  
  // 显示所有构件为白色
  const showAllTreeObjectsWhite = (): void => {
    setTreeShowAllWhite(true);
    setTreeWhiteComponents([]);
    setTreeWhiteGroups([]);
  };
  
  // 清除模型树高亮状态（除了右键点击外的所有操作）
  const clearTreeHighlight = (): void => {
    setTreeHighlightedComponentId(null);
    setTreeHighlightedGroupName(null);
  };

  // 组件树面板
  const ComponentTreePanel = () => {
    const componentTree = getComponentTree();
    const groupNames = Object.keys(componentTree).sort();
    const [componentFilter, setComponentFilter] = useState('');
    
    // 过滤组件树
    const filteredTree: { [key: string]: Component[] } = {};
    
    groupNames.forEach(groupName => {
      const filteredComponents = componentTree[groupName].filter(component => 
        component.name.toLowerCase().includes(componentFilter.toLowerCase()) ||
        component.objectGroup.toLowerCase().includes(componentFilter.toLowerCase()) ||
        component.properties.material.toLowerCase().includes(componentFilter.toLowerCase())
      );
      
      if (filteredComponents.length > 0) {
        filteredTree[groupName] = filteredComponents;
      }
    });
    
    const filteredGroupNames = Object.keys(filteredTree).sort();
    
    // 自动展开搜索结果
    useEffect(() => {
      if (componentFilter) {
        setExpandedGroups(filteredGroupNames);
      }
    }, [componentFilter]);

    // 当模型树显示且左侧栏收纳时，在左侧栏中显示
    if (showComponentTree && leftPanelCollapsed) {
      return (
        <div className="fixed left-12 top-0 bottom-0 w-80 bg-white shadow-lg border-r border-gray-200 overflow-y-auto z-50" data-tree-container="true">
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium flex items-center">
                <Layers className="w-5 h-5 mr-2" />
                模型零件树
              </h3>
              <div className="flex space-x-2">
                <button 
                  onClick={toggleComponentTree}
                  className="p-1 hover:bg-gray-100 rounded"
                  title="关闭模型树"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            {/* 搜索过滤器 */}
            <div className="mb-4">
              <div className="relative">
                <input
                  type="text"
                  value={componentFilter}
                  onChange={(e) => {
                    setComponentFilter(e.target.value);
                    clearTreeHighlight(); // 搜索时清除模型树高亮
                    showAllTreeObjectsWhite(); // 搜索时重置为显示所有白色
                  }}
                  placeholder="搜索构件名称、材料..."
                  className="w-full border rounded-md pl-9 pr-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <Search className="w-4 h-4 text-gray-400" />
                </div>
                {componentFilter && (
                  <button
                    onClick={() => {
                      setComponentFilter('');
                      clearTreeHighlight(); // 清除搜索时也清除模型树高亮
                      showAllTreeObjectsWhite(); // 清除搜索时重置为显示所有白色
                    }}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    title="清除搜索"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            
            {filteredGroupNames.length > 0 ? (
              <div className="space-y-2">
                {filteredGroupNames.map(groupName => {
                  const components = filteredTree[groupName];
                  const isExpanded = expandedGroups.includes(groupName);
                  
                  return (
                    <div key={groupName} id={`component-group-${groupName}`} className="border rounded-md overflow-hidden">
                      <div 
                        className={`p-2 flex items-center justify-between cursor-pointer transition-colors ${
                          // 白色/灰色显示逻辑 - 优化对比度
                          treeShowAllWhite || treeWhiteGroups.includes(groupName) 
                            ? 'bg-white border-l-4 border-blue-500 shadow-sm hover:bg-blue-50' 
                            : 'bg-gray-200 text-gray-600 border-l-4 border-gray-300 hover:bg-gray-300'
                        }`}
                        onClick={(e) => {
                          // 如果是组展开/收起，继续原有逻辑
                          toggleGroupExpand(groupName);
                          // 同时处理组的高亮
                          handleTreeGroupClick(groupName, e);
                        }}
                        onContextMenu={(e) => handleTreeGroupClick(groupName, e)}
                      >
                        <div className="flex items-center">
                          {isExpanded ? 
                            <ChevronDown className="w-4 h-4 mr-2" /> : 
                            <ChevronRight className="w-4 h-4 mr-2" />
                          }
                          <span className="font-medium text-sm">{groupName}</span>
                          <span className="ml-2 text-xs text-gray-500">({components.length}个构件)</span>
                        </div>
                        <div className="flex items-center">
                          {components.some(c => c.version !== 'current') && (
                            <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full flex items-center mr-2">
                              <History className="w-3 h-3 mr-1" />
                              含历史版本
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {isExpanded && (
                        <div className="border-t">
                          <ul className="divide-y divide-gray-100">
                            {components.map(component => {
                              // 获取各种状态
                              const finalHighlightSet = getFinalHighlightSet();
                              const isInFinalSet = finalHighlightSet.includes(component.id);
                              const isInCart = bindingCart.objects.find(o => o.id === component.id);
                              
                              // 判断是否应该显示为白色
                              const isComponentWhite = treeShowAllWhite || treeWhiteComponents.includes(component.id);
                              
                              return (
                                <li 
                                  key={component.id}
                                  id={`component-item-${component.id}`}
                                  className={`p-2 pl-8 text-sm cursor-pointer transition-colors ${
                                    // 白色/灰色显示逻辑 - 优化对比度
                                    isComponentWhite 
                                      ? 'bg-white border-l-4 border-green-500 shadow-sm hover:bg-green-50' 
                                      : 'bg-gray-200 text-gray-600 border-l-4 border-gray-300 hover:bg-gray-300'
                                  } ${isInFinalSet ? 'bg-blue-50' : ''}`}
                                  onClick={(e) => handleTreeComponentClick(component, e)}
                                  onContextMenu={(e) => handleTreeComponentClick(component, e)}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                      {component.version !== 'current' ? (
                                        <History className="w-3 h-3 text-orange-600 mr-1 flex-shrink-0" />
                                      ) : (
                                        <div className="w-3 h-3 mr-1" />
                                      )}
                                      <span className="truncate">{component.name}</span>
                                    </div>
                                  </div>
                                  <div className="text-xs text-gray-500 ml-4">
                                    {component.properties.material} | v: {component.version}
                                  </div>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                {componentFilter ? 
                  `没有找到包含 "${componentFilter}" 的构件` : 
                  '没有找到符合条件的构件'
                }
              </div>
            )}
          </div>
        </div>
      );
    }
  };

  // 点击页面任何地方关闭上下文菜单
  useEffect(() => {
    const handleClickOutside = () => {
      if (contextMenu.visible) {
        setContextMenu({ ...contextMenu, visible: false });
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [contextMenu]);

  // 右键菜单组件
  const ContextMenu = () => {
    if (!contextMenu.visible) return null;
    
    const handleFileManagement = () => {
      // 获取要管理文件的构件ID列表
      let componentsForFiles: string[] = [];
      
      if (contextMenu.isFromTree) {
        // 来自模型树的右键点击 - 使用白色显示的构件
        if (treeShowAllWhite) {
          // 如果所有都显示为白色，则管理所有构件的文件
          componentsForFiles = components.map(c => c.id);
        } else {
          // 只管理白色构件的文件
          componentsForFiles = treeWhiteComponents;
        }
      } else {
        const highlightedComponents = getFinalHighlightSet();
        if (contextMenu.componentId && !highlightedComponents.includes(contextMenu.componentId)) {
          componentsForFiles = [...highlightedComponents, contextMenu.componentId];
        } else {
          componentsForFiles = highlightedComponents;
        }
      }
      
      setSelectedComponentsForFiles(componentsForFiles);
      setShowFileManagement(true);
      setContextMenu({...contextMenu, visible: false});
    };
    
    const handleShowAllObjects = () => {
      showAllTreeObjectsWhite();
      setContextMenu({...contextMenu, visible: false});
    };
    
    const handleAddToBindingPanel = () => {
      let componentsToAdd: Component[] = [];
      
      if (contextMenu.isFromTree) {
        // 来自模型树的右键点击 - 添加所有白色构件
        if (treeShowAllWhite) {
          // 如果所有都显示为白色，则添加所有构件
          componentsToAdd = components;
        } else {
          // 只添加白色构件
          componentsToAdd = components.filter(c => treeWhiteComponents.includes(c.id));
        }
      } else {
        // 来自其他地方的右键点击 - 使用原有逻辑
        const highlightedComponents = getFinalHighlightSet();
        if (contextMenu.componentId) {
          const component = components.find(c => c.id === contextMenu.componentId);
          if (component) {
            componentsToAdd = [component];
          }
        } else {
          componentsToAdd = components.filter(c => highlightedComponents.includes(c.id));
        }
      }
      
      if (componentsToAdd.length > 0) {
        componentsToAdd.forEach(component => {
          addObjectToCart(component);
        });
      }
      
      setContextMenu({...contextMenu, visible: false});
    };

    // 判断是否显示管理关联文件选项（只对白色条目显示）
    const shouldShowFileManagement = () => {
      if (!contextMenu.isFromTree) return !isViewOnlyUser() && !isBindingMode;
      
      if (treeShowAllWhite) return !isViewOnlyUser() && !isBindingMode;
      
      // 检查右键点击的条目是否为白色
      if (contextMenu.componentId) {
        return treeWhiteComponents.includes(contextMenu.componentId) && !isViewOnlyUser() && !isBindingMode;
      }
      
      // 如果是组级别的右键，检查组是否为白色
      if (treeHighlightedGroupName) {
        return treeWhiteGroups.includes(treeHighlightedGroupName) && !isViewOnlyUser() && !isBindingMode;
      }
      
      return false;
    };
    
    // 判断是否显示添加到绑定面板选项（只对白色条目显示）
    const shouldShowAddToBindingPanel = () => {
      if (!hasBindingPermission() || !isBindingMode) return false;
      
      if (!contextMenu.isFromTree) return true; // 非模型树右键，使用原有逻辑
      
      if (treeShowAllWhite) return true; // 所有都是白色时显示
      
      // 检查右键点击的条目是否为白色
      if (contextMenu.componentId) {
        return treeWhiteComponents.includes(contextMenu.componentId);
      }
      
      // 如果是组级别的右键，检查组是否为白色
      if (treeHighlightedGroupName) {
        return treeWhiteGroups.includes(treeHighlightedGroupName);
      }
      
      return false;
    };
    
    return (
      <div 
        className="fixed bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50 w-48"
        style={{ 
          left: `${contextMenu.x}px`, 
          top: `${contextMenu.y}px` 
        }}
      >
        {contextMenu.isFromTree && (
          <div 
            className="px-4 py-2 hover:bg-blue-50 cursor-pointer flex items-center"
            onClick={handleShowAllObjects}
          >
            <Eye className="w-4 h-4 mr-2 text-green-600" />
            <span>显示所有对象</span>
          </div>
        )}
        
        {shouldShowFileManagement() && (
          <div 
            className="px-4 py-2 hover:bg-blue-50 cursor-pointer flex items-center"
            onClick={handleFileManagement}
          >
            <FileText className="w-4 h-4 mr-2 text-blue-600" />
            <span>管理关联文件</span>
          </div>
        )}
        
        {shouldShowAddToBindingPanel() && (
          <div 
            className="px-4 py-2 hover:bg-blue-50 cursor-pointer flex items-center"
            onClick={handleAddToBindingPanel}
          >
            <ShoppingCart className="w-4 h-4 mr-2 text-orange-600" />
            <span>添加到绑定面板</span>
          </div>
        )}
        
        <div className="border-t my-1"></div>
        
        <div 
          className="px-4 py-2 hover:bg-blue-50 cursor-pointer flex items-center"
          onClick={() => setContextMenu({...contextMenu, visible: false})}
        >
          <X className="w-4 h-4 mr-2 text-gray-600" />
          <span>取消</span>
        </div>
      </div>
    );
  };

  // 文件管理页面
  const FileManagementPage = () => {
    const [selectedFiles, setSelectedFiles] = useState<number[]>([]);
    const [fileSearchText, setFileSearchText] = useState('');
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploadStep, setUploadStep] = useState(1);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [selectedACCFiles, setSelectedACCFiles] = useState<string[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [fileToDelete, setFileToDelete] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteSuccess, setDeleteSuccess] = useState<{show: boolean, count: number}>({show: false, count: 0});
    const [showEditModal, setShowEditModal] = useState(false);
    const [fileToEdit, setFileToEdit] = useState<FileItem | null>(null);
    const [editedFileName, setEditedFileName] = useState('');
    const [editedFileType, setEditedFileType] = useState('');
    const [editSuccess, setEditSuccess] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [dateFilter, setDateFilter] = useState<{start: string, end: string}>({start: '', end: ''});
    const [typeFilter, setTypeFilter] = useState<string>('');
    const [showMyFilesOnly, setShowMyFilesOnly] = useState(false);
    
    // 固定的文件类型选项
    const fileTypes = ['施工方案', '物料提交', '施工图纸', '测试报告'];
    
    // 为ACC文件添加文件夹结构的状态
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['04', '4.1', '4.10', '4.2', '4.3']));
    
    // 文件内容查看功能的状态
    const [showFilePreview, setShowFilePreview] = useState(false);
    const [previewFile, setPreviewFile] = useState<any>(null);
    
    // 文件类型映射函数 - 根据文件夹类型映射到系统文件类型
    const mapACCFileType = (folderName: string) => {
      if (folderName.includes('Safety') || folderName.includes('Quality') || folderName.includes('Risk')) {
        return '测试报告';
      } else if (folderName.includes('Resources')) {
        return '物料提交';
      } else if (folderName.includes('Method Statements') || folderName.includes('Statutory Approvals')) {
        return '施工方案';
      } else if (folderName.includes('Materials') || folderName.includes('Surveys') || folderName.includes('Technical Reports') || folderName.includes('Models') || folderName.includes('Drawings')) {
        return '施工图纸';
      }
      return '施工方案'; // 默认类型
    };
    
    // 模拟ACC平台的文件列表 - 按文件夹层级组织，添加正确的文件类型
    const accFiles = {
      '04': {
        name: '04 Published [AC]',
        type: 'folder',
        children: {
          '4.1': {
            name: '4.1 Safety, Quality & Risk',
            type: 'folder',
            children: {
              'files': [
                { id: 'acc-1', name: '1505-W-PHD-KFC-120-000105.pdf', type: '测试报告', size: '2.4MB', date: '2023-10-15', content: '这是一份安全质量风险评估报告...' },
                { id: 'acc-2', name: '1505-W-PHD-KFC-760-000003.pdf', type: '测试报告', size: '3.8MB', date: '2023-11-02', content: '质量检测报告内容...' },
                { id: 'acc-3', name: '1505-W-PHD-KFC-760-000004.pdf', type: '测试报告', size: '5.1MB', date: '2023-11-10', content: '风险评估分析报告...' },
                { id: 'acc-4', name: '1505-W-PHD-KFC-760-000044.pdf', type: '测试报告', size: '1.2MB', date: '2023-12-05', content: '安全检查记录...' },
                { id: 'acc-5', name: '1505-W-PHD-KFC-760-000050.pdf', type: '测试报告', size: '4.5MB', date: '2023-12-20', content: '质量验收报告...' },
                { id: 'acc-6', name: '1505-W-PHD-KFC-760-000057.pdf', type: '测试报告', size: '1.8MB', date: '2024-01-08', content: '安全风险评估总结...' }
              ]
            }
          },
          '4.10': {
            name: '4.10 Statutory Approvals',
            type: 'folder',
            children: {
              'files': [
                { id: 'acc-7', name: '1505-W-PHD-KFC-760-000061.pdf', type: '施工方案', size: '18.5MB', date: '2024-01-15', content: '法定审批文件内容...' },
                { id: 'acc-8', name: '1505-W-PHD-KFC-760-000070.pdf', type: '施工方案', size: '2.7MB', date: '2024-02-01', content: '施工许可证申请文件...' }
              ]
            }
          },
          '4.2': {
            name: '4.2 Resources',
            type: 'folder',
            children: {
              'files': [
                { id: 'acc-9', name: '1505-W-PHD-KFC-760-000153.pdf', type: '物料提交', size: '3.2MB', date: '2024-02-10', content: '资源配置计划文档...' }
              ]
            }
          },
          '4.3': {
            name: '4.3 Method Statements',
            type: 'folder',
            children: {
              'files': [
                { id: 'acc-10', name: '1505-W-PHD-KFC-785-000009.pdf', type: '施工方案', size: '6.8MB', date: '2024-02-15', content: '施工工艺说明书...' },
                { id: 'acc-11', name: '1831-W-PHD-KFC-410-000001.pdf', type: '施工方案', size: '4.1MB', date: '2024-02-20', content: '方法声明文档...' },
                { id: 'acc-12', name: '1831-W-PHD-KFC-760-000017.pdf', type: '施工方案', size: '2.9MB', date: '2024-02-25', content: '施工技术方案...' },
                { id: 'acc-13', name: '1831-W-PHD-KFC-760-000036.pdf', type: '施工方案', size: '3.5MB', date: '2024-03-01', content: '工艺流程说明...' }
              ]
            }
          },
          '4.4': {
            name: '4.4 Materials',
            type: 'folder',
            children: {
              'files': []
            }
          },
          '4.5': {
            name: '4.5 Surveys',
            type: 'folder',
            children: {
              'files': []
            }
          },
          '4.6': {
            name: '4.6 Technical Reports',
            type: 'folder',
            children: {
              'files': []
            }
          },
          '4.7': {
            name: '4.7 Models',
            type: 'folder',
            children: {
              'files': []
            }
          },
          '4.8': {
            name: '4.8 Drawings',
            type: 'folder',
            children: {
              'files': []
            }
          }
        }
      }
    };

    // 获取所有文件用于选择
    const getAllACCFiles = () => {
      const allFiles = [];
      const traverse = (node) => {
        if (node.children) {
          if (node.children.files) {
            allFiles.push(...node.children.files);
          }
          Object.values(node.children).forEach(child => {
            if (child.children) traverse(child);
          });
        }
      };
      Object.values(accFiles).forEach(traverse);
      return allFiles;
    };

    const toggleFolder = (folderId: string) => {
      setExpandedFolders(prev => {
        const newSet = new Set(prev);
        if (newSet.has(folderId)) {
          newSet.delete(folderId);
        } else {
          newSet.add(folderId);
        }
        return newSet;
      });
    };

    const renderFileTree = (node: any, nodeId: string, level: number = 0) => {
      const isExpanded = expandedFolders.has(nodeId);
      const paddingLeft = level * 20;

      if (node.type === 'folder') {
        return (
          <div key={nodeId}>
            <div 
              className="flex items-center py-2 px-3 hover:bg-gray-50 cursor-pointer"
              style={{ paddingLeft: `${paddingLeft + 12}px` }}
              onClick={() => toggleFolder(nodeId)}
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 mr-2 text-gray-500" />
              ) : (
                <ChevronRight className="w-4 h-4 mr-2 text-gray-500" />
              )}
              <Folder className="w-4 h-4 mr-2 text-blue-500" />
              <span className="text-sm font-medium text-gray-700">{node.name}</span>
              {node.children?.files && (
                <span className="ml-auto text-xs text-gray-500">
                  ({node.children.files.length})
                </span>
              )}
            </div>
            
            {isExpanded && node.children && (
              <div>
                {/* 渲染子文件夹 */}
                {Object.entries(node.children).map(([childId, child]) => {
                  if (childId !== 'files') {
                    return renderFileTree(child, childId, level + 1);
                  }
                })}
                
                {/* 渲染文件 */}
                {node.children.files && node.children.files.map((file) => (
                  <div 
                    key={file.id}
                    className={`flex items-center py-2 px-3 ${
                      selectedACCFiles.includes(file.id) ? 'bg-blue-50 border-l-2 border-blue-500' : 'hover:bg-gray-50'
                    }`}
                    style={{ paddingLeft: `${paddingLeft + 32}px` }}
                  >
                    <input 
                      type="checkbox" 
                      checked={selectedACCFiles.includes(file.id)}
                      onChange={() => toggleACCFileSelection(file.id)}
                      className="mr-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      title={`选择文件: ${file.name}`}
                    />
                    <FileText className="w-4 h-4 mr-2 text-red-500" />
                    <div 
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => toggleACCFileSelection(file.id)}
                    >
                      <div className="text-sm text-gray-900 truncate">{file.name}</div>
                      <div className="text-xs text-gray-500">{file.size} • {file.date} • {file.type}</div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewFile(file);
                        setShowFilePreview(true);
                      }}
                      className="ml-2 p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                      title="查看文件内容"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      }
      
      return null;
    };
    
    const getAssociatedFiles = () => {
      if (selectedComponentsForFiles.length === 0) return [];
      
      return files.filter(file => 
        file.objects.some(objId => selectedComponentsForFiles.includes(objId))
      );
    };
    
    const getFilteredFiles = () => {
      let filteredFiles = getAssociatedFiles();
      
      // 文本搜索过滤
      if (fileSearchText) {
        filteredFiles = filteredFiles.filter(file => 
          file.name.toLowerCase().includes(fileSearchText.toLowerCase()) ||
          file.type.toLowerCase().includes(fileSearchText.toLowerCase()) ||
          file.uploadedBy.toLowerCase().includes(fileSearchText.toLowerCase())
        );
      }
      
      // 日期范围过滤
      if (dateFilter.start) {
        filteredFiles = filteredFiles.filter(file => 
          file.updateDate >= dateFilter.start
        );
      }
      
      if (dateFilter.end) {
        filteredFiles = filteredFiles.filter(file => 
          file.updateDate <= dateFilter.end
        );
      }
      
      // 文件类型过滤
      if (typeFilter) {
        filteredFiles = filteredFiles.filter(file => 
          file.type === typeFilter
        );
      }
      
      // 仅显示我上传的文件
      if (showMyFilesOnly) {
        filteredFiles = filteredFiles.filter(file => 
          file.uploadedBy === currentUser
        );
      }
      
      return filteredFiles;
    };
    
    // 获取所有上传者列表（去重）
    const getUploaders = () => {
      const uploaders = new Set<string>();
      files.forEach(file => {
        uploaders.add(file.uploadedBy);
      });
      return Array.from(uploaders);
    };
    
    // 清除所有筛选条件
    const clearAllFilters = () => {
      setDateFilter({start: '', end: ''});
      setTypeFilter('');
      setShowMyFilesOnly(false);
      setFileSearchText('');
    };
    
    // 检查是否有任何筛选条件被应用
    const hasActiveFilters = () => {
      return !!(
        fileSearchText || 
        dateFilter.start || 
        dateFilter.end || 
        typeFilter || 
        showMyFilesOnly
      );
    };
    
    const toggleFileSelection = (fileId: number) => {
      setSelectedFiles(prev => {
        if (prev.includes(fileId)) {
          return prev.filter(id => id !== fileId);
        } else {
          return [...prev, fileId];
        }
      });
    };
    
    const toggleSelectAll = () => {
      const filteredFiles = getFilteredFiles();
      if (selectedFiles.length === filteredFiles.length) {
        setSelectedFiles([]);
      } else {
        setSelectedFiles(filteredFiles.map(file => file.id));
      }
    };
    
    const toggleACCFileSelection = (fileId: string) => {
      setSelectedACCFiles(prev => {
        if (prev.includes(fileId)) {
          return prev.filter(id => id !== fileId);
        } else {
          return [...prev, fileId];
        }
      });
    };
    
    const handleUploadFiles = () => {
      setIsUploading(true);
      setUploadProgress(0);
      
      // 模拟上传进度
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => {
              setIsUploading(false);
              setUploadStep(3); // 完成步骤
            }, 500);
            return 100;
          }
          return prev + 5;
        });
      }, 200);
    };
    
    const resetUploadModal = () => {
      setShowUploadModal(false);
      setUploadStep(1);
      setUploadProgress(0);
      setSelectedACCFiles([]);
      setIsUploading(false);
    };
    
    const completeUpload = () => {
      // 模拟添加新文件到列表
      const allACCFiles = getAllACCFiles();
      const newFiles = selectedACCFiles.map((fileId, index) => {
        const accFile = allACCFiles.find(f => f.id === fileId);
        return {
          id: files.length + index + 1,
          name: accFile?.name || '未命名文件',
          uploadDate: new Date().toISOString().split('T')[0],
          updateDate: new Date().toISOString().split('T')[0],
          type: accFile?.type || '未知类型',
          bindingStatus: 'current' as const,
          uploadedBy: currentUser,
          linkedToCurrent: true,
          objects: selectedComponentsForFiles,
          hydCode: {
            project: '项目A',
            contractor: '承包商B',
            location: '位置C',
            structure: '结构D',
            space: '空间E',
            grid: '网格F',
            cat: '类别G'
          },
          version: 1
        };
      });
      
      // 更新文件列表
      setFiles(prev => [...prev, ...newFiles]);
      resetUploadModal();
    };
    
    const handleDeleteFile = (fileId: number) => {
      setFileToDelete(fileId);
      setShowDeleteConfirm(true);
    };
    
    const handleBulkDelete = () => {
      if (selectedFiles.length > 0) {
        setShowDeleteConfirm(true);
      }
    };
    
    const confirmDelete = () => {
      setIsDeleting(true);
      
      // 模拟删除操作延迟
      setTimeout(() => {
        // 如果是单个文件删除
        if (fileToDelete !== null) {
          setFiles(prevFiles => prevFiles.filter(file => file.id !== fileToDelete));
          setDeleteSuccess({show: true, count: 1});
        } 
        // 如果是批量删除
        else if (selectedFiles.length > 0) {
          setFiles(prevFiles => prevFiles.filter(file => !selectedFiles.includes(file.id)));
          setDeleteSuccess({show: true, count: selectedFiles.length});
          setSelectedFiles([]);
        }
        
        setIsDeleting(false);
        setShowDeleteConfirm(false);
        setFileToDelete(null);
        
        // 3秒后隐藏成功提示
        setTimeout(() => {
          setDeleteSuccess({show: false, count: 0});
        }, 3000);
      }, 1000);
    };
    
    const cancelDelete = () => {
      setShowDeleteConfirm(false);
      setFileToDelete(null);
    };
    
    // 删除确认对话框
    const DeleteConfirmModal = () => {
      if (!showDeleteConfirm) return null;
      
      const count = fileToDelete !== null ? 1 : selectedFiles.length;
      const fileNames = fileToDelete !== null 
        ? files.find(f => f.id === fileToDelete)?.name || "未知文件"
        : selectedFiles.length > 2 
          ? `${files.find(f => f.id === selectedFiles[0])?.name || "未知文件"} 等 ${selectedFiles.length} 个文件` 
          : selectedFiles.map(id => files.find(f => f.id === id)?.name || "未知文件").join(", ");
      
      return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 text-red-600 mb-4">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-medium mb-2">确认删除</h3>
              <p className="text-gray-600">
                您确定要删除 <span className="font-medium">{fileNames}</span> 吗？
              </p>
              <p className="text-gray-500 text-sm mt-2">此操作无法撤销</p>
            </div>
            
            {isDeleting ? (
              <div className="flex justify-center items-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                <span className="ml-2 text-gray-600">正在删除...</span>
              </div>
            ) : (
              <div className="flex justify-end space-x-3">
                <button 
                  onClick={cancelDelete}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  disabled={isDeleting}
                >
                  取消
                </button>
                <button 
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-red-600 rounded-md text-white hover:bg-red-700"
                  disabled={isDeleting}
                >
                  确认删除
                </button>
              </div>
            )}
          </div>
        </div>
      );
    };
    
    // 删除成功提示
    const DeleteSuccessToast = () => {
      if (!deleteSuccess.show) return null;
      
      return (
        <div className="fixed bottom-4 right-4 bg-green-600 text-white px-4 py-3 rounded-md shadow-lg flex items-center z-50">
          <CheckCircle className="w-5 h-5 mr-2" />
          <span>成功删除 {deleteSuccess.count} 个文件</span>
        </div>
      );
    };
    
    const filteredFiles = getFilteredFiles();
    
    // ACC文件上传模态框
    const ACCUploadModal = () => {
      if (!showUploadModal) return null;
      
      return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-5xl max-h-[90vh] flex flex-col">
            <div className="border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">从ACC平台添加文件</h2>
              <button 
                onClick={resetUploadModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="px-6 py-4 flex-1 overflow-hidden">
              {/* 步骤指示器 */}
              <div className="flex items-center mb-6">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${uploadStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                  1
                </div>
                <div className={`h-1 flex-grow mx-2 ${uploadStep >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${uploadStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                  2
                </div>
                <div className={`h-1 flex-grow mx-2 ${uploadStep >= 3 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${uploadStep >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                  3
                </div>
              </div>
              
              {/* 步骤内容 */}
              {uploadStep === 1 && (
                <div className="flex-1 overflow-hidden">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium">选择ACC平台文件</h3>
                    <div className="text-sm text-gray-600">
                      已选择 {selectedACCFiles.length} 个文件
                              </div>
                  </div>
                  
                  {/* 文件树容器 */}
                  <div className="border rounded-lg bg-white overflow-auto" style={{ height: '400px' }}>
                    <div className="py-2">
                      {Object.entries(accFiles).map(([nodeId, node]) => 
                        renderFileTree(node, nodeId, 0)
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {uploadStep === 2 && (
                <div>
                  <h3 className="text-lg font-medium mb-4">上传文件</h3>
                  <div className="mb-4">
                    <p className="text-gray-600 mb-2">已选择 {selectedACCFiles.length} 个文件</p>
                    <ul className="border rounded-lg p-3 mb-4 max-h-40 overflow-y-auto">
                      {selectedACCFiles.map(fileId => {
                        const allFiles = getAllACCFiles();
                        const file = allFiles.find(f => f.id === fileId);
                        return (
                          <li key={fileId} className="flex items-center py-1">
                            <FileText className="w-4 h-4 mr-2 text-gray-400" />
                            <span>{file?.name}</span>
                            <span className="ml-auto text-sm text-gray-500">{file?.size}</span>
                          </li>
                        );
                      })}
                    </ul>
                    
                    {isUploading ? (
                      <div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                          <div 
                            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                            style={{ width: `${uploadProgress}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>上传中...</span>
                          <span>{uploadProgress}%</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-600">点击下方按钮开始上传</p>
                    )}
                  </div>
                </div>
              )}
              
              {uploadStep === 3 && (
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mb-4">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">上传成功</h3>
                  <p className="text-gray-600 mb-4">已成功上传 {selectedACCFiles.length} 个文件</p>
                </div>
              )}
            </div>
            
            <div className="border-t px-6 py-4 flex justify-end space-x-3">
              {uploadStep < 3 && (
                <button 
                  onClick={resetUploadModal}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  取消
                </button>
              )}
              
              {uploadStep === 1 && (
                <button 
                  onClick={() => setUploadStep(2)}
                  disabled={selectedACCFiles.length === 0}
                  className={`px-4 py-2 rounded-md text-white ${selectedACCFiles.length > 0 ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-300 cursor-not-allowed'}`}
                >
                  下一步
                </button>
              )}
              
              {uploadStep === 2 && !isUploading && (
                <button 
                  onClick={handleUploadFiles}
                  className="px-4 py-2 bg-blue-600 rounded-md text-white hover:bg-blue-700"
                >
                  开始上传
                </button>
              )}
              
              {uploadStep === 3 && (
                <button 
                  onClick={completeUpload}
                  className="px-4 py-2 bg-blue-600 rounded-md text-white hover:bg-blue-700"
                >
                  完成
                </button>
              )}
            </div>
          </div>
        </div>
      );
    };
    
    const handleEditFile = (file: FileItem) => {
      setFileToEdit(file);
      setEditedFileName(file.name);
      setEditedFileType(file.type);
      setShowEditModal(true);
    };
    
    const saveEditedFile = () => {
      if (!fileToEdit) return;
      
      // 模拟编辑延迟
      setTimeout(() => {
        setFiles(prevFiles => prevFiles.map(file => {
          if (file.id === fileToEdit.id) {
            // 创建新版本
            const newVersion = (file.version || 1) + 1;
            return {
              ...file,
              name: editedFileName,
              type: editedFileType,
              updateDate: new Date().toISOString().split('T')[0],
              version: newVersion
            };
          }
          return file;
        }));
        
        setShowEditModal(false);
        setFileToEdit(null);
        setEditSuccess(true);
        
        // 3秒后隐藏成功提示
        setTimeout(() => {
          setEditSuccess(false);
        }, 3000);
      }, 800);
    };
    
    // 文件编辑模态框
    const EditFileModal = () => {
      if (!showEditModal || !fileToEdit) return null;
      
      const currentVersion = fileToEdit.version || 1;
      
      return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium">编辑文件</h3>
              <button 
                onClick={() => setShowEditModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="fileName" className="block text-sm font-medium text-gray-700 mb-1">
                  文件名称
                </label>
                <input
                  type="text"
                  id="fileName"
                  value={editedFileName}
                  onChange={(e) => setEditedFileName(e.target.value)}
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label htmlFor="fileType" className="block text-sm font-medium text-gray-700 mb-1">
                  文件类型
                </label>
                <select
                  id="fileType"
                  value={editedFileType}
                  onChange={(e) => setEditedFileType(e.target.value)}
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {fileTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <History className="w-4 h-4" />
                <span>当前版本: v{currentVersion}</span>
                <span className="mx-2">•</span>
                <span>编辑后将升级至: v{currentVersion + 1}</span>
              </div>
              
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Calendar className="w-4 h-4" />
                <span>上传日期: {fileToEdit.uploadDate}</span>
              </div>
              
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Clock className="w-4 h-4" />
                <span>最后更新: {fileToEdit.updateDate}</span>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button 
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                取消
              </button>
              <button 
                onClick={saveEditedFile}
                className="px-4 py-2 bg-blue-600 rounded-md text-white hover:bg-blue-700"
                disabled={!editedFileName.trim()}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      );
    };
    
    // 编辑成功提示
    const EditSuccessToast = () => {
      if (!editSuccess) return null;
      
      return (
        <div className="fixed bottom-4 right-4 bg-green-600 text-white px-4 py-3 rounded-md shadow-lg flex items-center z-50">
          <CheckCircle className="w-5 h-5 mr-2" />
          <span>文件编辑成功，版本已更新</span>
        </div>
      );
    };
    
    // 文件预览模态框
    const FilePreviewModal = () => {
      if (!showFilePreview || !previewFile) return null;
      
      return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="border-b px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">{previewFile.name}</h2>
                <p className="text-sm text-gray-600">{previewFile.type} • {previewFile.size} • {previewFile.date}</p>
              </div>
              <button 
                onClick={() => setShowFilePreview(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="px-6 py-4 flex-1 overflow-auto">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium mb-3">文件内容预览</h3>
                <div className="bg-white p-4 rounded border">
                  <p className="text-gray-700 whitespace-pre-wrap">{previewFile.content}</p>
                </div>
              </div>
            </div>
            
            <div className="border-t px-6 py-4 flex justify-end space-x-3">
              <button 
                onClick={() => setShowFilePreview(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                关闭
              </button>
              <button 
                onClick={() => {
                  toggleACCFileSelection(previewFile.id);
                  setShowFilePreview(false);
                }}
                className={`px-4 py-2 rounded-md text-white ${
                  selectedACCFiles.includes(previewFile.id) 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {selectedACCFiles.includes(previewFile.id) ? '取消选择' : '选择文件'}
              </button>
            </div>
          </div>
        </div>
      );
    };
    
    return (
      <div className="fixed inset-0 bg-gray-50 z-50 flex flex-col">
        <div className="bg-white shadow-sm px-6 py-4 flex items-center">
          <button 
            onClick={() => setShowFileManagement(false)}
            className="text-blue-600 hover:text-blue-800 flex items-center mr-4"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            返回
          </button>
          <h1 className="text-xl font-semibold">文件管理</h1>
          <span className="text-sm text-gray-500 ml-4">
            已选择 {selectedComponentsForFiles.length} 个构件
          </span>
        </div>
        
        <div className="flex-1 p-6">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {!isBindingMode && hasBindingPermission() && (
                  <button 
                    className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700 flex items-center"
                    onClick={() => setShowUploadModal(true)}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    添加文件
                  </button>
                )}
                {!isBindingMode && hasBindingPermission() && selectedFiles.length > 0 && (
                  <button 
                    className="bg-red-600 text-white px-3 py-1.5 rounded text-sm hover:bg-red-700 flex items-center"
                    onClick={handleBulkDelete}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    删除 ({selectedFiles.length})
                  </button>
                )}
                
                <button 
                  className={`px-3 py-1.5 rounded text-sm flex items-center ${showFilters ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className="w-4 h-4 mr-1" />
                  筛选
                  {hasActiveFilters() && <span className="ml-1 w-2 h-2 rounded-full bg-blue-600"></span>}
                </button>
                
                {hasActiveFilters() && (
                  <button 
                    className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                    onClick={clearAllFilters}
                  >
                    清除筛选
                  </button>
                )}
              </div>
              
              <div className="relative">
                <input
                  type="text"
                  value={fileSearchText}
                  onChange={(e) => setFileSearchText(e.target.value)}
                  placeholder="搜索文件..."
                  className="border rounded-md pl-9 pr-4 py-1.5 text-sm w-64"
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <Search className="w-4 h-4 text-gray-400" />
                </div>
                {fileSearchText && (
                  <button
                    onClick={() => setFileSearchText('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            
            {/* 筛选面板 */}
            {showFilters && (
              <div className="mb-4 p-4 border rounded-md bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">日期范围</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="date"
                        value={dateFilter.start}
                        onChange={(e) => setDateFilter(prev => ({...prev, start: e.target.value}))}
                        className="border rounded-md px-2 py-1 text-sm w-full"
                      />
                      <span className="text-gray-500">至</span>
                      <input
                        type="date"
                        value={dateFilter.end}
                        onChange={(e) => setDateFilter(prev => ({...prev, end: e.target.value}))}
                        className="border rounded-md px-2 py-1 text-sm w-full"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">文件类型</label>
                    <select
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                      className="border rounded-md px-2 py-1 text-sm w-full"
                    >
                      <option value="">全部类型</option>
                      {fileTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="mt-3 flex items-center">
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showMyFilesOnly}
                      onChange={(e) => setShowMyFilesOnly(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                    />
                    <span className="text-sm text-gray-700">只显示我上传的文件</span>
                  </label>
                </div>
              </div>
            )}
            
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-3 w-10">
                      <input 
                        type="checkbox" 
                        checked={selectedFiles.length === filteredFiles.length && filteredFiles.length > 0} 
                        onChange={toggleSelectAll}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      文件名称
                    </th>
                    <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      类型
                    </th>
                    <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      版本
                    </th>
                    <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      上传日期
                    </th>
                    <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      更新日期
                    </th>
                    <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      上传者
                    </th>
                    <th className="p-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      关联构件
                    </th>
                    <th className="p-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFiles.length > 0 ? (
                    filteredFiles.map(file => (
                      <tr 
                        key={file.id} 
                        className={`border-b hover:bg-gray-50 ${selectedFiles.includes(file.id) ? 'bg-blue-50' : ''}`}
                      >
                        <td className="p-3">
                          <input 
                            type="checkbox" 
                            checked={selectedFiles.includes(file.id)} 
                            onChange={() => toggleFileSelection(file.id)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </td>
                        <td className="p-3 font-medium">
                          <div className="flex items-center">
                            {file.name}
                            {file.uploadedBy === currentUser && (
                              <span className="ml-2 px-1.5 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                                我的
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3">{file.type}</td>
                        <td className="p-3">v{file.version || 1}</td>
                        <td className="p-3">{file.uploadDate}</td>
                        <td className="p-3">{file.updateDate}</td>
                        <td className="p-3 text-sm text-gray-600">{file.uploadedBy}</td>
                        <td className="p-3 text-center">{file.objects.length}</td>
                        <td className="p-3">
                          <div className="flex items-center justify-end space-x-1">
                            <button
                              onClick={() => handleListItemClick(file, 'file')}
                              className="text-blue-600 hover:text-blue-800 p-1"
                              title="查看详情"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            
                            {(isAdmin() || file.uploadedBy === currentUser) && !isBindingMode && (
                              <button
                                className="text-green-600 hover:text-green-800 p-1"
                                title="编辑文件"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditFile(file);
                                }}
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                            )}
                            
                            {(isAdmin() || file.uploadedBy === currentUser) && !isBindingMode && (
                              <button
                                className="text-red-600 hover:text-red-800 p-1"
                                title="删除文件"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteFile(file.id);
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-gray-500">
                        {fileSearchText ? 
                          `没有找到包含 "${fileSearchText}" 的文件` : 
                          '没有关联的文件'
                        }
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        {/* ACC文件上传模态框 */}
        <ACCUploadModal />
        
        {/* 删除确认对话框 */}
        <DeleteConfirmModal />
        
        {/* 删除成功提示 */}
        <DeleteSuccessToast />
        
        {/* 文件编辑模态框 */}
        <EditFileModal />
        
        {/* 编辑成功提示 */}
        <EditSuccessToast />
        
        {/* 文件预览模态框 */}
        <FilePreviewModal />
      </div>
    );
  };

  // ==================== 删除构件逻辑模块 ====================
  
  // 重新创建的删除构件函数 - 更可靠的实现
  const removeComponentFromBindingCart = useCallback((componentId: string): void => {
    console.log('[DELETE] 开始删除构件:', componentId);
    
    // 强制立即更新状态，使用函数式更新确保最新状态
    setBindingCart(prevCart => {
      console.log('[DELETE] 删除前购物车状态:', prevCart);
      console.log('[DELETE] 删除前构件数量:', prevCart.objects.length);
      console.log('[DELETE] 要删除的构件ID:', componentId);
      
      // 检查构件是否存在
      const targetComponent = prevCart.objects.find(obj => obj.id === componentId);
      if (!targetComponent) {
        console.warn('[DELETE] 警告: 要删除的构件不存在于购物车中');
        return prevCart; // 如果构件不存在，返回原状态
      }
      
      console.log('[DELETE] 找到目标构件:', targetComponent.name, targetComponent.id);
      
      // 过滤掉要删除的构件
      const updatedObjects = prevCart.objects.filter(obj => {
        const shouldKeep = obj.id !== componentId;
        if (!shouldKeep) {
          console.log('[DELETE] 正在删除构件:', obj.name, obj.id);
        }
        return shouldKeep;
      });
      
      console.log('[DELETE] 过滤后构件数量:', updatedObjects.length);
      console.log('[DELETE] 剩余构件列表:', updatedObjects.map(obj => `${obj.name}(${obj.id})`));
      
      // 重新计算是否包含历史构件
      const hasHistoricalObjects = updatedObjects.some(obj => obj.version !== 'current');
      console.log('[DELETE] 重新计算历史对象状态:', hasHistoricalObjects);
      
      const newCart = {
        ...prevCart,
        objects: updatedObjects,
        hasHistoricalObjects
      };
      
      console.log('[DELETE] 新的购物车状态:', newCart);
      console.log('[DELETE] 删除操作完成，新构件数量:', newCart.objects.length);
      
      return newCart;
    });
    
    // 显示删除成功提示
    console.log('[DELETE] 状态更新函数调用完成');
  }, []); // 移除bindingCart依赖项，避免无限循环

  // 重新创建的删除文件函数
  const removeFileFromBindingCart = useCallback((fileId: number): void => {
    console.log('[DELETE] 开始删除文件:', fileId);
    
    setBindingCart(prevCart => {
      const updatedFiles = prevCart.files.filter(file => file.id !== fileId);
      
      const newCart = {
        files: updatedFiles,
        objects: [], // 删除文件时清空所有构件
        hasHistoricalObjects: false
      };
      
      console.log('[DELETE] 文件删除完成，购物车已清空');
      return newCart;
    });
  }, []);

  // 统一的删除函数 - 替换原来的removeFromBindingCart
  const removeFromBindingCart = useCallback((item: FileItem | Component, type: string): void => {
    console.log('[DELETE] 删除请求:', { type, item: item.id });
    
    try {
      if (type === 'file') {
        const fileItem = item as FileItem;
        removeFileFromBindingCart(fileItem.id);
      } else if (type === 'object' || type === 'component') {
        const objItem = item as Component;
        removeComponentFromBindingCart(objItem.id);
      } else {
        console.error('[DELETE] 未知的删除类型:', type);
      }
    } catch (error) {
      console.error('[DELETE] 删除过程中出错:', error);
    }
  }, [removeFileFromBindingCart, removeComponentFromBindingCart]);

  // 删除按钮组件 - 修复版本，使用正确的状态检查
  const DeleteComponentButton: React.FC<{ component: Component }> = ({ component }) => {
    const [isDeleting, setIsDeleting] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    
    const handleDeleteClick = (e: React.MouseEvent) => {
      // 完全阻止事件传播
      e.preventDefault();
      e.stopPropagation();
      // 移除不支持的 stopImmediatePropagation() 调用
      
      if (isDeleting) {
        console.log('[DELETE-BTN] 已在删除中，忽略重复点击');
        return;
      }
      
      console.log('[DELETE-BTN] 点击删除按钮:', component.id, component.name);
      setIsDeleting(true);
      
      try {
        console.log('[DELETE-BTN] 开始执行删除操作');
        
        // 直接调用删除函数，它内部包含了存在性检查和状态更新逻辑
        removeComponentFromBindingCart(component.id);
        
        console.log('[DELETE-BTN] ✅ 删除函数已调用');
        
      } catch (error) {
        console.error('[DELETE-BTN] 删除失败:', error);
        alert(`删除构件失败: ${error.message || '未知错误'}`);
      } finally {
        // 状态更新是异步的，但我们可以立即重置isDeleting状态
        // isDeleting的主要作用是防止重复点击，而不是反映真实的删除完成状态
        setIsDeleting(false);
      }
    };
    
    return (
      <div 
        className="relative z-30 flex-shrink-0"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onMouseUp={(e) => e.stopPropagation()}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <button
          type="button"
          onClick={handleDeleteClick}
          disabled={isDeleting}
          className={`
            ml-2 p-1.5 rounded-lg border-2 transition-all duration-200 
            focus:outline-none focus:ring-4 focus:ring-red-500/30 focus:ring-offset-2
            transform hover:scale-105 active:scale-95
            ${isDeleting 
              ? 'bg-gray-300 border-gray-300 text-gray-500 cursor-not-allowed' 
              : isHovered
                ? 'bg-red-600 border-red-600 text-white shadow-lg scale-105'
                : 'bg-red-50 border-red-200 text-red-600 shadow-sm hover:shadow-md'
            }
          `}
          title={isDeleting ? "正在删除..." : `删除构件: ${component.name}`}
          style={{ 
            minWidth: '32px',
            minHeight: '32px',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            touchAction: 'manipulation',
            zIndex: 1000,
            isolation: 'isolate'
          }}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
        >
          {isDeleting ? (
            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <X className={`w-4 h-4 transition-transform duration-200 ${isHovered ? 'scale-110 text-white' : 'text-red-600'}`} />
          )}
        </button>
        {/* 添加删除提示 */}
        {isHovered && !isDeleting && (
          <div className="absolute bottom-full right-0 mb-2 px-2 py-1 text-xs text-white bg-red-600 rounded shadow-lg whitespace-nowrap z-50">
            点击删除
            <div className="absolute top-full right-2 w-0 h-0 border-l-2 border-r-2 border-t-4 border-transparent border-t-red-600"></div>
          </div>
        )}
      </div>
    );
  };

  // ==================== 删除构件逻辑模块结束 ====================

  // 浮窗拖拽处理函数
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - panelPosition.x,
      y: e.clientY - panelPosition.y
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      setPanelPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // 添加全局鼠标事件监听
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

  // Render different views based on conditions
  if (currentView === 'login') return <LoginPage />;
  if (currentView === 'project-map') return <ProjectMapPage />;
  if (currentView === 'admin') return <AdminPage />;
  if (currentView === 'risc-detail') return <RiscDetailPage />;
  if (currentView === 'file-detail') return <FileDetailPage />;
  if (showFileManagement) return <FileManagementPage />;

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
            onClick={() => {
              if (confirmExitBindingMode('返回项目地图')) {
                setCurrentView('project-map');
              }
            }}
            className="p-2 text-gray-600 hover:text-gray-900"
            title="项目地图"
          >
            <Home className="w-5 h-5" />
          </button>
          {isAdmin() && (
            <button 
              onClick={() => {
                if (confirmExitBindingMode('进入管理员后台')) {
                  setCurrentView('admin');
                }
              }}
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
              onChange={(e) => {
                const newUser = e.target.value;
                if (newUser !== currentUser) {
                  if (confirmExitBindingMode('切换用户')) {
                    setCurrentUser(newUser);
                  } else {
                    // 如果用户取消，重置选择框到当前用户
                    e.target.value = currentUser;
                  }
                }
              }}
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
            onClick={() => {
              if (confirmExitBindingMode('退出登录')) {
                setCurrentView('login');
              }
            }}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            退出登录
          </button>
          {/* User Guide Button */}
          <button 
            onClick={() => setShowUserGuide(true)}
            className="p-2 bg-blue-600 text-white rounded-full shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
            title="用户指南 / 帮助"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* 左侧栏 */}
        <div className={`bg-white shadow-sm transition-all duration-300 ${leftPanelCollapsed ? 'w-12' : 'w-80'} flex flex-col`}>
          <div className="p-4 border-b flex items-center justify-between flex-shrink-0">
            {!leftPanelCollapsed && (
              <div className="flex items-center justify-between w-full">
                <h2 className="font-medium">筛选与管理</h2>
                {/* 全局清除所有选择按钮 */}
                {(hasHydCodeFilter() || selectedRISC || selectedFile || manualHighlightSet.length > 0 || 
                  riscFilters.status || riscFilters.searchText || riscFilters.startDate || riscFilters.endDate || riscFilters.showCurrentModelBinding ||
                  fileFilters.type || fileFilters.searchText || fileFilters.startDate || fileFilters.endDate || fileFilters.showMyFiles || fileFilters.showCurrentModelBinding) && (
                  <button
                    onClick={clearAllUserSelections}
                    className="text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700 flex items-center"
                    title="清除所有筛选和选择"
                  >
                    <X className="w-3 h-3 mr-1" />
                    清除全部
                  </button>
                )}
              </div>
            )}
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
                  <div className={`border-b pb-4 mb-4 flex-shrink-0 ${floatingPanel.isHistoricalView ? 'opacity-50 pointer-events-none' : ''}`}>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium flex items-center">
                        <Filter className="w-4 h-4 mr-2" />
                        HyD Code 高级筛选
                        {floatingPanel.isHistoricalView && (
                          <span className="ml-2 text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded">
                            历史视图不可用
                          </span>
                        )}
                      </h3>
                      {hasHydCodeFilter() && (
                        <button
                          onClick={clearAllHydCodeFilters}
                          className="text-xs text-red-600 hover:text-red-800"
                          title="清除所有HyD Code筛选"
                          disabled={floatingPanel.isHistoricalView}
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
                              level === 'project' || floatingPanel.isHistoricalView ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''
                            }`}
                            disabled={level === 'project' || floatingPanel.isHistoricalView}
                            title={
                              floatingPanel.isHistoricalView ? '历史视图模式下不可使用HyD Code筛选' :
                              level === 'project' ? 'Project字段不可选择' : `选择${level}`
                            }
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
                      匹配构件: {floatingPanel.isHistoricalView ? '-' : getHydCodeFilteredComponents().length}
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
                    {(riscFilters.status || riscFilters.startDate || riscFilters.endDate || riscFilters.searchText || riscFilters.showCurrentModelBinding || selectedRISC) && (
                      <button
                        onClick={clearAllRiscFiltersAndSelections}
                        className="text-xs text-red-600 hover:text-red-800"
                        title="清除所有RISC筛选和选择"
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
                    
                    {/* 当前模型绑定筛选 */}
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="showCurrentModelBindingRisc"
                        checked={riscFilters.showCurrentModelBinding}
                        onChange={(e) => handleRiscFilterChange('showCurrentModelBinding', e.target.checked)}
                        className="mr-2 rounded"
                      />
                      <label htmlFor="showCurrentModelBindingRisc" className="text-xs text-gray-700 cursor-pointer">
                        只显示当前模型绑定
                      </label>
                    </div>
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
                                    // 基础背景色：选中状态(蓝色) > 默认状态
                                    selectedRISC === form.id ? 'bg-blue-50' : 'bg-white'
                                  } ${
                                    // 悬浮效果：根据当前是否有持续高亮来决定颜色
                                    hoveredItem?.id === form.id 
                                      ? (getFinalHighlightSet().length > 0 && (selectedRISC !== null || selectedFile !== null))
                                        ? 'ring-2 ring-yellow-400 bg-yellow-50' // 情况二：有持续高亮时悬浮显示黄色
                                        : 'ring-2 ring-blue-400 bg-blue-50'     // 情况一：无持续高亮时悬浮显示蓝色
                                      : ''
                                  } ${
                                    // 普通悬浮效果（当没有被特殊悬浮时）
                                    hoveredItem?.id !== form.id ? 'hover:bg-gray-50' : ''
                                  }`}
                                  onClick={() => handleListItemClick(form, 'risc')}
                                  onDoubleClick={() => handleDoubleClick(form, 'risc')}
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
                        <option 
                          key={version.value} 
                          value={version.value}
                          disabled={isBindingMode && version.value !== 'current'}
                        >
                          {version.label} - {version.date}
                          {isBindingMode && version.value !== 'current' && ' (绑定模式下不可用)'}
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
                      
                      {/* 绑定模式下的批量添加按钮 */}
                      {isBindingMode && getFinalHighlightSet().length > 0 && showAddAllHighlightedButton && (
                        <div className="mb-4 flex justify-center">
                          <button
                            onClick={addAllHighlightedToCart}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center font-medium shadow-md transition-all"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            添加所有高亮构件到绑定 ({getFinalHighlightSet().length})
                          </button>
                        </div>
                      )}
                      
                      {/* 绑定模式下添加构件的提示信息 */}
                      {isBindingMode && !showAddAllHighlightedButton && (
                        <div className="mb-4 flex justify-center">
                          <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg flex items-center font-medium shadow-md">
                            <CheckCircle className="w-4 h-4 mr-2" />
                            正在处理构件添加...
                          </div>
                        </div>
                      )}
                      
                      {/* 绑定模式下但没有高亮构件时的提示 */}
                      {isBindingMode && getFinalHighlightSet().length === 0 && showAddAllHighlightedButton && (
                        <div className="mb-4 flex justify-center">
                          <div className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg flex items-center font-medium">
                            <Info className="w-4 h-4 mr-2" />
                            请选择或筛选构件以高亮显示
                          </div>
                        </div>
                      )}

                      {/* 构件网格显示 */}
                      <div 
                        className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-4 w-full"
                        onMouseLeave={() => {
                          // 当鼠标离开整个构件网格区域时，确保清除悬浮状态
                          setHoveredObjects([]);
                          setHoveredItem(null);
                          setHoveredItemType(null);
                        }}
                      >
                        {getFilteredObjectGroups().map(component => {
                          // 获取各种状态
                          const finalHighlightSet = getFinalHighlightSet();
                          const isInFinalSet = finalHighlightSet.includes(component.id);
                          const isInFilterSet = filterHighlightSet.includes(component.id);
                          const isInManualSet = manualHighlightSet.includes(component.id);
                          const isInCart = bindingCart.objects.find(o => o.id === component.id);
                          const isHovered = hoveredObjects.includes(component.id);
                          
                          // 颜色逻辑 - 支持黄色悬浮覆盖蓝色高亮
                          let colorClass = '';
                          let borderClass = '';
                          let scaleClass = '';
                          
                          // 黄色悬浮效果 - 最高优先级，当有高亮构件存在时悬浮显示黄色
                          if (isHovered && finalHighlightSet.length > 0) {
                            colorClass = 'bg-yellow-400 text-white shadow-xl';
                            borderClass = 'border-yellow-500';
                            scaleClass = 'transform scale-115 z-10';
                          }
                          // 蓝色悬浮效果 - 无持续高亮时的悬浮
                          else if (isHovered && finalHighlightSet.length === 0) {
                            colorClass = 'bg-blue-400 text-white shadow-xl';
                            borderClass = 'border-blue-500';
                            scaleClass = 'transform scale-115 z-10';
                          }
                          // 蓝色持续高光 - 最终高亮集中的构件
                          else if (isInFinalSet) {
                            colorClass = 'bg-blue-500 text-white shadow-lg';
                            borderClass = 'border-blue-600';
                            scaleClass = 'transform scale-110';
                          }
                          // 默认状态
                          else {
                            colorClass = 'bg-white bg-opacity-90 text-gray-700';
                            borderClass = 'border-gray-300';
                            scaleClass = '';
                          }
                          
                          return (
                            <div 
                              key={component.id}
                              className={`p-3 rounded-lg cursor-pointer transition-all relative border-2 ${colorClass} ${borderClass} ${scaleClass}`}
                              onClick={() => handleComponentClick(component)}
                              onContextMenu={(e) => handleComponentClick(component, e)}
                              title={`${component.name} (${component.objectGroup})`}
                            >
                              <div className="text-xs font-medium truncate flex items-center justify-between mb-1">
                                <span className="truncate">{component.name}</span>
                                {component.version !== 'current' && !isInCart && (
                                  <History className="w-3 h-3 text-orange-600 flex-shrink-0 ml-1" />
                                )}
                              </div>
                              <div className="text-xs opacity-75 truncate">{component.objectGroup}</div>
                              <div className="text-xs opacity-60">v: {component.version}</div>
                              
                              {/* 状态指示器 */}
                              <div className="absolute top-1 right-1 flex space-x-1">
                                {/* 移除了"在模型树中查看"按钮 */}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      
                      <div className="text-xs text-gray-600">
                        显示 {getFilteredObjectGroups().length} 个构件
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
                          悬浮预览: {hoveredObjects.length} 个构件 {
                            getFinalHighlightSet().length === 0
                              ? '(蓝色)' 
                              : '(黄色覆盖)'
                          }
                        </div>
                      )}
                      
                      {/* 模型树切换按钮 */}
                      <div className="mt-4">
                        <button
                          onClick={toggleComponentTree}
                          className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
                        >
                          <Layers className="w-4 h-4 mr-2" />
                          {showComponentTree ? '隐藏模型零件树' : '显示模型零件树'}
                        </button>
                      </div>
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
              <div className="bg-blue-100 border border-blue-300 px-3 py-2 rounded-lg text-sm max-w-xs">
                <div className="font-medium text-blue-800 flex items-center">
                  <Target className="w-4 h-4 mr-2" />
                  绑定模式已激活
                </div>
                <div className="text-xs text-blue-600 mt-1">
                  • 选择文件进行绑定（1个文件 ↔ 多个构件）
                </div>
                <div className="text-xs text-blue-600">
                  • 通过筛选或手动选择构件进行高亮
                </div>
                <div className="text-xs text-blue-600">
                  • 点击"添加所有高亮构件"批量添加
                </div>
                {bindingCart.hasHistoricalObjects && (
                  <div className="mt-1 text-xs text-orange-600 flex items-center">
                    <History className="w-3 h-3 mr-1" />
                    包含历史版本构件
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
                      {(fileFilters.type || fileFilters.startDate || fileFilters.endDate || fileFilters.searchText || fileFilters.showMyFiles || fileFilters.showCurrentModelBinding || selectedFile) && (
                        <button
                          onClick={clearAllFileFiltersAndSelections}
                          className="text-xs text-red-600 hover:text-red-800"
                          title="清除所有文件筛选和选择"
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
                    
                    {/* 当前模型绑定筛选 */}
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="showCurrentModelBindingFile"
                        checked={fileFilters.showCurrentModelBinding}
                        onChange={(e) => handleFileFilterChange('showCurrentModelBinding', e.target.checked)}
                        className="mr-2 rounded"
                      />
                      <label htmlFor="showCurrentModelBindingFile" className="text-xs text-gray-700 cursor-pointer">
                        只显示当前模型绑定
                      </label>
                    </div>
              
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
                        选择文件进行绑定 | 在BIM视图中高亮构件，然后点击"添加所有高亮构件"按钮
                      </div>
                      {bindingCart.hasHistoricalObjects && (
                        <div className="mt-1 text-xs text-orange-600 flex items-center">
                          <History className="w-3 h-3 mr-1" />
                          包含历史版本构件
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
                              // 基础背景色：选中状态(蓝色) > 购物车状态(绿色) > 默认状态
                              selectedFile === file.id 
                                ? 'bg-blue-50 border-blue-200' 
                                : isInCart 
                                  ? 'bg-green-50 border-green-200'
                                  : 'bg-white border-gray-200'
                            } ${
                              // 悬浮效果：根据当前是否有持续高亮来决定颜色
                              hoveredItem?.id === file.id 
                                ? (getFinalHighlightSet().length > 0 && (selectedRISC !== null || selectedFile !== null))
                                  ? 'ring-2 ring-yellow-400 bg-yellow-50' // 情况二：有持续高亮时悬浮显示黄色
                                  : 'ring-2 ring-blue-400 bg-blue-50'     // 情况一：无持续高亮时悬浮显示蓝色
                                : ''
                            } ${
                              // 普通悬浮效果（当没有被特殊悬浮时）
                              hoveredItem?.id !== file.id ? 'hover:bg-gray-50' : ''
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
                                {/* 绑定模式下显示当前选中文件 */}
                                {isBindingMode && isInCart && (
                                  <div className="text-xs text-green-600 font-medium">
                                    当前选中
                                  </div>
                                )}
                                
                                {/* 非绑定模式下的操作按钮 */}
                                {!isBindingMode && hasBindingPermission() && canModify && (
                                  <>
                                    {/* 修改现有绑定 */}
                                    {file.objects.length > 0 && (file.bindingStatus === 'current' || file.bindingStatus === 'history') && (
                                      <button 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (viewMode === 'historical') {
                                            alert('历史视图下不允许进入绑定模式。请先切换到当前版本后再开始绑定。');
                                            return;
                                          }
                                          editExistingBinding(file);
                                        }}
                                        className={`p-1 ${viewMode === 'historical' ? 'text-gray-400 cursor-not-allowed' : 'text-green-600 hover:text-green-800'}`}
                                        title={viewMode === 'historical' ? '历史视图下不可用' : '修改绑定关系'}
                                        disabled={viewMode === 'historical'}
                                      >
                                        <Link className="w-4 h-4" />
                                      </button>
                                    )}
                                    
                                    {/* 开始新绑定 */}
                                    {file.objects.length === 0 && (
                                      <button 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          addToBindingCart(file, 'file');
                                        }}
                                        className={`p-1 ${viewMode === 'historical' ? 'text-gray-400 cursor-not-allowed' : 'text-orange-600 hover:text-orange-800'}`}
                                        title={viewMode === 'historical' ? '历史视图下不可用' : '开始绑定关系'}
                                        disabled={viewMode === 'historical'}
                                      >
                                        <Link className="w-4 h-4" />
                                      </button>
                                    )}
                                  </>
                                )}
                                
                                {/* 绑定状态图标 */}
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
                        No files matching criteria
                      </div>
                    )}
                  </div>
                </div>
                
                                    {/* Binding Management Panel - Below right file list */}
                {isBindingMode && (
                  <div className="border-t pt-4 mt-4 flex-shrink-0">
                    <h3 className="text-sm font-medium mb-3 flex items-center">
                      <Link className="w-4 h-4 mr-2" />
                      Binding Management Panel
                    </h3>
                    <div className="overflow-y-auto max-h-[50vh]">
                      <BindingCartContent />
                    </div>
                    
                    {/* 绑定操作按钮 - 确保始终显示 */}
                    <div className="flex space-x-2 mt-4">
                      <button 
                        onClick={submitBinding}
                        className="flex-1 bg-blue-600 text-white text-xs py-2 px-3 rounded hover:bg-blue-700 disabled:bg-gray-400"
                        disabled={bindingCart.files.length !== 1 || bindingCart.objects.length === 0}
                      >
                        Submit Binding
                      </button>
                      <button 
                        onClick={exitBindingMode}
                        className="flex-1 bg-gray-600 text-white text-xs py-2 px-3 rounded hover:bg-gray-700"
                      >
                        Cancel
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
      
      {/* Binding Management Panel - Floating Cart */}
      <BindingManagementPanel />
      
      {/* 组件树面板 */}
      <ComponentTreePanel />
      
      {/* 右键菜单 */}
      <ContextMenu />
      
      {/* 历史视图浮窗 - 优化UI尺寸和位置 */}
      {floatingPanel.visible && floatingPanel.componentInfo && (
        <div 
          className="fixed bg-white bg-opacity-95 rounded-lg shadow-2xl border border-gray-300 z-50 cursor-move"
          style={{
            left: `${panelPosition.x}px`,
            top: `${panelPosition.y}px`,
            width: '280px',
            height: 'auto',
            maxHeight: '220px',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            flexDirection: 'column',
          }}
          onMouseDown={handleMouseDown}
        >
          {/* 标题栏 - 更紧凑 */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 bg-opacity-95 text-white px-2 py-1 rounded-t-lg flex items-center justify-between cursor-grab active:cursor-grabbing flex-shrink-0">
            <div className="flex items-center space-x-1.5">
              <History className="w-3.5 h-3.5" />
              <span className="font-semibold text-xs">
                {floatingPanel.isHistoricalView ? 'Historical View' : 'Current View'}
              </span>
            </div>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                handleCloseFloatingPanel();
              }}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded p-0.5"
              title="Close Floating Panel"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
          
          {/* 内容区域 - 更紧凑的布局 */}
          <div className="p-2 space-y-1 text-xs overflow-y-auto flex-grow">
            {/* 构件信息 - 简化显示 */}
            <div className="border-b border-gray-200 pb-1">
              <div className="flex items-center justify-between mb-0.5">
                <h4 className="font-semibold text-gray-800 text-xs">Component Information</h4>
                <span className="text-xs text-gray-500 font-mono">{floatingPanel.componentInfo.componentId}</span>
              </div>
              <div className="text-gray-600 space-y-0.5 text-xs">
                <div className="flex justify-between">
                  <span>Current Version:</span>
                  <span className="font-mono text-xs">{floatingPanel.componentInfo.currentVersionId}</span>
                </div>
                <div className="flex justify-between">
                  <span>Historical Version:</span>
                  <span className="font-mono text-xs">{floatingPanel.componentInfo.historicalVersionId}</span>
                </div>
              </div>
            </div>
            
            {/* 文件信息 - 简化显示 */}
            <div className="border-b border-gray-200 pb-1">
              <h4 className="font-semibold text-gray-800 mb-0.5 text-xs">
                {floatingPanel.componentInfo.fileType === 'file' ? 'Associated File' : 'Associated RISC'}
              </h4>
              <div className="text-gray-600 text-xs">
                <div className="truncate">
                  <span className="font-medium">{floatingPanel.componentInfo.fileInfo.name || (floatingPanel.componentInfo.fileInfo as RiscForm).requestNo}</span>
                </div>
              </div>
            </div>
            
            {/* 变更说明 - 紧凑显示 */}
            <div className="pb-1">
              <h4 className="font-semibold text-gray-800 mb-0.5 text-xs">Change Description</h4>
              <div className="text-gray-600 space-y-0.5 max-h-12 overflow-y-auto">
                {floatingPanel.componentInfo.changes.length > 0 ? (
                  floatingPanel.componentInfo.changes.slice(0, 2).map((change, index) => (
                    <div key={index} className="flex items-start space-x-1.5">
                      <span className="w-1 h-1 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></span>
                      <span className="text-xs truncate">{change}</span>
                    </div>
                  ))
                ) : (
                                      <div className="text-xs text-gray-400">No change records</div>
                )}
                {floatingPanel.componentInfo.changes.length > 2 && (
                                      <div className="text-xs text-gray-400 pl-2.5">+{floatingPanel.componentInfo.changes.length - 2} more...</div>
                )}
              </div>
            </div>
          </div>
          
          {/* 操作按钮 - 更紧凑 */}
          <div className="flex justify-between items-center p-2 border-t border-gray-200 flex-shrink-0">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                handleToggleHistoricalView();
              }}
              className="flex items-center space-x-1 bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 transition-colors text-xs"
            >
              <RefreshCw className="w-3 h-3" />
              <span>
                {floatingPanel.isHistoricalView ? 'To Current' : 'To Historical'}
              </span>
            </button>
            
            <div className="text-xs text-gray-500">
              {floatingPanel.isHistoricalView ? 'Historical Model' : 'Current Model'}
            </div>
          </div>
        </div>
      )}
      
      {/* Place UserGuideModal at root */}
      {showUserGuide && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-5xl max-h-[90vh] flex flex-col">
            <div className="border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold flex items-center"><HelpCircle className="w-5 h-5 mr-2" />User Guide</h2>
              <button 
                onClick={() => setShowUserGuide(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-4 flex-1 overflow-auto">
              <pre className="whitespace-pre-wrap text-sm text-gray-800">{userGuideContent}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Export component with error boundary
const DWSSBIMDashboardWithErrorBoundary = () => (
  <ErrorBoundaryComponent>
    <DWSSBIMDashboard />
  </ErrorBoundaryComponent>
);

export default DWSSBIMDashboardWithErrorBoundary;
