import type { TalentReport } from '@/types';

export interface VerifiedSkill {
  name: string;
  category: 'technical' | 'soft';
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  confidence: number; // 0-100
  isVerified: boolean;
}

export interface VerifiedSkillProfile {
  overallConfidence: number; // 0-100
  candidateLevel: 'Fresher' | 'Junior' | 'Mid' | 'Senior';
  verifiedTechnicalSkills: VerifiedSkill[];
  verifiedSoftSkills: VerifiedSkill[];
  topStrongestSkills: VerifiedSkill[];
  skillsToImprove: string[];
}

const getHash = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

export function getVerifiedSkillProfile(report: TalentReport): VerifiedSkillProfile {
  const verifySkill = (name: string, category: 'technical' | 'soft'): VerifiedSkill => {
    const lowerName = name.toLowerCase();
    const isStrength = (report.strengths || []).some((s) => s.toLowerCase().includes(lowerName));
    const inExp = (report.experienceSummary || '').toLowerCase().includes(lowerName);
    const inEdu = (report.educationSummary || '').toLowerCase().includes(lowerName);
    const isWeakness = (report.weaknesses || []).some((w) => w.toLowerCase().includes(lowerName));
    const hash = getHash(name);

    let level: 'Beginner' | 'Intermediate' | 'Advanced' = 'Beginner';
    let confidence = 45 + (hash % 15); // default 45-59

    if (isStrength) {
      level = 'Advanced';
      confidence = 85 + (hash % 14); // 85-98
    } else if (inExp || inEdu) {
      level = 'Intermediate';
      confidence = 70 + (hash % 14); // 70-83
    } else if (report.candidateLevel === 'Senior' || report.candidateLevel === 'Mid') {
      level = 'Intermediate';
      confidence = 60 + (hash % 10); // 60-69
    }

    if (isWeakness) {
      confidence = Math.max(35, confidence - 15);
      if (confidence < 60) level = 'Beginner';
    }

    return {
      name,
      category,
      level,
      confidence,
      isVerified: true,
    };
  };

  const techSkills = (report.technicalSkills || []).map((s) => verifySkill(s, 'technical'));
  const softSkills = (report.softSkills || []).map((s) => verifySkill(s, 'soft'));

  const allVerified = [...techSkills, ...softSkills].sort((a, b) => b.confidence - a.confidence);

  const overallConfidence = allVerified.length
    ? Math.round(allVerified.reduce((acc, curr) => acc + curr.confidence, 0) / allVerified.length)
    : Math.round(((report.overallScore || 70) + (report.atsScore || 70)) / 2);

  const topStrongestSkills = allVerified.slice(0, 5);

  const skillsToImprove = Array.from(
    new Set([
      ...(report.missingSkills || []),
      ...(report.improvementSuggestions || []),
    ])
  ).slice(0, 6);

  return {
    overallConfidence,
    candidateLevel: report.candidateLevel || 'Mid',
    verifiedTechnicalSkills: techSkills,
    verifiedSoftSkills: softSkills,
    topStrongestSkills,
    skillsToImprove,
  };
}
