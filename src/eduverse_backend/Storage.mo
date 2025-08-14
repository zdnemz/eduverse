import Principal "mo:base/Principal";
import HashMap "mo:base/HashMap";
import Iter "mo:base/Iter";
import Array "mo:base/Array";
import Nat32 "mo:base/Nat32";
import Time "mo:base/Time";
import Text "mo:base/Text";
import Nat "mo:base/Nat";
import Result "mo:base/Result";
import Types "Types";
import Int "mo:base/Int";

module {
  public type UserStorage = HashMap.HashMap<Principal, Types.User>;
  public type CertificateStorage = HashMap.HashMap<Nat, Types.Certificate>;
  public type UserProfileStorage = HashMap.HashMap<Principal, Types.UserProfile>;

  // Certificate ID counter type
  public type CertificateId = Nat;

  // === USER STORAGE FUNCTIONS ===
  public func createEmptyUsers() : UserStorage {
    HashMap.HashMap<Principal, Types.User>(
      1,
      Principal.equal,
      Principal.hash
    );
  };

  public func createEmptyUserProfiles() : UserProfileStorage {
    HashMap.HashMap<Principal, Types.UserProfile>(
      1,
      Principal.equal,
      Principal.hash
    );
  };

  public func restoreUsers(
    userEntries : [(Principal, Types.User)]
  ) : UserStorage {
    HashMap.fromIter<Principal, Types.User>(
      userEntries.vals(),
      1,
      Principal.equal,
      Principal.hash
    );
  };

  public func restoreUserProfiles(
    profileEntries : [(Principal, Types.UserProfile)]
  ) : UserProfileStorage {
    HashMap.fromIter<Principal, Types.UserProfile>(
      profileEntries.vals(),
      1,
      Principal.equal,
      Principal.hash
    );
  };

  public func persistUsers(users: UserStorage) : [(Principal, Types.User)] {
    Iter.toArray(users.entries());
  };

  public func persistUserProfiles(profiles: UserProfileStorage) : [(Principal, Types.UserProfile)] {
    Iter.toArray(profiles.entries());
  };

  public func getUser(users: UserStorage, principal: Principal): ?Types.User {
    users.get(principal);
  };

  public func putUser(users: UserStorage, principal: Principal, user: Types.User): () {
    users.put(principal, user);
  };

  public func removeUser(users: UserStorage, principal: Principal): ?Types.User {
    users.remove(principal);
  };

  public func getUserProfile(profiles: UserProfileStorage, principal: Principal): ?Types.UserProfile {
    profiles.get(principal);
  };

  public func putUserProfile(profiles: UserProfileStorage, principal: Principal, profile: Types.UserProfile): () {
    profiles.put(principal, profile);
  };

  // === CERTIFICATE STORAGE FUNCTIONS ===
  public func createEmptyCertificates() : CertificateStorage {
    HashMap.HashMap<Nat, Types.Certificate>(
      1,
      Nat.equal,
      func(x: Nat) : Nat32 { Nat32.fromNat(x) }
    );
  };

  public func restoreCertificates(
    certEntries : [(Nat, Types.Certificate)]
  ) : CertificateStorage {
    HashMap.fromIter<Nat, Types.Certificate>(
      certEntries.vals(),
      1,
      Nat.equal,
      func(x: Nat) : Nat32 { Nat32.fromNat(x) }
    );
  };

  public func persistCertificates(certificates: CertificateStorage) : [(Nat, Types.Certificate)] {
    Iter.toArray(certificates.entries());
  };

  public func getCertificate(certificates: CertificateStorage, tokenId: Nat): ?Types.Certificate {
    certificates.get(tokenId);
  };

  public func putCertificate(certificates: CertificateStorage, tokenId: Nat, cert: Types.Certificate): () {
    certificates.put(tokenId, cert);
  };

  public func removeCertificate(certificates: CertificateStorage, tokenId: Nat): ?Types.Certificate {
    certificates.remove(tokenId);
  };

  // === CERTIFICATE ID MANAGEMENT ===
  public func getNextId(currentId: CertificateId): CertificateId {
    currentId + 1;
  };

  // === HELPER FUNCTIONS ===
  public func principalToHash(p: Principal): Nat32 {
    Principal.hash(p);
  };

  public func getAllCertificates(certificates: CertificateStorage): [(Nat, Types.Certificate)] {
    Iter.toArray(certificates.entries());
  };

  public func getAllUsers(users: UserStorage): [(Principal, Types.User)] {
    Iter.toArray(users.entries());
  };

  public func getAllUserProfiles(profiles: UserProfileStorage): [(Principal, Types.UserProfile)] {
    Iter.toArray(profiles.entries());
  };

  // Function to find certificate by ID
  public func findCertificateById(certificates: CertificateStorage, certId: Nat): ?Types.Certificate {
    certificates.get(certId);
  };

  // Function to get user's certificates by userId
  public func getUserCertificates(certificates: CertificateStorage, userId: Principal): [Types.Certificate] {
    let allCerts = Iter.toArray(certificates.vals());
    Array.filter<Types.Certificate>(allCerts, func(cert) = cert.userId == userId);
  };

  // Function to get user's completed courses from profile
  public func getUserCompletedCourses(profiles: UserProfileStorage, principal: Principal): [Text] {
    switch (profiles.get(principal)) {
      case (?profile) {
        profile.achievements; 
      };
      case null [];
    };
  };

  // Function to add course to user's completed courses via profile
  public func addCompletedCourse(profiles: UserProfileStorage, principal: Principal, courseName: Text): () {
    let existingProfile = profiles.get(principal);
    let updatedProfile : Types.UserProfile = {
      userId = principal;
      username = switch (existingProfile) { case (?p) p.username; case null null };
      email = switch (existingProfile) { case (?p) p.email; case null null };
      joinedAt = switch (existingProfile) { case (?p) p.joinedAt; case null Time.now() };
      totalCoursesCompleted = switch (existingProfile) { 
        case (?p) p.totalCoursesCompleted + 1; 
        case null 1; 
      };
      certificates = switch (existingProfile) { case (?p) p.certificates; case null [] };
      achievements = switch (existingProfile) { 
        case (?p) Array.append(p.achievements, [courseName]); 
        case null [courseName]; 
      };
    };
    profiles.put(principal, updatedProfile);
  };

  // Function to add certificate to user profile
  public func addCertificateToProfile(profiles: UserProfileStorage, principal: Principal, certificateId: Nat): () {
    let existingProfile = profiles.get(principal);
    let updatedProfile : Types.UserProfile = {
      userId = principal;
      username = switch (existingProfile) { case (?p) p.username; case null null };
      email = switch (existingProfile) { case (?p) p.email; case null null };
      joinedAt = switch (existingProfile) { case (?p) p.joinedAt; case null Time.now() };
      totalCoursesCompleted = switch (existingProfile) { case (?p) p.totalCoursesCompleted; case null 0 };
      certificates = switch (existingProfile) { 
        case (?p) Array.append(p.certificates, [certificateId]); 
        case null [certificateId]; 
      };
      achievements = switch (existingProfile) { case (?p) p.achievements; case null [] };
    };
    profiles.put(principal, updatedProfile);
  };

  // === CERTIFICATE MANAGER CLASS ===
  public class CertificateManager() {
    // Create storage instances using functional approach
    private var users : UserStorage = HashMap.HashMap<Principal, Types.User>(
      1, Principal.equal, Principal.hash
    );
    private var userProfiles : UserProfileStorage = HashMap.HashMap<Principal, Types.UserProfile>(
      1, Principal.equal, Principal.hash
    );
    private var certificates : CertificateStorage = HashMap.HashMap<Nat, Types.Certificate>(
      1, Nat.equal, func(x: Nat) : Nat32 { Nat32.fromNat(x) }
    );
    private var nextCertificateId : Nat = 1;

    public func claimCertificate(caller: Principal, courseId: Nat, courseName: Text): Result.Result<Types.Certificate, Text> {
      if (Principal.isAnonymous(caller)) {
        return #err("Anonymous users cannot claim certificates");
      };

      let currentTime = Time.now();
      let currentTimeNat = Int.abs(currentTime); 

      let newCert : Types.Certificate = {
        tokenId = nextCertificateId;
        userId = caller;
        courseId = courseId;
        courseName = courseName;
        completedAt = currentTimeNat; 
        issuer = "Eduverse Academy";
        certificateHash = "cert_" # Nat.toText(nextCertificateId) # "_" # Principal.toText(caller);
        metadata = {
          name = "Certificate of Completion - " # courseName;
          description = "This NFT certificate confirms successful completion of " # courseName # " course on Eduverse Academy platform.";
          image = "https://eduverse.academy/certificates/" # Nat.toText(nextCertificateId) # ".png";
          attributes = [
            { trait_type = "Course"; value = courseName },
            { trait_type = "Completion Date"; value = Nat.toText(currentTimeNat / 1000000000) }
          ];
        };
      };

      // Add certificate to storage
      certificates.put(nextCertificateId, newCert);
      
      // Add certificate to user profile
      let existingProfile = userProfiles.get(caller);
      let updatedProfile : Types.UserProfile = {
        userId = caller;
        username = switch (existingProfile) { case (?p) p.username; case null null };
        email = switch (existingProfile) { case (?p) p.email; case null null };
        joinedAt = switch (existingProfile) { case (?p) p.joinedAt; case null currentTimeNat };
        totalCoursesCompleted = switch (existingProfile) { 
          case (?p) p.totalCoursesCompleted + 1; 
          case null 1; 
        };
        certificates = switch (existingProfile) { 
          case (?p) Array.append(p.certificates, [nextCertificateId]); 
          case null [nextCertificateId]; 
        };
        achievements = switch (existingProfile) { 
          case (?p) Array.append(p.achievements, [courseName]); 
          case null [courseName]; 
        };
      };
      userProfiles.put(caller, updatedProfile);
      
      // Increment certificate ID
      nextCertificateId += 1;

      #ok(newCert);
    };

    public func getMyCertificates(caller: Principal): [Types.Certificate] {
      let allCerts = Iter.toArray(certificates.vals());
      Array.filter<Types.Certificate>(allCerts, func(cert) = cert.userId == caller);
    };

    public func getCertificateById(certId: Nat): ?Types.Certificate {
      certificates.get(certId);
    };

    // Persistence functions
    public func persistData(): {
      users: [(Principal, Types.User)];
      userProfiles: [(Principal, Types.UserProfile)];
      certificates: [(Nat, Types.Certificate)];
      nextCertId: Nat;
    } {
      {
        users = Iter.toArray(users.entries());
        userProfiles = Iter.toArray(userProfiles.entries());
        certificates = Iter.toArray(certificates.entries());
        nextCertId = nextCertificateId;
      };
    };

    public func loadData(data: {
      users: [(Principal, Types.User)];
      userProfiles: [(Principal, Types.UserProfile)];
      certificates: [(Nat, Types.Certificate)];
      nextCertId: Nat;
    }): () {
      users := HashMap.fromIter<Principal, Types.User>(
        data.users.vals(), 1, Principal.equal, Principal.hash
      );
      userProfiles := HashMap.fromIter<Principal, Types.UserProfile>(
        data.userProfiles.vals(), 1, Principal.equal, Principal.hash
      );
      certificates := HashMap.fromIter<Nat, Types.Certificate>(
        data.certificates.vals(), 1, Nat.equal, func(x: Nat) : Nat32 { Nat32.fromNat(x) }
      );
      nextCertificateId := data.nextCertId;
    };

    // Helper functions
    public func getAllUsers(): [(Principal, Types.User)] {
      Iter.toArray(users.entries());
    };

    public func getAllUserProfiles(): [(Principal, Types.UserProfile)] {
      Iter.toArray(userProfiles.entries());
    };

    public func getAllCertificatesEntries(): [(Nat, Types.Certificate)] {
      Iter.toArray(certificates.entries());
    };
  };
}