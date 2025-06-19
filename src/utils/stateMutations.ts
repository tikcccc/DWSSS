// 状态变更工具函数
import { HydCode, RiscFilters, FileFilters } from '../types';

export class StateMutations {
  // 清除所有RISC筛选
  static clearAllRiscFilters(setRiscFilters: (filters: RiscFilters) => void): void {
    setRiscFilters({
      status: '',
      startDate: '',
      endDate: '',
      searchText: ''
    });
  }

  // 清除所有文件筛选
  static clearAllFileFilters(setFileFilters: (filters: any) => void): void {
    setFileFilters({
      type: '',
      startDate: '',
      endDate: '',
      searchText: '',
      showMyFiles: false
    });
  }

  // 清除所有HyD Code筛选
  static clearAllHydCodeFilters(
    setHydCodeFilter: (filter: HydCode) => void,
    setFilterHighlightSet: (set: string[]) => void
  ): void {
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
  }

  // 清除所有用户选择 - 新功能
  static clearAllUserSelections(
    setHydCodeFilter: (filter: HydCode) => void,
    setRiscFilters: (filters: RiscFilters) => void,
    setFileFilters: (filters: any) => void,
    setFilterHighlightSet: (set: string[]) => void,
    setManualHighlightSet: (set: string[]) => void,
    setSelectedRISC: (id: string | null) => void,
    setSelectedFile: (id: number | null) => void,
    setHoveredObjects: (objects: string[]) => void,
    setHoveredItem: (item: any) => void,
    setHoveredItemType: (type: string | null) => void
  ): void {
    // 清除所有筛选条件
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
      searchText: ''
    });
    setFileFilters({
      type: '',
      startDate: '',
      endDate: '',
      searchText: '',
      showMyFiles: false
    });
    
    // 清除所有高光和选择状态
    setFilterHighlightSet([]);
    setManualHighlightSet([]);
    setSelectedRISC(null);
    setSelectedFile(null);
    setHoveredObjects([]);
    setHoveredItem(null);
    setHoveredItemType(null);
  }

  // 清除所有RISC筛选和相关选择 - 增强版
  static clearAllRiscFiltersAndSelections(
    setRiscFilters: (filters: RiscFilters) => void,
    selectedRISC: string | null,
    setSelectedRISC: (id: string | null) => void,
    setManualHighlightSet: (set: string[] | ((prev: string[]) => string[])) => void,
    riscForms: any[]
  ): void {
    setRiscFilters({
      status: '',
      startDate: '',
      endDate: '',
      searchText: ''
    });
    
    // 如果当前有RISC选中，也清除相关高光
    if (selectedRISC) {
      setSelectedRISC(null);
      // 只清除与该RISC相关的手动高光，保留其他筛选产生的高光
      const currentRisc = riscForms.find(r => r.id === selectedRISC);
      if (currentRisc) {
        setManualHighlightSet(prev => 
          prev.filter(id => !currentRisc.objects.includes(id))
        );
      }
    }
  }

  // 清除所有文件筛选和相关选择 - 增强版
  static clearAllFileFiltersAndSelections(
    setFileFilters: (filters: any) => void,
    selectedFile: number | null,
    setSelectedFile: (id: number | null) => void,
    setManualHighlightSet: (set: string[] | ((prev: string[]) => string[])) => void,
    files: any[]
  ): void {
    setFileFilters({
      type: '',
      startDate: '',
      endDate: '',
      searchText: '',
      showMyFiles: false
    });
    
    // 如果当前有文件选中，也清除相关高光
    if (selectedFile) {
      setSelectedFile(null);
      // 只清除与该文件相关的手动高光，保留其他筛选产生的高光
      const currentFile = files.find(f => f.id === selectedFile);
      if (currentFile) {
        setManualHighlightSet(prev => 
          prev.filter(id => !currentFile.objects.includes(id))
        );
      }
    }
  }

  // 清除所有高亮状态的辅助函数
  static clearAllHighlightsAfterAdd(
    setManualHighlightSet: (set: string[]) => void,
    setFilterHighlightSet: (set: string[]) => void,
    setHydCodeFilter: (filter: HydCode) => void,
    setSelectedRISC: (id: string | null) => void,
    setSelectedFile: (id: number | null) => void,
    setHoveredObjects: (objects: string[]) => void,
    setHoveredItem: (item: any) => void,
    setHoveredItemType: (type: string | null) => void
  ): void {
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
  }
} 