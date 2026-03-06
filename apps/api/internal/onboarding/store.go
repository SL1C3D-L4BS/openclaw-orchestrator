package onboarding

import "sync"

// JobStore abstracts persistence for onboarding jobs (in-memory or SQLite).
type JobStore interface {
	Put(job *OnboardingJob)
	Get(id string) *OnboardingJob
}

// Store is an in-memory JobStore for development and testing.
type Store struct {
	mu   sync.RWMutex
	jobs map[string]*OnboardingJob
}

func NewStore() *Store {
	return &Store{jobs: make(map[string]*OnboardingJob)}
}

func (s *Store) Put(job *OnboardingJob) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.jobs[job.ID] = job
}

func (s *Store) Get(id string) *OnboardingJob {
	s.mu.RLock()
	defer s.mu.RUnlock()
	j, ok := s.jobs[id]
	if !ok {
		return nil
	}
	copy := *j
	return &copy
}
