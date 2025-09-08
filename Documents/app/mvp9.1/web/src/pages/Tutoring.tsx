import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/Tabs'
import { poundsFromCents } from '../lib/money'
import { analytics } from '../lib/analytics'
import { Search, Filter, Calendar, ExternalLink, Lock, Users, BookOpen } from 'lucide-react'
import { resourcesData, type Resource } from '../data/resources'

const USE_MOCKS = false

interface Tutor {
  id: string
  display_name: string
  subjects: string[]
  hourly_rate_cents: number
  bio?: string
  calendly_url?: string
  stripe_payment_link_url?: string
}

const MOCK_TUTORS: Tutor[] = [
  {
    id: '1',
    display_name: 'Sarah Chen',
    subjects: ['Software Engineering', 'System Design', 'Leadership'],
    hourly_rate_cents: 7500,
    bio: 'Senior Software Engineer at Google with 8+ years experience. Specialized in technical interviews and system design.',
    calendly_url: 'https://calendly.com/sarah-chen',
    stripe_payment_link_url: 'https://buy.stripe.com/example1'
  },
  {
    id: '2',
    display_name: 'Michael Rodriguez',
    subjects: ['Product Management', 'Strategy', 'Case Studies'],
    hourly_rate_cents: 8000,
    bio: 'Former Meta PM, now helping candidates ace product interviews at top tech companies.',
    calendly_url: 'https://calendly.com/michael-rodriguez',
    stripe_payment_link_url: 'https://buy.stripe.com/example2'
  },
  {
    id: '3',
    display_name: 'Dr. Emma Thompson',
    subjects: ['Medical Interviews', 'NHS Applications', 'Clinical Knowledge'],
    hourly_rate_cents: 9000,
    bio: 'Consultant physician with extensive experience in medical school and residency admissions.',
    calendly_url: 'https://calendly.com/dr-emma-thompson',
    stripe_payment_link_url: 'https://buy.stripe.com/example3'
  }
]

function TutorCard({ tutor }: { tutor: Tutor }) {
  const displayedSubjects = tutor.subjects.slice(0, 3)
  const extraCount = tutor.subjects.length - 3

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-primary text-primary-on flex items-center justify-center font-semibold text-lg">
            {tutor.display_name.split(' ').map(n => n[0]).join('')}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-text-primary mb-2">{tutor.display_name}</h3>
            
            <div className="flex flex-wrap gap-1 mb-2">
              {displayedSubjects.map((subject, index) => (
                <Badge key={index} variant="secondary">
                  {subject}
                </Badge>
              ))}
              {extraCount > 0 && (
                <Badge variant="outline">+{extraCount}</Badge>
              )}
            </div>
            
            <div className="text-2xl font-bold text-primary mb-2">
              {poundsFromCents(tutor.hourly_rate_cents)}/hr
            </div>
            
            {tutor.bio && (
              <p className="text-sm text-text-secondary line-clamp-2 mb-4">
                {tutor.bio}
              </p>
            )}
            
            <div className="flex gap-2">
              {tutor.stripe_payment_link_url && (
                <Button 
                  size="sm" 
                  variant="yellow"
                  onClick={() => {
                    analytics.tutorBookClicked(tutor.id)
                    window.open(tutor.stripe_payment_link_url, '_blank')
                  }}
                >
                  Book
                </Button>
              )}
              {tutor.calendly_url && (
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => {
                    analytics.tutorScheduleClicked(tutor.id)
                    window.open(tutor.calendly_url, '_blank')
                  }}
                >
                  <Calendar size={16} className="mr-1" />
                  Schedule
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ResourceCard({ resource }: { resource: Resource }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-text-primary">{resource.title}</h3>
          {resource.is_premium && (
            <Lock size={16} className="text-text-secondary flex-shrink-0" />
          )}
        </div>
        
        <Badge variant="secondary" className="mb-2">
          {resource.category}
        </Badge>
        
        {resource.description && (
          <p className="text-sm text-text-secondary line-clamp-1 mb-4">
            {resource.description}
          </p>
        )}
        
        <Button 
          size="sm" 
          variant="secondary" 
          onClick={() => {
            analytics.resourceOpened(resource.id, resource.title)
            window.open(resource.url, '_blank')
          }}
          className="w-full"
        >
          <ExternalLink size={16} className="mr-1" />
          Open
        </Button>
      </CardContent>
    </Card>
  )
}

function TutorsTab() {
  const [tutors, setTutors] = useState<Tutor[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('')
  const [sortBy, setSortBy] = useState('price_asc')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  useEffect(() => {
    fetchTutors()
  }, [searchTerm, selectedSubject, sortBy, page])

  async function fetchTutors() {
    try {
      setLoading(page === 1)
      
      if (USE_MOCKS) {
        await new Promise(resolve => setTimeout(resolve, 800))
        let filteredTutors = [...MOCK_TUTORS]
        
        if (searchTerm) {
          filteredTutors = filteredTutors.filter(t => 
            t.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.subjects.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()))
          )
        }
        
        if (selectedSubject) {
          filteredTutors = filteredTutors.filter(t => 
            t.subjects.some(s => s.toLowerCase().includes(selectedSubject.toLowerCase()))
          )
        }
        
        if (sortBy === 'price_asc') {
          filteredTutors.sort((a, b) => a.hourly_rate_cents - b.hourly_rate_cents)
        } else if (sortBy === 'price_desc') {
          filteredTutors.sort((a, b) => b.hourly_rate_cents - a.hourly_rate_cents)
        }
        
        setTutors(page === 1 ? filteredTutors : [...tutors, ...filteredTutors])
        setHasMore(false) // No pagination in mocks
      } else {
        const API_BASE = import.meta.env.VITE_API_URL || ''
        const params = new URLSearchParams({
          search: searchTerm,
          subject: selectedSubject,
          sort: sortBy,
          page: page.toString(),
          pageSize: '12'
        })
        
        const response = await fetch(`${API_BASE}/api/tutors/public?${params}`, {
          credentials: 'include'
        })
        
        if (!response.ok) throw new Error('Failed to fetch tutors')
        
        const data = await response.json()
        setTutors(page === 1 ? data.items : [...tutors, ...data.items])
        setHasMore(data.items.length === 12)
      }
    } catch (err) {
      console.error('Error fetching tutors:', err)
    } finally {
      setLoading(false)
    }
  }

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedSubject('')
    setSortBy('price_asc')
    setPage(1)
  }

  const loadMore = () => {
    setPage(p => p + 1)
  }

  const allSubjects = Array.from(new Set(MOCK_TUTORS.flatMap(t => t.subjects)))

  return (
    <div className="space-y-6">
      {/* Banner */}
      <Card variant="orange">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold mb-1">Get 1-to-1 interview coaching</h3>
              <p className="text-sm text-text-secondary">From £75/hr</p>
            </div>
            <Button size="sm" onClick={() => document.getElementById('tutor-list')?.scrollIntoView({ behavior: 'smooth' })}>
              Book a session
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="flex-1">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary" />
                <Input 
                  placeholder="Search tutors or topics" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select 
                value={selectedSubject} 
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="px-3 py-2 rounded-lg border border-divider bg-card text-text-primary text-sm"
              >
                <option value="">All Subjects</option>
                {allSubjects.map(subject => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 rounded-lg border border-divider bg-card text-text-primary text-sm"
              >
                <option value="price_asc">Price: Low → High</option>
                <option value="price_desc">Price: High → Low</option>
              </select>
              {(searchTerm || selectedSubject) && (
                <Button size="sm" variant="ghost" onClick={clearFilters}>
                  Clear
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Become a tutor CTA */}
      <Card variant="lavender">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold mb-1">Know your stuff? Earn by tutoring.</h3>
              <p className="text-sm text-text-secondary">Share your expertise and help others succeed</p>
            </div>
            <Button size="sm" variant="secondary">
              <Users size={16} className="mr-1" />
              Become a Tutor
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tutors Grid */}
      <div id="tutor-list">
        {loading && page === 1 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-card rounded-lg p-6 animate-pulse">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-full bg-surface-alt"></div>
                  <div className="flex-1">
                    <div className="h-5 bg-surface-alt rounded mb-2"></div>
                    <div className="h-4 bg-surface-alt rounded mb-2 w-32"></div>
                    <div className="h-6 bg-surface-alt rounded mb-2 w-20"></div>
                    <div className="h-10 bg-surface-alt rounded w-32"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : tutors.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <h3 className="text-lg font-semibold mb-2">No tutors match your filters</h3>
              <p className="text-text-secondary mb-4">Try adjusting your search or clearing filters</p>
              <Button onClick={clearFilters}>Clear filters</Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {tutors.map((tutor) => (
                <TutorCard key={tutor.id} tutor={tutor} />
              ))}
            </div>
            
            {hasMore && (
              <div className="text-center mt-8">
                <Button onClick={loadMore} variant="secondary">
                  Load More
                </Button>
              </div>
            )}
          </>
        )}
      </div>

    </div>
  )
}

function ResourcesTab() {
  const [resources, setResources] = useState<Resource[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [filteredResources, setFilteredResources] = useState<Resource[]>([])

  useEffect(() => {
    // Load resources from data file
    setResources(resourcesData)
  }, [])

  useEffect(() => {
    let filtered = resources
    
    if (selectedCategory && selectedCategory !== 'All') {
      filtered = filtered.filter(r => r.category === selectedCategory)
    }
    
    if (searchTerm) {
      filtered = filtered.filter(r => 
        r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.description && r.description.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }
    
    setFilteredResources(filtered)
  }, [resources, searchTerm, selectedCategory])

  const categories = ['All', 'Guides', 'Past Questions', 'Templates', 'Videos', 'Tools']

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <p className="text-subtitle text-text-secondary">
          Short, high-impact resources to boost your interview prep.
        </p>
      </div>

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2 justify-center">
        {categories.map(category => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category === 'All' ? '' : category)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              (selectedCategory === category || (selectedCategory === '' && category === 'All'))
                ? 'bg-primary text-primary-on'
                : 'bg-surface-alt text-text-secondary hover:bg-surface hover:text-text-primary'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="max-w-md mx-auto">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary" />
          <Input 
            placeholder="Search titles" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Resources Grid */}
      {filteredResources.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <BookOpen size={48} className="mx-auto text-text-secondary mb-4" />
            <h3 className="text-lg font-semibold mb-2">No resources found</h3>
            <p className="text-text-secondary">Try another category or search term</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredResources.map((resource) => (
            <ResourceCard key={resource.id} resource={resource} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function Tutoring() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-display mb-2">Tutoring</h1>
        <p className="text-subtitle text-text-secondary">
          Connect with expert tutors and access curated resources
        </p>
      </div>

      <Tabs defaultValue="tutors" className="w-full">
        <div className="flex justify-center">
          <TabsList>
            <TabsTrigger value="tutors">Tutors</TabsTrigger>
            <TabsTrigger value="resources">Resources</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="tutors">
          <TutorsTab />
        </TabsContent>
        
        <TabsContent value="resources">
          <ResourcesTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
