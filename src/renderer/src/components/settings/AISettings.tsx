import React, { useState } from 'react'
import { Plus, Edit2, Trash2, Settings } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAIStore } from '../../stores/aiStore'
import { AIModel } from '../../../../shared/types/ai'

const AISettings: React.FC = () => {
  const { config, addModel, updateModel, deleteModel, setDefaultModel, updateModelOptions } = useAIStore()
  const currentModelId = config.currentModelId
  const models = config.models as AIModel[]
  const options = config.options

  const [showAddForm, setShowAddForm] = useState(false)
  const [editingModel, setEditingModel] = useState<AIModel | null>(null)
  const [formData, setFormData] = useState<{
    name: string
    provider: 'azure' | 'openai'
    model: string
    apiKey: string
    baseURL: string
  }>({
    name: '',
    provider: 'openai',
    model: '',
    apiKey: '',
    baseURL: ''
  })

  const resetForm = () => {
    setFormData({
      name: '',
      provider: 'openai',
      model: '',
      apiKey: '',
      baseURL: ''
    })
  }

  const handleAddModel = () => {
    resetForm()
    setEditingModel(null)
    setShowAddForm(true)
  }

  const handleEditModel = (model: AIModel) => {
    setFormData({
      name: model.name,
      provider: model.provider,
      model: model.model,
      apiKey: model.apiKey || '',
      baseURL: model.baseURL || ''
    })
    setEditingModel(model)
    setShowAddForm(true)
  }

  const handleDeleteModel = (modelId: string) => {
    if (window.confirm('Are you sure you want to delete this model?')) {
      deleteModel(modelId)
    }
  }

  const handleSetDefault = (modelId: string) => {
    setDefaultModel(modelId)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast.error('Model name is required')
      return
    }
    if (!formData.model.trim()) {
      toast.error('Model identifier is required')
      return
    }
    if (!formData.apiKey.trim()) {
      toast.error('API key is required for this provider')
      return
    }
    if (formData.provider === 'azure' && !formData.baseURL.trim()) {
      toast.error('Base URL is required for Azure OpenAI')
      return
    }

    const modelData = {
      name: formData.name.trim(),
      provider: formData.provider,
      model: formData.model.trim(),
      apiKey: formData.apiKey.trim(),
      baseURL: formData.baseURL.trim() || undefined
    }

    if (editingModel) {
      updateModel(editingModel.id, modelData)
    } else {
      addModel(modelData)
    }

    setShowAddForm(false)
    resetForm()
    setEditingModel(null)
  }

  const handleCancel = () => {
    setShowAddForm(false)
    resetForm()
    setEditingModel(null)
  }

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Models</h3>
        <p className="text-sm text-gray-600">
          Configure AI models for the assistant.
        </p>
      </div>

      {/* Models List */}
      <div className="space-y-2 mb-6">
        {models.map((model) => (
          <div
            key={model.id}
            className={`border rounded-lg p-3 ${model.id === currentModelId ? 'border-blue-200 bg-blue-50' : 'border-gray-200'
              }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <h4 className="font-medium text-gray-900 truncate pl-2">{model.name}</h4>
                <div className="text-sm flex items-center gap-2">
                  <span className="px-2 py-1 text-xs bg-blue-100 text-gray-700 rounded-md font-mono">
                    {model.provider}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {model.id === currentModelId ? (
                  <span className="px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded-md whitespace-nowrap">
                    Default
                  </span>
                ) : (
                  <button
                    onClick={() => handleSetDefault(model.id)}
                    className="px-3 py-1 text-xs text-blue-600 hover:bg-blue-100 rounded-md transition-colors"
                  >
                    Set Default
                  </button>
                )}
                <button
                  onClick={() => handleEditModel(model)}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                  title="Edit Model"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteModel(model.id)}
                  className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Delete Model"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Model Button */}
      {!showAddForm && (
        <button
          onClick={handleAddModel}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mb-6"
        >
          <Plus className="w-4 h-4" />
          Add Model
        </button>
      )}

      {/* Add/Edit Model Form */}
      {showAddForm && (
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="w-5 h-5 text-gray-600" />
            <h4 className="font-medium text-gray-900">
              {editingModel ? 'Edit Model' : 'Add New Model'}
            </h4>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Model Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., GPT-4o, Claude-3"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Provider <span className="text-red-500">*</span>
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.provider}
                onChange={(e) => handleInputChange('provider', e.target.value)}
              >
                <option value="openai">OpenAI</option>
                <option value="azure">Azure OpenAI</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Model <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., gpt-4o, gpt-3.5-turbo"
                value={formData.model}
                onChange={(e) => handleInputChange('model', e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                API Key <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={'Your API key'}
                value={formData.apiKey}
                onChange={(e) => handleInputChange('apiKey', e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Base URL {formData.provider === 'azure' && <span className="text-red-500">*</span>}
              </label>
              <input
                type="url"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., https://your-resource.openai.azure.com"
                value={formData.baseURL}
                onChange={(e) => handleInputChange('baseURL', e.target.value)}
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
              >
                {editingModel ? 'Update Model' : 'Add Model'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* AI Options */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Options</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Temperature
            </label>
            <input
              type="number"
              min="0"
              max="2"
              step="0.1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={options.temperature}
              onChange={(e) => updateModelOptions({ temperature: parseFloat(e.target.value) })}
            />
            <p className="text-xs text-gray-500 mt-1">Controls randomness (0.0 - 2.0)</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max Tokens
            </label>
            <input
              type="number"
              min="1"
              max="500000"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={options.maxTokens}
              onChange={(e) => updateModelOptions({ maxTokens: parseInt(e.target.value) })}
            />
            <p className="text-xs text-gray-500 mt-1">Maximum response length</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AISettings