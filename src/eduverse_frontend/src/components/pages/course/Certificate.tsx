// components/course/Certificate.tsx
import { motion } from 'framer-motion';
import { Award, Download, Calendar, Star } from 'lucide-react';

interface CertificateProps {
  courseTitle: string;
  studentName: string;
  completionDate: string;
  score: string;
  onDownload: () => void;
}

export default function Certificate({
  courseTitle,
  studentName,
  completionDate,
  score,
  onDownload,
}: CertificateProps) {
  return (
    <motion.div
      className="card from-primary to-secondary text-primary-content bg-gradient-to-br shadow-2xl"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="card-body p-8 text-center">
        {/* Header */}
        <div className="mb-6 flex justify-center">
          <div className="bg-primary-content/20 rounded-full p-4">
            <Award className="text-primary-content h-12 w-12" />
          </div>
        </div>

        <h1 className="mb-2 text-3xl font-bold">Certificate of Completion</h1>
        <div className="divider divider-primary"></div>

        {/* Content */}
        <div className="space-y-6">
          <div>
            <p className="text-primary-content/80 mb-2 text-lg">This is to certify that</p>
            <h2 className="text-primary-content text-4xl font-bold">{studentName}</h2>
          </div>

          <div>
            <p className="text-primary-content/80 mb-2 text-lg">has successfully completed</p>
            <h3 className="text-primary-content text-2xl font-semibold">{courseTitle}</h3>
          </div>

          {/* Details */}
          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="bg-primary-content/10 rounded-lg p-4">
              <div className="mb-2 flex items-center justify-center gap-2">
                <Calendar className="h-5 w-5" />
                <span className="font-semibold">Completion Date</span>
              </div>
              <p className="text-primary-content/90">{completionDate}</p>
            </div>

            <div className="bg-primary-content/10 rounded-lg p-4">
              <div className="mb-2 flex items-center justify-center gap-2">
                <Star className="h-5 w-5" />
                <span className="font-semibold">Final Score</span>
              </div>
              <p className="text-primary-content/90">{score}%</p>
            </div>
          </div>

          {/* Signature Section */}
          <div className="border-primary-content/20 mt-8 border-t pt-6">
            <div className="text-center">
              <div className="border-primary-content/30 mx-auto mb-2 w-48 border-b"></div>
              <p className="text-primary-content/80 text-sm">EduVerse Platform</p>
              <p className="text-primary-content/60 text-xs">Digital Certificate</p>
            </div>
          </div>
        </div>

        {/* Download Button */}
        <div className="card-actions mt-8 justify-center">
          <button
            onClick={onDownload}
            className="btn btn-primary btn-lg bg-primary-content/20 border-primary-content/30 text-primary-content hover:bg-primary-content/30"
          >
            <Download className="mr-2 h-5 w-5" />
            Download Certificate
          </button>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-4 left-4 opacity-20">
          <Award className="h-8 w-8" />
        </div>
        <div className="absolute top-4 right-4 opacity-20">
          <Award className="h-8 w-8" />
        </div>
        <div className="absolute bottom-4 left-4 opacity-20">
          <Award className="h-8 w-8" />
        </div>
        <div className="absolute right-4 bottom-4 opacity-20">
          <Award className="h-8 w-8" />
        </div>
      </div>
    </motion.div>
  );
}
