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
        
        // Initialize user progress - FIXED: Removed quizResults field, kept only quizResult
        let progressKey = getUserProgressKey(caller, courseId);
        let initialProgress: Types.UserProgress = {
          userId = caller;
          courseId = courseId;
          completedModules = [];
          quizResult = null; // Single quiz result per course
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

  public shared({ caller }) func completeModule(courseId: Nat, moduleId: Nat): async Result.Result<Text, Text> {
    if (not isEnrolled(caller, courseId)) {
      return #err("You must enroll in this course first");
    };
    
    let progressKey = getUserProgressKey(caller, courseId);
    switch (userProgress.get(progressKey)) {
      case null { #err("Progress not found") };
      case (?progress) {
        // Check if module already completed
        let alreadyCompleted = Array.find<Nat>(progress.completedModules, func(id) = id == moduleId) != null;
        
        if (alreadyCompleted) {
          return #ok("Module already completed");
        };
        
        // Add module to completed list
        let updatedModules = Array.append(progress.completedModules, [moduleId]);
        
        // Calculate new overall progress
        let totalModules = switch (Array.find<Types.CourseMaterial>(Materials.materials, func(m) = m.courseId == courseId)) {
          case null { 1 }; // Fallback to avoid division by zero
          case (?material) { material.modules.size() };
        };
        
        let newOverallProgress = (updatedModules.size() * 100) / totalModules;
        
        let updatedProgress = {
          progress with 
          completedModules = updatedModules;
          overallProgress = newOverallProgress;
          lastAccessed = Time.now();
        };

        userProgress.put(progressKey, updatedProgress);
        #ok("Module completed successfully")
      };
    };
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
            // FIXED: Auto-mark module as completed when accessed
            let progressKey = getUserProgressKey(caller, courseId);
            switch (userProgress.get(progressKey)) {
              case null { };
              case (?progress) {
                // Check if module not already completed
                let alreadyCompleted = Array.find<Nat>(progress.completedModules, func(id) = id == moduleId) != null;
                
                if (not alreadyCompleted) {
                  // Add module to completed list
                  let updatedModules = Array.append(progress.completedModules, [moduleId]);
                  
                  // Calculate new overall progress
                  let totalModules = material.modules.size();
                  let newOverallProgress = (updatedModules.size() * 100) / totalModules;
                  
                  let updatedProgress = {
                    progress with 
                    completedModules = updatedModules;
                    overallProgress = newOverallProgress;
                    lastAccessed = Time.now();
                  };
                  userProgress.put(progressKey, updatedProgress);
                } else {
                  // Just update last accessed time
                  let updatedProgress = {
                    progress with lastAccessed = Time.now();
                  };
                  userProgress.put(progressKey, updatedProgress);
                };
              };
            };
            #ok(foundModule) 
          };
        };
      }
    }
  };

  // === QUIZ FUNCTIONS ===
  public query({ caller }) func getQuiz(courseId: Nat): async Result.Result<Types.CourseQuiz, Text> {
    if (not isEnrolled(caller, courseId)) {
      return #err("You must enroll in this course first");
    };

    switch (Quizzes.getQuizByCourseId(courseId)) {
      case null { #err("Quiz not available for this course") };
      case (?quiz) { #ok(quiz) };
    }
  };

  public shared({ caller }) func submitQuiz(
    courseId: Nat, 
    answers: [Types.UserAnswer]
  ): async Result.Result<Types.QuizResult, Text> {
    if (not isEnrolled(caller, courseId)) {
      return #err("You must enroll in this course first");
    };
    
    switch (Quizzes.getQuizByCourseId(courseId)) {
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
          score = score;
          passed = passed;
          completedAt = Time.now();
          answers = answers;
          timeSpent = null;
        };
        
        // Store quiz result
        let resultKey = getUserProgressKey(caller, courseId);
        quizResults.put(resultKey, [result]);
        
        // FIXED: Update progress without overriding existing completed modules
        switch (userProgress.get(resultKey)) {
          case null { };
          case (?progress) {
            // Get all possible module IDs for this course
            let allModuleIds = switch (Array.find<Types.CourseMaterial>(Materials.materials, func(m) = m.courseId == courseId)) {
              case null { [] };
              case (?material) { Array.map<Types.Module, Nat>(material.modules, func(mod) = mod.moduleId) };
            };
            
            // FIXED: If quiz passed, ensure all modules are marked as completed
            // But keep existing completed modules even if quiz not passed
            let finalCompletedModules = if (passed) {
              // Merge existing completed modules with all modules (in case some were missed)
              let combined = Array.append(progress.completedModules, allModuleIds);
              // Remove duplicates
              Array.foldLeft<Nat, [Nat]>(combined, [], func(acc, moduleId) {
                if (Array.find<Nat>(acc, func(id) = id == moduleId) == null) {
                  Array.append(acc, [moduleId])
                } else {
                  acc
                }
              })
            } else {
              // Keep existing completed modules even if quiz failed
              progress.completedModules
            };
            
            let newOverallProgress = if (passed) { 100 } else {
              // Calculate based on completed modules
              let totalModules = allModuleIds.size();
              if (totalModules == 0) { 0 } else {
                (finalCompletedModules.size() * 100) / totalModules
              }
            };
            
            let updatedProgress = {
              progress with 
              completedModules = finalCompletedModules;
              quizResult = ?result;
              overallProgress = newOverallProgress;
              lastAccessed = Time.now();
            };
            userProgress.put(resultKey, updatedProgress);
            
            // Issue certificate only if passed
            if (passed) {
              ignore await issueCertificate(caller, courseId);
            };
          };
        };
        
        #ok(result)
      };
    }
  };

  public query func getAllQuizzes(): async [Types.CourseQuiz] {
    Quizzes.getAllQuizzes()
  };

  public query func getQuizPreview(courseId: Nat): async ?Types.QuizPreview {
    Quizzes.getQuizPreview(courseId)
  };

  public query func validateAnswers(answers: [Types.UserAnswer], quizQuestions: [Types.QuizQuestion]): async Result.Result<Bool, Text> {
    Quizzes.validateAnswers(answers, quizQuestions)
  };
  

  // === PROGRESS TRACKING ===
  public query({ caller }) func getMyProgress(courseId: Nat): async ?Types.UserProgress {
    let progressKey = getUserProgressKey(caller, courseId);
    switch (userProgress.get(progressKey)) {
      case null { 
        // Return default progress if none exists
        ?{
          userId = caller;
          courseId = courseId;
          completedModules = [];
          quizResult = null;
          overallProgress = 0;
          lastAccessed = Time.now();
        }
      };
      case (?progress) { ?progress };
    }
  };

  public query({ caller }) func getCourseCompletionStatus(courseId: Nat): async ?{
    isEnrolled: Bool;
    totalModules: Nat;
    completedModules: [Nat];
    completedModulesCount: Nat;
    overallProgress: Nat;
    hasQuizResult: Bool;
    quizPassed: Bool;
    quizScore: Nat;
    canGetCertificate: Bool;
  } {
    // FIXED: Ensure user is enrolled first
    if (not isEnrolled(caller, courseId)) {
      return null; // Return null for non-enrolled users
    };
    
    let progressKey = getUserProgressKey(caller, courseId);
    
    // FIXED: Get total modules with proper validation
    let totalModules = switch (Array.find<Types.CourseMaterial>(Materials.materials, func(m) = m.courseId == courseId)) {
      case null { 
        // Course material not found - this shouldn't happen for valid courses
        return null;
      };
      case (?material) { 
        let moduleCount = material.modules.size();
        if (moduleCount == 0) {
          return null; // Invalid course with no modules
        };
        moduleCount
      };
    };
    
    // FIXED: Get progress with detailed validation
    let (completedModules, _overallProgress, quizResult) = switch (userProgress.get(progressKey)) {
      case null { 
        // No progress found - create default
        ([], 0, null) 
      };
      case (?progress) { 
        // Validate progress data
        let validatedModules = progress.completedModules;
        let validatedProgress = progress.overallProgress;
        
        // Ensure progress consistency
        let calculatedProgress = if (totalModules > 0) {
          (validatedModules.size() * 100) / totalModules
        } else { 0 };
        
        // Use calculated progress if stored progress seems wrong
        let finalProgress = if (validatedProgress != calculatedProgress and validatedModules.size() > 0) {
          calculatedProgress
        } else {
          validatedProgress
        };
        
        (validatedModules, finalProgress, progress.quizResult) 
      };
    };
    
    // FIXED: Enhanced quiz result validation
    let (hasQuizResult, quizPassed, quizScore) = switch (quizResult) {
      case null { 
        // No quiz result in progress, check quizResults storage as backup
        let resultKey = getUserProgressKey(caller, courseId);
        switch (quizResults.get(resultKey)) {
          case null { (false, false, 0) };
          case (?results) {
            if (results.size() == 0) {
              (false, false, 0)
            } else {
              // Get latest result
              let latestResult = results[results.size() - 1];
              (true, latestResult.passed, latestResult.score)
            }
          };
        }
      };
      case (?result) { 
        // Validate quiz result
        let validScore = if (result.score > 100) { 100 } else if (result.score < 0) { 0 } else { result.score };
        (true, result.passed, validScore) 
      };
    };
    
    // FIXED: Enhanced completion logic
    let modulesComplete = completedModules.size() >= totalModules;
    let _canGetCertificate = modulesComplete and quizPassed;
    
    // FIXED: Additional validation - if quiz passed, ensure all modules marked as completed
    let finalCompletedModules = if (quizPassed and not modulesComplete) {
      // Auto-complete all modules if quiz passed but modules not all marked
      let allModuleIds = switch (Array.find<Types.CourseMaterial>(Materials.materials, func(m) = m.courseId == courseId)) {
        case null { completedModules };
        case (?material) { Array.map<Types.Module, Nat>(material.modules, func(mod) = mod.moduleId) };
      };
      allModuleIds
    } else {
      completedModules
    };
    
    let finalCompletedCount = finalCompletedModules.size();
    let finalOverallProgress = if (totalModules > 0) {
      (finalCompletedCount * 100) / totalModules
    } else { 0 };
    
    // FIXED: Return validated and complete status
    ?{
      isEnrolled = true;
      totalModules = totalModules;
      completedModules = finalCompletedModules;
      completedModulesCount = finalCompletedCount;
      overallProgress = finalOverallProgress;
      hasQuizResult = hasQuizResult;
      quizPassed = quizPassed;
      quizScore = quizScore;
      canGetCertificate = (finalCompletedCount >= totalModules) and quizPassed;
    }
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
        // Calculate final score from quiz results
        let progressKey = getUserProgressKey(userId, courseId);
        let finalScore = switch (quizResults.get(progressKey)) {
          case null { 0 };
          case (?results) {
            if (results.size() == 0) { 0 }
            else {
              let totalScore = Array.foldLeft<Types.QuizResult, Nat>(
                results, 0, func(acc, result) = acc + result.score
              );
              totalScore / results.size()
            }
          };
        };

        let certificate: Types.Certificate = {
          tokenId = nextCertificateId;
          userId = userId;
          courseId = courseId;
          courseName = course.title;
          completedAt = Time.now();
          finalScore = finalScore;
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
              { trait_type = "Completion Date"; value = Int.toText(Time.now() / 1000000000) }
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

    // Calculate average quiz score from all quiz results
    let allQuizResults = Iter.toArray(quizResults.vals()) 
      |> Array.map<[Types.QuizResult], [Types.QuizResult]>(_, func(x) = x)
      |> Array.flatten<Types.QuizResult>(_);
    let courseQuizResults = Array.filter<Types.QuizResult>(allQuizResults, func(r) = r.courseId == courseId);
    
    let averageQuizScore = if (courseQuizResults.size() > 0) {
      let totalScore = Array.foldLeft<Types.QuizResult, Nat>(
        courseQuizResults, 0, func(acc, result) = acc + result.score
      );
      Float.fromInt(totalScore) / Float.fromInt(courseQuizResults.size())
    } else { 0.0 };

    ?{
      courseId = courseId;
      totalEnrollments = totalEnrollments;
      completionRate = completionRate;
      averageScore = 85.0; // Placeholder
      averageQuizScore = averageQuizScore;
      totalQuizAttempts = courseQuizResults.size();
      averageTimeToComplete = 30; // Placeholder
    }
  };

  // === UTILITY FUNCTIONS ===
  public query func getCategories(): async [Text] {
    let categories = Array.map<Types.CourseInfo, Text>(Courses.courses, func(course) = course.category);
    // Remove duplicates
    Array.foldLeft<Text, [Text]>(categories, [], func(acc, category) {
      if (Array.find<Text>(acc, func(c) = c == category) == null) {
        Array.append(acc, [category])
      } else {
        acc
      }
    })
  };
};