using SyncSpace.Domain.Common;
using SyncSpace.Domain.Enums;

namespace SyncSpace.Domain.Entities;

public class RiskAssessment : BaseEntity
{
    public Guid ProjectGroupId { get; set; }
    public RiskLevel RiskLevel { get; set; }
    public int OverallScore { get; set; }
    public int InactiveMembersScore { get; set; }
    public int DelayedMilestonesScore { get; set; }
    public int LowContributionScore { get; set; }
    public int CommunicationScore { get; set; }
    public int TaskBottleneckScore { get; set; }
    public DateTime AssessedAt { get; set; } = DateTime.UtcNow;

    public ProjectGroup ProjectGroup { get; set; } = null!;
    public ICollection<RiskAlert> Alerts { get; set; } = new List<RiskAlert>();
}

public class RiskAlert : BaseEntity
{
    public Guid AssessmentId { get; set; }
    public Guid ProjectGroupId { get; set; }
    public RiskFactor Factor { get; set; }
    public RiskLevel Severity { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string? Recommendation { get; set; }
    public bool IsAcknowledged { get; set; }
    public DateTime? AcknowledgedAt { get; set; }
    public Guid? AcknowledgedById { get; set; }

    public RiskAssessment Assessment { get; set; } = null!;
    public ProjectGroup ProjectGroup { get; set; } = null!;
}
