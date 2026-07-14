using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using SyncSpace.Application.Common.Interfaces;
using SyncSpace.Domain.Entities;
using SyncSpace.Infrastructure.Identity;
using SyncSpace.Persistence.Context;

namespace SyncSpace.Infrastructure.Identity;

public class IdentityService : IIdentityService
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly RoleManager<IdentityRole<Guid>> _roleManager;
    private readonly SyncSpaceDbContext _context;

    public IdentityService(
        UserManager<ApplicationUser> userManager,
        RoleManager<IdentityRole<Guid>> roleManager,
        SyncSpaceDbContext context)
    {
        _userManager = userManager;
        _roleManager = roleManager;
        _context = context;
    }

    public async Task<(bool Success, string[] Errors)> CreateUserAsync(
        Guid userId, string email, string password, string firstName, string lastName)
    {
        var identityUser = new ApplicationUser
        {
            Id = userId,
            UserName = email,
            Email = email,
            FirstName = firstName,
            LastName = lastName,
            EmailConfirmed = true,
            CreatedAt = DateTime.UtcNow
        };

        var result = await _userManager.CreateAsync(identityUser, password);
        if (!result.Succeeded)
        {
            var errors = result.Errors.Select(e => IdentityErrors.GetError(e.Code)).ToArray();
            return (false, errors);
        }

        // Create domain user
        var domainUser = new User
        {
            Id = userId,
            IdentityId = userId.ToString(),
            Email = email,
            FirstName = firstName,
            LastName = lastName,
            Status = Domain.Enums.UserStatus.Active
        };

        _context.Users.Add(domainUser);
        await _context.SaveChangesAsync();

        return (true, []);
    }

    public async Task<(bool Success, string[] Errors)> CreateUserWithoutPasswordAsync(
        Guid userId, string email, string firstName, string lastName, string? avatarUrl)
    {
        var identityUser = new ApplicationUser
        {
            Id = userId,
            UserName = email,
            Email = email,
            FirstName = firstName,
            LastName = lastName,
            AvatarUrl = avatarUrl,
            EmailConfirmed = true,
            CreatedAt = DateTime.UtcNow
        };

        var result = await _userManager.CreateAsync(identityUser);
        if (!result.Succeeded)
        {
            var errors = result.Errors.Select(e => IdentityErrors.GetError(e.Code)).ToArray();
            return (false, errors);
        }

        var domainUser = new User
        {
            Id = userId,
            IdentityId = userId.ToString(),
            Email = email,
            FirstName = firstName,
            LastName = lastName,
            AvatarUrl = avatarUrl,
            Status = Domain.Enums.UserStatus.Active
        };

        _context.Users.Add(domainUser);
        await _context.SaveChangesAsync();

        return (true, []);
    }

    public async Task<(bool Success, string[] Errors)> AddToRoleAsync(Guid userId, string role)
    {
        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user == null) return (false, ["User not found."]);

        if (!await _roleManager.RoleExistsAsync(role))
            await _roleManager.CreateAsync(new IdentityRole<Guid>(role));

        var result = await _userManager.AddToRoleAsync(user, role);
        return result.Succeeded ? (true, []) : (false, result.Errors.Select(e => e.Description).ToArray());
    }

    public async Task<(bool Success, string Error)> CheckPasswordAsync(string email, string password)
    {
        var user = await _userManager.FindByEmailAsync(email);
        if (user == null) return (false, "Invalid email or password.");

        var valid = await _userManager.CheckPasswordAsync(user, password);
        return valid ? (true, "") : (false, "Invalid email or password.");
    }

    public async Task<IList<string>> GetRolesAsync(Guid userId)
    {
        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user == null) return [];
        return await _userManager.GetRolesAsync(user);
    }

    public async Task<UserInfo?> GetUserInfoAsync(Guid userId)
    {
        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user == null) return null;
        return new UserInfo
        {
            Id = user.Id,
            Email = user.Email!,
            FirstName = user.FirstName,
            LastName = user.LastName,
            AvatarUrl = user.AvatarUrl
        };
    }

    public async Task<UserInfo?> GetUserInfoByEmailAsync(string email)
    {
        var user = await _userManager.FindByEmailAsync(email);
        if (user == null) return null;
        return new UserInfo
        {
            Id = user.Id,
            Email = user.Email!,
            FirstName = user.FirstName,
            LastName = user.LastName,
            AvatarUrl = user.AvatarUrl
        };
    }

    public async Task<DateTime?> GetLockoutEndAsync(Guid userId)
    {
        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user?.LockoutEnd == null) return null;
        return user.LockoutEnd.Value.UtcDateTime;
    }

    public async Task<int> GetFailedLoginAttemptsAsync(Guid userId)
    {
        var user = await _userManager.FindByIdAsync(userId.ToString());
        return user?.FailedLoginAttempts ?? 0;
    }

    public async Task<bool> IsUserActiveAsync(Guid userId)
    {
        var user = await _userManager.FindByIdAsync(userId.ToString());
        return user?.IsActive ?? false;
    }

    public async Task<bool> LockoutUserAsync(Guid userId, TimeSpan duration)
    {
        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user == null) return false;
        var result = await _userManager.SetLockoutEndDateAsync(user, new DateTimeOffset(DateTime.UtcNow + duration));
        return result.Succeeded;
    }

    public async Task<bool> ResetFailedAttemptsAsync(Guid userId)
    {
        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user == null) return false;
        user.FailedLoginAttempts = 0;
        user.LockoutEnd = null;
        var result = await _userManager.UpdateAsync(user);
        return result.Succeeded;
    }

    public async Task<bool> IncrementFailedAttemptsAsync(Guid userId)
    {
        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user == null) return false;
        user.FailedLoginAttempts++;
        var result = await _userManager.UpdateAsync(user);
        return result.Succeeded;
    }

    public async Task<bool> SetLastLoginAsync(Guid userId)
    {
        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user == null) return false;
        user.LastLoginAt = DateTime.UtcNow;
        var result = await _userManager.UpdateAsync(user);
        return result.Succeeded;
    }

    public async Task<bool> DeactivateUserAsync(Guid userId)
    {
        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user == null) return false;
        user.IsActive = false;
        var result = await _userManager.UpdateAsync(user);
        return result.Succeeded;
    }
}
