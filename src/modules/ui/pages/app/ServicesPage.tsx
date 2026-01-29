import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Card, Button, Modal, HistorySection } from '../../components/common'
import { ServiceForm, ServiceDisplayCard, EditServiceModal } from '../../components/services'
import { useServices, useCreateService, useUpdateService, useDeleteService, useDeletedHistory, useAddToHistory } from '@/hooks'
import { cn } from '@/lib/utils'
import type { Service } from '@/types'
import { useTheme, useUndo } from '../../context'

export function ServicesPage() {
  const { colors } = useTheme()
  const { showUndo } = useUndo()
  const { data: services = [], isLoading } = useServices()
  const { data: deletedItems = [] } = useDeletedHistory('service')
  const createService = useCreateService()
  const updateService = useUpdateService()
  const deleteService = useDeleteService()
  const addToHistory = useAddToHistory()

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)

  const handleCreate = async (data: Partial<Service>) => {
    await createService.mutateAsync(data as Omit<Service, 'id' | 'createdAt' | 'updatedAt' | 'modifiers'>)
    setShowCreateModal(false)
  }

  const handleUpdate = async (data: Partial<Service>) => {
    if (editingService) {
      await updateService.mutateAsync({ id: editingService.id, data })
      setEditingService(null)
    }
  }

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation() // Prevent card click from triggering
    const serviceToDelete = services.find(s => s.id === id)
    if (!serviceToDelete) return

    await deleteService.mutateAsync(id)

    // Add to history for restore functionality
    await addToHistory.mutateAsync({
      entityType: 'service',
      entityId: serviceToDelete.id,
      entityName: serviceToDelete.name,
      data: serviceToDelete,
    })

    showUndo({
      type: 'service',
      label: serviceToDelete.name,
      data: serviceToDelete,
      onUndo: async () => {
        const { id: _id, createdAt, updatedAt, ...serviceData } = serviceToDelete
        await createService.mutateAsync(serviceData as Omit<Service, 'id' | 'createdAt' | 'updatedAt' | 'modifiers'>)
      }
    })
  }

  const handleDeleteFromModal = async () => {
    if (!editingService) return

    const serviceToDelete = editingService
    await deleteService.mutateAsync(serviceToDelete.id)
    setEditingService(null)

    // Add to history for restore functionality
    await addToHistory.mutateAsync({
      entityType: 'service',
      entityId: serviceToDelete.id,
      entityName: serviceToDelete.name,
      data: serviceToDelete,
    })

    showUndo({
      type: 'service',
      label: serviceToDelete.name,
      data: serviceToDelete,
      onUndo: async () => {
        const { id: _id, createdAt, updatedAt, ...serviceData } = serviceToDelete
        await createService.mutateAsync(serviceData as Omit<Service, 'id' | 'createdAt' | 'updatedAt' | 'modifiers'>)
      }
    })
  }

  return (
    <div className={cn('min-h-screen p-4 lg:p-6', colors.pageGradientLight)}>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Services</h1>
        <Button
          onClick={() => setShowCreateModal(true)}
          style={{ backgroundColor: colors.accentColorDark, color: colors.textOnAccent }}
          className="hover:opacity-90"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Service
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center text-gray-600">Loading services...</div>
      ) : services.length === 0 ? (
        <Card>
          <div className="py-8 text-center">
            <p className="text-gray-600">No services yet. Create your first service to get started.</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {services.map((service) => (
            <ServiceDisplayCard
              key={service.id}
              service={service}
              onEdit={() => setEditingService(service)}
              onDelete={(e) => handleDelete(e, service.id)}
            />
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Service"
        size="md"
      >
        <ServiceForm
          onSubmit={handleCreate}
          onCancel={() => setShowCreateModal(false)}
          isLoading={createService.isPending}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={!!editingService}
        onClose={() => setEditingService(null)}
        title="Edit Service"
        size="md"
      >
        {editingService && (
          <EditServiceModal
            service={editingService}
            onSubmit={handleUpdate}
            onCancel={() => setEditingService(null)}
            onDelete={handleDeleteFromModal}
            isLoading={updateService.isPending}
          />
        )}
      </Modal>

      <HistorySection
        items={deletedItems}
        entityType="service"
        title="Recently Deleted Services"
      />
      </div>
    </div>
  )
}
