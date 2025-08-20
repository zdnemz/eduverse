import HashMap "mo:base/HashMap";
import Principal "mo:base/Principal";
import Time "mo:base/Time";
import Result "mo:base/Result";
import Array "mo:base/Array";
import Iter "mo:base/Iter";
import Text "mo:base/Text";
import Nat "mo:base/Nat";
import Float "mo:base/Float";
import Int "mo:base/Int";
import Types "../Types";

module {
  public class UserManager() {
    // Storage untuk user data
    private var users = HashMap.HashMap<Principal, Types.User>(10, Principal.equal, Principal.hash);
    private var profiles = HashMap.HashMap<Principal, Types.UserProfile>(10, Principal.equal, Principal.hash);
    
    // User CRUD operations
    public func updateUser(userId: Principal, name: Text, email: ?Text): Result.Result<Text, Text> {
      // Validate input
      if (Text.size(name) == 0) {
        return #err("Name cannot be empty");
      };
      
      // Check if email is valid (basic validation)
      switch (email) {
        case (?emailValue) {
          if (Text.size(emailValue) > 0 and not Text.contains(emailValue, #char '@')) {
            return #err("Invalid email format");
          };
        };
        case null { };
      };
      
      let currentTime = Time.now();
      
      // Update or create user
      let user: Types.User = switch (users.get(userId)) {
        case (?existingUser) {
          {
            existingUser with
            name = name;
            email = email;
            updatedAt = ?currentTime;
          }
        };
        case null {
          {
            id = userId;
            name = name;
            email = email;
            createdAt = currentTime;
            updatedAt = null;
          }
        };
      };
      
      users.put(userId, user);
      
      // Update or create profile
      let profile: Types.UserProfile = switch (profiles.get(userId)) {
        case (?existingProfile) {
          {
            existingProfile with
            username = ?name;
            email = email;
          }
        };
        case null {
          {
            userId = userId;
            username = ?name;
            email = email;
            joinedAt = currentTime;
            totalCoursesCompleted = 0;
            totalQuizzesPassed = 0;
            averageQuizScore = 0.0;
            certificates = [];
            achievements = [];
            learningStreak = 0;
          }
        };
      };
      
      profiles.put(userId, profile);
      
      #ok("User profile updated successfully")
    };
    
    public func getUser(userId: Principal): ?Types.User {
      users.get(userId)
    };
    
    public func getMyProfile(userId: Principal): ?Types.User {
      users.get(userId)
    };
    
    public func getUserProfile(userId: Principal): ?Types.UserProfile {
      profiles.get(userId)
    };
    
    public func createUser(userId: Principal, name: Text, email: ?Text): Result.Result<Types.User, Text> {
      // Check if user already exists
      switch (users.get(userId)) {
        case (?_) { return #err("User already exists") };
        case null { };
      };
      
      // Validate input
      if (Text.size(name) == 0) {
        return #err("Name cannot be empty");
      };
      
      let currentTime = Time.now();
      
      let newUser: Types.User = {
        id = userId;
        name = name;
        email = email;
        createdAt = currentTime;
        updatedAt = null;
      };
      
      let newProfile: Types.UserProfile = {
        userId = userId;
        username = ?name;
        email = email;
        joinedAt = currentTime;
        totalCoursesCompleted = 0;
        totalQuizzesPassed = 0;
        averageQuizScore = 0.0;
        certificates = [];
        achievements = [];
        learningStreak = 0;
      };
      
      users.put(userId, newUser);
      profiles.put(userId, newProfile);
      
      #ok(newUser)
    };
    
    public func deleteUser(userId: Principal): Result.Result<Text, Text> {
      switch (users.get(userId)) {
        case null { #err("User not found") };
        case (?_) {
          users.delete(userId);
          profiles.delete(userId);
          #ok("User deleted successfully")
        };
      }
    };
    
    // Profile management
    public func updateCourseCompletion(userId: Principal, increment: Bool): Result.Result<Text, Text> {
      switch (profiles.get(userId)) {
        case null { #err("User profile not found") };
        case (?profile) {
          let newCount = if (increment) {
            profile.totalCoursesCompleted + 1
          } else {
            Nat.sub(profile.totalCoursesCompleted, 1)
          };
          
          let updatedProfile = {
            profile with
            totalCoursesCompleted = newCount;
          };
          
          profiles.put(userId, updatedProfile);
          #ok("Course completion count updated")
        };
      }
    };

    // NEW: Update quiz statistics
    public func updateQuizStats(userId: Principal, quizPassed: Bool, quizScore: Nat): Result.Result<Text, Text> {
      switch (profiles.get(userId)) {
        case null { #err("User profile not found") };
        case (?profile) {
          let newQuizzesPassed = if (quizPassed) {
            profile.totalQuizzesPassed + 1
          } else {
            profile.totalQuizzesPassed
          };
          
          // Calculate new average score
          let totalQuizzes = profile.totalQuizzesPassed + 1;
          let currentTotalScore = profile.averageQuizScore * Float.fromInt(profile.totalQuizzesPassed);
          let newTotalScore = currentTotalScore + Float.fromInt(quizScore);
          let newAverageScore = newTotalScore / Float.fromInt(totalQuizzes);
          
          let updatedProfile = {
            profile with
            totalQuizzesPassed = newQuizzesPassed;
            averageQuizScore = newAverageScore;
          };
          
          profiles.put(userId, updatedProfile);
          #ok("Quiz statistics updated")
        };
      }
    };

    // NEW: Update learning streak
    public func updateLearningStreak(userId: Principal, streak: Nat): Result.Result<Text, Text> {
      switch (profiles.get(userId)) {
        case null { #err("User profile not found") };
        case (?profile) {
          let updatedProfile = {
            profile with
            learningStreak = streak;
          };
          
          profiles.put(userId, updatedProfile);
          #ok("Learning streak updated")
        };
      }
    };
    
    public func addCertificate(userId: Principal, certificateId: Nat): Result.Result<Text, Text> {
      switch (profiles.get(userId)) {
        case null { #err("User profile not found") };
        case (?profile) {
          // Check if certificate already exists
          if (Array.find<Nat>(profile.certificates, func(id) = id == certificateId) != null) {
            return #err("Certificate already added to profile");
          };
          
          let updatedProfile = {
            profile with
            certificates = Array.append(profile.certificates, [certificateId]);
          };
          
          profiles.put(userId, updatedProfile);
          #ok("Certificate added to profile")
        };
      }
    };
    
    public func addAchievement(userId: Principal, achievement: Text): Result.Result<Text, Text> {
      switch (profiles.get(userId)) {
        case null { #err("User profile not found") };
        case (?profile) {
          // Check if achievement already exists
          if (Array.find<Text>(profile.achievements, func(a) = a == achievement) != null) {
            return #err("Achievement already exists");
          };
          
          let updatedProfile = {
            profile with
            achievements = Array.append(profile.achievements, [achievement]);
          };
          
          profiles.put(userId, updatedProfile);
          #ok("Achievement added")
        };
      }
    };
    
    // Statistics and analytics
    public func getTotalUsers(): Nat {
      users.size()
    };
    
    public func getUserStats(userId: Principal): ?{
      totalCourses: Nat;
      totalQuizzes: Nat;
      averageScore: Float;
      certificateCount: Nat;
      achievementCount: Nat;
      learningStreak: Nat;
      memberSince: Int;
    } {
      switch (profiles.get(userId)) {
        case null { null };
        case (?profile) {
          ?{
            totalCourses = profile.totalCoursesCompleted;
            totalQuizzes = profile.totalQuizzesPassed;
            averageScore = profile.averageQuizScore;
            certificateCount = profile.certificates.size();
            achievementCount = profile.achievements.size();
            learningStreak = profile.learningStreak;
            memberSince = profile.joinedAt;
          }
        };
      }
    };

    // FIXED: Get top performers for leaderboard
    public func getTopPerformers(limit: Nat): [Types.LeaderboardEntry] {
      let allProfiles = profiles.vals() |> Iter.toArray(_);
      
      // Sort by average quiz score (descending)
      let sortedProfiles = Array.sort<Types.UserProfile>(
        allProfiles,
        func(a, b) {
          if (a.averageQuizScore > b.averageQuizScore) { #less }
          else if (a.averageQuizScore < b.averageQuizScore) { #greater }
          else { #equal }
        }
      );
      
      // Take only the top 'limit' profiles
      let actualLimit = if (sortedProfiles.size() < limit) {
        sortedProfiles.size()
      } else {
        limit
      };
      
      var result: [Types.LeaderboardEntry] = [];
      var i = 0;
      
      while (i < actualLimit) {
        let profile = sortedProfiles[i];
        let entry: Types.LeaderboardEntry = {
          rank = i + 1;
          userId = profile.userId;
          username = profile.username;
          totalScore = Int.abs(Float.toInt(profile.averageQuizScore));
          coursesCompleted = profile.totalCoursesCompleted;
          averageScore = profile.averageQuizScore;
        };
        result := Array.append(result, [entry]);
        i += 1;
      };
      
      result
    };

    // FIXED: Check if user qualifies for achievements
    public func checkAchievements(userId: Principal): [Text] {
      switch (profiles.get(userId)) {
        case null { [] };
        case (?profile) {
          var newAchievements: [Text] = [];
          
          // First Course Completion
          if (profile.totalCoursesCompleted >= 1) {
            let hasAchievement = Array.find<Text>(profile.achievements, func(a) = a == "First Course Complete");
            if (hasAchievement == null) {
              newAchievements := Array.append(newAchievements, ["First Course Complete"]);
            };
          };
          
          // Quiz Master (100% on a quiz)
          if (profile.averageQuizScore == 100.0) {
            let hasAchievement = Array.find<Text>(profile.achievements, func(a) = a == "Quiz Master");
            if (hasAchievement == null) {
              newAchievements := Array.append(newAchievements, ["Quiz Master"]);
            };
          };
          
          // Learning Streak (7 days)
          if (profile.learningStreak >= 7) {
            let hasAchievement = Array.find<Text>(profile.achievements, func(a) = a == "Week Warrior");
            if (hasAchievement == null) {
              newAchievements := Array.append(newAchievements, ["Week Warrior"]);
            };
          };
          
          // Course Champion (5 courses)
          if (profile.totalCoursesCompleted >= 5) {
            let hasAchievement = Array.find<Text>(profile.achievements, func(a) = a == "Course Champion");
            if (hasAchievement == null) {
              newAchievements := Array.append(newAchievements, ["Course Champion"]);
            };
          };
          
          newAchievements
        };
      }
    };
    
    // Search functions
    public func searchUsersByName(searchTerm: Text): [Types.User] {
      let lowerSearchTerm = Text.toLowercase(searchTerm);
      let allUsers = users.vals() |> Iter.toArray(_);
      
      Array.filter<Types.User>(allUsers, func(user) {
        Text.contains(Text.toLowercase(user.name), #text lowerSearchTerm)
      })
    };
    
    // Bulk operations
    public func getAllUsers(): [Types.User] {
      users.vals() |> Iter.toArray(_)
    };
    
    public func getAllProfiles(): [Types.UserProfile] {
      profiles.vals() |> Iter.toArray(_)
    };
    
    // User validation
    public func validateUser(userId: Principal): Bool {
      switch (users.get(userId)) {
        case null { false };
        case (?_) { true };
      }
    };
    
    public func isUserActive(userId: Principal): Bool {
      switch (users.get(userId)) {
        case null { false };
        case (?user) {
          // Consider user active if created less than 1 year ago
          let oneYear = 365 * 24 * 60 * 60 * 1_000_000_000; // in nanoseconds
          let currentTime = Time.now();
          (currentTime - user.createdAt) < oneYear
        };
      }
    };

    // NEW: Reset user progress (for testing/admin purposes)
    public func resetUserProgress(userId: Principal): Result.Result<Text, Text> {
      switch (profiles.get(userId)) {
        case null { #err("User profile not found") };
        case (?profile) {
          let resetProfile = {
            profile with
            totalCoursesCompleted = 0;
            totalQuizzesPassed = 0;
            averageQuizScore = 0.0;
            certificates = [];
            achievements = [];
            learningStreak = 0;
          };
          
          profiles.put(userId, resetProfile);
          #ok("User progress reset successfully")
        };
      }
    };
    
    // Utility functions for upgrades
    public func getSize(): Nat {
      users.size()
    };
    
    public func clear(): () {
      users := HashMap.HashMap<Principal, Types.User>(10, Principal.equal, Principal.hash);
      profiles := HashMap.HashMap<Principal, Types.UserProfile>(10, Principal.equal, Principal.hash);
    };

    // NEW: Migration function for existing users (if needed)
    public func migrateExistingProfiles(): Text {
      var migratedCount = 0;
      
      for ((userId, profile) in profiles.entries()) {
        // Check if profile needs migration (missing new fields)
        let needsMigration = switch (profile.averageQuizScore, profile.totalQuizzesPassed, profile.learningStreak) {
          case (_, _, _) { false }; // All fields exist
        };
        
        if (needsMigration) {
          let migratedProfile = {
            userId = profile.userId;
            username = profile.username;
            email = profile.email;
            joinedAt = profile.joinedAt;
            totalCoursesCompleted = profile.totalCoursesCompleted;
            totalQuizzesPassed = 0;
            averageQuizScore = 0.0;
            certificates = profile.certificates;
            achievements = profile.achievements;
            learningStreak = 0;
          };
          
          profiles.put(userId, migratedProfile);
          migratedCount += 1;
        };
      };
      
      "Migrated " # Nat.toText(migratedCount) # " user profiles"
    };
  };
};