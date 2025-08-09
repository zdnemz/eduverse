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
  
  public type LearningModule = {
    id: Text;
    title: Text;
    description: Text;
    content: Text;  // HTML content untuk materi
    estimatedTime: Text;  // "15 min", "30 min", etc
    difficulty: Difficulty;
    category: Text;  // "Development", "Design", etc
    instructor: Text;
    thumbnail: ?Text;  // URL gambar
    createdAt: Time.Time;
    updatedAt: Time.Time;
  };

  public type Difficulty = {
    #beginner;
    #intermediate;
    #advanced;
  };

  // === QUIZ TYPES (Updated) ===
  
  public type Quiz = {
    id: Text;
    title: Text;
    description: ?Text;
    moduleId: Text;  // ganti dari learningId ke moduleId biar lebih jelas
    passingScore: Nat;  // minimal score untuk lulus (contoh: 70)
    timeLimit: ?Nat;  // waktu dalam detik (contoh: 300 = 5 menit)
    createdAt: Time.Time;
  };

  public type Question = {
    id: Text;
    quizId: Text;
    text: Text;
    qtype: Text;  // "multiple_choice", "true_false", etc
    points: Nat;
  };

  public type Option = {
    id: Text;
    questionId: Text;
    text: Text;
    isCorrect: Bool;
  };

  public type UserAnswer = {
    id: Text;
    userId: Principal;
    quizId: Text;
    questionId: Text;
    selectedOptionId: Text;
    answeredAt: Time.Time;
    isCorrect: Bool;
  };

  public type QuizResult = {
    id: Text;
    userId: Principal;
    quizId: Text;
    score: Nat;  // percentage (0-100)
    totalQuestions: Nat;
    correctAnswers: Nat;
    timeSpent: Nat;  // waktu yang dihabiskan dalam detik
    passed: Bool;  // true jika score >= passingScore
    finishedAt: Time.Time;
  };

  // === USER PROGRESS TYPES ===
  
  public type UserProgress = {
    userId: Principal;
    moduleId: Text;
    isCompleted: Bool;
    completedAt: ?Time.Time;
    currentStep: ProgressStep;
    quizAttempts: Nat;  // berapa kali coba quiz
    bestScore: ?Nat;  // score terbaik quiz
    certificateClaimed: Bool;
  };

  public type ProgressStep = {
    #reading;        // sedang baca materi
    #readingComplete; // selesai baca, siap quiz
    #quizTaken;      // quiz sudah diambil
    #completed;      // semua selesai
  };

  // === CERTIFICATE ENHANCED ===
  
  public type CertificateRequest = {
    userId: Principal;
    moduleId: Text;
    quizResultId: Text;
  };

  public type CertificateInfo = {
    name: Text;
    description: Text;
    imageUrl: ?Text;  // template certificate image
  };

}