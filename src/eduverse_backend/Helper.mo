import Principal "mo:base/Principal";
import Int "mo:base/Int";
import Nat32 "mo:base/Nat32";

module {
  public func principalKey(p : Principal) : { hash : Nat32; key : Principal } {
    { hash = Principal.hash(p); key = p };
  };

  public func principalKeyText(p : Principal) : { hash : Text; key : Principal } {
    { hash = Principal.toText(p); key = p };
  };

  public func formatTime(t : Int) : Text {
    let seconds = t / 1_000_000_000;
    Int.toText(seconds);
  };

  // Helper function to convert Principal to a simple Nat hash
  public func principalToNat(p : Principal) : Nat {
    let hash32 = Principal.hash(p);
    Nat32.toNat(hash32);
  };
}