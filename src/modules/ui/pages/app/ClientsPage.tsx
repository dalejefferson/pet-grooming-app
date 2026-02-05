import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Plus, Phone, Trash2, Users } from 'lucide-react'
import { Card, Button, Input, Badge, Modal, ImageUpload, HistorySection, ConfirmDialog, Skeleton, EmptyState, AddressAutocomplete } from '../../components/common'
import { useClients, useClientPets, useCreateClient, useDeleteClient, useDeletedHistory, useAddToHistory, useCurrentUser } from '@/hooks'
import { formatPhone, cn } from '@/lib/utils'
import { debounce } from '@/lib/utils/debounce'
import type { Client } from '@/types'
import { useTheme, useUndo } from '../../context'

function ClientForm({
  onSubmit,
  onCancel,
  isLoading,
  accentColor,
  organizationId,
}: {
  onSubmit: (data: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => void
  onCancel: () => void
  isLoading: boolean
  accentColor: string
  organizationId: string
}) {
  const { colors } = useTheme()
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    notes: '',
    imageUrl: undefined as string | undefined,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      ...formData,
      organizationId,
      preferredContactMethod: 'email',
      isNewClient: true,
    })
  }

  const getInitials = () => {
    const first = formData.firstName.charAt(0) || ''
    const last = formData.lastName.charAt(0) || ''
    return first + last || '?'
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex justify-center">
        <ImageUpload
          currentImage={formData.imageUrl}
          onImageChange={(url) => setFormData((p) => ({ ...p, imageUrl: url || undefined }))}
          placeholder={getInitials()}
          size="lg"
          bucket="client-images"
        />
      </div>
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
        <Input
          label="First Name"
          value={formData.firstName}
          onChange={(e) => setFormData((p) => ({ ...p, firstName: e.target.value }))}
          required
        />
        <Input
          label="Last Name"
          value={formData.lastName}
          onChange={(e) => setFormData((p) => ({ ...p, lastName: e.target.value }))}
          required
        />
      </div>
      <Input
        label="Email"
        type="email"
        value={formData.email}
        onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
        required
      />
      <Input
        label="Phone"
        type="tel"
        value={formData.phone}
        onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
        required
      />
      <AddressAutocomplete
        label="Address"
        value={formData.address}
        onChange={(val) => setFormData((p) => ({ ...p, address: val }))}
      />
      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} className="min-h-[44px] sm:min-h-0">
          Cancel
        </Button>
        <Button
          type="submit"
          loading={isLoading}
          className="min-h-[44px] sm:min-h-0 hover:opacity-90"
          style={{ backgroundColor: accentColor, color: colors.textOnAccent }}
        >
          Add Client
        </Button>
      </div>
    </form>
  )
}

function ClientCard({ client, accentColor, onDelete }: { client: Client; accentColor: string; onDelete: () => void }) {
  const navigate = useNavigate()
  const { data: pets = [] } = useClientPets(client.id)
  const initials = (client.firstName.charAt(0) + client.lastName.charAt(0)).toUpperCase()

  const handleCardClick = () => {
    navigate(`/app/clients/${client.id}`)
  }

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDelete()
  }

  return (
    <Card
      className="aspect-square flex flex-col items-center justify-center p-4 text-center transition-all cursor-pointer hover:shadow-[4px_4px_0px_0px_#1e293b] hover:-translate-y-0.5 relative group"
      onClick={handleCardClick}
    >
      {/* Delete Button - Top Right */}
      <button
        onClick={handleDeleteClick}
        className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/80 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
        aria-label="Delete client"
      >
        <Trash2 className="h-3.5 w-3.5 text-red-500" />
      </button>

      {/* Profile Image */}
      <div
        className="flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-[#1e293b] text-2xl font-bold text-[#334155] shadow-[3px_3px_0px_0px_#1e293b] overflow-hidden"
        style={{ backgroundColor: client.imageUrl ? undefined : accentColor }}
      >
        {client.imageUrl ? (
          <img src={client.imageUrl} alt={`${client.firstName} ${client.lastName}`} className="h-full w-full object-cover" />
        ) : (
          <span>{initials}</span>
        )}
      </div>

      {/* Name */}
      <div className="mt-3 flex items-center justify-center gap-2">
        <h3 className="font-semibold text-gray-900 truncate">
          {client.firstName} {client.lastName}
        </h3>
        {client.isNewClient && (
          <Badge variant="primary" size="sm">New</Badge>
        )}
      </div>

      {/* Contact */}
      <div className="mt-2 space-y-1 text-sm text-gray-600">
        <div className="flex items-center justify-center gap-1.5">
          <Phone className="h-3.5 w-3.5" />
          {formatPhone(client.phone)}
        </div>
      </div>

      {/* Pets */}
      {pets.length > 0 && (
        <div className="mt-3 flex flex-wrap justify-center gap-1">
          {pets.slice(0, 3).map((pet) => (
            <Badge key={pet.id} variant="secondary" size="sm">
              {pet.name}
            </Badge>
          ))}
          {pets.length > 3 && (
            <Badge variant="outline" size="sm">+{pets.length - 3}</Badge>
          )}
        </div>
      )}
    </Card>
  )
}

export function ClientsPage() {
  const { colors } = useTheme()
  const { showUndo } = useUndo()
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [clientToDeleteId, setClientToDeleteId] = useState<string | null>(null)
  const { data: user } = useCurrentUser()
  const { data: clients = [], isLoading } = useClients()
  const { data: deletedItems = [] } = useDeletedHistory('client')
  const createClient = useCreateClient()
  const deleteClient = useDeleteClient()
  const addToHistory = useAddToHistory()

  const debouncedSetQuery = useMemo(
    () => debounce((value: string) => setDebouncedQuery(value), 300),
    []
  )

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    debouncedSetQuery(e.target.value)
  }

  const handleDeleteClient = async (clientId: string) => {
    // Find and store the client data before deleting
    const clientToDelete = clients.find(c => c.id === clientId)
    if (!clientToDelete) return

    await deleteClient.mutateAsync(clientId)

    // Add to history for restore functionality
    await addToHistory.mutateAsync({
      entityType: 'client',
      entityId: clientToDelete.id,
      entityName: `${clientToDelete.firstName} ${clientToDelete.lastName}`,
      data: clientToDelete,
    })

    // Show undo toast
    showUndo({
      type: 'client',
      label: `${clientToDelete.firstName} ${clientToDelete.lastName}`,
      data: clientToDelete,
      onUndo: async () => {
        // Restore the client (create with same data, excluding id/timestamps)
        const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...clientData } = clientToDelete
        await createClient.mutateAsync(clientData)
      }
    })
  }

  const filteredClients = useMemo(() => clients.filter((client) => {
    if (!debouncedQuery) return true
    const query = debouncedQuery.toLowerCase()
    return (
      client.firstName.toLowerCase().includes(query) ||
      client.lastName.toLowerCase().includes(query) ||
      client.email.toLowerCase().includes(query) ||
      client.phone.includes(debouncedQuery)
    )
  }), [clients, debouncedQuery])

  const handleAddClient = async (data: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => {
    await createClient.mutateAsync(data)
    setShowAddModal(false)
  }

  return (
    <div className={cn('min-h-screen p-4 lg:p-6', colors.pageGradientLight)}>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
        <Button
          onClick={() => setShowAddModal(true)}
          style={{ backgroundColor: colors.accentColorDark, color: colors.textOnAccent }}
          className="hover:opacity-90"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Client
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="Search clients..."
          value={searchQuery}
          onChange={handleSearchChange}
          className="pl-10"
        />
      </div>

      {isLoading ? (
        <Skeleton variant="card" count={10} />
      ) : filteredClients.length === 0 ? (
        <EmptyState
          icon={<Users className="h-8 w-8" />}
          title={debouncedQuery ? 'No clients found' : 'No clients yet'}
          description={debouncedQuery ? 'No clients match your search. Try a different term.' : 'Get started by adding your first client.'}
          action={!debouncedQuery ? { label: 'Add Client', onClick: () => setShowAddModal(true) } : undefined}
        />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {filteredClients.map((client) => (
            <ClientCard
              key={client.id}
              client={client}
              accentColor={colors.accentColor}
              onDelete={() => {
                setClientToDeleteId(client.id)
                setDeleteConfirmOpen(true)
              }}
            />
          ))}
        </div>
      )}

      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Client"
        size="md"
      >
        <ClientForm
          onSubmit={handleAddClient}
          onCancel={() => setShowAddModal(false)}
          isLoading={createClient.isPending}
          accentColor={colors.accentColorDark}
          organizationId={user?.organizationId || ''}
        />
      </Modal>

      <HistorySection
        items={deletedItems}
        entityType="client"
        title="Recently Deleted Clients"
      />

      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false)
          setClientToDeleteId(null)
        }}
        onConfirm={async () => {
          if (clientToDeleteId) {
            await handleDeleteClient(clientToDeleteId)
          }
          setDeleteConfirmOpen(false)
          setClientToDeleteId(null)
        }}
        title="Delete Client?"
        message="This will remove the client. You can restore from history."
        variant="danger"
        confirmLabel="Delete"
      />
      </div>
    </div>
  )
}
