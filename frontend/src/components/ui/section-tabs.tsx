import { motion } from 'framer-motion'
import { cn } from '../../lib/utils'

interface SectionTabsProps {
  tabs: string[]
  activeTab: string
  onChange: (tab: string) => void
}

export function SectionTabs({ tabs, activeTab, onChange }: SectionTabsProps) {
  return (
    <div className="mb-5 border-b border-line">
      <div className="flex flex-wrap gap-6">
        {tabs.map((tab) => {
          const isActive = tab === activeTab
          return (
            <button
              key={tab}
              type="button"
              onClick={() => onChange(tab)}
              className={cn('ui-tab', isActive && 'ui-tab-active')}
            >
              {tab}
              {isActive ? (
                <motion.span
                  layoutId="active-tab-line"
                  className="absolute inset-x-0 bottom-[-1px] h-0.5 bg-accent-500"
                />
              ) : null}
            </button>
          )
        })}
      </div>
    </div>
  )
}
