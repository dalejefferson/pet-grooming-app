import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Card, Button, Modal } from '@/components/common'
import { ServiceForm, ServiceDisplayCard, EditServiceModal } from '@/components/services'
import { useServices, useCreateService, useUpdateService, useDeleteService } from '@/hooks'
import { cn } from '@/lib/utils'
import type { Service } from '@/types'
import { useTheme } from '@/context/ThemeContext'

export function ServicesPage() {
  const { colors } = useTheme()
  const { data: services = [], isLoading } = useServices()
  const createService = useCreateService()
  const updateService = useUpdateService()
  const deleteService = useDeleteService()

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
    if (confirm('Are you sure you want to delete this service?')) {
      await deleteService.mutateAsync(id)
    }
  }

  const handleDeleteFromModal = async () => {
    if (editingService && confirm('Are you sure you want to delete this service?')) {
      await deleteService.mutateAsync(editingService.id)
      setEditingService(null)
    }
  }

  return (
    <div className={cn('min-h-screen', colors.pageGradientLight)}>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Services</h1>
        <Button onClick={() => setShowCreateModal(true)}>
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
      </div>
    </div>
  )
}
