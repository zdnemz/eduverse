import Principal "mo:base/Principal";
import Result "mo:base/Result";
import Types "../Types";
import Storage "../Storage";

module {
  public class UserManager() {
    private var users = Storage.createEmptyUsers();

    public func updateUser(caller: Principal, name: Text, email: ?Text): Result.Result<Text, Text> {
      if (Principal.isAnonymous(caller)) {
        return #err("Anonymous users cannot update profiles");
      };

      let existingUser = Storage.getUser(users, caller);
      let updatedUser : Types.User = {
        name = name;
        email = email;
        completedCourses = switch (existingUser) {
          case (?user) user.completedCourses;
          case null [];
        };
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