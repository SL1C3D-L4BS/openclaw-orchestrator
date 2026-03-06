package onboarding

import (
	"database/sql"
	"sync"
	"time"

	_ "modernc.org/sqlite"
)

const createOnboardingTableSQL = `
CREATE TABLE IF NOT EXISTS onboarding_jobs (
	id TEXT PRIMARY KEY,
	workflow_id TEXT NOT NULL,
	status TEXT NOT NULL,
	progress INTEGER NOT NULL,
	script_content TEXT NOT NULL,
	workflow_json BLOB,
	created_at TEXT NOT NULL
);
`

// SQLiteStore is a durable, file-based job store using CGO-free SQLite.
type SQLiteStore struct {
	db *sql.DB
	mu sync.Mutex
}

// NewSQLiteStore opens or creates the database at dbPath and initializes the onboarding_jobs table.
func NewSQLiteStore(dbPath string) (*SQLiteStore, error) {
	db, err := sql.Open("sqlite", dbPath)
	if err != nil {
		return nil, err
	}
	if _, err := db.Exec(createOnboardingTableSQL); err != nil {
		db.Close()
		return nil, err
	}
	return &SQLiteStore{db: db}, nil
}

// Close closes the database connection.
func (s *SQLiteStore) Close() error {
	return s.db.Close()
}

// Put inserts or replaces an onboarding job.
func (s *SQLiteStore) Put(job *OnboardingJob) {
	if job == nil {
		return
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	createdAt := time.Now().UTC().Format(time.RFC3339)
	_, err := s.db.Exec(
		`INSERT INTO onboarding_jobs (id, workflow_id, status, progress, script_content, workflow_json, created_at)
		 VALUES (?, ?, ?, ?, ?, ?, ?)
		 ON CONFLICT(id) DO UPDATE SET
			workflow_id = excluded.workflow_id,
			status = excluded.status,
			progress = excluded.progress,
			script_content = excluded.script_content,
			workflow_json = excluded.workflow_json`,
		job.ID, job.WorkflowID, job.Status, job.Progress, job.ScriptContent, job.WorkflowJSON, createdAt,
	)
	if err != nil {
		// Best-effort: no way to surface to caller without changing interface
		return
	}
}

// Get returns a copy of the job by ID, or nil if not found.
func (s *SQLiteStore) Get(id string) *OnboardingJob {
	s.mu.Lock()
	defer s.mu.Unlock()
	row := s.db.QueryRow(
		`SELECT id, workflow_id, status, progress, script_content, workflow_json FROM onboarding_jobs WHERE id = ?`,
		id,
	)
	var job OnboardingJob
	var workflowJSON []byte
	err := row.Scan(&job.ID, &job.WorkflowID, &job.Status, &job.Progress, &job.ScriptContent, &workflowJSON)
	if err == sql.ErrNoRows {
		return nil
	}
	if err != nil {
		return nil
	}
	job.WorkflowJSON = workflowJSON
	return &job
}

// Ensure SQLiteStore implements JobStore at compile time.
var _ JobStore = (*SQLiteStore)(nil)
