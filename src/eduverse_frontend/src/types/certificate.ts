export interface Certificate {
  tokenId: number;
  userId: string;
  courseId: number;
  courseName: string;
  completedAt: number;
  issuer: string;
  certificateHash: string;
  metadata: {
    name: string;
    description: string;
    image: string;
    attributes: Array<{ trait_type: string; value: string }>;
  };
}

export interface CertificateDisplayProps {
  certificate: Certificate;
  onViewCertificate: () => void;
  onViewMaterials: () => void;
  onChooseNewCourse: () => void;
  userName?: string;
  currentUserId?: string | null;
}
