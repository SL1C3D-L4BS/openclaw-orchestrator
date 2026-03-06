package auth

import (
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// Claims holds subject and role for authorization.
type Claims struct {
	jwt.RegisteredClaims
	Role string `json:"role"`
}

// NewToken issues a JWT for the given subject and role. Expires in 24h.
// jwtSecret is the signing key (from config); must be non-empty in production.
func NewToken(subject, role string, jwtSecret string) (string, error) {
	secretBytes := []byte(jwtSecret)
	now := time.Now()
	claims := Claims{
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   subject,
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(24 * time.Hour)),
			Issuer:    "openclaw-orchestrator",
		},
		Role: role,
	}
	t := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return t.SignedString(secretBytes)
}

// ParseAndValidate parses the token string and validates signature and expiry.
// jwtSecret must match the key used to sign the token. Returns claims and nil, or nil and error.
func ParseAndValidate(tokenString string, jwtSecret string) (*Claims, error) {
	secretBytes := []byte(jwtSecret)
	t, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(t *jwt.Token) (interface{}, error) {
		return secretBytes, nil
	})
	if err != nil {
		return nil, err
	}
	claims, ok := t.Claims.(*Claims)
	if !ok || !t.Valid {
		return nil, errors.New("invalid token")
	}
	return claims, nil
}
