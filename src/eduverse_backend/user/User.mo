import Principal "mo:base/Principal";
import Result "mo:base/Result";
import Array "mo:base/Array";
import Types "../Types";
import Debug "mo:base/Debug";
import Storage "../Storage";

module {
  public class UserManager() {

    private var users = Storage.createEmptyUsers();

    private let adminList : [Principal] = [
      Principal.fromText("gsxgw-6jb4f-hbcmv-qwtfr-mv3pp-pjvkd-i344o-ig7cz-xfirm-srnl4-5ae"),
    ];

    public func updateUser(caller: Principal, name: Text, email: ?Text): Result.Result<Text, Text> {
      if (Principal.isAnonymous(caller)) {
        return #err("Anonymous users cannot update profiles");
      };

      Debug.print("Caller principal: " # Principal.toText(caller));
      for (p in adminList.vals()) {
        Debug.print("Admin list principal: " # Principal.toText(p));
      };

      let existingUser = Storage.getUser(users, caller);

      let role : Types.Role = switch (existingUser) {
        case (?user) user.role;
        case null {
          if (Array.find<Principal>(adminList, func(a) { Principal.equal(a, caller) }) != null) {
            #admin
          } else {
            #student
          }
        };
      };

      let updatedUser : Types.User = {
        name = name;
        email = email;
        completedCourses = switch (existingUser) {
          case (?user) user.completedCourses;
          case null [];
        };
        role = role;
      };
      Storage.putUser(users, caller, updatedUser);

      #ok("Profile updated successfully");
    };

    public func getMyProfile(caller: Principal): ?Types.User {
      Storage.getUser(users, caller);
    };

    public func persistData(): [(Principal, Types.User)] {
      Storage.persistUsers(users);
    };

    public func loadData(userEntries: [(Principal, Types.User)]): () {
      Storage.loadUsers(users, userEntries);
    };

    public func restoreData(userEntries: [(Principal, Types.User)]): () {
      users := Storage.restoreUsers(userEntries);
    };
  };
}
