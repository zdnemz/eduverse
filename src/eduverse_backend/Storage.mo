import Principal "mo:base/Principal";
import HashMap "mo:base/HashMap";
import RBTree "mo:base/RBTree";
import Iter "mo:base/Iter";
import Array "mo:base/Array";
import Nat32 "mo:base/Nat32";
import Types "Types";

module {
  public type UserStorage = HashMap.HashMap<Principal, Types.User>;
  public type CertificateStorage = RBTree.RBTree<Nat32, [Types.Certificate]>;

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

  public func persistUsers(users: UserStorage) : [(Principal, Types.User)] {
    Iter.toArray(users.entries());
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

  public func loadUsers(users: UserStorage, userEntries : [(Principal, Types.User)]) : () {
    for ((principal, user) in userEntries.vals()) {
      users.put(principal, user);
    };
  };

  // === CERTIFICATE STORAGE FUNCTIONS ===
  public func createEmptyCertificates() : CertificateStorage {
    RBTree.RBTree<Nat32, [Types.Certificate]>(Nat32.compare);
  };

  public func restoreCertificates(
    certEntries : [(Nat32, [Types.Certificate])]
  ) : CertificateStorage {
    let tree = RBTree.RBTree<Nat32, [Types.Certificate]>(Nat32.compare);
    for ((key, certs) in certEntries.vals()) {
      tree.put(key, certs);
    };
    tree;
  };

  public func persistCertificates(certificates: CertificateStorage) : [(Nat32, [Types.Certificate])] {
    Iter.toArray(certificates.entries());
  };

  public func getCertificates(certificates: CertificateStorage, principalHash: Nat32): ?[Types.Certificate] {
    certificates.get(principalHash);
  };

  public func putCertificates(certificates: CertificateStorage, principalHash: Nat32, certs: [Types.Certificate]): () {
    certificates.put(principalHash, certs);
  };

  public func removeCertificates(certificates: CertificateStorage, principalHash: Nat32): ?[Types.Certificate] {
    certificates.remove(principalHash);
  };

  // === CERTIFICATE ID MANAGEMENT ===
  public func getNextId(currentId: CertificateId): CertificateId {
    currentId + 1;
  };

  // === HELPER FUNCTIONS ===
  public func principalToHash(p: Principal): Nat32 {
    Principal.hash(p);
  };

  public func getAllCertificates(certificates: CertificateStorage): [(Nat32, [Types.Certificate])] {
    Iter.toArray(certificates.entries());
  };

  public func getAllUsers(users: UserStorage): [(Principal, Types.User)] {
    Iter.toArray(users.entries());
  };

  // Function to find certificate by ID across all users
  public func findCertificateById(certificates: CertificateStorage, certId: Nat): ?Types.Certificate {
    for ((_, userCerts) in certificates.entries()) {
      for (cert in userCerts.vals()) {
        if (cert.id == certId) {
          return ?cert;
        };
      };
    };
    null;
  };

  // Function to get user's completed courses
  public func getUserCompletedCourses(users: UserStorage, principal: Principal): [Text] {
    switch (users.get(principal)) {
      case (?user) user.completedCourses;
      case null [];
    };
  };

  // Function to add course to user's completed courses
  public func addCompletedCourse(users: UserStorage, principal: Principal, courseName: Text): () {
    let existingUser = users.get(principal);
    let updatedUser : Types.User = {
      name = switch (existingUser) { case (?u) u.name; case null "Anonymous" };
      email = switch (existingUser) { case (?u) u.email; case null null };
      completedCourses = switch (existingUser) { 
        case (?u) Array.append(u.completedCourses, [courseName]); 
        case null [courseName]; 
      };
    };
    users.put(principal, updatedUser);
  };
}