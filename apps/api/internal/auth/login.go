package auth

import (
	"github.com/gofiber/fiber/v2"
)

// LoginRequest body for POST /api/v1/auth/login.
type LoginRequest struct {
	Username string `json:"username"`
}

// LoginResponse body returned on success.
type LoginResponse struct {
	Token string `json:"token"`
	Role  string `json:"role"`
}

// LoginHandler returns a Fiber handler that issues a JWT for test_director and test_responder.
// jwtSecret is the signing key (from config). Temporary for verification; replace with real IdP in production.
func LoginHandler(jwtSecret string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		var req LoginRequest
		if err := c.BodyParser(&req); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid JSON body"})
		}
		var role string
		switch req.Username {
		case TestDirector:
			role = RoleClinicalDirector
		case TestResponder:
			role = RoleResponder
		default:
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "unknown user; use test_director or test_responder",
			})
		}
		token, err := NewToken(req.Username, role, jwtSecret)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to issue token"})
		}
		return c.JSON(LoginResponse{Token: token, Role: role})
	}
}
