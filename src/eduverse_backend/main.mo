import Principal "mo:base/Principal";
import Result "mo:base/Result";
import Array "mo:base/Array";
import Types "./Types";
import Certificate "./certificate/Certificate";
import User "./user/User";
import Courses "./learning/Courses";
import CourseContent "./learning/Module";
import Text "mo:base/Text";

persistent actor EduverseBackend {

  // Persistent data variables
  private var savedUserData: [(Principal, Types.User)] = [];
  private var savedCertificateData: [(Nat32, [Types.Certificate])] = [];
  private var savedNextCertId: Nat = 1;

  // Transient managers
  private transient let certificateManager = Certificate.CertificateManager();
  private transient let userManager = User.UserManager();

  // Certificate functions
  public shared({ caller }) func claimCertificate(courseName: Text): async Result.Result<Types.Certificate, Text> {
    certificateManager.claimCertificate(caller, courseName)
  };

  public query({ caller }) func getMyCertificates(): async [Types.Certificate] {
    certificateManager.getMyCertificates(caller)
  };

  // User functions
  public shared({ caller }) func updateUser(name: Text, email: ?Text): async Result.Result<Text, Text> {
    userManager.updateUser(caller, name, email)
  };

  public query({ caller }) func getMyProfile(): async ?Types.User {
    userManager.getMyProfile(caller)
  };

  // Course functions
  public query func getCourses(): async [Types.CourseInfo] {
    Courses.courses
  };

  public query func getCourse(courseId: Nat): async ?Types.CourseInfo {
    Array.find(Courses.courses, func(course: Types.CourseInfo): Bool {
      course.id == courseId
    })
  };

  public query func getCourseContent(courseId: Nat): async ?Types.CourseContent {
    Array.find(CourseContent.courseContents, func(content: Types.CourseContent): Bool {
      content.courseId == courseId
    })
  };

  public query func getCoursesByCategory(category: Text): async [Types.CourseInfo] {
    Array.filter(Courses.courses, func(course: Types.CourseInfo): Bool {
      course.category == category
    })
  };

  public query func searchCourses(searchQuery: Text): async [Types.CourseInfo] {
    let lowerQuery = Text.toLowercase(searchQuery);

    Array.filter(Courses.courses, func(course: Types.CourseInfo): Bool {
      Text.toLowercase(course.title) == lowerQuery
        or Text.toLowercase(course.instructor) == lowerQuery
        or Text.toLowercase(course.category) == lowerQuery
    })
  };

  // System functions for upgrades
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
}