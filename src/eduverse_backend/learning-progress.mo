import Principal "mo:base/Principal";
import Time "mo:base/Time";
import HashMap "mo:base/HashMap";
import Text "mo:base/Text";
import Iter "mo:base/Iter";
import Nat "mo:base/Nat";
import Nat32 "mo:base/Nat32";

persistent actor {

    type Modul = {
        id : Nat;
        title : Text;
        content : Text;
        quizAvailable : Bool;
    };

    type ModulStatus = {
        completed : Bool;
        completedAt : ?Int;
    };

    // Tipe untuk penyimpanan internal (pakai HashMap)
    type UserProgress = {
        modulStatus : HashMap.HashMap<Nat, ModulStatus>;
        lastVisited : Nat;
    };

    // Tipe untuk return query (pakai array tuple)
    type UserProgressShared = {
        modulStatus : [(Nat, ModulStatus)];
        lastVisited : Nat;
    };

    let modulList : [Modul] = [
        {
            id = 0;
            title = "Pengenalan Motoko";
            content = "Motoko adalah ...";
            quizAvailable = true;
        },
        {
            id = 1;
            title = "Tipe Data";
            content = "Tipe data dalam Motoko ...";
            quizAvailable = true;
        },
        {
            id = 2;
            title = "Fungsi dan Aktor";
            content = "Fungsi di Motoko ...";
            quizAvailable = false;
        },
    ];

    // Custom hash function for Nat values
    func natHash(n : Nat) : Nat32 {
        var hash : Nat32 = 0;
        var temp = n;
        while (temp > 0) {
            hash := hash * 31 + Nat32.fromNat(temp % 256);
            temp := temp / 256;
        };
        hash;
    };

    var userProgressEntries : [(Principal, ([(Nat, ModulStatus)], Nat))] = [];

    // Explicitly declare as transient and use proper hash function
    transient var userProgressMap = HashMap.HashMap<Principal, UserProgress>(10, Principal.equal, Principal.hash);

    system func preupgrade() {
        userProgressEntries := Iter.toArray(
            Iter.map<(Principal, UserProgress), (Principal, ([(Nat, ModulStatus)], Nat))>(
                userProgressMap.entries(),
                func((k, v) : (Principal, UserProgress)) : (Principal, ([(Nat, ModulStatus)], Nat)) {
                    (
                        k,
                        (
                            Iter.toArray(v.modulStatus.entries()),
                            v.lastVisited,
                        ),
                    );
                },
            )
        );
    };

    system func postupgrade() {
        userProgressMap := HashMap.HashMap<Principal, UserProgress>(10, Principal.equal, Principal.hash);
        for ((principal, (modulStatusArr, lastVisited)) in userProgressEntries.vals()) {
            // Use custom hash function for Nat values
            let modulStatusMap = HashMap.HashMap<Nat, ModulStatus>(10, Nat.equal, natHash);
            for ((modulId, status) in modulStatusArr.vals()) {
                modulStatusMap.put(modulId, status);
            };
            userProgressMap.put(
                principal,
                {
                    modulStatus = modulStatusMap;
                    lastVisited = lastVisited;
                },
            );
        };
        userProgressEntries := [];
    };

    public query func getModulList() : async [Modul] {
        modulList;
    };

    public query func getMyProgress({ caller } : { caller : Principal }) : async ?UserProgressShared {
        switch (userProgressMap.get(caller)) {
            case null return null;
            case (?p) return ?{
                modulStatus = Iter.toArray(p.modulStatus.entries());
                lastVisited = p.lastVisited;
            };
        };
    };

    public func completeModul({ caller } : { caller : Principal }, modulId : Nat) : async Bool {
        if (modulId >= modulList.size()) return false;

        let user = caller;

        let progress = switch (userProgressMap.get(user)) {
            case null {
                {
                    // Use custom hash function for Nat values
                    modulStatus = HashMap.HashMap<Nat, ModulStatus>(10, Nat.equal, natHash);
                    lastVisited = modulId;
                };
            };
            case (?p) {
                {
                    modulStatus = p.modulStatus;
                    lastVisited = modulId;
                };
            };
        };

        progress.modulStatus.put(
            modulId,
            {
                completed = true;
                completedAt = ?Time.now();
            },
        );

        userProgressMap.put(user, progress);
        return true;
    };

    public query func getModulStatus({ caller } : { caller : Principal }, modulId : Nat) : async ?ModulStatus {
        switch (userProgressMap.get(caller)) {
            case null return null;
            case (?p) return p.modulStatus.get(modulId);
        };
    };
};