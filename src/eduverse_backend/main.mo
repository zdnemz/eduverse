import Principal "mo:base/Principal";
import HashMap "mo:base/HashMap";
import Trie "mo:base/Trie";
import Time "mo:base/Time";
import Text "mo:base/Text";
import Nat "mo:base/Nat";
import Int "mo:base/Int";
import Array "mo:base/Array";
import Result "mo:base/Result";
import Iter "mo:base/Iter";
// import Debug "mo:base/Debug";


actor CertificateManager {
    // ===== DATA TYPE =====
    public type User = {
        name : Text;
        email : ?Text;
        completedCourses : [Text];
    };

    public type Certificate = {
        id : Nat;
        courseName : Text;
        dateIssued : Text;
        owner : Principal;
    };

    // ===== STABLE STORAGE =====
    stable var nextCertificateId : Nat = 0;
    stable var certificates : Trie.Trie<Principal, [Certificate]> = Trie.empty();
    stable var userEntries : [(Principal, User)] = [];

    // ===== IN-MEMORY STORAGE =====
    private var users = HashMap.fromIter<Principal, User>(
        userEntries.vals(), 
        1, 
        Principal.equal, 
        Principal.hash
    );

    // ===== HELPER FUNCTION =====
    private func principalKey(p : Principal) : Trie.Key<Principal> {
        { hash = Principal.hash(p); key = p };
    };

    private func formatTime(t : Int) : Text {
        let seconds = t / 1_000_000_000;
        Int.toText(seconds);
    };

    // ===== MAIN FUNCTION =====
    public shared({ caller }) func claimCertificate(courseName : Text) : async Result.Result<Certificate, Text> {
      
        if (Principal.isAnonymous(caller)) {
            return #err("Anonymous users cannot claim certificates");
        };

        let newCert : Certificate = {
            id = nextCertificateId;
            courseName = courseName;
            dateIssued = formatTime(Time.now());
            owner = caller;
        };

        // Update certificates
        let existingCerts = Trie.get(certificates, principalKey(caller), Principal.equal);
        let updatedCerts = switch (existingCerts) {
            case (?certs) Array.append(certs, [newCert]);
            case null [newCert];
        };
        certificates := Trie.put(
            certificates, 
            principalKey(caller), 
            Principal.equal, 
            updatedCerts
        ).0;
        nextCertificateId += 1;

        // Update user
        let existingUser = users.get(caller);
        let updatedUser : User = {
            name = switch (existingUser) { case (?u) u.name; case null "Anonymous" };
            email = switch (existingUser) { case (?u) u.email; case null null };
            completedCourses = switch (existingUser) { 
                case (?u) Array.append(u.completedCourses, [courseName]); 
                case null [courseName] 
            };
        };
        users.put(caller, updatedUser);
        userEntries := Iter.toArray(users.entries());

        #ok(newCert);
    };

    public query({ caller }) func getMyCertificates() : async [Certificate] {
        switch (Trie.get(certificates, principalKey(caller), Principal.equal)) {
            case (?certs) certs;
            case null [];
        }
    };

    public shared({ caller }) func updateUser(name : Text, email : ?Text) : async Result.Result<Text, Text> {
        if (Principal.isAnonymous(caller)) {
            return #err("Anonymous users cannot update profiles");
        };

        let existingUser = users.get(caller);
        let updatedUser : User = {
            name = name;
            email = email;
            completedCourses = switch (existingUser) {
                case (?user) user.completedCourses;
                case null [];
            };
        };
        users.put(caller, updatedUser);

        userEntries := Iter.toArray(users.entries());

        #ok("Profile updated successfully");
    };

    public query({ caller }) func getMyProfile() : async ?User {
      let userOpt = users.get(caller);   
      return userOpt;
    };

    // ===== UPGRADE HANDLING =====
    system func preupgrade() {
        userEntries := Iter.toArray(users.entries());
    };

    system func postupgrade() {
        users := HashMap.fromIter<Principal, User>(
            userEntries.vals(),
            1,
            Principal.equal,
            Principal.hash
        );
    };
};