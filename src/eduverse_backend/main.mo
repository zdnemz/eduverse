import Result "mo:base/Result";
import Array "mo:base/Array";
import HashMap "mo:base/HashMap";
import Time "mo:base/Time";
import Principal "mo:base/Principal";
import Text "mo:base/Text";
import Nat "mo:base/Nat";
import Iter "mo:base/Iter";
import Nat32 "mo:base/Nat32";
import Float "mo:base/Float";
import Int "mo:base/Int";

import Types "./Types";
import User "./user/User";
import Courses "./learning/Courses";
import Materials "./learning/Materials";
import Quizzes "./learning/Quizzes";

persistent actor EduverseBackend {
  private transient let userManager = User.UserManager();
  
  // Storage untuk progress dan enrollment
  private var enrollmentsEntries : [(Principal, [Types.Enrollment])] = [];
  private transient var enrollments = HashMap.fromIter<Principal, [Types.Enrollment]>(
    enrollmentsEntries.vals(), 10, Principal.equal, Principal.hash
  );
  
  private var progressEntries : [(Text, Types.UserProgress)] = [];
  private transient var userProgress = HashMap.fromIter<Text, Types.UserProgress>(
    progressEntries.vals(), 10, Text.equal, Text.hash
  );
  
  private var quizResultsEntries : [(Text, [Types.QuizResult])] = [];
  private transient var quizResults = HashMap.fromIter<Text, [Types.QuizResult]>(
    quizResultsEntries.vals(), 10, Text.equal, Text.hash
  );
  
  private var certificatesEntries : [(Nat, Types.Certificate)] = [];
  private transient var certificates = HashMap.fromIter<Nat, Types.Certificate>(
    certificatesEntries.vals(), 10, Nat.equal, func(x: Nat) : Nat32 { Nat32.fromNat(x) }
  );
  
  private var nextCertificateId : Nat = 1;

  // Upgrade hooks
  system func preupgrade() {
    enrollmentsEntries := Iter.toArray(enrollments.entries());
    progressEntries := Iter.toArray(userProgress.entries());
    quizResultsEntries := Iter.toArray(quizResults.entries());
    certificatesEntries := Iter.toArray(certificates.entries());
  };

  system func postupgrade() {
    enrollmentsEntries := [];
    progressEntries := [];
    quizResultsEntries := [];
    certificatesEntries := [];
  };

  // Helper functions
  private func getUserProgressKey(userId: Principal, courseId: Nat) : Text {
    Principal.toText(userId) # "_" # Nat.toText(courseId)
  };

  private func isEnrolled(userId: Principal, courseId: Nat) : Bool {
    switch (enrollments.get(userId)) {
      case null { false };
      case (?userEnrollments) {
        Array.find<Types.Enrollment>(userEnrollments, func(e) = e.courseId == courseId) != null
      };
    }
  };

  // === USER FUNCTIONS === 
  public shared({ caller }) func updateUser(name: Text, email: ?Text): async Result.Result<Text, Text> {
    userManager.updateUser(caller, name, email)
  };

  public query({ caller }) func getMyProfile(): async ?Types.User {
    userManager.getMyProfile(caller)
  };

  // === COURSE FUNCTIONS ===
  public query func getCourses(): async [Types.CourseInfo] {
    Courses.courses
  };

  public query func getCoursesByCategory(category: Text): async [Types.CourseInfo] {
    Array.filter(Courses.courses, func(course: Types.CourseInfo): Bool {
      course.category == category
    })
  };

  public query func searchCourses(searchQuery: Text): async [Types.CourseInfo] {
    let lowerQuery = Text.toLowercase(searchQuery);
    Array.filter(Courses.courses, func(course: Types.CourseInfo): Bool {
      let titleMatch = Text.contains(Text.toLowercase(course.title), #text lowerQuery);
      let instructorMatch = Text.contains(Text.toLowercase(course.instructor), #text lowerQuery);
      let categoryMatch = Text.contains(Text.toLowercase(course.category), #text lowerQuery);
      titleMatch or instructorMatch or categoryMatch
    })
  };

  public query func getCourseById(courseId: Nat): async ?Types.CourseInfo {
    Array.find<Types.CourseInfo>(Courses.courses, func(course) = course.id == courseId)
  };

  // === ENROLLMENT FUNCTIONS ===
  public shared({ caller }) func enrollCourse(courseId: Nat): async Result.Result<Text, Text> {
    // Check if course exists
    switch (Array.find<Types.CourseInfo>(Courses.courses, func(course) = course.id == courseId)) {
      case null { #err("Course not found") };
      case (?course) {
        // Check if already enrolled
        if (isEnrolled(caller, courseId)) {
          return #err("Already enrolled in this course");
        };
        
        let enrollment: Types.Enrollment = {
          userId = caller;
          courseId = courseId;
          enrolledAt = Time.now();
          status = #Active;
        };
        
        switch (enrollments.get(caller)) {
          case null {
            enrollments.put(caller, [enrollment]);
          };
          case (?existing) {
            enrollments.put(caller, Array.append(existing, [enrollment]));
          };
        };
        
        // Initialize user progress
        let progressKey = getUserProgressKey(caller, courseId);
        let initialProgress: Types.UserProgress = {
          userId = caller;
          courseId = courseId;
          completedModules = [];
          quizResults = [];
          overallProgress = 0;
          lastAccessed = Time.now();
        };
        userProgress.put(progressKey, initialProgress);
        
        #ok("Successfully enrolled in: " # course.title)
      };
    }
  };

  public query({ caller }) func getMyEnrollments(): async [Types.Enrollment] {
    switch (enrollments.get(caller)) {
      case null { [] };
      case (?userEnrollments) { userEnrollments };
    }
  };

  // === LEARNING MATERIALS FUNCTIONS ===
  public query({ caller }) func getCourseMaterials(courseId: Nat): async Result.Result<Types.CourseMaterial, Text> {
    if (not isEnrolled(caller, courseId)) {
      return #err("You must enroll in this course first");
    };
    
    switch (Array.find<Types.CourseMaterial>(Materials.materials, func(material) = material.courseId == courseId)) {
      case null { #err("Course materials not found") };
      case (?material) { #ok(material) };
    }
  };

  public query({ caller }) func getModule(courseId: Nat, moduleId: Nat): async Result.Result<Types.Module, Text> {
    if (not isEnrolled(caller, courseId)) {
      return #err("You must enroll in this course first");
    };
    
    switch (Array.find<Types.CourseMaterial>(Materials.materials, func(material) = material.courseId == courseId)) {
      case null { #err("Course not found") };
      case (?material) {
        switch (Array.find<Types.Module>(material.modules, func(mod) = mod.moduleId == moduleId)) {
          case null { #err("Module not found") };
          case (?foundModule) { 
            // Update last accessed time
            let progressKey = getUserProgressKey(caller, courseId);
            switch (userProgress.get(progressKey)) {
              case null { };
              case (?progress) {
                let updatedProgress = {
                  progress with lastAccessed = Time.now();
                };
                userProgress.put(progressKey, updatedProgress);
              };
            };
            #ok(foundModule) 
          };
        };
      };
    }
  };

  // === QUIZ FUNCTIONS ===
  public query({ caller }) func getQuiz(courseId: Nat, moduleId: Nat): async Result.Result<Types.CourseQuiz, Text> {
    if (not isEnrolled(caller, courseId)) {
      return #err("You must enroll in this course first");
    };
    
    switch (Quizzes.getQuizByModuleId(courseId, moduleId)) {
      case null { #err("Quiz not found for this module") };
      case (?quiz) { #ok(quiz) };
    }
  };

  public shared({ caller }) func submitQuiz(
    courseId: Nat, 
    moduleId: Nat, 
    answers: [Types.UserAnswer]
  ): async Result.Result<Types.QuizResult, Text> {
    if (not isEnrolled(caller, courseId)) {
      return #err("You must enroll in this course first");
    };
    
    switch (Quizzes.getQuizByModuleId(courseId, moduleId)) {
      case null { #err("Quiz not found") };
      case (?quiz) {
        // Extract correct answers
        let correctAnswers = Array.map<Types.QuizQuestion, Nat>(
          quiz.questions, 
          func(q) = q.correctAnswer
        );
        
        // Extract user answers in same order
        let userAnswerValues = Array.map<Types.UserAnswer, Nat>(
          answers,
          func(a) = a.selectedAnswer
        );
        
        let score = Quizzes.calculateScore(userAnswerValues, correctAnswers);
        let passed = Quizzes.hasPassedQuiz(score, quiz.passingScore);
        
        let result: Types.QuizResult = {
          userId = caller;
          courseId = courseId;
          moduleId = moduleId;
          score = score;
          passed = passed;
          completedAt = Time.now();
          answers = answers;
        };
        
        // Store quiz result
        let resultKey = getUserProgressKey(caller, courseId);
        switch (quizResults.get(resultKey)) {
          case null {
            quizResults.put(resultKey, [result]);
          };
          case (?existing) {
            // Replace existing result for same module or add new
            let filtered = Array.filter<Types.QuizResult>(existing, func(r) = r.moduleId != moduleId);
            quizResults.put(resultKey, Array.append(filtered, [result]));
          };
        };
        
        // Update user progress if passed
        if (passed) {
          switch (userProgress.get(resultKey)) {
            case null { };
            case (?progress) {
              let newCompletedModules = if (Array.find<Nat>(progress.completedModules, func(m) = m == moduleId) == null) {
                Array.append(progress.completedModules, [moduleId])
              } else {
                progress.completedModules
              };
              
              // Get total modules for this course
              let totalModules = switch (Array.find<Types.CourseMaterial>(Materials.materials, func(m) = m.courseId == courseId)) {
                case null { 1 };
                case (?material) { material.modules.size() };
              };
              
              let newProgress = (newCompletedModules.size() * 100) / totalModules;
              
              let updatedProgress = {
                progress with 
                completedModules = newCompletedModules;
                overallProgress = newProgress;
                lastAccessed = Time.now();
              };
              userProgress.put(resultKey, updatedProgress);
              
              // Check if course completed and issue certificate
              if (newCompletedModules.size() == totalModules) {
                ignore await issueCertificate(caller, courseId);
              };
            };
          };
        };
        
        #ok(result)
      };
    }
  };

  // === PROGRESS TRACKING ===
  public query({ caller }) func getMyProgress(courseId: Nat): async ?Types.UserProgress {
    let progressKey = getUserProgressKey(caller, courseId);
    userProgress.get(progressKey)
  };

  public query({ caller }) func getMyQuizResults(courseId: Nat): async [Types.QuizResult] {
    let resultKey = getUserProgressKey(caller, courseId);
    switch (quizResults.get(resultKey)) {
      case null { [] };
      case (?results) { results };
    }
  };

  // === CERTIFICATE FUNCTIONS ===
  private func issueCertificate(userId: Principal, courseId: Nat): async Result.Result<Types.Certificate, Text> {
    switch (Array.find<Types.CourseInfo>(Courses.courses, func(c) = c.id == courseId)) {
      case null { #err("Course not found") };
      case (?course) {
        let certificate: Types.Certificate = {
          tokenId = nextCertificateId;
          userId = userId;
          courseId = courseId;
          courseName = course.title;
          completedAt = Time.now();
          issuer = "Eduverse Academy";
          certificateHash = "cert_" # Nat.toText(nextCertificateId) # "_" # Principal.toText(userId);
          metadata = {
            name = "Certificate of Completion - " # course.title;
            description = "This NFT certificate confirms successful completion of " # course.title # " course on Eduverse Academy platform.";
            image = "https://eduverse.academy/certificates/" # Nat.toText(nextCertificateId) # ".png";
            attributes = [
              { trait_type = "Course"; value = course.title },
              { trait_type = "Instructor"; value = course.instructor },
              { trait_type = "Difficulty"; value = switch(course.difficulty) {
                case (#Beginner) { "Beginner" };
                case (#Intermediate) { "Intermediate" };
                case (#Advanced) { "Advanced" };
              }},
              { trait_type = "Category"; value = course.category },
              { trait_type = "Completion Date"; value = Int.toText(Time.now() / 1000000000) } // Convert to seconds
            ];
          };
        };
        
        certificates.put(nextCertificateId, certificate);
        nextCertificateId += 1;
        
        #ok(certificate)
      };
    }
  };

  public query({ caller }) func getMyCertificates(): async [Types.Certificate] {
    let userCerts = Iter.toArray(certificates.vals());
    Array.filter<Types.Certificate>(userCerts, func(cert) = cert.userId == caller)
  };

  public query func getCertificate(tokenId: Nat): async ?Types.Certificate {
    certificates.get(tokenId)
  };

  // === ANALYTICS FUNCTIONS ===
  public query func getCourseStats(courseId: Nat): async ?Types.CourseStats {
    let allEnrollments = Iter.toArray(enrollments.vals()) 
      |> Array.map<[Types.Enrollment], [Types.Enrollment]>(_, func(x) = x)
      |> Array.flatten<Types.Enrollment>(_);
    
    let courseEnrollments = Array.filter<Types.Enrollment>(allEnrollments, func(e) = e.courseId == courseId);
    let totalEnrollments = courseEnrollments.size();
    
    if (totalEnrollments == 0) return null;
    
    let allProgress = Iter.toArray(userProgress.vals());
    let courseProgress = Array.filter<Types.UserProgress>(allProgress, func(p) = p.courseId == courseId);
    let completed = Array.filter<Types.UserProgress>(courseProgress, func(p) = p.overallProgress >= 100);
    
    let completionRate = if (totalEnrollments > 0) {
      (Float.fromInt(completed.size()) / Float.fromInt(totalEnrollments)) * 100.0
    } else { 0.0 };
    
    ?{
      courseId = courseId;
      totalEnrollments = totalEnrollments;
      completionRate = completionRate;
      averageScore = 85.0; // Placeholder - could calculate from actual quiz results
      averageTimeToComplete = 30; // Placeholder - could calculate from actual data
    }
  };

  // === UTILITY FUNCTIONS ===
  public query func getCategories(): async [Text] {
    let categories = Array.map<Types.CourseInfo, Text>(Courses.courses, func(course) = course.category);
    // Remove duplicates (simple approach)
    Array.foldLeft<Text, [Text]>(categories, [], func(acc, category) {
      if (Array.find<Text>(acc, func(c) = c == category) == null) {
        Array.append(acc, [category])
      } else {
        acc
      }
    })
  };
};