module {

  public type Role = {
    #admin;
    #student;
  };

  public type User = {
    name : Text;
    email : ?Text;
    completedCourses : [Text];
    role : Role;
  };

  public type Certificate = {
    id : Nat;
    courseName : Text;
    dateIssued : Text;
    owner : Principal;
  };

  // === LEARNING MODULE TYPES ===

  public type Difficulty = {
    #Beginner;
    #Intermediate;
    #Advanced;
  };

  public type CourseInfo = {
    id: Nat;
    title: Text;
    duration: Text;
    instructor: Text;
    thumbnail: Text;
    difficulty: Difficulty;
    rating: Float;
    category: Text;
    students: Nat;
    totalLessons: Nat;
  };

  // Extended Types for Content
  public type LessonType = {
    #Video;
    #Reading;
    #Interactive;
    #CodeLab;
    #Assignment;
  };

  public type LessonContent = {
    summary: Text;
    keyPoints: [Text];
    detailedContent: Text;
    codeExamples: ?Text;
  };

  public type Lesson = {
    id: Nat;
    title: Text;
    content: LessonContent;
    videoUrl: ?Text;
    duration: Text;
    lessonType: LessonType;
    resources: [Text];
    isCompleted: Bool;
  };

  public type QuizQuestion = {
    id: Nat;
    question: Text;
    options: [Text];
    correctAnswerIndex: Nat;
    explanation: Text;
    difficulty: Difficulty;
    timeLimit: ?Nat; // in seconds
  };

  public type Module = {
    id: Nat;
    title: Text;
    description: Text;
    estimatedTime: Text;
    prerequisites: [Text];
    isLocked: Bool;
    lessons: [Lesson];
    quiz: [QuizQuestion];
  };

  public type CourseContent = {
    courseId: Nat;
    modules: [Module];
  };

  public type UserProgress = {
    userId: Principal;
    courseId: Nat;
    completedLessons: [Nat];
    completedModules: [Nat];
    quizScores: [(Nat, Float)]; // (quizId, score percentage)
    lastAccessed: Int; // timestamp
    overallProgress: Float; // 0.0 to 1.0
  };

  public type PersistData = {
    users: [(Principal, User)];
    certificates: [(Nat32, [Certificate])];
    nextCertId: Nat;
  };

}