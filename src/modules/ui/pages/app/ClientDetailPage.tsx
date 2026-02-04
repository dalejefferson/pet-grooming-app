import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Phone, Mail, MapPin, Dog, Plus, Edit2, Calendar } from 'lucide-react'
import { Card, CardTitle, Button, Badge, LoadingPage, Modal, Input, Select, Textarea, ImageUpload, ComboBox } from '../../components/common'
import { CreateAppointmentModal } from '../../components/calendar'
import type { PetServiceSelection } from '../../components/calendar'
import { PaymentMethodsSection } from '../../components/payment'
import { useClient, useClientPets, useUpdateClient, useCreatePet, useOrganization, useServices, useGroomers, useCreateAppointment, useCurrentUser } from '@/hooks'
import { formatPhone, cn } from '@/lib/utils'
import { BEHAVIOR_LEVEL_LABELS, COAT_TYPE_LABELS, WEIGHT_RANGE_LABELS, DOG_BREEDS, CAT_BREEDS } from '@/config/constants'
import type { Pet, AppointmentStatus } from '@/types'
import { useState, useMemo } from 'react'
import { useTheme } from '../../context'

function PetForm({
  clientId,
  organizationId,
  onSubmit,
  onCancel,
  isLoading,
  accentColor,
}: {
  clientId: string
  organizationId: string
  onSubmit: (data: Omit<Pet, 'id' | 'createdAt' | 'updatedAt'>) => void
  onCancel: () => void
  isLoading: boolean
  accentColor: string
}) {
  const { colors } = useTheme()
  const [formData, setFormData] = useState({
    name: '',
    species: 'dog' as Pet['species'],
    breed: '',
    weight: 0,
    weightRange: 'medium' as Pet['weightRange'],
    coatType: 'medium' as Pet['coatType'],
    behaviorLevel: 3 as Pet['behaviorLevel'],
    groomingNotes: '',
    imageUrl: undefined as string | undefined,
  })

  const breedOptions = useMemo(() => {
    if (formData.species === 'dog') return DOG_BREEDS.map((b) => ({ value: b, label: b }))
    if (formData.species === 'cat') return CAT_BREEDS.map((b) => ({ value: b, label: b }))
    return []
  }, [formData.species])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      ...formData,
      clientId,
      organizationId,
      vaccinations: [],
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex justify-center">
        <ImageUpload
          currentImage={formData.imageUrl}
          onImageChange={(url) => setFormData((p) => ({ ...p, imageUrl: url || undefined }))}
          placeholder={formData.name.charAt(0) || '?'}
          size="lg"
          bucket="pet-images"
        />
      </div>
      <Input
        label="Pet Name"
        value={formData.name}
        onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
        required
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          label="Species"
          options={[
            { value: 'dog', label: 'Dog' },
            { value: 'cat', label: 'Cat' },
            { value: 'other', label: 'Other' },
          ]}
          value={formData.species}
          onChange={(e) => setFormData((p) => ({ ...p, species: e.target.value as Pet['species'], breed: '' }))}
        />
        {formData.species === 'other' ? (
          <Input
            label="Breed"
            value={formData.breed}
            onChange={(e) => setFormData((p) => ({ ...p, breed: e.target.value }))}
            placeholder="Enter breed"
            required
          />
        ) : (
          <ComboBox
            label="Breed"
            options={breedOptions}
            value={formData.breed}
            onChange={(value) => setFormData((p) => ({ ...p, breed: value }))}
            placeholder="Select or type a breed"
          />
        )}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Weight (lbs)"
          type="number"
          value={formData.weight || ''}
          onChange={(e) => setFormData((p) => ({ ...p, weight: Number(e.target.value) }))}
        />
        <Select
          label="Weight Range"
          options={Object.entries(WEIGHT_RANGE_LABELS).map(([value, label]) => ({ value, label }))}
          value={formData.weightRange}
          onChange={(e) => setFormData((p) => ({ ...p, weightRange: e.target.value as Pet['weightRange'] }))}
        />
      </div>
      <Select
        label="Coat Type"
        options={Object.entries(COAT_TYPE_LABELS).map(([value, label]) => ({ value, label }))}
        value={formData.coatType}
        onChange={(e) => setFormData((p) => ({ ...p, coatType: e.target.value as Pet['coatType'] }))}
      />
      <Select
        label="Behavior Level"
        options={Object.entries(BEHAVIOR_LEVEL_LABELS).map(([value, label]) => ({ value, label }))}
        value={String(formData.behaviorLevel)}
        onChange={(e) => setFormData((p) => ({ ...p, behaviorLevel: Number(e.target.value) as Pet['behaviorLevel'] }))}
      />
      <Textarea
        label="Grooming Notes"
        value={formData.groomingNotes}
        onChange={(e) => setFormData((p) => ({ ...p, groomingNotes: e.target.value }))}
        rows={3}
      />
      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="submit"
          loading={isLoading}
          style={{ backgroundColor: accentColor, color: colors.textOnAccent }}
          className="hover:opacity-90"
        >
          Add Pet
        </Button>
      </div>
    </form>
  )
}

export function ClientDetailPage() {
  const { colors } = useTheme()
  const { clientId } = useParams<{ clientId: string }>()
  const { data: user } = useCurrentUser()
  const { data: client, isLoading } = useClient(clientId || '')
  const { data: pets = [] } = useClientPets(clientId || '')
  // Organization hook kept for potential future use
  useOrganization()
  const updateClient = useUpdateClient()
  const createPet = useCreatePet()
  const { data: services = [] } = useServices()
  const { data: groomers = [] } = useGroomers()
  const createAppointment = useCreateAppointment()
  const [showAddPetModal, setShowAddPetModal] = useState(false)
  const [showBookModal, setShowBookModal] = useState(false)
  const [bookStartTime, setBookStartTime] = useState('')
  const [bookEndTime, setBookEndTime] = useState('')
  const [isEditingNotes, setIsEditingNotes] = useState(false)
  const [notes, setNotes] = useState('')
  const [isEditingContact, setIsEditingContact] = useState(false)
  const [contactForm, setContactForm] = useState({
    email: '',
    phone: '',
    address: '',
    preferredContactMethod: '' as 'email' | 'phone' | 'text',
  })
  const [contactErrors, setContactErrors] = useState<{ email?: string; phone?: string }>({})

  if (isLoading) return <LoadingPage />

  if (!client) {
    return (
      <div className="text-center">
        <p className="text-gray-600">Client not found</p>
        <Link to="/app/clients" className="text-primary-600 hover:underline">
          Back to clients
        </Link>
      </div>
    )
  }

  const handleSaveNotes = async () => {
    await updateClient.mutateAsync({ id: client.id, data: { notes } })
    setIsEditingNotes(false)
  }

  const handleSaveContact = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const phoneRegex = /^[+]?[\d\s()-]{7,}$/
    const errors: { email?: string; phone?: string } = {}
    if (contactForm.email && !emailRegex.test(contactForm.email)) {
      errors.email = 'Please enter a valid email address'
    }
    if (contactForm.phone && !phoneRegex.test(contactForm.phone)) {
      errors.phone = 'Please enter a valid phone number'
    }
    if (Object.keys(errors).length > 0) {
      setContactErrors(errors)
      return
    }
    setContactErrors({})
    await updateClient.mutateAsync({
      id: client.id,
      data: {
        email: contactForm.email,
        phone: contactForm.phone,
        address: contactForm.address || undefined,
        preferredContactMethod: contactForm.preferredContactMethod,
      },
    })
    setIsEditingContact(false)
  }

  const handleAddPet = async (data: Omit<Pet, 'id' | 'createdAt' | 'updatedAt'>) => {
    await createPet.mutateAsync(data)
    setShowAddPetModal(false)
  }

  const handleCreateAppointment = async (data: { clientId: string; petServices: PetServiceSelection[]; groomerId: string; notes: string; startTime: string; endTime: string }) => {
    try {
      await createAppointment.mutateAsync({
        organizationId: user?.organizationId || '',
        clientId: data.clientId,
        pets: data.petServices.filter((ps) => ps.serviceIds.length > 0).map((ps) => ({
          petId: ps.petId,
          services: ps.serviceIds.map((serviceId) => {
            const service = services.find((s) => s.id === serviceId)
            return { serviceId, appliedModifiers: [], finalDuration: service?.baseDurationMinutes || 60, finalPrice: service?.basePrice || 0 }
          }),
        })),
        groomerId: data.groomerId || undefined,
        startTime: new Date(data.startTime).toISOString(),
        endTime: new Date(data.endTime).toISOString(),
        status: 'confirmed' as AppointmentStatus,
        internalNotes: data.notes || undefined,
        depositPaid: false,
        totalAmount: data.petServices.reduce((total, ps) => total + ps.serviceIds.reduce((sum, sid) => sum + (services.find((s) => s.id === sid)?.basePrice || 0), 0), 0),
      })
      setShowBookModal(false)
    } catch {
      // Error stays visible via react-query; keep modal open so user can retry
    }
  }

  const clientInitials = (client.firstName.charAt(0) + client.lastName.charAt(0)).toUpperCase()

  const handleImageChange = async (imageUrl: string | null) => {
    await updateClient.mutateAsync({ id: client.id, data: { imageUrl: imageUrl || undefined } })
  }

  return (
    <div className={cn('min-h-screen p-4 lg:p-6', colors.pageGradientLight)}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/app/clients">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <ImageUpload
              currentImage={client.imageUrl}
              onImageChange={handleImageChange}
              placeholder={clientInitials}
              size="lg"
              bucket="client-images"
            />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {client.firstName} {client.lastName}
              </h1>
              {client.isNewClient && (
                <Badge variant="primary" size="sm">New Client</Badge>
              )}
            </div>
          </div>
          <Button
            variant="themed"
            onClick={() => {
              setBookStartTime('')
              setBookEndTime('')
              setShowBookModal(true)
            }}
          >
            <Calendar className="mr-2 h-4 w-4" />
            Book Appointment
          </Button>
        </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Contact Information */}
        <Card>
          <div className="flex items-center justify-between">
            <CardTitle>Contact Information</CardTitle>
            {!isEditingContact && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setContactForm({
                    email: client.email,
                    phone: client.phone,
                    address: client.address || '',
                    preferredContactMethod: client.preferredContactMethod,
                  })
                  setIsEditingContact(true)
                }}
              >
                <Edit2 className="h-4 w-4" />
              </Button>
            )}
          </div>
          {isEditingContact ? (
            <div className="mt-4 space-y-4">
              <Input
                label="Email"
                type="email"
                value={contactForm.email}
                onChange={(e) => {
                  setContactForm((p) => ({ ...p, email: e.target.value }))
                  if (contactErrors.email) setContactErrors((p) => ({ ...p, email: undefined }))
                }}
                error={contactErrors.email}
              />
              <Input
                label="Phone"
                type="tel"
                value={contactForm.phone}
                onChange={(e) => {
                  setContactForm((p) => ({ ...p, phone: e.target.value }))
                  if (contactErrors.phone) setContactErrors((p) => ({ ...p, phone: undefined }))
                }}
                error={contactErrors.phone}
              />
              <Input
                label="Address"
                value={contactForm.address}
                onChange={(e) => setContactForm((p) => ({ ...p, address: e.target.value }))}
              />
              <Select
                label="Preferred Contact Method"
                options={[
                  { value: 'email', label: 'Email' },
                  { value: 'phone', label: 'Phone' },
                  { value: 'text', label: 'Text' },
                ]}
                value={contactForm.preferredContactMethod}
                onChange={(e) => setContactForm((p) => ({ ...p, preferredContactMethod: e.target.value as 'email' | 'phone' | 'text' }))}
              />
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setIsEditingContact(false)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveContact}
                  loading={updateClient.isPending}
                  style={{ backgroundColor: colors.accentColorDark, color: colors.textOnAccent }}
                  className="hover:opacity-90"
                >
                  Save
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-gray-400" />
                  <a href={`mailto:${client.email}`} className="hover:underline" style={{ color: colors.accentColorDark }}>
                    {client.email}
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-gray-400" />
                  <a href={`tel:${client.phone}`} className="hover:underline" style={{ color: colors.accentColorDark }}>
                    {formatPhone(client.phone)}
                  </a>
                </div>
                {client.address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-gray-400" />
                    <span className="text-gray-700">{client.address}</span>
                  </div>
                )}
              </div>
              <div className="mt-4 border-t pt-4">
                <p className="text-sm text-gray-500">
                  Preferred Contact: {client.preferredContactMethod}
                </p>
              </div>
            </>
          )}
        </Card>

        {/* Notes */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between">
            <CardTitle>Notes</CardTitle>
            {!isEditingNotes && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setNotes(client.notes || '')
                  setIsEditingNotes(true)
                }}
              >
                <Edit2 className="h-4 w-4" />
              </Button>
            )}
          </div>
          {isEditingNotes ? (
            <div className="mt-4 space-y-4">
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
              />
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setIsEditingNotes(false)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveNotes}
                  loading={updateClient.isPending}
                  style={{ backgroundColor: colors.accentColorDark, color: colors.textOnAccent }}
                  className="hover:opacity-90"
                >
                  Save
                </Button>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-gray-700">
              {client.notes || 'No notes yet.'}
            </p>
          )}
        </Card>
      </div>

      {/* Pets */}
      <Card>
        <div className="flex items-center justify-between">
          <CardTitle>Pets</CardTitle>
          <Button variant="themed" size="sm" onClick={() => setShowAddPetModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Pet
          </Button>
        </div>

        {pets.length === 0 ? (
          <div className="mt-6 text-center py-8">
            <Dog className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-gray-600">No pets registered yet.</p>
          </div>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pets.map((pet) => (
              <Link key={pet.id} to={`/app/pets/${pet.id}`}>
                <div className="rounded-xl border-2 border-[#1e293b] bg-white p-4 shadow-[3px_3px_0px_0px_#1e293b] transition-all hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_#1e293b]">
                  <div className="flex items-start gap-3">
                    {/* Pet Image */}
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 border-[#1e293b] bg-[#e0f2fe] font-semibold text-[#334155] shadow-[2px_2px_0px_0px_#1e293b] overflow-hidden">
                      {pet.imageUrl ? (
                        <img src={pet.imageUrl} alt={pet.name} className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-sm">{pet.name.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900">{pet.name}</h3>
                          <p className="text-sm text-gray-600">{pet.breed}</p>
                        </div>
                        <Badge variant="secondary" size="sm">
                          {pet.species}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge variant="outline" size="sm">
                      {COAT_TYPE_LABELS[pet.coatType]}
                    </Badge>
                    <Badge variant="outline" size="sm">
                      {WEIGHT_RANGE_LABELS[pet.weightRange]}
                    </Badge>
                    <Badge
                      variant={pet.behaviorLevel <= 2 ? 'success' : pet.behaviorLevel >= 4 ? 'warning' : 'secondary'}
                      size="sm"
                    >
                      {BEHAVIOR_LEVEL_LABELS[pet.behaviorLevel]}
                    </Badge>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>

      {/* Payment Methods */}
      <PaymentMethodsSection clientId={client.id} />

      <Modal
        isOpen={showAddPetModal}
        onClose={() => setShowAddPetModal(false)}
        title="Add New Pet"
        size="md"
      >
        <PetForm
          clientId={client.id}
          organizationId={user?.organizationId || ''}
          onSubmit={handleAddPet}
          onCancel={() => setShowAddPetModal(false)}
          isLoading={createPet.isPending}
          accentColor={colors.accentColorDark}
        />
      </Modal>

      <CreateAppointmentModal
        isOpen={showBookModal}
        onClose={() => setShowBookModal(false)}
        clients={client ? [client] : []}
        clientPets={pets}
        services={services}
        groomers={groomers}
        initialStartTime={bookStartTime}
        initialEndTime={bookEndTime}
        onClientChange={() => {}}
        selectedClientId={client?.id || ''}
        onCreateAppointment={handleCreateAppointment}
        isCreating={createAppointment.isPending}
      />
      </div>
    </div>
  )
}
