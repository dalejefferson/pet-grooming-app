import { Menu, Bell } from 'lucide-react'
import { Button } from '@/components/common'
import { useCurrentUser, useOrganization } from '@/hooks'
import { getInitials } from '@/lib/utils'

interface HeaderProps {
  onMenuClick?: () => void
  title?: string
}

export function Header({ onMenuClick, title }: HeaderProps) {
  const { data: user } = useCurrentUser()
  const { data: org } = useOrganization()

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b-2 border-[#1e293b] bg-white px-4 lg:px-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onMenuClick}
          className="lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </Button>
        {title && <h1 className="text-lg font-bold text-[#1e293b]">{title}</h1>}
      </div>

      <div className="flex items-center gap-4">
        <span className="hidden text-sm text-[#64748b] md:block">
          {org?.name}
        </span>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-accent-500" />
        </Button>
        {user && (
          <div className="flex h-8 w-8 items-center justify-center rounded-xl border-2 border-[#1e293b] bg-[#d1fae5] text-sm font-medium text-[#1e293b] shadow-[2px_2px_0px_0px_#1e293b]">
            {getInitials(user.name)}
          </div>
        )}
      </div>
    </header>
  )
}
