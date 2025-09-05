// Analytics utility - no-op stubs for now
// Can be easily extended to integrate with analytics providers

export function track(event: string, props?: Record<string, any>) {
  if (import.meta.env.DEV) {
    console.log('[Analytics]', event, props)
  }
  
  // TODO: Integrate with analytics provider
  // e.g. analytics.track(event, props)
}

// Specific event helpers
export const analytics = {
  // Affiliates events
  affApplySubmitted: () => track('aff_apply_submitted'),
  affLinkCopied: () => track('aff_link_copied'),
  
  // Tutors events
  tutorFilterChanged: (filters: Record<string, any>) => track('tutor_filter_changed', filters),
  tutorBookClicked: (tutorId: string) => track('tutor_book_clicked', { tutorId }),
  tutorScheduleClicked: (tutorId: string) => track('tutor_schedule_clicked', { tutorId }),
  tutorLoadMoreClicked: () => track('tutor_load_more_clicked'),
  
  // Resources events
  resourceFilterChanged: (category: string, search: string) => track('resource_filter_changed', { category, search }),
  resourceOpened: (resourceId: string | number, title: string) => track('resource_opened', { resourceId, title })
}
