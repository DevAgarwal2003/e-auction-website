'use client'

import { Search, RotateCcw, SlidersHorizontal } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { budgetRanges } from '@/data/locations'
import { useFilterMeta, citiesFrom, localitiesFrom } from '@/hooks/useFilterMeta'

const ALL = '__all__'

function FilterSelect({ label, value, placeholder, onChange, options, disabled }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Select value={value || ALL} onValueChange={(v) => onChange(v === ALL ? '' : v)} disabled={disabled}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>{placeholder}</SelectItem>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

export default function PropertyFilters({ filters, setFilters, onReset }) {
  const { locations, states, propertyTypes, banks, statuses } = useFilterMeta()

  const update = (key, value) => {
    setFilters((prev) => {
      const next = { ...prev, [key]: value }
      if (key === 'state') {
        next.city = ''
        next.locality = ''
      }
      if (key === 'city') next.locality = ''
      return next
    })
  }

  const cities = citiesFrom(locations, filters.state)
  const localities = localitiesFrom(locations, filters.state, filters.city)

  const toOpts = (arr) => arr.map((v) => ({ value: v, label: v }))

  return (
    <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-primary" />
          <h3 className="font-display text-base font-semibold">Filters</h3>
        </div>
        <button
          onClick={onReset}
          className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground transition-colors hover:text-primary"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset
        </button>
      </div>

      <div className="space-y-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by keyword..."
            value={filters.keyword}
            onChange={(e) => update('keyword', e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="h-px bg-border" />

        <FilterSelect
          label="State"
          placeholder="All States"
          value={filters.state}
          onChange={(v) => update('state', v)}
          options={toOpts(states)}
        />
        <FilterSelect
          label="City"
          placeholder="All Cities"
          value={filters.city}
          onChange={(v) => update('city', v)}
          options={toOpts(cities)}
          disabled={!filters.state}
        />
        <FilterSelect
          label="Locality"
          placeholder="All Localities"
          value={filters.locality}
          onChange={(v) => update('locality', v)}
          options={toOpts(localities)}
          disabled={!filters.city}
        />

        <div className="h-px bg-border" />

        <FilterSelect
          label="Property Type"
          placeholder="Any Type"
          value={filters.type}
          onChange={(v) => update('type', v)}
          options={toOpts(propertyTypes)}
        />
        <FilterSelect
          label="Budget"
          placeholder="Any Budget"
          value={filters.budget}
          onChange={(v) => update('budget', v)}
          options={budgetRanges.map((b, i) => ({ value: String(i), label: b.label }))}
        />
        <FilterSelect
          label="Bank"
          placeholder="All Banks"
          value={filters.bank}
          onChange={(v) => update('bank', v)}
          options={toOpts(banks)}
        />
        <FilterSelect
          label="Auction Status"
          placeholder="Any Status"
          value={filters.status}
          onChange={(v) => update('status', v)}
          options={toOpts(statuses)}
        />
      </div>
    </div>
  )
}
