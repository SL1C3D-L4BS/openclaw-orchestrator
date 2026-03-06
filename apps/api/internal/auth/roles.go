package auth

// Role constants for RBAC.
const (
	RoleClinicalDirector = "CLINICAL_DIRECTOR" // publish/version workflows
	RoleResponder        = "RESPONDER"         // list and run workflows
)

// Test users for development. In production, replace with real identity provider.
const (
	TestDirector  = "test_director"
	TestResponder = "test_responder"
)
