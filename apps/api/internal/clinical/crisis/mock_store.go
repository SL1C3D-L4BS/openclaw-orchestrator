package crisis

import (
	"context"
	"sync"
)

// MockStore is an in-memory Store for development and testing.
type MockStore struct {
	mu   sync.RWMutex
	rows []CrisisWorkflow
}

// NewMockStore returns an empty in-memory store.
func NewMockStore() *MockStore {
	return &MockStore{rows: make([]CrisisWorkflow, 0)}
}

func (m *MockStore) ListActive(ctx context.Context) ([]CrisisWorkflow, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	var out []CrisisWorkflow
	for i := range m.rows {
		if m.rows[i].Status == StatusActive {
			out = append(out, m.rows[i])
		}
	}
	return out, nil
}

func (m *MockStore) Create(ctx context.Context, w CrisisWorkflow) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.rows = append(m.rows, w)
	return nil
}

func (m *MockStore) GetActive(ctx context.Context, workflowID string) (*CrisisWorkflow, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	var best *CrisisWorkflow
	for i := range m.rows {
		if m.rows[i].ID == workflowID && m.rows[i].Status == StatusActive {
			if best == nil || m.rows[i].Version > best.Version {
				w := m.rows[i]
				best = &w
			}
		}
	}
	return best, nil
}

func (m *MockStore) ArchiveActive(ctx context.Context, workflowID string) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	for i := range m.rows {
		if m.rows[i].ID == workflowID && m.rows[i].Status == StatusActive {
			m.rows[i].Status = StatusArchived
		}
	}
	return nil
}

func (m *MockStore) GetByIDAndVersion(ctx context.Context, workflowID string, version int) (*CrisisWorkflow, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	for i := range m.rows {
		if m.rows[i].ID == workflowID && m.rows[i].Version == version {
			w := m.rows[i]
			return &w, nil
		}
	}
	return nil, nil
}
