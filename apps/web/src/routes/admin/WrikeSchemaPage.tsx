import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Save, RefreshCw, AlertCircle, CheckCircle, Settings } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { callables } from '@/lib/api';
import { trackUserAction, trackFeatureUsage } from '@/lib/telemetry';

interface WrikeSchema {
  id: string;
  name: string;
  description: string;
  fields: WrikeField[];
  mappings: Record<string, string>;
  isActive: boolean;
  lastUpdated: Date;
  version: string;
}

interface WrikeField {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'select' | 'multiselect';
  required: boolean;
  options?: string[];
  description?: string;
}

export default function WrikeSchemaPage(): JSX.Element {
  const [selectedSchema, setSelectedSchema] = useState<WrikeSchema | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [schemaForm, setSchemaForm] = useState<Partial<WrikeSchema>>({});
  const queryClient = useQueryClient();

  // Mock schema data
  const schemas: WrikeSchema[] = [
    {
      id: '1',
      name: 'Campaign Schema v1',
      description: 'Standard campaign fields for Wrike integration',
      isActive: true,
      lastUpdated: new Date(2024, 0, 10),
      version: '1.0.0',
      fields: [
        {
          id: 'title',
          name: 'Campaign Title',
          type: 'text',
          required: true,
          description: 'The name of the campaign',
        },
        {
          id: 'status',
          name: 'Status',
          type: 'select',
          required: true,
          options: ['Draft', 'In Review', 'Approved', 'Active', 'Completed'],
          description: 'Current status of the campaign',
        },
        {
          id: 'dueDate',
          name: 'Due Date',
          type: 'date',
          required: true,
          description: 'When the campaign should be completed',
        },
        {
          id: 'assignedTo',
          name: 'Assigned To',
          type: 'text',
          required: true,
          description: 'Person responsible for the campaign',
        },
        {
          id: 'budget',
          name: 'Budget',
          type: 'number',
          required: false,
          description: 'Campaign budget in USD',
        },
        {
          id: 'tags',
          name: 'Tags',
          type: 'multiselect',
          required: false,
          options: ['Social Media', 'Email', 'Paid Search', 'Content Marketing'],
          description: 'Campaign categories and tags',
        },
      ],
      mappings: {
        'title': 'wrike_title',
        'status': 'wrike_status',
        'dueDate': 'wrike_due_date',
        'assignedTo': 'wrike_assignee',
        'budget': 'wrike_budget',
        'tags': 'wrike_tags',
      },
    },
    {
      id: '2',
      name: 'Content Schema v1',
      description: 'Content creation and review workflow',
      isActive: false,
      lastUpdated: new Date(2024, 0, 5),
      version: '1.0.0',
      fields: [
        {
          id: 'contentType',
          name: 'Content Type',
          type: 'select',
          required: true,
          options: ['Blog Post', 'Social Media', 'Email', 'Video', 'Infographic'],
          description: 'Type of content being created',
        },
        {
          id: 'priority',
          name: 'Priority',
          type: 'select',
          required: true,
          options: ['Low', 'Medium', 'High', 'Urgent'],
          description: 'Content creation priority',
        },
      ],
      mappings: {
        'contentType': 'wrike_content_type',
        'priority': 'wrike_priority',
      },
    },
  ];

  // Test connection mutation
  const testConnectionMutation = useMutation({
    mutationFn: async () => {
      // TODO: Implement actual Wrike connection test
      return new Promise((resolve) => {
        setTimeout(() => resolve({ success: true }), 2000);
      });
    },
    onSuccess: () => {
      trackUserAction('wrike_connection_tested');
    },
  });

  // Save schema mutation
  const saveSchemaMutation = useMutation({
    mutationFn: async (schema: WrikeSchema) => {
      // TODO: Implement actual schema save
      console.log('Saving schema:', schema);
      return schema;
    },
    onSuccess: () => {
      setIsEditing(false);
      trackUserAction('wrike_schema_saved');
    },
  });

  const handleEditSchema = (schema: WrikeSchema): void => {
    setSelectedSchema(schema);
    setSchemaForm(schema);
    setIsEditing(true);
    trackFeatureUsage('wrike_schema', 'edit');
  };

  const handleSaveSchema = (): void => {
    if (selectedSchema && schemaForm) {
      saveSchemaMutation.mutate({
        ...selectedSchema,
        ...schemaForm,
      } as WrikeSchema);
    }
  };

  const handleTestConnection = (): void => {
    testConnectionMutation.mutate();
  };

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Wrike Schema Configuration</h1>
          <p className="text-secondary-600 mt-1">
            Manage field mappings and integration settings
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleTestConnection}
            disabled={testConnectionMutation.isPending}
            className="btn-secondary flex items-center space-x-2"
          >
            <RefreshCw className={`h-4 w-4 ${testConnectionMutation.isPending ? 'animate-spin' : ''}`} />
            <span>Test Connection</span>
          </button>
          <button className="btn-primary flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </button>
        </div>
      </div>

      {/* Connection Status */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`h-3 w-3 rounded-full ${testConnectionMutation.isSuccess ? 'bg-success-500' : 'bg-danger-500'}`} />
            <span className="text-sm font-medium text-secondary-900">
              Wrike Connection: {testConnectionMutation.isSuccess ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          <div className="text-sm text-secondary-500">
            Last tested: {testConnectionMutation.isSuccess ? 'Just now' : 'Never'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Schema List */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-secondary-900">Available Schemas</h2>
          
          <div className="space-y-3">
            {schemas.map((schema, index) => (
              <motion.div
                key={schema.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`card cursor-pointer transition-all ${
                  selectedSchema?.id === schema.id ? 'ring-2 ring-primary-500' : 'hover:shadow-md'
                }`}
                onClick={() => setSelectedSchema(schema)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-lg font-semibold text-secondary-900">
                        {schema.name}
                      </h3>
                      {schema.isActive && (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-success-100 text-success-800">
                          Active
                        </span>
                      )}
                    </div>
                    
                    <p className="text-secondary-600 text-sm mb-3">
                      {schema.description}
                    </p>
                    
                    <div className="flex items-center space-x-4 text-xs text-secondary-500">
                      <span>Version {schema.version}</span>
                      <span>{schema.fields.length} fields</span>
                      <span>Updated {formatDate(schema.lastUpdated)}</span>
                    </div>
                  </div>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditSchema(schema);
                    }}
                    className="btn-ghost text-sm"
                  >
                    Edit
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Schema Details */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-secondary-900">Schema Details</h2>
            {selectedSchema && (
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="btn-ghost text-sm"
              >
                {isEditing ? 'Cancel' : 'Edit'}
              </button>
            )}
          </div>

          {!selectedSchema ? (
            <div className="card text-center py-12">
              <FileText className="h-12 w-12 text-secondary-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-secondary-900 mb-2">No Schema Selected</h3>
              <p className="text-secondary-600">
                Select a schema from the list to view its details
              </p>
            </div>
          ) : (
            <div className="card">
              <div className="space-y-4">
                {/* Schema Info */}
                <div>
                  <label className="label">Schema Name</label>
                  <input
                    type="text"
                    value={isEditing ? schemaForm.name || '' : selectedSchema.name}
                    onChange={(e) => setSchemaForm({ ...schemaForm, name: e.target.value })}
                    disabled={!isEditing}
                    className="input"
                  />
                </div>

                <div>
                  <label className="label">Description</label>
                  <textarea
                    value={isEditing ? schemaForm.description || '' : selectedSchema.description}
                    onChange={(e) => setSchemaForm({ ...schemaForm, description: e.target.value })}
                    disabled={!isEditing}
                    className="input h-20 resize-none"
                  />
                </div>

                {/* Fields */}
                <div>
                  <label className="label">Fields ({selectedSchema.fields.length})</label>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {selectedSchema.fields.map((field) => (
                      <div key={field.id} className="p-3 bg-secondary-50 rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-secondary-900">
                            {field.name}
                          </span>
                          <span className="text-xs text-secondary-500">
                            {field.type}
                          </span>
                        </div>
                        {field.description && (
                          <p className="text-xs text-secondary-600">
                            {field.description}
                          </p>
                        )}
                        {field.required && (
                          <span className="inline-block mt-1 px-2 py-1 text-xs bg-danger-100 text-danger-800 rounded">
                            Required
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Mappings */}
                <div>
                  <label className="label">Field Mappings</label>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {Object.entries(selectedSchema.mappings).map(([local, wrike]) => (
                      <div key={local} className="flex items-center justify-between p-2 bg-secondary-50 rounded text-sm">
                        <span className="text-secondary-900">{local}</span>
                        <span className="text-secondary-500">→</span>
                        <span className="text-secondary-600">{wrike}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {isEditing && (
                  <div className="flex items-center justify-end space-x-3 pt-4 border-t border-secondary-200">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveSchema}
                      disabled={saveSchemaMutation.isPending}
                      className="btn-primary flex items-center space-x-2"
                    >
                      <Save className="h-4 w-4" />
                      <span>Save Schema</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Integration Status */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-secondary-900">Integration Status</h3>
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-success-600" />
            <span className="text-sm text-success-600">Synchronized</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-600">24</div>
            <div className="text-sm text-secondary-600">Campaigns Synced</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-success-600">98%</div>
            <div className="text-sm text-secondary-600">Success Rate</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-warning-600">2</div>
            <div className="text-sm text-secondary-600">Pending Updates</div>
          </div>
        </div>
      </div>
    </div>
  );
}
