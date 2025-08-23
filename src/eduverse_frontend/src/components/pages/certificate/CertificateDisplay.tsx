import React from 'react';
import {
  Award,
  BookOpen,
  GraduationCap,
  BookOpenCheck,
  Star,
  Sparkles,
  Trophy,
} from 'lucide-react';
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
      {/* Subtle floating particles */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-20 left-10 h-1 w-1 animate-pulse rounded-full bg-white/30"></div>
        <div className="absolute top-40 right-20 h-1 w-1 animate-bounce rounded-full bg-white/20"></div>
        <div className="absolute bottom-32 left-1/4 h-1 w-1 animate-ping rounded-full bg-white/25"></div>
        <div className="absolute top-1/3 right-1/3 h-0.5 w-0.5 animate-pulse rounded-full bg-white/30"></div>
        <div className="absolute right-10 bottom-20 h-1 w-1 animate-bounce rounded-full bg-white/20"></div>
      </div>

      <div className="relative w-full max-w-4xl">
        {/* Certificate Container */}
        <div className="relative">
          {/* Outer glow effect */}
          <div className="absolute -inset-1 animate-pulse rounded-3xl bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 opacity-30 blur"></div>

          {/* Main Certificate Card */}
          <div className="relative mx-auto max-w-3xl overflow-hidden rounded-3xl border border-white/20 bg-white/95 shadow-2xl backdrop-blur-sm">
            {/* Top decorative border */}
            <div className="h-2 bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600"></div>

            <div className="p-8">
              {/* Certificate Content */}
              <div className="relative rounded-2xl border-4 border-indigo-200/50 bg-gradient-to-br from-slate-50 to-blue-50/50 p-10 text-center shadow-inner">
                {/* Enhanced Decorative Elements */}
                <div className="absolute top-4 left-4 h-16 w-16">
                  <div className="animate-spin-slow h-full w-full rounded-full border-4 border-indigo-300/40"></div>
                  <Star className="absolute top-1/2 left-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 transform text-yellow-500" />
                </div>
                <div className="absolute top-4 right-4 h-16 w-16">
                  <div className="animate-spin-slow h-full w-full rounded-full border-4 border-purple-300/40"></div>
                  <Sparkles className="absolute top-1/2 left-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 transform text-pink-500" />
                </div>
                <div className="absolute bottom-4 left-4 h-12 w-12">
                  <div className="h-full w-full animate-pulse rounded-full border-3 border-green-300/40"></div>
                  <Trophy className="absolute top-1/2 left-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 transform text-green-600" />
                </div>
                <div className="absolute right-4 bottom-4 h-12 w-12">
                  <div className="h-full w-full animate-pulse rounded-full border-3 border-blue-300/40"></div>
                  <Award className="absolute top-1/2 left-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 transform text-blue-600" />
                </div>

                {/* Certificate Header */}
                <div className="relative z-10">
                  {/* Premium Logo Design */}
                  <div className="relative mb-6">
                    <div className="relative mx-auto h-32 w-32">
                      {/* Outer Ring - Golden */}
                      <div className="animate-spin-slow absolute inset-0 rounded-full border-4 border-yellow-400 opacity-90 shadow-lg"></div>

                      {/* Middle Ring - Silver */}
                      <div className="animate-reverse-spin absolute inset-3 rounded-full border-3 border-gray-300 opacity-80"></div>

                      {/* Inner Circle - Premium Dark Background */}
                      <div className="absolute inset-6 flex items-center justify-center rounded-full border-2 border-slate-600 bg-gradient-to-br from-slate-800 via-slate-900 to-black shadow-2xl">
                        {/* Custom Academic Logo */}
                        <div className="relative text-center">
                          {/* Main Symbol */}
                          <div className="relative mb-1">
                            {/* Book Foundation */}
                            <div className="mx-auto mb-1 h-1.5 w-8 rounded-sm bg-gradient-to-r from-blue-400 to-blue-600"></div>

                            {/* Academic Cap */}
                            <div className="relative">
                              <div className="mx-auto h-2.5 w-10 rotate-1 transform rounded-sm bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-500 shadow-lg"></div>
                              <div className="absolute top-0 left-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1 rotate-45 transform rounded-sm border border-yellow-600 bg-gradient-to-br from-yellow-500 to-orange-600 shadow-xl"></div>
                              <div className="absolute top-0 -right-1 h-4 w-0.5 bg-red-500"></div>
                              <div className="absolute top-4 -right-2 h-2 w-1.5 rounded-full bg-gradient-to-b from-red-500 to-red-700"></div>
                            </div>
                          </div>

                          <div className="text-xs font-bold tracking-wider text-white">EDU</div>

                          {/* Sparkle Effects */}
                          <div className="absolute -top-2 -left-3 h-2 w-2 animate-pulse rounded-full bg-yellow-400"></div>
                          <div className="absolute -top-1 right-0 h-1 w-1 animate-ping rounded-full bg-blue-400"></div>
                          <div className="absolute -bottom-1 -left-1 h-1.5 w-1.5 animate-pulse rounded-full bg-orange-400"></div>
                        </div>
                      </div>

                      {/* Premium Glow Effect */}
                      <div className="bg-gradient-conic absolute -inset-8 animate-pulse rounded-full from-yellow-400 via-orange-500 to-yellow-400 opacity-30 blur-xl"></div>

                      {/* Floating Elements */}
                      <div className="absolute -top-4 left-8 h-2 w-2 animate-bounce rounded-full bg-yellow-300 opacity-80"></div>
                      <div className="absolute right-6 -bottom-3 h-1.5 w-1.5 animate-pulse rounded-full bg-blue-300 opacity-70"></div>
                    </div>
                  </div>

                  {/* Enhanced Title */}
                  <h1 className="mb-4 bg-gradient-to-r from-indigo-800 via-purple-700 to-pink-600 bg-clip-text text-5xl font-bold tracking-wider text-transparent">
                    CERTIFICATE OF COMPLETION
                  </h1>

                  {/* Decorative Line with Star */}
                  <div className="mb-8 flex items-center justify-center">
                    <div className="h-1 w-20 rounded-full bg-gradient-to-r from-transparent to-indigo-400"></div>
                    <Star className="animate-spin-slow mx-4 h-6 w-6 text-yellow-500" />
                    <div className="h-1 w-20 rounded-full bg-gradient-to-l from-transparent to-purple-400"></div>
                  </div>

                  <div className="mb-6 text-xl font-medium text-indigo-700">
                    This is to certify that
                  </div>

                  {/* Enhanced Student Name */}
                  <div className="relative mb-8">
                    <div className="mb-3 bg-gradient-to-r from-indigo-800 via-purple-700 to-pink-600 bg-clip-text text-5xl font-bold tracking-wide text-transparent">
                      {userName || 'Distinguished Learner'}
                    </div>
                    <div className="mb-2 flex items-center justify-center">
                      <div className="h-0.5 w-32 rounded-full bg-gradient-to-r from-transparent via-indigo-400 to-transparent"></div>
                    </div>
                    <div className="mt-2 text-sm font-medium tracking-wide text-indigo-500 italic">
                      Student Name
                    </div>
                  </div>

                  <div className="mb-6 text-xl leading-relaxed text-indigo-700">
                    has successfully completed the comprehensive course
                  </div>

                  {/* Enhanced Course Name */}
                  <div className="relative mb-8">
                    <div className="inline-block rounded-2xl border-2 border-indigo-200/50 bg-gradient-to-r from-indigo-50 to-purple-50 p-6 shadow-lg">
                      <div className="mb-2 text-2xl leading-tight font-bold text-indigo-800">
                        "{certificate.courseName}"
                      </div>
                      <div className="text-sm text-indigo-500 italic">Course Title</div>
                    </div>
                  </div>

                  <div className="mb-8 text-lg leading-relaxed text-indigo-700">
                    and has demonstrated mastery of all required competencies
                    <br />
                    to earn this{' '}
                    <span className="bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text font-bold text-transparent">
                      blockchain-verified NFT certificate
                    </span>
                  </div>

                  {/* Enhanced Certificate Details */}
                  <div className="mt-10 flex flex-wrap items-center justify-between gap-6 border-t-2 border-indigo-200 pt-8">
                    <div className="text-left">
                      <div className="mb-2 text-sm font-medium tracking-wide text-indigo-500 uppercase">
                        Completion Date
                      </div>
                      <div className="text-xl font-bold text-indigo-800">
                        {new Date(certificate.completedAt / 1000000).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="mx-auto mb-3 flex h-20 w-20 animate-pulse items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-purple-700 shadow-2xl">
                        <Award className="h-10 w-10 text-white" />
                      </div>
                      <div className="text-lg font-bold text-indigo-600">Verified</div>
                    </div>

                    <div className="text-right">
                      <div className="mb-2 text-sm font-medium tracking-wide text-indigo-500 uppercase">
                        Issuer
                      </div>
                      <div className="text-xl font-bold text-indigo-800">{certificate.issuer}</div>
                    </div>
                  </div>

                  {/* Enhanced Certificate Meta Info */}
                  <div className="mt-8 border-t border-indigo-100 pt-6 text-sm">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="rounded-lg bg-indigo-50/50 p-3">
                        <span className="font-semibold text-indigo-600">Certificate ID:</span> #
                        {certificate.tokenId}
                      </div>
                      <div className="rounded-lg bg-purple-50/50 p-3">
                        <span className="font-semibold text-purple-600">Hash:</span>{' '}
                        {certificate.certificateHash.slice(0, 12)}...
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Action Buttons */}
        <div className="mt-8 text-center">
          <div className="flex flex-wrap justify-center gap-6">
            <button
              onClick={onViewCertificate}
              className="group relative flex items-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-700 px-8 py-4 font-bold text-white shadow-xl transition-all duration-300 hover:scale-105 hover:from-indigo-700 hover:to-purple-800 hover:shadow-2xl"
            >
              <div className="absolute inset-0 translate-y-full bg-gradient-to-r from-yellow-400/20 to-pink-400/20 transition-transform duration-300 group-hover:translate-y-0"></div>
              <div className="relative flex items-center gap-3">
                <Award className="h-5 w-5 transition-transform group-hover:rotate-12" />
                View Full Certificate
              </div>
            </button>

            <button
              onClick={onViewMaterials}
              className="group relative flex items-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-700 px-8 py-4 font-bold text-white shadow-xl transition-all duration-300 hover:scale-105 hover:from-blue-700 hover:to-cyan-800 hover:shadow-2xl"
            >
              <div className="absolute inset-0 translate-y-full bg-gradient-to-r from-green-400/20 to-blue-400/20 transition-transform duration-300 group-hover:translate-y-0"></div>
              <div className="relative flex items-center gap-3">
                <BookOpen className="h-5 w-5 transition-transform group-hover:scale-110" />
                Review Materials
              </div>
            </button>

            <button
              onClick={onChooseNewCourse}
              className="group relative flex items-center gap-3 overflow-hidden rounded-2xl border-2 border-indigo-200 bg-white px-8 py-4 font-bold text-indigo-700 shadow-xl transition-all duration-300 hover:scale-105 hover:border-indigo-300 hover:bg-gray-50 hover:shadow-2xl"
            >
              <BookOpenCheck className="h-5 w-5 transition-transform group-hover:scale-110" />
              Choose New Course
            </button>
          </div>

          {/* Enhanced Share Certificate */}
          <div className="mt-8">
            <button
              onClick={() => {
                navigator.clipboard.writeText(
                  window.location.href + '/certificate/' + certificate.tokenId
                );
                toast.success('Certificate link copied to clipboard!');
              }}
              className="font-medium text-white/90 decoration-2 underline-offset-4 transition-colors duration-300 hover:text-white hover:underline"
            >
              <span className="mr-2 text-2xl">📋</span>
              Share Certificate Link
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificateDisplay;
