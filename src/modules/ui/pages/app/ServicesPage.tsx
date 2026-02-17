import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Card, Button, Modal, HistorySection, ConfirmDialog } from '../../components/common'
import { ServiceForm, ServiceDisplayCard, EditServiceModal } from '../../components/services'
import { useServices, useCreateService, useUpdateService, useDeleteService, useDeletedHistory, useAddToHistory } from '@/hooks'
import { cn } from '@/lib/utils'
import type { Service } from '@/types'
import { useTheme, useUndo } from '../../context'

export function ServicesPage() {
  const { colors } = useTheme()
  const { showUndo } = useUndo()
  const { data: services = [], isLoading, isError, refetch } = useServices()
  const { data: deletedItems = [] } = useDeletedHistory('service')
  const createService = useCreateService()
  const updateService = useUpdateService()
  const deleteService = useDeleteService()
  const addToHistory = useAddToHistory()

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [serviceToDeleteId, setServiceToDeleteId] = useState<string | null>(null)
  const [deleteFromModal, setDeleteFromModal] = useState(false)

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

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation() // Prevent card click from triggering
    setServiceToDeleteId(id)
    setDeleteFromModal(false)
    setDeleteConfirmOpen(true)
  }

  const handleDeleteFromModal = () => {
    if (!editingService) return
    setServiceToDeleteId(editingService.id)
    setDeleteFromModal(true)
    setDeleteConfirmOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!serviceToDeleteId) return
    const serviceToDelete = services.find(s => s.id === serviceToDeleteId)
    if (!serviceToDelete) return

    await deleteService.mutateAsync(serviceToDeleteId)

    if (deleteFromModal) {
      setEditingService(null)
    }

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
        const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...serviceData } = serviceToDelete
        await createService.mutateAsync(serviceData as Omit<Service, 'id' | 'createdAt' | 'updatedAt' | 'modifiers'>)
      }
    })

    setDeleteConfirmOpen(false)
    setServiceToDeleteId(null)
  }

  return (
    <div className={cn('min-h-screen p-4 lg:p-6', colors.pageGradientLight)}>
      <div className="space-y-6">
        <div data-tour-step="services-page-header" className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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

      {isError ? (
        <Card>
          <div className="py-8 text-center">
            <p className="text-red-600 font-medium">Failed to load services.</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        </Card>
      ) : isLoading ? (
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

      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false)
          setServiceToDeleteId(null)
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Service?"
        message="This may affect existing appointments using this service. You can restore from history."
        variant="danger"
        confirmLabel="Delete"
      />
      </div>
    </div>
  )
}
