import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Plus, Phone } from 'lucide-react'
import { Card, Button, Input, Badge, Modal, ImageUpload } from '@/components/common'
import { useClients, useClientPets, useCreateClient } from '@/hooks'
import { formatPhone, cn } from '@/lib/utils'
import type { Client } from '@/types'
import { useTheme } from '@/context/ThemeContext'

function ClientForm({
  onSubmit,
  onCancel,
  isLoading,
}: {
  onSubmit: (data: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => void
  onCancel: () => void
  isLoading: boolean
}) {
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
      organizationId: 'org-1',
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
      <Input
        label="Address"
        value={formData.address}
        onChange={(e) => setFormData((p) => ({ ...p, address: e.target.value }))}
      />
      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} className="min-h-[44px] sm:min-h-0">
          Cancel
        </Button>
        <Button type="submit" loading={isLoading} className="min-h-[44px] sm:min-h-0">
          Add Client
        </Button>
      </div>
    </form>
  )
}

function ClientCard({ client }: { client: Client }) {
  const { data: pets = [] } = useClientPets(client.id)
  const initials = (client.firstName.charAt(0) + client.lastName.charAt(0)).toUpperCase()

  return (
    <Link to={`/app/clients/${client.id}`}>
      <Card className="aspect-square flex flex-col items-center justify-center p-4 text-center transition-all hover:shadow-md hover:-translate-y-1">
        {/* Profile Image */}
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-[#1e293b] bg-[#fef9c3] text-2xl font-bold text-[#334155] shadow-[3px_3px_0px_0px_#1e293b] overflow-hidden">
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
    </Link>
  )
}

export function ClientsPage() {
  const { colors } = useTheme()
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const { data: clients = [], isLoading } = useClients()
  const createClient = useCreateClient()

  const filteredClients = clients.filter((client) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      client.firstName.toLowerCase().includes(query) ||
      client.lastName.toLowerCase().includes(query) ||
      client.email.toLowerCase().includes(query) ||
      client.phone.includes(searchQuery)
    )
  })

  const handleAddClient = async (data: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => {
    await createClient.mutateAsync(data)
    setShowAddModal(false)
  }

  return (
    <div className={cn('min-h-screen', colors.pageGradientLight)}>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Client
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="Search clients..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {isLoading ? (
        <div className="text-center text-gray-600">Loading clients...</div>
      ) : filteredClients.length === 0 ? (
        <Card>
          <div className="py-8 text-center">
            <p className="text-gray-600">
              {searchQuery ? 'No clients found matching your search.' : 'No clients yet.'}
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {filteredClients.map((client) => (
            <ClientCard key={client.id} client={client} />
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
        />
      </Modal>
      </div>
    </div>
  )
}
