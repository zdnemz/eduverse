import Principal "mo:base/Principal";
import Result "mo:base/Result";
import Time "mo:base/Time";
import Int "mo:base/Int";
import Nat "mo:base/Nat";

import Types "../Types";
import Storage "../Storage";

module {
  public class CertificateManager() {
    // Create storage instances using functional approach
    private var users = Storage.createEmptyUsers();
    private var certificates = Storage.createEmptyCertificates();
    private var nextCertificateId : Nat = 1;

    public func claimCertificate(caller: Principal, courseName: Text, courseId: Nat, finalScore: Nat): Result.Result<Types.Certificate, Text> {
      if (Principal.isAnonymous(caller)) {
        return #err("Anonymous users cannot claim certificates");
      };

      let currentTime = Time.now(); // Keep as Int for timestamps

      let newCert : Types.Certificate = {
        tokenId = nextCertificateId;
        userId = caller;
        courseId = courseId;
        courseName = courseName;
        completedAt = currentTime;
        finalScore = finalScore; // Added missing field
        issuer = "Eduverse Academy";
        certificateHash = "cert_" # Nat.toText(nextCertificateId) # "_" # Principal.toText(caller);
        metadata = {
          name = "Certificate of Completion - " # courseName;
          description = "This NFT certificate confirms successful completion of " # courseName # " course on Eduverse Academy platform.";
          image = "https://eduverse.academy/certificates/" # Nat.toText(nextCertificateId) # ".png";
          attributes = [
            { trait_type = "Course"; value = courseName },
            { trait_type = "Completion Date"; value = Nat.toText(Int.abs(currentTime) / 1000000000) },
            { trait_type = "Final Score"; value = Nat.toText(finalScore) } // Added score to metadata
          ];
        };
      };

      // Add certificate to storage using the certificate ID as key
      Storage.putCertificate(certificates, nextCertificateId, newCert);
      
      // Increment certificate ID
      nextCertificateId += 1;

      // Ensure user exists in storage
      let existingUser = Storage.getUser(users, caller);
      let updatedUser : Types.User = switch (existingUser) {
        case (?user) {
          {
            id = user.id;
            name = user.name;
            email = user.email;
            createdAt = user.createdAt;
            updatedAt = ?currentTime;
          }
        };
        case null {
          {
            id = caller;
            name = "User";
            email = null;
            createdAt = currentTime;
            updatedAt = null;
          }
        };
      };

      Storage.putUser(users, caller, updatedUser);

      #ok(newCert);
    };

    public func getMyCertificates(caller: Principal): [Types.Certificate] {
      // Get all certificates and filter by owner
      Storage.getUserCertificates(certificates, caller);
    };

    public func getCertificateById(certId: Nat): ?Types.Certificate {
      Storage.getCertificate(certificates, certId);
    };

    // Persistence functions
    public func persistData(): {
      users: [(Principal, Types.User)];
      certificates: [(Nat, Types.Certificate)];
      nextCertId: Nat;
    } {
      {
        users = Storage.persistUsers(users);
        certificates = Storage.persistCertificates(certificates);
        nextCertId = nextCertificateId;
      };
    };

    public func loadData(data: {
      users: [(Principal, Types.User)];
      certificates: [(Nat, Types.Certificate)];
      nextCertId: Nat;
    }): () {
      users := Storage.restoreUsers(data.users);
      certificates := Storage.restoreCertificates(data.certificates);
      nextCertificateId := data.nextCertId;
    };

    // Helper functions
    public func getAllUsers(): [(Principal, Types.User)] {
      Storage.getAllUsers(users);
    };

    public func getAllCertificates(): [(Nat, Types.Certificate)] {
      Storage.getAllCertificates(certificates);
    };
  };
}