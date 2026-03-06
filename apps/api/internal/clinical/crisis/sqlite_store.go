package crisis

import (
	"context"
	"database/sql"
	"encoding/json"
	"time"

	_ "modernc.org/sqlite"
)

const createTableSQL = `
CREATE TABLE IF NOT EXISTS crisis_workflows (
	id TEXT NOT NULL,
	version INTEGER NOT NULL,
	workflow_json TEXT NOT NULL,
	status TEXT NOT NULL,
	created_at TEXT NOT NULL,
	PRIMARY KEY (id, version)
);
`

// SQLiteStore is a durable, file-based Store using CGO-free SQLite (modernc.org/sqlite).
type SQLiteStore struct {
	db *sql.DB
}

// NewSQLiteStore opens or creates the database at dbPath and initializes the crisis_workflows table.
func NewSQLiteStore(dbPath string) (*SQLiteStore, error) {
	db, err := sql.Open("sqlite", dbPath)
	if err != nil {
		return nil, err
	}
	if _, err := db.Exec(createTableSQL); err != nil {
		db.Close()
		return nil, err
	}
	return &SQLiteStore{db: db}, nil
}

// Close closes the database connection. Call when shutting down the application.
func (s *SQLiteStore) Close() error {
	return s.db.Close()
}

func (s *SQLiteStore) ListActive(ctx context.Context) ([]CrisisWorkflow, error) {
	rows, err := s.db.QueryContext(ctx,
		`SELECT id, version, workflow_json, status, created_at FROM crisis_workflows WHERE status = ? ORDER BY id, version`,
		StatusActive,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []CrisisWorkflow
	for rows.Next() {
		var w CrisisWorkflow
		var workflowJSON string
		var createdAt string
		if err := rows.Scan(&w.ID, &w.Version, &workflowJSON, &w.Status, &createdAt); err != nil {
			return nil, err
		}
		w.WorkflowJSON = json.RawMessage(workflowJSON)
		w.CreatedAt, _ = time.Parse(time.RFC3339, createdAt)
		out = append(out, w)
	}
	return out, rows.Err()
}

func (s *SQLiteStore) Create(ctx context.Context, w CrisisWorkflow) error {
	_, err := s.db.ExecContext(ctx,
		`INSERT INTO crisis_workflows (id, version, workflow_json, status, created_at) VALUES (?, ?, ?, ?, ?)`,
		w.ID, w.Version, string(w.WorkflowJSON), w.Status, w.CreatedAt.UTC().Format(time.RFC3339),
	)
	return err
}

func (s *SQLiteStore) GetActive(ctx context.Context, workflowID string) (*CrisisWorkflow, error) {
	row := s.db.QueryRowContext(ctx,
		`SELECT id, version, workflow_json, status, created_at FROM crisis_workflows WHERE id = ? AND status = ? ORDER BY version DESC LIMIT 1`,
		workflowID, StatusActive,
	)
	var w CrisisWorkflow
	var workflowJSON string
	var createdAt string
	err := row.Scan(&w.ID, &w.Version, &workflowJSON, &w.Status, &createdAt)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	w.WorkflowJSON = json.RawMessage(workflowJSON)
	w.CreatedAt, _ = time.Parse(time.RFC3339, createdAt)
	return &w, nil
}

func (s *SQLiteStore) ArchiveActive(ctx context.Context, workflowID string) error {
	_, err := s.db.ExecContext(ctx,
		`UPDATE crisis_workflows SET status = ? WHERE id = ? AND status = ?`,
		StatusArchived, workflowID, StatusActive,
	)
	return err
}

func (s *SQLiteStore) GetByIDAndVersion(ctx context.Context, workflowID string, version int) (*CrisisWorkflow, error) {
	row := s.db.QueryRowContext(ctx,
		`SELECT id, version, workflow_json, status, created_at FROM crisis_workflows WHERE id = ? AND version = ?`,
		workflowID, version,
	)
	var w CrisisWorkflow
	var workflowJSON string
	var createdAt string
	err := row.Scan(&w.ID, &w.Version, &workflowJSON, &w.Status, &createdAt)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	w.WorkflowJSON = json.RawMessage(workflowJSON)
	w.CreatedAt, _ = time.Parse(time.RFC3339, createdAt)
	return &w, nil
}

// Ensure SQLiteStore implements Store at compile time.
var _ Store = (*SQLiteStore)(nil)
