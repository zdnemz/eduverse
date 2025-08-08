import Principal "mo:base/Principal";
import Result "mo:base/Result";
import Array "mo:base/Array";
import Time "mo:base/Time";
import Nat32 "mo:base/Nat32";

import Types "../Types";
import Storage "../Storage";
import Helper "../Helper";

module {
  public class CertificateManager() {
    // Create storage instances using functional approach
    private var users = Storage.createEmptyUsers();
    private var certificates = Storage.createEmptyCertificates();
    private var nextCertificateId : Nat = 1;

    public func claimCertificate(caller: Principal, courseName: Text): Result.Result<Types.Certificate, Text> {
      if (Principal.isAnonymous(caller)) {
        return #err("Anonymous users cannot claim certificates");
      };

      let newCert : Types.Certificate = {
        id = nextCertificateId;
        courseName = courseName;
        dateIssued = Helper.formatTime(Time.now());
        owner = caller;
      };

      // Get principal hash for certificate storage
      let principalHash = Helper.principalToNat(caller);
      let principalHash32 = Nat32.fromNat(principalHash % (2**32)); // Convert to Nat32

      // Add certificate to user's collection
      let existingCerts = Storage.getCertificates(certificates, principalHash32);
      let updatedCerts = switch (existingCerts) {
        case (?certs) Array.append(certs, [newCert]);
        case null [newCert];
      };
      Storage.putCertificates(certificates, principalHash32, updatedCerts);
      
      // Increment certificate ID
      nextCertificateId += 1;

      // Update user's completed courses
      let existingUser = Storage.getUser(users, caller);
      let updatedUser : Types.User = {
        name = switch (existingUser) { case (?u) u.name; case null "Anonymous" };
        email = switch (existingUser) { case (?u) u.email; case null null };
        completedCourses = switch (existingUser) { 
          case (?u) Array.append(u.completedCourses, [courseName]); 
          case null [courseName]; 
        };
        role = switch (existingUser) {
          case (?u) u.role;
          case null #student;
        };
      };

      Storage.putUser(users, caller, updatedUser);

      #ok(newCert);
    };

    public func getMyCertificates(caller: Principal): [Types.Certificate] {
      let principalHash = Helper.principalToNat(caller);
      let principalHash32 = Nat32.fromNat(principalHash % (2**32));
      
      switch (Storage.getCertificates(certificates, principalHash32)) {
        case (?certs) certs;
        case null [];
      };
    };

    public func getCertificateById(certId: Nat): ?Types.Certificate {
      Storage.findCertificateById(certificates, certId);
    };

    // Persistence functions
    public func persistData(): {
      users: [(Principal, Types.User)];
      certificates: [(Nat32, [Types.Certificate])];
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
      certificates: [(Nat32, [Types.Certificate])];
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

    public func getAllCertificates(): [(Nat32, [Types.Certificate])] {
      Storage.getAllCertificates(certificates);
    };
  };
}