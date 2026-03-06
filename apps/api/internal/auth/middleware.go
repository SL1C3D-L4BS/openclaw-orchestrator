package auth

import (
	"strings"

	"github.com/gofiber/fiber/v2"
)

// RequireRole returns a Fiber handler that validates JWT and ensures the user has one of the allowed roles.
// jwtSecret is the key used to sign tokens (from config). Expects Authorization: Bearer <token>.
// Returns 401 if missing or invalid, 403 if role not allowed.
func RequireRole(jwtSecret string, allowedRoles ...string) fiber.Handler {
	allowed := make(map[string]bool)
	for _, r := range allowedRoles {
		allowed[r] = true
	}
	return func(c *fiber.Ctx) error {
		auth := c.Get("Authorization")
		if auth == "" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "missing Authorization header"})
		}
		const prefix = "Bearer "
		if !strings.HasPrefix(auth, prefix) {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "invalid Authorization format"})
		}
		tokenString := strings.TrimSpace(auth[len(prefix):])
		if tokenString == "" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "missing token"})
		}
		claims, err := ParseAndValidate(tokenString, jwtSecret)
		if err != nil {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "invalid or expired token"})
		}
		if !allowed[claims.Role] {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "insufficient permissions"})
		}
		c.Locals("claims", claims)
		return c.Next()
	}
}
