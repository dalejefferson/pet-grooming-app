import { useState } from 'react'
import { Search, Plus } from 'lucide-react'
import { Card, Button, Input, Modal } from '@/components/common'
import { GroomerForm, GroomerCard } from '@/components/groomers'
import { useGroomers, useCreateGroomer, useUpdateGroomer, useDeleteGroomer } from '@/hooks'
import { cn } from '@/lib/utils'
import type { Groomer } from '@/types'
import { useTheme } from '@/context/ThemeContext'

export function GroomersPage() {
  const { colors } = useTheme()
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingGroomer, setEditingGroomer] = useState<Groomer | null>(null)

  const { data: groomers = [], isLoading } = useGroomers()
  const createGroomer = useCreateGroomer()
  const updateGroomer = useUpdateGroomer()
  const deleteGroomer = useDeleteGroomer()

  const filteredGroomers = groomers.filter((groomer) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      groomer.firstName.toLowerCase().includes(query) ||
      groomer.lastName.toLowerCase().includes(query) ||
      groomer.email.toLowerCase().includes(query) ||
      groomer.specialties.some((s) => s.toLowerCase().includes(query))
    )
  })

  // Separate active and inactive groomers
  const activeGroomers = filteredGroomers.filter((g) => g.isActive)
  const inactiveGroomers = filteredGroomers.filter((g) => !g.isActive)

  const handleCreate = async (data: Omit<Groomer, 'id' | 'createdAt' | 'updatedAt'>) => {
    await createGroomer.mutateAsync(data)
    setShowCreateModal(false)
  }

  const handleUpdate = async (data: Omit<Groomer, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingGroomer) {
      await updateGroomer.mutateAsync({ id: editingGroomer.id, data })
      setEditingGroomer(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this groomer?')) {
      await deleteGroomer.mutateAsync(id)
    }
  }

  return (
    <div className={cn('min-h-screen', colors.pageGradientLight)}>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Groomers</h1>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Groomer
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="Search groomers by name, email, or specialty..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {isLoading ? (
        <div className="text-center text-gray-600">Loading groomers...</div>
      ) : filteredGroomers.length === 0 ? (
        <Card>
          <div className="py-8 text-center">
            <p className="text-gray-600">
              {searchQuery
                ? 'No groomers found matching your search.'
                : 'No groomers yet. Add your first groomer to get started.'}
            </p>
          </div>
        </Card>
      ) : (
        <>
          {/* Active Groomers */}
          {activeGroomers.length > 0 && (
            <div>
              <h2 className="mb-4 text-lg font-semibold text-gray-900">
                Active Groomers ({activeGroomers.length})
              </h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {activeGroomers.map((groomer) => (
                  <GroomerCard
                    key={groomer.id}
                    groomer={groomer}
                    onEdit={() => setEditingGroomer(groomer)}
                    onDelete={() => handleDelete(groomer.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Inactive Groomers */}
          {inactiveGroomers.length > 0 && (
            <div>
              <h2 className="mb-4 text-lg font-semibold text-gray-500">
                Inactive Groomers ({inactiveGroomers.length})
              </h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {inactiveGroomers.map((groomer) => (
                  <GroomerCard
                    key={groomer.id}
                    groomer={groomer}
                    onEdit={() => setEditingGroomer(groomer)}
                    onDelete={() => handleDelete(groomer.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Add New Groomer"
        size="md"
      >
        <GroomerForm
          onSubmit={handleCreate}
          onCancel={() => setShowCreateModal(false)}
          isLoading={createGroomer.isPending}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={!!editingGroomer}
        onClose={() => setEditingGroomer(null)}
        title="Edit Groomer"
        size="md"
      >
        {editingGroomer && (
          <GroomerForm
            groomer={editingGroomer}
            onSubmit={handleUpdate}
            onCancel={() => setEditingGroomer(null)}
            isLoading={updateGroomer.isPending}
          />
        )}
      </Modal>
      </div>
    </div>
  )
}
