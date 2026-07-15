namespace SyncSpace.Domain.Enums;

public enum UserStatus
{
    Active = 0,
    Inactive = 1,
    Suspended = 2
}

public enum WorkspaceRole
{
    Owner = 0,
    Admin = 1,
    Editor = 2,
    Viewer = 3
}

public enum NotificationType
{
    Mention = 0,
    Assignment = 1,
    Comment = 2,
    Update = 3,
    Invite = 4
}

public enum CardPriority
{
    None = 0,
    Low = 1,
    Medium = 2,
    High = 3,
    Urgent = 4
}

public enum ActivityType
{
    Created = 0,
    Updated = 1,
    Deleted = 2,
    Moved = 3,
    Assigned = 4,
    Unassigned = 5,
    LabelAdded = 6,
    LabelRemoved = 7,
    CommentAdded = 8,
    PriorityChanged = 9,
    DueDateChanged = 10,
    AttachmentAdded = 11,
    AttachmentRemoved = 12
}

public enum MessageType
{
    Text = 0,
    File = 1,
    System = 2
}

public enum ChannelMemberRole
{
    Member = 0,
    Admin = 1
}

public enum AuditAction
{
    UserLogin = 0,
    UserLogout = 1,
    UserRegister = 2,
    TaskCreated = 3,
    TaskUpdated = 4,
    TaskDeleted = 5,
    TaskMoved = 6,
    DocumentCreated = 7,
    DocumentEdited = 8,
    DocumentDeleted = 9,
    RoleChanged = 10,
    MemberInvited = 11,
    MemberRemoved = 12,
    FileUploaded = 13,
    FileDeleted = 14,
    FileMoved = 15,
    CommentAdded = 16,
    WorkspaceCreated = 17,
    WorkspaceUpdated = 18,
    CourseCreated = 19,
    MilestoneCompleted = 20
}

public enum AcademicRole
{
    Student = 0,
    Instructor = 1
}
