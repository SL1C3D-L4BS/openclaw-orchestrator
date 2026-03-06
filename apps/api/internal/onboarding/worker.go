package onboarding

import (
	"context"
	"log"
	"time"
)

// Worker processes onboarding jobs: simulates progress, then generates script and marks completed.
type Worker struct {
	jobStore JobStore
	jobChan  chan string
}

// NewWorker creates a worker that reads job IDs from the channel and processes them.
func NewWorker(jobStore JobStore) *Worker {
	return &Worker{jobStore: jobStore, jobChan: make(chan string, 32)}
}

// Enqueue sends a job ID to the worker (non-blocking if channel full).
func (w *Worker) Enqueue(jobID string) {
	select {
	case w.jobChan <- jobID:
	default:
		log.Printf("[onboarding] worker queue full, dropped job %s", jobID)
	}
}

// Run starts the worker loop. Call once in a goroutine.
func (w *Worker) Run(ctx context.Context) {
	for {
		select {
		case <-ctx.Done():
			return
		case jobID := <-w.jobChan:
			w.processJob(ctx, jobID)
		}
	}
}

func (w *Worker) processJob(ctx context.Context, jobID string) {
	job := w.jobStore.Get(jobID)
	if job == nil {
		return
	}
	// Only process if Pending
	if job.Status != StatusPending {
		return
	}

	w.updateJob(jobID, StatusProcessing, 0, job.ScriptContent)

	// Simulate progress every few seconds
	for p := 10; p <= 90; p += 20 {
		select {
		case <-ctx.Done():
			return
		default:
			time.Sleep(400 * time.Millisecond)
			w.updateJob(jobID, StatusProcessing, p, job.ScriptContent)
		}
	}

	// Generate script from workflow JSON — we need workflow JSON from the job
	// The job only has WorkflowID; we need to get workflow from crisis store.
	// So the job must carry the workflow JSON when we create it, or we need to pass crisis store to worker.
	// Simplest: when creating the job, we store the workflow JSON in the job (add field WorkflowJSON []byte).
	// Then worker can generate without touching crisis store.
	job = w.jobStore.Get(jobID)
	if job == nil {
		return
	}
	script, err := GenerateTutorialScript(job.WorkflowJSON)
	if err != nil {
		w.updateJob(jobID, StatusFailed, job.Progress, "")
		log.Printf("[onboarding] generate script failed for job %s: %v", jobID, err)
		return
	}
	w.updateJob(jobID, StatusCompleted, 100, script)
}

func (w *Worker) updateJob(id, status string, progress int, script string) {
	job := w.jobStore.Get(id)
	if job == nil {
		return
	}
	job.Status = status
	job.Progress = progress
	if script != "" {
		job.ScriptContent = script
	}
	w.jobStore.Put(job)
}
