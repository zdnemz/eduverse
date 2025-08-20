// CertificateDisplay.tsx - Komponen Sertifikat yang dipisahkan
import React from 'react';
import { Award, BookOpen, GraduationCap, BookOpenCheck } from 'lucide-react';
import { toast } from 'sonner';
import { CertificateDisplayProps } from '@/types/certificate';

const CertificateDisplay: React.FC<CertificateDisplayProps> = ({
  certificate,
  onViewCertificate,
  onViewMaterials,
  onChooseNewCourse,
  userName,
  currentUserId,
}) => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-transparent p-4">
      <div className="w-full max-w-4xl">
        {/* Certificate Container - WHITE BACKGROUND */}
        <div className="border-navy-200 mx-auto max-w-3xl rounded-2xl border-4 bg-white p-8 shadow-2xl">
          {/* Certificate Content */}
          <div className="border-navy-300 from-navy-50 relative rounded-lg border-4 bg-gradient-to-br to-blue-50 p-8 text-center">
            {/* Decorative Elements */}
            <div className="border-navy-200 absolute top-4 left-4 h-16 w-16 rounded-full border-4 opacity-20"></div>
            <div className="border-navy-200 absolute top-4 right-4 h-16 w-16 rounded-full border-4 opacity-20"></div>
            <div className="border-navy-200 absolute bottom-4 left-4 h-12 w-12 rounded-full border-4 opacity-20"></div>
            <div className="border-navy-200 absolute right-4 bottom-4 h-12 w-12 rounded-full border-4 opacity-20"></div>

            {/* Certificate Header */}
            <div className="relative z-10">
              <div className="text-navy-600 mb-6">
                <GraduationCap size={80} className="mx-auto" />
              </div>

              <h1 className="text-navy-800 mb-4 text-4xl font-bold tracking-wide">
                CERTIFICATE OF COMPLETION
              </h1>

              <div className="from-navy-400 mx-auto mb-8 h-1 w-32 rounded-full bg-gradient-to-r to-blue-500"></div>

              <div className="text-navy-600 mb-6 text-lg font-medium">This is to certify that</div>

              {/* Student Name - ENHANCED STYLING */}
              <div className="relative mb-8">
                <div className="text-navy-800 mb-2 text-4xl font-bold tracking-wide">
                  {userName || 'Distinguished Learner'}
                </div>
                <div className="bg-navy-300 mx-auto h-0.5 w-64"></div>
                <div className="text-navy-500 mt-2 text-sm italic">Student Name</div>
              </div>

              <div className="text-navy-700 mb-6 text-lg leading-relaxed">
                has successfully completed the comprehensive course
              </div>

              {/* Course Name - ENHANCED STYLING */}
              <div className="relative mb-8">
                <div className="text-navy-800 mb-2 text-2xl leading-tight font-bold">
                  "{certificate.courseName}"
                </div>
                <div className="text-navy-500 text-sm italic">Course Title</div>
              </div>

              <div className="text-navy-600 mb-8">
                and has demonstrated mastery of all required competencies
                <br />
                to earn this blockchain-verified NFT certificate
              </div>

              {/* Certificate Details */}
              <div className="border-navy-200 mt-10 flex items-center justify-between border-t-2 pt-8">
                <div className="text-left">
                  <div className="text-navy-500 mb-1 text-sm tracking-wide uppercase">
                    Completion Date
                  </div>
                  <div className="text-navy-800 text-lg font-semibold">
                    {new Date(certificate.completedAt / 1000000).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </div>
                </div>

                <div className="text-center">
                  <div className="from-navy-500 mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br to-blue-600">
                    <Award className="h-8 w-8 text-white" />
                  </div>
                  <div className="text-navy-600 text-sm font-medium">Verified</div>
                </div>

                <div className="text-right">
                  <div className="text-navy-500 mb-1 text-sm tracking-wide uppercase">Issuer</div>
                  <div className="text-navy-800 text-lg font-semibold">{certificate.issuer}</div>
                </div>
              </div>

              {/* Certificate Meta Info */}
              <div className="text-navy-400 border-navy-100 mt-8 border-t pt-4 text-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="font-medium">Certificate ID:</span> #{certificate.tokenId}
                  </div>
                  <div>
                    <span className="font-medium">Hash:</span>{' '}
                    {certificate.certificateHash.slice(0, 12)}...
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons - ENHANCED DESIGN */}
        <div className="mt-8 text-center">
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={onViewCertificate}
              className="group from-navy-600 to-navy-700 hover:from-navy-700 hover:to-navy-800 flex items-center gap-3 rounded-xl bg-gradient-to-r px-8 py-4 font-semibold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl"
            >
              <Award className="h-5 w-5 transition-transform group-hover:rotate-12" />
              View Full Certificate
            </button>

            <button
              onClick={onViewMaterials}
              className="group flex items-center gap-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-4 font-semibold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:from-blue-700 hover:to-blue-800 hover:shadow-xl"
            >
              <BookOpen className="h-5 w-5 transition-transform group-hover:scale-110" />
              Review Materials
            </button>

            <button
              onClick={onChooseNewCourse}
              className="group border-navy-300 text-navy-700 hover:bg-navy-50 hover:border-navy-400 flex items-center gap-3 rounded-xl border-2 bg-white px-8 py-4 font-semibold shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl"
            >
              <BookOpenCheck className="h-5 w-5 transition-transform group-hover:scale-110" />
              Choose New Course
            </button>
          </div>

          {/* Share Certificate */}
          <div className="mt-6">
            <button
              onClick={() => {
                navigator.clipboard.writeText(
                  window.location.href + '/certificate/' + certificate.tokenId
                );
                toast.success('Certificate link copied to clipboard!');
              }}
              className="text-navy-600 hover:text-navy-800 decoration-navy-300 hover:decoration-navy-500 font-medium underline transition-colors"
            >
              📋 Share Certificate Link
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificateDisplay;
