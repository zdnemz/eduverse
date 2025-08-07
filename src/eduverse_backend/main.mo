import Principal "mo:base/Principal";
import Result "mo:base/Result";
import Types "./Types";
import Certificate "./certificate/Certificate";
import User "./user/User";

persistent actor class CertificateManager() : async CertificateManager = this {

   var savedUserData: [(Principal, Types.User)] = [];
   var savedCertificateData: [(Nat32, [Types.Certificate])] = [];
   var savedNextCertId: Nat = 1;

  transient let certificateManager = Certificate.CertificateManager();
  transient let userManager = User.UserManager();

  public shared({ caller }) func claimCertificate(courseName: Text): async Result.Result<Types.Certificate, Text> {
    return certificateManager.claimCertificate(caller, courseName);
  };

  public query({ caller }) func getMyCertificates(): async [Types.Certificate] {
    return certificateManager.getMyCertificates(caller);
  };

  public shared({ caller }) func updateUser(name: Text, email: ?Text): async Result.Result<Text, Text> {
    return userManager.updateUser(caller, name, email);
  };

  public query({ caller }) func getMyProfile(): async ?Types.User {
    return userManager.getMyProfile(caller);
  };

  system func preupgrade() {
    let data = certificateManager.persistData();
    savedUserData := data.users;
    savedCertificateData := data.certificates;
    savedNextCertId := data.nextCertId;
  };

  system func postupgrade() {
    certificateManager.loadData({
      users = savedUserData;
      certificates = savedCertificateData;
      nextCertId = savedNextCertId;
    });
  };
};
