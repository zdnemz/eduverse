import Principal "mo:base/Principal";
import HashMap "mo:base/HashMap";
import Iter "mo:base/Iter";
import Types "../Types";

module {
  public type UserStorage = HashMap.HashMap<Principal, Types.User>;

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
}