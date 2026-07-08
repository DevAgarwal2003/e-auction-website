'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Globe, Building2, MapPin, Home, IndianRupee } from 'lucide-react'
import { Button } from '@/components/ui/button'
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

function Field({ icon: Icon, label, value, placeholder, onChange, options, disabled }) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </label>
      <Select value={value || ALL} onValueChange={(v) => onChange(v === ALL ? '' : v)} disabled={disabled}>
        <SelectTrigger className="bg-white">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>{placeholder}</SelectItem>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

export default function SearchBar() {
  const router = useRouter()
  const { locations, states, propertyTypes } = useFilterMeta()
  const [state, setState] = useState('')
  const [city, setCity] = useState('')
  const [locality, setLocality] = useState('')
  const [type, setType] = useState('')
  const [budget, setBudget] = useState('')

  const cities = citiesFrom(locations, state)
  const localities = localitiesFrom(locations, state, city)
  const toOpts = (arr) => arr.map((v) => ({ value: v, label: v }))

  const handleSearch = () => {
    const params = new URLSearchParams()
    if (state) params.set('state', state)
    if (city) params.set('city', city)
    if (locality) params.set('locality', locality)
    if (type) params.set('type', type)
    if (budget !== '') params.set('budget', budget)
    router.push(`/auctions?${params.toString()}`)
  }

  return (
    <div className="glass rounded-2xl border border-white/60 p-4 shadow-glow md:p-5">
      <div className="mb-3 flex items-center gap-2 px-0.5">
        <Search className="h-5 w-5 text-primary" />
        <span className="font-display text-base font-semibold text-primary">Find Your Property</span>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Field
          icon={Globe}
          label="State"
          placeholder="All States"
          value={state}
          onChange={(v) => {
            setState(v)
            setCity('')
            setLocality('')
          }}
          options={toOpts(states)}
        />
        <Field
          icon={Building2}
          label="City"
          placeholder="All Cities"
          value={city}
          onChange={(v) => {
            setCity(v)
            setLocality('')
          }}
          options={toOpts(cities)}
          disabled={!state}
        />
        <Field
          icon={MapPin}
          label="Locality"
          placeholder="All Localities"
          value={locality}
          onChange={setLocality}
          options={toOpts(localities)}
          disabled={!city}
        />
        <Field
          icon={Home}
          label="Property Type"
          placeholder="Any Type"
          value={type}
          onChange={setType}
          options={toOpts(propertyTypes)}
        />
        <Field
          icon={IndianRupee}
          label="Budget"
          placeholder="Any Budget"
          value={budget}
          onChange={setBudget}
          options={budgetRanges.map((b, i) => ({ value: String(i), label: b.label }))}
        />
      </div>
      <Button variant="secondary" size="lg" className="mt-4 w-full" onClick={handleSearch}>
        <Search className="h-4 w-4" />
        Search Properties
      </Button>
    </div>
  )
}
