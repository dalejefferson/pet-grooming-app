import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, AlertTriangle, User } from 'lucide-react'
import { Card, Input, Badge } from '../../components/common'
import { usePets, useClients } from '@/hooks'
import { BEHAVIOR_LEVEL_LABELS } from '@/config/constants'
import { useTheme } from '../../context'
import { cn } from '@/lib/utils'

export function PetsPage() {
  const { colors } = useTheme()
  const [searchQuery, setSearchQuery] = useState('')
  const { data: pets = [], isLoading } = usePets()
  const { data: clients = [] } = useClients()

  const filteredPets = pets.filter((pet) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    const client = clients.find((c) => c.id === pet.clientId)
    return (
      pet.name.toLowerCase().includes(query) ||
      pet.breed.toLowerCase().includes(query) ||
      client?.firstName.toLowerCase().includes(query) ||
      client?.lastName.toLowerCase().includes(query)
    )
  })

  return (
    <div className={cn('min-h-screen p-4 lg:p-6', colors.pageGradientLight)}>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Pets</h1>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="Search pets or owners..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {isLoading ? (
        <div className="text-center text-gray-600">Loading pets...</div>
      ) : filteredPets.length === 0 ? (
        <Card>
          <div className="py-8 text-center">
            <p className="text-gray-600">
              {searchQuery ? 'No pets found matching your search.' : 'No pets registered yet.'}
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {filteredPets.map((pet) => {
            const client = clients.find((c) => c.id === pet.clientId)
            return (
              <Link key={pet.id} to={`/app/pets/${pet.id}`}>
                <Card className="aspect-square flex flex-col items-center justify-center p-4 text-center transition-all cursor-pointer hover:shadow-md hover:-translate-y-1">
                  {/* Pet Image */}
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-[#1e293b] bg-[#e0f2fe] text-2xl font-bold text-[#334155] shadow-[3px_3px_0px_0px_#1e293b] overflow-hidden">
                    {pet.imageUrl ? (
                      <img src={pet.imageUrl} alt={pet.name} className="h-full w-full object-cover" />
                    ) : (
                      <span>{pet.name.charAt(0).toUpperCase()}</span>
                    )}
                  </div>

                  {/* Name */}
                  <div className="mt-3 flex items-center justify-center gap-1.5">
                    <h3 className="font-semibold text-gray-900 truncate">{pet.name}</h3>
                    {pet.behaviorLevel >= 4 && (
                      <AlertTriangle className="h-4 w-4 shrink-0 text-warning-500" />
                    )}
                  </div>

                  {/* Breed */}
                  <p className="mt-1 text-sm text-gray-600 truncate">{pet.breed}</p>

                  {/* Owner */}
                  {client && (
                    <div className="mt-1 flex items-center justify-center gap-1 text-xs text-gray-500">
                      <User className="h-3 w-3 shrink-0" />
                      <span className="truncate">{client.firstName} {client.lastName}</span>
                    </div>
                  )}

                  {/* Badges */}
                  <div className="mt-3 flex flex-wrap justify-center gap-1">
                    <Badge variant="secondary" size="sm">
                      {pet.species}
                    </Badge>
                    <Badge
                      variant={pet.behaviorLevel <= 2 ? 'success' : pet.behaviorLevel >= 4 ? 'warning' : 'secondary'}
                      size="sm"
                    >
                      {BEHAVIOR_LEVEL_LABELS[pet.behaviorLevel]}
                    </Badge>
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
      </div>
    </div>
  )
}
