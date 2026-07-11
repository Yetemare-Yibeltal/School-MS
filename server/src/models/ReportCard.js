// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// REPORT CARD MODEL
// ============================================

'use strict';

const mongoose = require('mongoose');
const { GRADE_NAMES, STREAMS } = require('../config/constants');

const reportCardSchema = new mongoose.Schema(
  {
    // ─── Student ──────────────────────────────
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student is required'],
      index: true,
    },

    // Cached student info for PDF generation
    studentSnapshot: {
      firstName: { type: String, trim: true },
      fatherName: { type: String, trim: true },
      grandFatherName: { type: String, trim: true },
      studentId: { type: String, trim: true },
      gender: { type: String, trim: true },
      dateOfBirth: { type: Date },
      photo: { url: { type: String } },
    },

    // ─── Academic Context ─────────────────────
    academicYear: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicYear',
      required: [true, 'Academic year is required'],
      index: true,
    },

    academicYearName: {
      type: String,
      trim: true,
    },

    term: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Term',
      required: [true, 'Term is required'],
      index: true,
    },

    termName: {
      type: String,
      trim: true,
    },

    termNumber: {
      type: Number,
      default: 1,
    },

    // ─── Class & Section ──────────────────────
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: [true, 'Class is required'],
      index: true,
    },

    grade: {
      type: String,
      required: [true, 'Grade is required'],
      enum: {
        values: GRADE_NAMES,
        message: '{VALUE} is not a valid grade',
      },
      index: true,
    },

    stream: {
      type: String,
      enum: {
        values: [...STREAMS, ''],
        message: '{VALUE} is not a valid stream',
      },
      default: '',
    },

    section: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Section',
      required: [true, 'Section is required'],
      index: true,
    },

    sectionName: {
      type: String,
      trim: true,
    },

    // Class teacher for this section
    classTeacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher',
      default: null,
    },

    classTeacherName: {
      type: String,
      trim: true,
      default: null,
    },

    // ─── Subject Results ──────────────────────
    // Detailed results per subject
    subjectResults: [
      {
        subject: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Subject',
        },
        subjectName: {
          type: String,
          trim: true,
        },
        subjectCode: {
          type: String,
          trim: true,
        },

        // Scores
        caScore: {
          type: Number,
          default: 0,
          min: 0,
        },
        maxCAScore: {
          type: Number,
          default: 50,
        },
        examScore: {
          type: Number,
          default: 0,
          min: 0,
        },
        maxExamScore: {
          type: Number,
          default: 50,
        },
        totalScore: {
          type: Number,
          default: 0,
        },
        maxTotalScore: {
          type: Number,
          default: 100,
        },
        percentage: {
          type: Number,
          default: 0,
        },

        // Grade
        letterGrade: {
          type: String,
          enum: ['A', 'B', 'C', 'D', 'F', ''],
          default: '',
        },
        gpaPoints: {
          type: Number,
          default: 0,
          min: 0,
          max: 4,
        },
        gradeRemark: {
          type: String,
          trim: true,
        },
        gradeColor: {
          type: String,
          default: '#6366f1',
        },

        // Status
        isPassed: {
          type: Boolean,
          default: false,
        },
        isAbsent: {
          type: Boolean,
          default: false,
        },

        // Teacher remark for this subject
        teacherRemark: {
          type: String,
          trim: true,
          default: null,
        },

        // Position in this subject
        subjectRank: {
          type: Number,
          default: null,
        },
      },
    ],

    // ─── Academic Performance ─────────────────
    // Total score across all subjects
    totalScore: {
      type: Number,
      default: 0,
    },

    // Maximum possible total score
    maxTotalScore: {
      type: Number,
      default: 0,
    },

    // Average score
    averageScore: {
      type: Number,
      default: 0,
    },

    // Average percentage
    averagePercentage: {
      type: Number,
      default: 0,
    },

    // Cumulative GPA
    gpa: {
      type: Number,
      default: 0,
      min: 0,
      max: 4,
    },

    // Overall letter grade
    overallGrade: {
      type: String,
      enum: ['A', 'B', 'C', 'D', 'F', ''],
      default: '',
    },

    // Number of subjects taken
    totalSubjects: {
      type: Number,
      default: 0,
    },

    // Number of subjects passed
    subjectsPassed: {
      type: Number,
      default: 0,
    },

    // Number of subjects failed
    subjectsFailed: {
      type: Number,
      default: 0,
    },

    // ─── Ranking ──────────────────────────────
    // Rank in section
    rankInSection: {
      type: Number,
      default: null,
    },

    // Total students in section
    totalInSection: {
      type: Number,
      default: 0,
    },

    // Rank in class (all sections)
    rankInClass: {
      type: Number,
      default: null,
    },

    // Total students in class
    totalInClass: {
      type: Number,
      default: 0,
    },

    // ─── Attendance ───────────────────────────
    // Attendance for this term
    attendance: {
      totalDays: {
        type: Number,
        default: 0,
      },
      presentDays: {
        type: Number,
        default: 0,
      },
      absentDays: {
        type: Number,
        default: 0,
      },
      lateDays: {
        type: Number,
        default: 0,
      },
      excusedDays: {
        type: Number,
        default: 0,
      },
      attendancePercentage: {
        type: Number,
        default: 0,
      },
      attendanceRemark: {
        type: String,
        trim: true,
        default: null,
      },
    },

    // ─── Comments ─────────────────────────────
    // Class teacher comment
    classTeacherComment: {
      type: String,
      trim: true,
      maxlength: [1000, 'Class teacher comment cannot exceed 1000 characters'],
      default: null,
    },

    // Principal comment
    principalComment: {
      type: String,
      trim: true,
      maxlength: [1000, 'Principal comment cannot exceed 1000 characters'],
      default: null,
    },

    // AI generated comment
    aiComment: {
      type: String,
      trim: true,
      maxlength: [1500, 'AI comment cannot exceed 1500 characters'],
      default: null,
    },

    // Whether AI comment was used
    usedAIComment: {
      type: Boolean,
      default: false,
    },

    // ─── Promotion Decision ───────────────────
    promotionStatus: {
      type: String,
      enum: ['promoted', 'repeated', 'conditional', 'pending', 'graduated', ''],
      default: 'pending',
    },

    promotionNote: {
      type: String,
      trim: true,
      default: null,
    },

    // Next grade (if promoted)
    nextGrade: {
      type: String,
      enum: {
        values: [...GRADE_NAMES, ''],
        message: '{VALUE} is not a valid grade',
      },
      default: '',
    },

    // ─── Extra Curricular ─────────────────────
    extraCurricular: [
      {
        activity: {
          type: String,
          trim: true,
        },
        achievement: {
          type: String,
          trim: true,
        },
        grade: {
          type: String,
          trim: true,
        },
      },
    ],

    // ─── Status ───────────────────────────────
    // Draft = being generated
    // Generated = all data computed
    // Approved = approved by class teacher
    // Published = visible to student/parent
    status: {
      type: String,
      enum: ['draft', 'generated', 'approved', 'published', 'recalled'],
      default: 'draft',
      index: true,
    },

    // Whether published to student/parent portal
    isPublished: {
      type: Boolean,
      default: false,
      index: true,
    },

    publishedAt: {
      type: Date,
      default: null,
    },

    publishedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    // Whether approved by class teacher
    isApproved: {
      type: Boolean,
      default: false,
    },

    approvedAt: {
      type: Date,
      default: null,
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    // ─── PDF Generation ───────────────────────
    // URL of generated PDF
    pdfUrl: {
      type: String,
      default: null,
    },

    pdfPublicId: {
      type: String,
      default: null,
    },

    // When PDF was generated
    pdfGeneratedAt: {
      type: Date,
      default: null,
    },

    // ─── Signature ────────────────────────────
    // Whether report card has been signed
    classTeacherSigned: {
      type: Boolean,
      default: false,
    },

    classTeacherSignedAt: {
      type: Date,
      default: null,
    },

    principalSigned: {
      type: Boolean,
      default: false,
    },

    principalSignedAt: {
      type: Date,
      default: null,
    },

    // ─── School Info Snapshot ─────────────────
    // Captured at time of generation
    schoolSnapshot: {
      name: { type: String, trim: true },
      address: { type: String, trim: true },
      phone: { type: String, trim: true },
      email: { type: String, trim: true },
      motto: { type: String, trim: true },
      logoUrl: { type: String, trim: true },
    },

    // ─── Audit ────────────────────────────────
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    generatedAt: {
      type: Date,
      default: null,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Compound Indexes ─────────────────────────
reportCardSchema.index(
  {
    student: 1,
    term: 1,
    academicYear: 1,
  },
  { unique: true }
);

reportCardSchema.index({
  section: 1,
  term: 1,
  status: 1,
});

reportCardSchema.index({
  grade: 1,
  academicYear: 1,
  term: 1,
});

reportCardSchema.index({
  academicYear: 1,
  isPublished: 1,
});

reportCardSchema.index({
  student: 1,
  academicYear: 1,
});

reportCardSchema.index({ rankInSection: 1 });
reportCardSchema.index({ gpa: -1 });
reportCardSchema.index({ createdAt: -1 });

// ─── Virtuals ─────────────────────────────────
// Student full name
reportCardSchema.virtual('studentFullName').get(function () {
  if (!this.studentSnapshot) return '';
  const parts = [this.studentSnapshot.firstName, this.studentSnapshot.fatherName];
  if (this.studentSnapshot.grandFatherName) {
    parts.push(this.studentSnapshot.grandFatherName);
  }
  return parts.join(' ');
});

// Pass/fail status
reportCardSchema.virtual('hasPassed').get(function () {
  return this.subjectsFailed === 0;
});

// Attendance status
reportCardSchema.virtual('attendanceStatus').get(function () {
  const rate = this.attendance.attendancePercentage;
  if (rate >= 90) return 'Excellent';
  if (rate >= 80) return 'Good';
  if (rate >= 75) return 'Satisfactory';
  if (rate >= 60) return 'Poor';
  return 'Critical';
});

// Is eligible for promotion
reportCardSchema.virtual('isEligibleForPromotion').get(function () {
  return this.subjectsFailed === 0 && this.attendance.attendancePercentage >= 75;
});

// GPA display
reportCardSchema.virtual('gpaDisplay').get(function () {
  return this.gpa.toFixed(2);
});

// Section rank display
reportCardSchema.virtual('rankDisplay').get(function () {
  if (!this.rankInSection || !this.totalInSection) return 'N/A';
  return `${this.rankInSection}/${this.totalInSection}`;
});

// ─── Pre-Save Hook ────────────────────────────
reportCardSchema.pre('save', function (next) {
  // Auto-calculate totals from subject results
  if (this.isModified('subjectResults') && this.subjectResults.length > 0) {
    const activeSubjects = this.subjectResults.filter((s) => !s.isAbsent);

    this.totalSubjects = this.subjectResults.length;
    this.subjectsPassed = this.subjectResults.filter((s) => s.isPassed).length;
    this.subjectsFailed = this.totalSubjects - this.subjectsPassed;

    if (activeSubjects.length > 0) {
      // Calculate average score
      const totalScore = activeSubjects.reduce((sum, s) => sum + (s.totalScore || 0), 0);
      this.totalScore = totalScore;
      this.averageScore = Math.round(totalScore / activeSubjects.length);

      const totalPercentage = activeSubjects.reduce((sum, s) => sum + (s.percentage || 0), 0);
      this.averagePercentage = Math.round(totalPercentage / activeSubjects.length);

      // Calculate GPA
      const totalGPA = activeSubjects.reduce((sum, s) => sum + (s.gpaPoints || 0), 0);
      this.gpa = parseFloat((totalGPA / activeSubjects.length).toFixed(2));

      // Set overall grade based on average percentage
      if (this.averagePercentage >= 85) this.overallGrade = 'A';
      else if (this.averagePercentage >= 75) this.overallGrade = 'B';
      else if (this.averagePercentage >= 65) this.overallGrade = 'C';
      else if (this.averagePercentage >= 50) this.overallGrade = 'D';
      else this.overallGrade = 'F';
    }
  }

  // Set attendance remark
  if (this.isModified('attendance')) {
    const rate = this.attendance.attendancePercentage;
    if (rate >= 90) this.attendance.attendanceRemark = 'Excellent';
    else if (rate >= 80) this.attendance.attendanceRemark = 'Good';
    else if (rate >= 75) this.attendance.attendanceRemark = 'Satisfactory';
    else if (rate >= 60) this.attendance.attendanceRemark = 'Poor';
    else this.attendance.attendanceRemark = 'Critical - Action Required';
  }

  next();
});

// ─── Static Methods ───────────────────────────

// Find report card for specific student and term
reportCardSchema.statics.findForStudentTerm = function (studentId, termId) {
  return this.findOne({
    student: studentId,
    term: termId,
  })
    .populate('student', 'firstName fatherName studentId photo')
    .populate('section', 'name fullName')
    .populate('classTeacher', 'firstName fatherName')
    .populate('academicYear', 'name ethiopianYear')
    .populate('term', 'name termNumber');
};

// Get all report cards for a student
reportCardSchema.statics.getStudentHistory = function (studentId) {
  return this.find({ student: studentId })
    .sort({ createdAt: -1 })
    .populate('academicYear', 'name ethiopianYear')
    .populate('term', 'name termNumber')
    .select('-subjectResults -editHistory -schoolSnapshot');
};

// Get all report cards for a section
reportCardSchema.statics.getSectionReportCards = function (sectionId, termId) {
  return this.find({
    section: sectionId,
    term: termId,
  })
    .sort({ rankInSection: 1 })
    .populate('student', 'firstName fatherName studentId photo');
};

// Generate report card from exam results
reportCardSchema.statics.generateForStudent = async function ({
  studentId,
  termId,
  academicYearId,
  sectionId,
  classId,
  generatedBy,
}) {
  const ExamResult = mongoose.model('ExamResult');
  const Student = mongoose.model('Student');
  const Section = mongoose.model('Section');
  const Attendance = mongoose.model('Attendance');

  // Get student data
  const student = await Student.findById(studentId).populate('classSection');

  if (!student) throw new Error('Student not found');

  // Get section data
  const section = await Section.findById(sectionId).populate(
    'classTeacher',
    'firstName fatherName'
  );

  // Get exam results for this term
  const results = await ExamResult.find({
    student: studentId,
    term: termId,
    academicYear: academicYearId,
  }).populate('subject', 'name code color');

  // Get attendance for this term
  const attendanceStats = await Attendance.aggregate([
    {
      $match: {
        student: new mongoose.Types.ObjectId(studentId),
        term: new mongoose.Types.ObjectId(termId),
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        present: {
          $sum: {
            $cond: [{ $eq: ['$status', 'present'] }, 1, 0],
          },
        },
        absent: {
          $sum: {
            $cond: [{ $eq: ['$status', 'absent'] }, 1, 0],
          },
        },
        late: {
          $sum: {
            $cond: [{ $eq: ['$status', 'late'] }, 1, 0],
          },
        },
        excused: {
          $sum: {
            $cond: [{ $eq: ['$status', 'excused'] }, 1, 0],
          },
        },
      },
    },
  ]);

  const att = attendanceStats[0] || {
    total: 0,
    present: 0,
    absent: 0,
    late: 0,
    excused: 0,
  };

  const attendancePercentage = att.total > 0 ? Math.round((att.present / att.total) * 100) : 0;

  // Build subject results
  const subjectResults = results.map((result) => ({
    subject: result.subject._id,
    subjectName: result.subjectName,
    subjectCode: result.subjectCode,
    caScore: result.caScore,
    maxCAScore: result.maxCAScore,
    examScore: result.examScore,
    maxExamScore: result.maxExamScore,
    totalScore: result.totalScore,
    maxTotalScore: result.maxTotalScore,
    percentage: result.percentage,
    letterGrade: result.letterGrade,
    gpaPoints: result.gpaPoints,
    gradeRemark: result.gradeRemark,
    gradeColor: '#6366f1',
    isPassed: result.isPassed,
    isAbsent: result.isAbsent,
    teacherRemark: result.teacherRemarks,
    subjectRank: result.rankInSection,
  }));

  // Get school info from settings
  const Settings = mongoose.model('Settings');
  const settings = await Settings.findOne().select(
    'schoolName schoolAddress schoolPhone schoolEmail schoolMotto logoUrl'
  );

  // Create or update report card
  const reportCardData = {
    student: studentId,
    studentSnapshot: {
      firstName: student.firstName,
      fatherName: student.fatherName,
      grandFatherName: student.grandFatherName,
      studentId: student.studentId,
      gender: student.gender,
      dateOfBirth: student.dateOfBirth,
      photo: student.photo,
    },
    academicYear: academicYearId,
    academicYearName: student.academicYear?.name || '',
    term: termId,
    termName: '',
    class: classId,
    grade: student.grade,
    stream: student.stream,
    section: sectionId,
    sectionName: section?.fullName || '',
    classTeacher: section?.classTeacher?._id,
    classTeacherName: section?.classTeacher
      ? `${section.classTeacher.firstName} ${section.classTeacher.fatherName}`
      : null,
    subjectResults,
    attendance: {
      totalDays: att.total,
      presentDays: att.present,
      absentDays: att.absent,
      lateDays: att.late,
      excusedDays: att.excused,
      attendancePercentage,
    },
    status: 'generated',
    generatedBy,
    generatedAt: new Date(),
    schoolSnapshot: {
      name: settings?.schoolName || 'Kat Secondary School',
      address: settings?.schoolAddress || 'Addis Ababa, Ethiopia',
      phone: settings?.schoolPhone || '',
      email: settings?.schoolEmail || '',
      motto: settings?.schoolMotto || '',
      logoUrl: settings?.logoUrl || '',
    },
  };

  return this.findOneAndUpdate({ student: studentId, term: termId }, reportCardData, {
    upsert: true,
    new: true,
  });
};

// Publish report card
reportCardSchema.statics.publish = async function (reportCardId, publishedBy) {
  return this.findByIdAndUpdate(
    reportCardId,
    {
      status: 'published',
      isPublished: true,
      publishedAt: new Date(),
      publishedBy,
    },
    { new: true }
  );
};

// Recall published report card
reportCardSchema.statics.recall = async function (reportCardId) {
  return this.findByIdAndUpdate(
    reportCardId,
    {
      status: 'recalled',
      isPublished: false,
    },
    { new: true }
  );
};

// Approve report card
reportCardSchema.statics.approve = async function (reportCardId, approvedBy) {
  return this.findByIdAndUpdate(
    reportCardId,
    {
      isApproved: true,
      approvedAt: new Date(),
      approvedBy,
      status: 'approved',
    },
    { new: true }
  );
};

// Save PDF URL after generation
reportCardSchema.statics.savePDF = async function (reportCardId, pdfUrl, publicId) {
  return this.findByIdAndUpdate(
    reportCardId,
    {
      pdfUrl,
      pdfPublicId: publicId,
      pdfGeneratedAt: new Date(),
    },
    { new: true }
  );
};

// Calculate and update ranks for a section
reportCardSchema.statics.updateSectionRanks = async function (sectionId, termId) {
  const cards = await this.find({
    section: sectionId,
    term: termId,
  }).sort({ gpa: -1, averageScore: -1 });

  const totalInSection = cards.length;

  for (let i = 0; i < cards.length; i++) {
    await this.findByIdAndUpdate(cards[i]._id, {
      rankInSection: i + 1,
      totalInSection,
    });
  }

  return cards.length;
};

// Get dashboard stats
reportCardSchema.statics.getDashboardStats = async function (academicYearId, termId) {
  const query = { academicYear: academicYearId };
  if (termId) query.term = termId;

  const [total, published, approved, promoted, repeated] = await Promise.all([
    this.countDocuments(query),
    this.countDocuments({
      ...query,
      isPublished: true,
    }),
    this.countDocuments({
      ...query,
      isApproved: true,
    }),
    this.countDocuments({
      ...query,
      promotionStatus: 'promoted',
    }),
    this.countDocuments({
      ...query,
      promotionStatus: 'repeated',
    }),
  ]);

  return {
    total,
    published,
    approved,
    promoted,
    repeated,
    pending: total - published,
  };
};

// ─── Instance Methods ─────────────────────────

// Add class teacher comment
reportCardSchema.methods.addTeacherComment = async function (comment, teacherId) {
  this.classTeacherComment = comment;
  this.classTeacherSigned = true;
  this.classTeacherSignedAt = new Date();
  await this.save();
  return this;
};

// Add principal comment
reportCardSchema.methods.addPrincipalComment = async function (comment) {
  this.principalComment = comment;
  this.principalSigned = true;
  this.principalSignedAt = new Date();
  await this.save();
  return this;
};

// Add AI comment
reportCardSchema.methods.addAIComment = async function (aiComment) {
  this.aiComment = aiComment;
  this.usedAIComment = true;
  if (!this.classTeacherComment) {
    this.classTeacherComment = aiComment;
  }
  await this.save();
  return this;
};

// Set promotion decision
reportCardSchema.methods.setPromotion = async function (status, note, nextGrade) {
  this.promotionStatus = status;
  this.promotionNote = note || null;
  this.nextGrade = nextGrade || '';
  await this.save();
  return this;
};

// Get subject by code
reportCardSchema.methods.getSubjectResult = function (subjectCode) {
  return this.subjectResults.find((s) => s.subjectCode === subjectCode);
};

// Check if all signatures are complete
reportCardSchema.methods.isFullySigned = function () {
  return this.classTeacherSigned && this.principalSigned;
};

// Get print-ready data
reportCardSchema.methods.getPrintData = function () {
  return {
    school: this.schoolSnapshot,
    student: this.studentSnapshot,
    grade: this.grade,
    section: this.sectionName,
    term: this.termName,
    academicYear: this.academicYearName,
    subjects: this.subjectResults,
    attendance: this.attendance,
    performance: {
      averageScore: this.averageScore,
      averagePercentage: this.averagePercentage,
      gpa: this.gpaDisplay,
      overallGrade: this.overallGrade,
      rankInSection: this.rankDisplay,
      subjectsPassed: this.subjectsPassed,
      subjectsFailed: this.subjectsFailed,
    },
    comments: {
      classTeacher: this.classTeacherComment,
      principal: this.principalComment,
    },
    promotionStatus: this.promotionStatus,
    nextGrade: this.nextGrade,
    signatures: {
      classTeacher: {
        signed: this.classTeacherSigned,
        name: this.classTeacherName,
        date: this.classTeacherSignedAt,
      },
      principal: {
        signed: this.principalSigned,
        date: this.principalSignedAt,
      },
    },
  };
};

// ─── Create Model ─────────────────────────────
const ReportCard = mongoose.model('ReportCard', reportCardSchema);

module.exports = ReportCard;
