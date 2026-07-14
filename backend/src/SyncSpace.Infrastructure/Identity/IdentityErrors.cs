namespace SyncSpace.Infrastructure.Identity;

public static class IdentityErrors
{
    public static readonly Dictionary<string, string> Errors = new()
    {
        ["DuplicateUserName"] = "Username is already taken.",
        ["DuplicateEmail"] = "An account with this email already exists.",
        ["PasswordTooShort"] = "Password must be at least 8 characters long.",
        ["PasswordRequiresDigit"] = "Password must contain at least one digit.",
        ["PasswordRequiresLower"] = "Password must contain at least one lowercase letter.",
        ["PasswordRequiresUpper"] = "Password must contain at least one uppercase letter.",
        ["PasswordRequiresNonAlphanumeric"] = "Password must contain at least one special character.",
        ["LockoutEnabled"] = "Account has been locked due to too many failed login attempts.",
        ["InvalidLogin"] = "Invalid email or password.",
        ["EmailNotConfirmed"] = "Please verify your email address.",
        ["UserLockedOut"] = "Account is locked. Please try again later.",
        ["InvalidToken"] = "Invalid or expired token.",
        ["TokenAlreadyRevoked"] = "Refresh token has already been revoked."
    };

    public static string GetError(string key) =>
        Errors.TryGetValue(key, out var error) ? error : "An unexpected error occurred.";
}
