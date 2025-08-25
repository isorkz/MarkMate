import React, { useState } from 'react'
import { Plus, Edit2, Trash2, Settings } from 'lucide-react'

interface AIModel {
  id: string
  name: string
  provider: 'azure' | 'openai' | 'ollama'
  model: string
  apiKey?: string
  baseURL?: string
  isDefault: boolean
}

const AISettings: React.FC = () => {
  // Mock data - will be replaced with actual store
  const [models, setModels] = useState<AIModel[]>([
    {
      id: '1',
      name: 'GPT-4o',
      provider: 'azure',
      model: 'gpt-4o',
      apiKey: '***hidden***',
      baseURL: 'https://your-resource.openai.azure.com',
      isDefault: true
    }
  ])

  const [showAddForm, setShowAddForm] = useState(false)
  const [editingModel, setEditingModel] = useState<AIModel | null>(null)

  const handleAddModel = () => {
    setShowAddForm(true)
    setEditingModel(null)
  }

  const handleEditModel = (model: AIModel) => {
    setEditingModel(model)
    setShowAddForm(true)
  }

  const handleDeleteModel = (modelId: string) => {
    if (window.confirm('Are you sure you want to delete this model?')) {
      setModels(models.filter(m => m.id !== modelId))
    }
  }

  const handleSetDefault = (modelId: string) => {
    setModels(models.map(m => ({ ...m, isDefault: m.id === modelId })))
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Models</h3>
        <p className="text-sm text-gray-600">
          Configure AI models for the assistant. You can add multiple providers and switch between them.
        </p>
      </div>

      {/* Models List */}
      <div className="space-y-4 mb-6">
        {models.map((model) => (
          <div
            key={model.id}
            className={`border rounded-lg p-4 ${model.isDefault ? 'border-blue-200 bg-blue-50' : 'border-gray-200'
              }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-gray-900">{model.name}</h4>
                  {model.isDefault && (
                    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                      Default
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-600">
                  <div>Provider: <span className="font-mono">{model.provider}</span></div>
                  <div>Model: <span className="font-mono">{model.model}</span></div>
                  {model.baseURL && (
                    <div>Base URL: <span className="font-mono text-xs">{model.baseURL}</span></div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {!model.isDefault && (
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
                  className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  title="Delete Model"
                  disabled={model.isDefault}
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
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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

          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Model Name
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., GPT-4o, Claude-3"
                defaultValue={editingModel?.name || ''}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Provider
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                defaultValue={editingModel?.provider || 'openai'}
              >
                <option value="openai">OpenAI</option>
                <option value="azure">Azure OpenAI</option>
                <option value="ollama">Ollama (Local)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Model
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., gpt-4o, gpt-3.5-turbo"
                defaultValue={editingModel?.model || ''}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                API Key
              </label>
              <input
                type="password"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Your API key (stored locally)"
                defaultValue={editingModel?.apiKey || ''}
              />
              <p className="text-xs text-gray-500 mt-1">
                Or set via environment variable: MARKMATE_API_KEY
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Base URL
              </label>
              <input
                type="url"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., https://your-resource.openai.azure.com"
                defaultValue={editingModel?.baseURL || ''}
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
              >
                {editingModel ? 'Update Model' : 'Add Model'}
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

export default AISettings