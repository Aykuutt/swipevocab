-- SwipeVocab SQL Server schema.
-- Run this script in the SwipeVocab database. It is safe to run more than once.

IF OBJECT_ID(N'dbo.UserProfiles', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.UserProfiles (
    UserId uniqueidentifier NOT NULL
      CONSTRAINT PK_UserProfiles PRIMARY KEY,
    DisplayName nvarchar(80) NOT NULL
      CONSTRAINT DF_UserProfiles_DisplayName DEFAULT N'Sen',
    LearningGoal nvarchar(40) NOT NULL
      CONSTRAINT DF_UserProfiles_LearningGoal DEFAULT N'general',
    PlacementLevel nvarchar(5) NOT NULL
      CONSTRAINT DF_UserProfiles_PlacementLevel DEFAULT N'A1',
    CreatedAtUtc datetime2(3) NOT NULL
      CONSTRAINT DF_UserProfiles_CreatedAtUtc DEFAULT SYSUTCDATETIME(),
    UpdatedAtUtc datetime2(3) NOT NULL
      CONSTRAINT DF_UserProfiles_UpdatedAtUtc DEFAULT SYSUTCDATETIME()
  );
END;

IF OBJECT_ID(N'dbo.UserProgress', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.UserProgress (
    UserId uniqueidentifier NOT NULL
      CONSTRAINT PK_UserProgress PRIMARY KEY
      CONSTRAINT FK_UserProgress_UserProfiles
      FOREIGN KEY REFERENCES dbo.UserProfiles(UserId) ON DELETE CASCADE,
    ProgressJson nvarchar(max) NOT NULL
      CONSTRAINT CK_UserProgress_ProgressJson CHECK (ISJSON(ProgressJson) = 1),
    UpdatedAtUtc datetime2(3) NOT NULL
      CONSTRAINT DF_UserProgress_UpdatedAtUtc DEFAULT SYSUTCDATETIME()
  );
END;
