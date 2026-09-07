// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// GRADE CALCULATOR UTILITY
// kat-school/server/src/utils/gradeCalculator.util.js
// ============================================

'use strict';

// ─── Ethiopian MoE Grading Scale ─────────────
// Based on Federal Ministry of Education grading
const ETHIOPIAN_GRADE_SCALE = [
  { letter: 'A', minScore: 85, maxScore: 100, gradePoint: 4.0, description: 'Excellent' },
  { letter: 'B', minScore: 75, maxScore: 84, gradePoint: 3.0, description: 'Very Good' },
  { letter: 'C', minScore: 65, maxScore: 74, gradePoint: 2.0, description: 'Good' },
  { letter: 'D', minScore: 50, maxScore: 64, gradePoint: 1.0, description: 'Satisfactory' },
  { letter: 'F', minScore: 0, maxScore: 49, gradePoint: 0.0, description: 'Fail' },
];

// ─── Assessment Weights ───────────────────────
const DEFAULT_WEIGHTS = {
  ca: 0.5, // Continuous Assessment 50%
  exam: 0.5, // Final Exam 50%
};

// ─── Get Grade Letter ─────────────────────────
const getGradeLetter = (score, gradeScale = ETHIOPIAN_GRADE_SCALE) => {
  if (score === null || score === undefined || isNaN(score)) {
    return null;
  }

  const clampedScore = Math.max(0, Math.min(100, score));

  const grade = gradeScale.find((g) => clampedScore >= g.minScore && clampedScore <= g.maxScore);

  return grade ? grade.letter : 'F';
};

// ─── Get Grade Point ──────────────────────────
const getGradePoint = (score, gradeScale = ETHIOPIAN_GRADE_SCALE) => {
  const letter = getGradeLetter(score, gradeScale);
  if (!letter) return 0;

  const grade = gradeScale.find((g) => g.letter === letter);
  return grade ? grade.gradePoint : 0;
};

// ─── Get Grade Description ────────────────────
const getGradeDescription = (score, gradeScale = ETHIOPIAN_GRADE_SCALE) => {
  const letter = getGradeLetter(score, gradeScale);
  if (!letter) return 'N/A';

  const grade = gradeScale.find((g) => g.letter === letter);
  return grade ? grade.description : 'Unknown';
};

// ─── Calculate Final Score ────────────────────
// caScore: Continuous Assessment score (out of caTotal)
// examScore: Exam score (out of examTotal)
// Returns final score out of 100
const calculateFinalScore = ({
  caScore = 0,
  caTotal = 50,
  examScore = 0,
  examTotal = 50,
  caWeight = DEFAULT_WEIGHTS.ca,
  examWeight = DEFAULT_WEIGHTS.exam,
}) => {
  if (caScore === null && examScore === null) return null;

  // Convert to percentage
  const caPercentage = caTotal > 0 ? (caScore / caTotal) * 100 : 0;
  const examPercentage = examTotal > 0 ? (examScore / examTotal) * 100 : 0;

  // Weighted average
  const finalScore = caPercentage * caWeight + examPercentage * examWeight;

  return Math.round(finalScore * 100) / 100;
};

// ─── Calculate GPA ────────────────────────────
// subjects: [{ score, creditHours }]
// Returns GPA and total credit hours
const calculateGPA = (subjects, gradeScale = ETHIOPIAN_GRADE_SCALE) => {
  if (!subjects || subjects.length === 0) {
    return { gpa: 0, totalCreditHours: 0, totalPoints: 0 };
  }

  let totalPoints = 0;
  let totalCreditHours = 0;
  let passedSubjects = 0;
  let failedSubjects = 0;

  const details = subjects.map((subject) => {
    const score =
      subject.finalScore !== undefined
        ? subject.finalScore
        : calculateFinalScore({
            caScore: subject.caScore || 0,
            caTotal: subject.caTotal || 50,
            examScore: subject.examScore || 0,
            examTotal: subject.examTotal || 50,
          });

    const gradePoint = getGradePoint(score, gradeScale);
    const gradeLetter = getGradeLetter(score, gradeScale);
    const creditHours = subject.creditHours || 1;
    const isPassed = score >= 50;

    totalPoints += gradePoint * creditHours;
    totalCreditHours += creditHours;

    if (isPassed) {
      passedSubjects++;
    } else {
      failedSubjects++;
    }

    return {
      subject: subject.name || subject.subjectName,
      score,
      gradePoint,
      gradeLetter,
      creditHours,
      isPassed,
    };
  });

  const gpa = totalCreditHours > 0 ? Math.round((totalPoints / totalCreditHours) * 100) / 100 : 0;

  return {
    gpa,
    totalPoints: Math.round(totalPoints * 100) / 100,
    totalCreditHours,
    passedSubjects,
    failedSubjects,
    totalSubjects: subjects.length,
    details,
  };
};

// ─── Calculate Class Rank ─────────────────────
// students: [{ studentId, finalScore }]
// Returns students with rank added
const calculateClassRank = (students) => {
  if (!students || students.length === 0) return [];

  // Sort by score descending
  const sorted = [...students].sort((a, b) => (b.finalScore || 0) - (a.finalScore || 0));

  let rank = 1;
  let prevScore = null;
  let sameRankCount = 0;

  return sorted.map((student, index) => {
    const score = student.finalScore || 0;

    if (score !== prevScore) {
      rank = index + 1 - sameRankCount + 1;
      if (prevScore !== null) rank = index + 1;
      sameRankCount = 0;
    } else {
      sameRankCount++;
    }

    prevScore = score;

    return {
      ...student,
      rank,
      rankDisplay: getRankDisplay(rank),
    };
  });
};

// ─── Get Rank Display ─────────────────────────
const getRankDisplay = (rank) => {
  if (rank === 1) return '1st';
  if (rank === 2) return '2nd';
  if (rank === 3) return '3rd';
  return `${rank}th`;
};

// ─── Check If Passed ──────────────────────────
const isPassed = (score, passingScore = 50) => {
  return score !== null && score !== undefined && score >= passingScore;
};

// ─── Calculate Subject Average ────────────────
const calculateSubjectAverage = (scores) => {
  if (!scores || scores.length === 0) return 0;
  const validScores = scores.filter((s) => s !== null && s !== undefined && !isNaN(s));
  if (validScores.length === 0) return 0;
  const sum = validScores.reduce((a, b) => a + b, 0);
  return Math.round((sum / validScores.length) * 100) / 100;
};

// ─── Calculate Grade Distribution ─────────────
// scores: array of numbers
// Returns count of each grade letter
const calculateGradeDistribution = (scores, gradeScale = ETHIOPIAN_GRADE_SCALE) => {
  const distribution = {};
  gradeScale.forEach((g) => {
    distribution[g.letter] = {
      count: 0,
      percentage: 0,
      description: g.description,
    };
  });

  scores.forEach((score) => {
    const letter = getGradeLetter(score, gradeScale);
    if (letter && distribution[letter]) {
      distribution[letter].count++;
    }
  });

  const total = scores.length;
  Object.keys(distribution).forEach((letter) => {
    distribution[letter].percentage =
      total > 0 ? Math.round((distribution[letter].count / total) * 10000) / 100 : 0;
  });

  return distribution;
};

// ─── Calculate Pass Rate ──────────────────────
const calculatePassRate = (scores, passingScore = 50) => {
  if (!scores || scores.length === 0) return 0;
  const passed = scores.filter((s) => s >= passingScore).length;
  return Math.round((passed / scores.length) * 10000) / 100;
};

// ─── Generate Report Card Comment ─────────────
// Used as fallback when AI is not available
const generateReportComment = (studentName, gpa, grade, passedAll) => {
  const firstName = studentName.split(' ')[0];

  if (gpa >= 3.5) {
    return `${firstName} has demonstrated outstanding academic performance this term. Excellent work across all subjects. Keep it up!`;
  }
  if (gpa >= 3.0) {
    return `${firstName} has shown very good academic performance this term. Continue to work hard and maintain these results.`;
  }
  if (gpa >= 2.0) {
    return `${firstName} has performed satisfactorily this term. With more effort and consistency, further improvement is possible.`;
  }
  if (gpa >= 1.0 && passedAll) {
    return `${firstName} has passed all subjects this term but needs to put in more effort to improve their overall performance.`;
  }
  return `${firstName} needs significant improvement in academic performance. Please ensure regular attendance, complete assignments, and seek additional support from teachers.`;
};

// ─── Format Score Display ─────────────────────
const formatScore = (score, total = 100, decimals = 1) => {
  if (score === null || score === undefined) return 'N/A';
  return `${Number(score).toFixed(decimals)}/${total}`;
};

// ─── Get Grade Color ──────────────────────────
const getGradeColor = (letter) => {
  const colors = {
    A: '#22c55e',
    B: '#3b82f6',
    C: '#f59e0b',
    D: '#f97316',
    F: '#ef4444',
  };
  return colors[letter] || '#94a3b8';
};

module.exports = {
  ETHIOPIAN_GRADE_SCALE,
  DEFAULT_WEIGHTS,
  getGradeLetter,
  getGradePoint,
  getGradeDescription,
  calculateFinalScore,
  calculateGPA,
  calculateClassRank,
  getRankDisplay,
  isPassed,
  calculateSubjectAverage,
  calculateGradeDistribution,
  calculatePassRate,
  generateReportComment,
  formatScore,
  getGradeColor,
};
