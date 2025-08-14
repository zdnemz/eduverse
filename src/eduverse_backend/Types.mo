module {
  // Enum untuk difficulty level
  public type Difficulty = {
    #Beginner;
    #Intermediate;
    #Advanced;
  };

  // Type untuk user basic info
  public type User = {
    id: Principal;
    name: Text;
    email: ?Text;
    createdAt: Int;
    updatedAt: ?Int;
  };

  // Type untuk informasi course
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

  // Type untuk module dalam course
  public type Module = {
    moduleId: Nat;
    title: Text;
    content: Text; // Konten pembelajaran dalam bentuk text
    codeExample: Text; // Contoh kode
  };

  // Type untuk materi course
  public type CourseMaterial = {
    courseId: Nat;
    modules: [Module];
  };

  // Type untuk pertanyaan quiz
  public type QuizQuestion = {
    questionId: Nat;
    question: Text;
    options: [Text]; // Array of multiple choice options
    correctAnswer: Nat; // Index of correct answer (0-based)
    explanation: Text; // Penjelasan jawaban yang benar
  };

  // Type untuk quiz
  public type CourseQuiz = {
    courseId: Nat;
    moduleId: Nat;
    title: Text;
    questions: [QuizQuestion];
    passingScore: Nat; // Passing score dalam persentase (0-100)
    timeLimit: Nat; // Time limit dalam detik
  };

  // Type untuk jawaban user
  public type UserAnswer = {
    questionId: Nat;
    selectedAnswer: Nat;
  };

  // Type untuk hasil quiz
  public type QuizResult = {
    userId: Principal;
    courseId: Nat;
    moduleId: Nat;
    score: Nat; // Score dalam persentase
    passed: Bool;
    completedAt: Int; // Timestamp
    answers: [UserAnswer];
  };

  // Type untuk progress user
  public type UserProgress = {
    userId: Principal;
    courseId: Nat;
    completedModules: [Nat]; // Array of completed module IDs
    quizResults: [QuizResult];
    overallProgress: Nat; // Progress dalam persentase
    lastAccessed: Int; // Timestamp
  };

  // Type untuk sertifikat NFT
  public type Certificate = {
    tokenId: Nat;
    userId: Principal;
    courseId: Nat;
    courseName: Text;
    completedAt: Int; // Timestamp
    issuer: Text; // Nama platform/institusi
    certificateHash: Text; // Hash untuk verifikasi
    metadata: CertificateMetadata;
  };

  public type CertificateMetadata = {
    name: Text;
    description: Text;
    image: Text; // URL to certificate image
    attributes: [CertificateAttribute];
  };

  public type CertificateAttribute = {
    trait_type: Text;
    value: Text;
  };

  // Type untuk enrollment
  public type Enrollment = {
    userId: Principal;
    courseId: Nat;
    enrolledAt: Int; // Timestamp
    status: EnrollmentStatus;
  };

  public type EnrollmentStatus = {
    #Active;
    #Completed;
    #Paused;
    #Dropped;
  };

  // Type untuk respons API
  public type ApiResponse<T> = {
    #Ok: T;
    #Err: Text;
  };

  // Type untuk statistik course
  public type CourseStats = {
    courseId: Nat;
    totalEnrollments: Nat;
    completionRate: Float; // Persentase completion rate
    averageScore: Float;
    averageTimeToComplete: Nat; // Dalam hari
  };

  // Type untuk user profile
  public type UserProfile = {
    userId: Principal;
    username: ?Text;
    email: ?Text;
    joinedAt: Int;
    totalCoursesCompleted: Nat;
    certificates: [Nat]; // Array of certificate token IDs
    achievements: [Text];
  };

  // Type untuk learning path
  public type LearningPath = {
    pathId: Nat;
    title: Text;
    description: Text;
    courses: [Nat]; // Array of course IDs dalam urutan
    difficulty: Difficulty;
    estimatedDuration: Text;
    prerequisites: [Text];
  };
};