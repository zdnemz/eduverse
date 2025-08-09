import Time "mo:base/Time";

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

  public type LearningModule = {
    id: Nat;
    courseId: Nat;
    title: Text;
    description: Text;
    content: Text; // HTML atau Markdown
    estimatedTime: Text;
    createdAt: Time.Time;
    updatedAt: Time.Time;
  };

  public type Quiz = {
    id: Nat;
    moduleId: Nat;
    title: Text;
    description: ?Text;
    passingScore: Nat;
    timeLimit: ?Nat; // detik
    createdAt: Time.Time;
  };

  public type UserProgress = {
    userId: Principal;
    courseId: Nat;
    progress: Nat;  // persen 0-100
    completedLessons: Nat;
    nextLesson: ?Text;
    quizPassed: Bool;
    lastUpdated: Time.Time;
  };

}