import {
  X,
  Plus,
  Edit2,
  Trash2,
  Save,
  Search,
  Folder,
  Palette,
  FileText,
  Loader2,
  AlertCircle,
  CheckCircle,
} from 'lucide-react'
import React, { useState, useEffect } from 'react'

import type { MaterialPreset } from '@/services/api/MaterialPresetsAPIClient'
import { materialPresetsClient } from '@/services/api/MaterialPresetsAPIClient'
import { Modal, ModalHeader, ModalBody, ModalFooter, Button, Badge, LoadingSpinner} from '@/components/common'
import { cn } from '@/styles'

interface MaterialPresetEditorProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

interface PresetFormData {
  id: string
  displayName: string
  stylePrompt: string
  description: string
  category: string
  tier: string
  color: string
}

export const MaterialPresetEditor: React.FC<MaterialPresetEditorProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  // Data state
  const [presets, setPresets] = useState<MaterialPreset[]>([])
  const [categories, setCategories] = useState<string[]>([])

  // UI state
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  // Form state
  const [editingPreset, setEditingPreset] = useState<MaterialPreset | null>(null)
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [formData, setFormData] = useState<PresetFormData>({
    id: '',
    displayName: '',
    stylePrompt: '',
    description: '',
    category: '',
    tier: '',
    color: '',
  })

  // Load presets
  const loadPresets = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const [presetsData, categoriesData] = await Promise.all([
        materialPresetsClient.getMaterialPresets(),
        materialPresetsClient.getCategories(),
      ])
      setPresets(presetsData)
      setCategories(categoriesData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load material presets')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      loadPresets()
    }
  }, [open])

  // Filter presets
  const filteredPresets = presets.filter((preset) => {
    const matchesSearch =
      preset.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      preset.stylePrompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      preset.description?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesCategory = !selectedCategory || preset.category === selectedCategory

    return matchesSearch && matchesCategory
  })

  // Handle add new preset
  const handleAddNew = () => {
    const newId = materialPresetsClient.generatePresetId('new-preset')
    setFormData({
      id: newId,
      displayName: '',
      stylePrompt: '',
      description: '',
      category: '',
      tier: '',
      color: '#3B82F6',
    })
    setIsAddingNew(true)
    setEditingPreset(null)
  }

  // Handle edit preset
  const handleEdit = (preset: MaterialPreset) => {
    setFormData({
      id: preset.id,
      displayName: preset.displayName,
      stylePrompt: preset.stylePrompt,
      description: preset.description || '',
      category: preset.category || '',
      tier: preset.tier?.toString() || '',
      color: preset.color || '#3B82F6',
    })
    setEditingPreset(preset)
    setIsAddingNew(false)
  }

  // Handle save (add or update)
  const handleSave = async () => {
    try {
      setIsSaving(true)
      setError(null)

      const presetData: MaterialPreset = {
        id: formData.id,
        displayName: formData.displayName.trim(),
        stylePrompt: formData.stylePrompt.trim(),
        description: formData.description.trim() || undefined,
        category: formData.category.trim() || undefined,
        tier: formData.tier.trim() || undefined,
        color: formData.color.trim() || undefined,
      }

      // Validate
      const validation = materialPresetsClient.validatePreset(presetData)
      if (!validation.valid) {
        setError(validation.errors.join(', '))
        return
      }

      if (isAddingNew) {
        await materialPresetsClient.addMaterialPreset(presetData)
        setSuccessMessage('Material preset added successfully')
      } else if (editingPreset) {
        await materialPresetsClient.updateMaterialPreset(editingPreset.id, presetData)
        setSuccessMessage('Material preset updated successfully')
      }

      await loadPresets()
      setIsAddingNew(false)
      setEditingPreset(null)
      setFormData({
        id: '',
        displayName: '',
        stylePrompt: '',
        description: '',
        category: '',
        tier: '',
        color: '',
      })

      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save material preset')
    } finally {
      setIsSaving(false)
    }
  }

  // Handle delete
  const handleDelete = async (presetId: string) => {
    if (!confirm('Are you sure you want to delete this material preset?')) {
      return
    }

    try {
      setIsSaving(true)
      setError(null)
      await materialPresetsClient.deleteMaterialPreset(presetId)
      setSuccessMessage('Material preset deleted successfully')
      await loadPresets()
      if (editingPreset?.id === presetId) {
        setEditingPreset(null)
        setIsAddingNew(false)
      }
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete material preset')
    } finally {
      setIsSaving(false)
    }
  }

  // Handle cancel
  const handleCancel = () => {
    setIsAddingNew(false)
    setEditingPreset(null)
    setFormData({
      id: '',
      displayName: '',
      stylePrompt: '',
      description: '',
      category: '',
      tier: '',
      color: '',
    })
  }

  const isEditing = isAddingNew || editingPreset !== null

  return (
    <Modal open={open} onClose={onClose} size="xl">
      <ModalHeader onClose={onClose}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center">
            <Palette className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-text-primary">Material Preset Editor</h2>
            <p className="text-sm text-text-secondary">Manage material presets for 3D assets</p>
          </div>
        </div>
      </ModalHeader>

      <ModalBody>
        {/* Success/Error Messages */}
        {successMessage && (
          <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-md flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-400">{successMessage}</p>
            <button
              onClick={() => setSuccessMessage(null)}
              className="ml-auto text-green-400 hover:text-green-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-md flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-400">{error}</p>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-400 hover:text-red-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="md" className="text-primary" />
            <span className="ml-3 text-text-secondary">Loading presets...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Preset List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-text-primary">
                  Presets ({filteredPresets.length})
                </h3>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleAddNew}
                  disabled={isEditing}
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add New
                </Button>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                <input
                  type="text"
                  placeholder="Search presets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 bg-bg-tertiary border border-border-primary rounded-md text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              {/* Category Filter */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={cn(
                    'px-3 py-1 rounded-full text-xs font-medium transition-colors',
                    !selectedCategory
                      ? 'bg-primary/20 text-primary border border-primary/30'
                      : 'bg-bg-tertiary text-text-secondary border border-border-primary hover:bg-bg-secondary',
                  )}
                >
                  All
                </button>
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={cn(
                      'px-3 py-1 rounded-full text-xs font-medium transition-colors',
                      selectedCategory === category
                        ? 'bg-primary/20 text-primary border border-primary/30'
                        : 'bg-bg-tertiary text-text-secondary border border-border-primary hover:bg-bg-secondary',
                    )}
                  >
                    {category}
                  </button>
                ))}
              </div>

              {/* Preset List */}
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                {filteredPresets.length === 0 ? (
                  <div className="text-center py-8 text-text-tertiary">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No presets found</p>
                  </div>
                ) : (
                  filteredPresets.map((preset) => (
                    <div
                      key={preset.id}
                      className={cn(
                        'p-3 bg-bg-tertiary border rounded-lg transition-all cursor-pointer',
                        editingPreset?.id === preset.id
                          ? 'border-primary ring-2 ring-primary/50'
                          : 'border-border-primary hover:border-border-secondary',
                      )}
                      onClick={() => handleEdit(preset)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {preset.color && (
                              <div
                                className="w-3 h-3 rounded-full flex-shrink-0"
                                style={{ backgroundColor: preset.color }}
                              />
                            )}
                            <h4 className="text-sm font-semibold text-text-primary truncate">
                              {preset.displayName}
                            </h4>
                          </div>
                          <p className="text-xs text-text-tertiary line-clamp-2">
                            {preset.stylePrompt}
                          </p>
                          {preset.category && (
                            <Badge variant="secondary" className="mt-2 text-xs">
                              <Folder className="w-3 h-3 mr-1" />
                              {preset.category}
                            </Badge>
                          )}
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEdit(preset)
                            }}
                            className="p-1 text-text-tertiary hover:text-primary transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDelete(preset.id)
                            }}
                            className="p-1 text-text-tertiary hover:text-red-400 transition-colors"
                            title="Delete"
                            disabled={isSaving}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Preset Form */}
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-text-primary">
                {isAddingNew ? 'Add New Preset' : editingPreset ? 'Edit Preset' : 'Select a Preset'}
              </h3>

              {isEditing ? (
                <div className="space-y-4">
                  {/* Display Name */}
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">
                      Display Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.displayName}
                      onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                      className="w-full px-3 py-2 bg-bg-tertiary border border-border-primary rounded-md text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/50"
                      placeholder="e.g., Metallic Gold"
                    />
                  </div>

                  {/* Style Prompt */}
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">
                      Style Prompt <span className="text-red-400">*</span>
                    </label>
                    <textarea
                      value={formData.stylePrompt}
                      onChange={(e) => setFormData({ ...formData, stylePrompt: e.target.value })}
                      className="w-full px-3 py-2 bg-bg-tertiary border border-border-primary rounded-md text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[80px]"
                      placeholder="e.g., shiny gold metal texture with reflective properties"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">
                      Description
                    </label>
                    <input
                      type="text"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 bg-bg-tertiary border border-border-primary rounded-md text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/50"
                      placeholder="Optional description"
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">
                      Category
                    </label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 bg-bg-tertiary border border-border-primary rounded-md text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/50"
                      placeholder="e.g., Metals, Fabrics, etc."
                      list="categories-list"
                    />
                    <datalist id="categories-list">
                      {categories.map((cat) => (
                        <option key={cat} value={cat} />
                      ))}
                    </datalist>
                  </div>

                  {/* Color */}
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">
                      Color Tag
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={formData.color}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        className="w-12 h-10 bg-bg-tertiary border border-border-primary rounded-md cursor-pointer"
                      />
                      <input
                        type="text"
                        value={formData.color}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        className="flex-1 px-3 py-2 bg-bg-tertiary border border-border-primary rounded-md text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/50"
                        placeholder="#3B82F6"
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <Button
                      variant="ghost"
                      onClick={handleCancel}
                      disabled={isSaving}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      onClick={handleSave}
                      disabled={isSaving || !formData.displayName || !formData.stylePrompt}
                      className="flex-1 flex items-center justify-center gap-2"
                    >
                      {isSaving ? (
                        <>
                          <LoadingSpinner size="sm" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          {isAddingNew ? 'Add Preset' : 'Update Preset'}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-text-tertiary">
                  <Palette className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Select a preset to edit or add a new one</p>
                </div>
              )}
            </div>
          </div>
        )}
      </ModalBody>

      <ModalFooter>
        <Button variant="ghost" onClick={onClose}>
          Close
        </Button>
      </ModalFooter>
    </Modal>
  )
}
