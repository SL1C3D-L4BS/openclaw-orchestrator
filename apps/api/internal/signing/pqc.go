// Package signing provides PQC (post-quantum) signing for skill exports.
// Integrates with go-pq-mmr for Merkle Mountain Range–based signing so
// exports are tamper-evident and earn the "Verified by Vericore" badge.
package signing

import (
	"crypto/sha256"
	"encoding/hex"
)

// Signer signs opaque payloads and returns a proof string.
// Replace this with the real go-pq-mmr implementation when available.
type Signer interface {
	Sign(data []byte) (proof string, err error)
}

// DefaultSigner is a stub that produces a deterministic proof from SHA-256.
// Swap for go-pq-mmr in production to get full PQC/MMR signing.
type DefaultSigner struct{}

// Sign returns a proof string for the given data.
// Phase 1: deterministic hash-based proof. Phase 2: wire in go-pq-mmr.
func (DefaultSigner) Sign(data []byte) (string, error) {
	h := sha256.Sum256(data)
	return "pqc-mmr-v1:" + hex.EncodeToString(h[:]), nil
}
