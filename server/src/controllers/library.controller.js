// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// LIBRARY CONTROLLER
// kat-school/server/src/controllers/library.controller.js
// ============================================

'use strict';

const mongoose = require('mongoose');
const BookCategory = require('../models/BookCategory');
const Book = require('../models/Book');
const LibraryMember = require('../models/LibraryMember');
const BookIssue = require('../models/BookIssue');
const BookReservation = require('../models/BookReservation');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Employee = require('../models/Employee');
const AcademicYear = require('../models/AcademicYear');
const Term = require('../models/Term');
const Settings = require('../models/Settings');
const { catchAsync } = require('../middleware/errorHandler.middleware');
const { auditLog } = require('../middleware/audit.middleware');
const { HTTP_STATUS } = require('../config/constants');
const { buildSearchQuery } = require('../utils/pagination.util');
const { uploadBookCover, deleteFromCloudinary } = require('../utils/fileUpload.util');
const { generateAccessionNumber } = require('../utils/generateId.util');
const {
  notifyBookDue,
  notifyBookOverdue,
  notifyBookAvailable,
} = require('../utils/notification.util');

// ═══════════════════════════════════════════
// BOOK CATEGORY
// ═══════════════════════════════════════════

exports.createBookCategory = catchAsync(async (req, res) => {
  const existing = await BookCategory.findOne({ code: req.body.code?.toUpperCase() });
  if (existing) {
    return res.status(HTTP_STATUS.CONFLICT).json({
      success: false,
      message: `Book category with code ${req.body.code} already exists.`,
    });
  }

  const category = await BookCategory.create({
    ...req.body,
    code: req.body.code?.toUpperCase(),
    isActive: true,
    createdBy: req.user._id,
  });

  return res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: 'Book category created.',
    data: { category },
  });
});

exports.getAllBookCategories = catchAsync(async (req, res) => {
  const { withCounts } = req.query;
  let categories;

  if (withCounts === 'true') {
    categories = await BookCategory.getWithBookCounts();
  } else {
    categories = await BookCategory.getAllActive();
  }

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Book categories fetched.',
    data: { categories },
  });
});

exports.updateBookCategory = catchAsync(async (req, res) => {
  const category = await BookCategory.findByIdAndUpdate(
    req.params.id,
    { ...req.body, updatedBy: req.user._id },
    { new: true, runValidators: true }
  );
  if (!category) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Book category not found.',
    });
  }
  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Book category updated.',
    data: { category },
  });
});

exports.deleteBookCategory = catchAsync(async (req, res) => {
  const bookCount = await Book.countDocuments({
    category: req.params.id,
    isActive: true,
  });
  if (bookCount > 0) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: `Cannot delete category with ${bookCount} active book(s).`,
    });
  }
  await BookCategory.findByIdAndUpdate(req.params.id, { isActive: false });
  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Book category deactivated.',
  });
});

// ═══════════════════════════════════════════
// BOOK
// ═══════════════════════════════════════════

exports.addBook = catchAsync(async (req, res) => {
  const {
    title,
    isbn,
    authors,
    editors,
    translators,
    publisher,
    publicationYear,
    edition,
    publicationPlace,
    category,
    deweyDecimal,
    subjects,
    suitableForGrades,
    language,
    description,
    numberOfPages,
    totalCopies,
    copies,
    shelfLocation,
    purchasePrice,
    finePerDay,
    acquisitionDate,
    acquisitionSource,
    donorName,
    isReference,
    canBeIssued,
    notes,
  } = req.body;

  const categoryDoc = await BookCategory.findById(category);
  if (!categoryDoc) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Book category not found.',
    });
  }

  // Check duplicate ISBN if provided
  if (isbn) {
    const existing = await Book.findOne({ isbn, isActive: true });
    if (existing) {
      return res.status(HTTP_STATUS.CONFLICT).json({
        success: false,
        message: `A book with ISBN ${isbn} already exists.`,
        data: { existingBook: existing },
      });
    }
  }

  const accessionNumber = await generateAccessionNumber();

  // Auto-generate copy numbers if not provided
  let bookCopies = copies;
  if (!bookCopies || bookCopies.length === 0) {
    bookCopies = Array.from({ length: totalCopies }, (_, i) => ({
      copyNumber: `${accessionNumber}-${String(i + 1).padStart(2, '0')}`,
      condition: 'Good',
      isAvailable: true,
      acquiredDate: acquisitionDate ? new Date(acquisitionDate) : new Date(),
    }));
  }

  const book = await Book.create({
    title,
    isbn: isbn || null,
    accessionNumber,
    authors: Array.isArray(authors) ? authors : [authors],
    primaryAuthor: Array.isArray(authors) ? authors[0] : authors,
    editors: editors || [],
    translators: translators || [],
    publisher,
    publicationYear: publicationYear || null,
    edition: edition || null,
    publicationPlace: publicationPlace || null,
    category,
    categoryName: categoryDoc.name,
    deweyDecimal: deweyDecimal || null,
    subjects: subjects || [],
    suitableForGrades: suitableForGrades || [],
    language: language || 'English',
    description: description || null,
    numberOfPages: numberOfPages || null,
    totalCopies,
    availableCopies: totalCopies,
    issuedCopies: 0,
    lostDamagedCopies: 0,
    copies: bookCopies,
    shelfLocation: shelfLocation || {},
    purchasePrice: purchasePrice || 0,
    finePerDay: finePerDay || 2,
    acquisitionDate: acquisitionDate ? new Date(acquisitionDate) : new Date(),
    acquisitionSource: acquisitionSource || '',
    donorName: donorName || null,
    isReference: isReference || false,
    canBeIssued: isReference ? false : canBeIssued !== false,
    isActive: true,
    notes,
    addedBy: req.user._id,
    createdBy: req.user._id,
  });

  // Update category stats
  await BookCategory.updateStats(category);

  await auditLog({
    req,
    action: 'CREATE',
    resource: 'book',
    resourceId: book._id,
    description: `Book added: ${title} — Accession: ${accessionNumber} (${totalCopies} copies)`,
  });

  return res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: 'Book added to library.',
    data: { book },
  });
});

exports.getAllBooks = catchAsync(async (req, res) => {
  const {
    category,
    language,
    grade,
    isAvailable,
    isReference,
    acquisitionSource,
    search,
    page = 1,
    limit = 20,
    sort = 'title',
    order = 'asc',
  } = req.query;

  const filter = { isActive: true };
  if (category) filter.category = category;
  if (language) filter.language = language;
  if (grade) filter.suitableForGrades = grade;
  if (acquisitionSource) filter.acquisitionSource = acquisitionSource;
  if (isReference !== undefined) filter.isReference = isReference === 'true';
  if (isAvailable === 'true') {
    filter.availableCopies = { $gt: 0 };
    filter.canBeIssued = true;
  }

  if (search) {
    Object.assign(
      filter,
      buildSearchQuery(search, [
        'title',
        'primaryAuthor',
        'authors',
        'isbn',
        'accessionNumber',
        'categoryName',
        'subjects',
      ])
    );
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const sortObj = { [sort]: order === 'asc' ? 1 : -1 };

  const [books, total] = await Promise.all([
    Book.find(filter)
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('category', 'name code color icon')
      .select(
        'title accessionNumber isbn primaryAuthor authors publisher publicationYear language categoryName availableCopies totalCopies coverImage isAvailable canBeIssued isReference stats.totalIssues shelfLocation'
      )
      .lean(),
    Book.countDocuments(filter),
  ]);

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Books fetched.',
    data: { books },
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
      hasNextPage: parseInt(page) < Math.ceil(total / parseInt(limit)),
      hasPreviousPage: parseInt(page) > 1,
    },
  });
});

exports.getBookById = catchAsync(async (req, res) => {
  const book = await Book.findById(req.params.id).populate('category', 'name code color').lean();

  if (!book) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Book not found.',
    });
  }

  // Get current issues for this book
  const currentIssues = await BookIssue.find({
    book: book._id,
    status: { $in: ['issued', 'overdue'] },
  })
    .populate('libraryMember', 'memberName membershipId memberType')
    .select('memberName membershipId memberType issueDate dueDate status')
    .lean();

  // Get reservations
  const reservations = await BookReservation.getForBook(book._id);

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Book fetched.',
    data: { book, currentIssues, reservations },
  });
});

exports.updateBook = catchAsync(async (req, res) => {
  const forbiddenFields = ['accessionNumber', 'createdBy', 'addedBy'];
  forbiddenFields.forEach((f) => delete req.body[f]);

  const book = await Book.findByIdAndUpdate(
    req.params.id,
    { ...req.body, updatedBy: req.user._id },
    { new: true, runValidators: true }
  );

  if (!book) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Book not found.',
    });
  }

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Book updated.',
    data: { book },
  });
});

exports.deleteBook = catchAsync(async (req, res) => {
  const book = await Book.findById(req.params.id);
  if (!book) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Book not found.',
    });
  }

  if (book.issuedCopies > 0) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: `Cannot delete book with ${book.issuedCopies} currently issued copy(ies).`,
    });
  }

  await Book.findByIdAndUpdate(req.params.id, { isActive: false });
  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Book deactivated.',
  });
});

exports.uploadBookCoverImage = catchAsync(async (req, res) => {
  if (!req.file) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'Please upload a cover image.',
    });
  }

  const book = await Book.findById(req.params.id);
  if (!book) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Book not found.',
    });
  }

  // Delete old cover if exists
  if (book.coverImage?.publicId) {
    await deleteFromCloudinary(book.coverImage.publicId);
  }

  const result = await uploadBookCover(req.file.path);
  if (!result.success) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Cover image upload failed.',
    });
  }

  const updatedBook = await Book.findByIdAndUpdate(
    req.params.id,
    {
      'coverImage.url': result.url,
      'coverImage.publicId': result.publicId,
      updatedBy: req.user._id,
    },
    { new: true }
  );

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Cover image uploaded.',
    data: { coverImage: updatedBook.coverImage },
  });
});

// ═══════════════════════════════════════════
// LIBRARY MEMBER
// ═══════════════════════════════════════════

exports.registerMember = catchAsync(async (req, res) => {
  const { memberType, student, teacher, employee, maxBooksAllowed, maxLoanDays, notes } = req.body;

  let memberDoc;
  let memberId;
  let memberName;
  let grade = null;
  let section = null;
  let department = null;
  let photo = null;
  let staffId = null;

  if (memberType === 'student') {
    memberDoc = await Student.findById(student)
      .select('firstName fatherName studentId grade sectionName photo')
      .lean();
    if (!memberDoc) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .json({ success: false, message: 'Student not found.' });
    }
    memberId = memberDoc.studentId;
    memberName = `${memberDoc.firstName} ${memberDoc.fatherName}`;
    grade = memberDoc.grade;
    section = memberDoc.sectionName;
    photo = memberDoc.photo?.url;
    staffId = student;
  } else if (memberType === 'teacher') {
    memberDoc = await Teacher.findById(teacher)
      .select('firstName fatherName teacherId primarySubject photo')
      .lean();
    if (!memberDoc) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .json({ success: false, message: 'Teacher not found.' });
    }
    memberId = memberDoc.teacherId;
    memberName = `${memberDoc.firstName} ${memberDoc.fatherName}`;
    photo = memberDoc.photo?.url;
    staffId = teacher;
  } else {
    memberDoc = await Employee.findById(employee)
      .select('firstName fatherName employeeId departmentName photo')
      .lean();
    if (!memberDoc) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .json({ success: false, message: 'Employee not found.' });
    }
    memberId = memberDoc.employeeId;
    memberName = `${memberDoc.firstName} ${memberDoc.fatherName}`;
    department = memberDoc.departmentName;
    photo = memberDoc.photo?.url;
    staffId = employee;
  }

  // Check already registered
  const existing = await LibraryMember.findOne({ memberId });
  if (existing) {
    return res.status(HTTP_STATUS.CONFLICT).json({
      success: false,
      message: 'This member is already registered in the library.',
      data: { member: existing },
    });
  }

  const currentYear = await AcademicYear.getCurrent();

  const result = await LibraryMember.registerMember({
    memberType,
    memberId,
    memberName,
    studentId: memberType === 'student' ? staffId : null,
    teacherId: memberType === 'teacher' ? staffId : null,
    employeeId: memberType === 'employee' ? staffId : null,
    grade,
    section,
    department,
    photo,
    academicYearId: currentYear?._id,
    academicYearName: currentYear?.name,
    registeredBy: req.user._id,
  });

  if (maxBooksAllowed) result.member.maxBooksAllowed = maxBooksAllowed;
  if (maxLoanDays) result.member.maxLoanDays = maxLoanDays;
  if (notes) result.member.notes = notes;
  await result.member.save();

  await auditLog({
    req,
    action: 'CREATE',
    resource: 'library_member',
    resourceId: result.member._id,
    description: `Library member registered: ${memberName} (${memberId}) — ${memberType}`,
  });

  return res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: 'Library member registered.',
    data: { member: result.member },
  });
});

exports.getAllMembers = catchAsync(async (req, res) => {
  const { memberType, status, search, page = 1, limit = 20 } = req.query;

  const filter = {};
  if (memberType) filter.memberType = memberType;
  if (status) filter.status = status;

  if (search) {
    Object.assign(filter, buildSearchQuery(search, ['memberName', 'memberId', 'membershipId']));
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [members, total] = await Promise.all([
    LibraryMember.find(filter).sort({ memberName: 1 }).skip(skip).limit(parseInt(limit)).lean(),
    LibraryMember.countDocuments(filter),
  ]);

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Library members fetched.',
    data: { members },
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
    },
  });
});

exports.getMemberById = catchAsync(async (req, res) => {
  const member = await LibraryMember.findById(req.params.id)
    .populate('student', 'firstName fatherName studentId grade photo')
    .populate('teacher', 'firstName fatherName teacherId primarySubject photo')
    .populate('employee', 'firstName fatherName employeeId departmentName photo')
    .lean();

  if (!member) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Library member not found.',
    });
  }

  const activeIssues = await BookIssue.find({
    libraryMember: member._id,
    status: { $in: ['issued', 'overdue'] },
  })
    .populate('book', 'title accessionNumber coverImage')
    .lean();

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Library member fetched.',
    data: { member, activeIssues },
  });
});

exports.getMemberByMembershipId = catchAsync(async (req, res) => {
  const member = await LibraryMember.findByMembershipId(req.params.membershipId);
  if (!member) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Library member not found.',
    });
  }

  const eligibility = member.checkBorrowEligibility();

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Library member fetched.',
    data: { member, eligibility },
  });
});

exports.updateMember = catchAsync(async (req, res) => {
  const member = await LibraryMember.findByIdAndUpdate(
    req.params.id,
    { ...req.body, updatedBy: req.user._id },
    { new: true, runValidators: true }
  );
  if (!member) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Library member not found.',
    });
  }
  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Library member updated.',
    data: { member },
  });
});

exports.suspendMember = catchAsync(async (req, res) => {
  const { reason, suspendedUntil } = req.body;
  if (!reason) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'Suspension reason is required.',
    });
  }

  const member = await LibraryMember.suspend(req.params.id, reason, suspendedUntil, req.user._id);

  if (!member) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Library member not found.',
    });
  }

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Library member suspended.',
    data: { member },
  });
});

exports.reactivateMember = catchAsync(async (req, res) => {
  const member = await LibraryMember.reactivate(req.params.id);
  if (!member) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Library member not found.',
    });
  }
  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Library member reactivated.',
    data: { member },
  });
});

// ═══════════════════════════════════════════
// BOOK ISSUE
// ═══════════════════════════════════════════

exports.issueBook = catchAsync(async (req, res) => {
  const { book, libraryMember, notes } = req.body;

  const [bookDoc, memberDoc] = await Promise.all([
    Book.findById(book),
    LibraryMember.findById(libraryMember),
  ]);

  if (!bookDoc) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Book not found.',
    });
  }

  if (!memberDoc) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Library member not found.',
    });
  }

  // Check book availability
  if (!bookDoc.isAvailable) {
    const pendingReservation = await BookReservation.findOne({
      book,
      libraryMember,
      status: 'available',
    });

    if (!pendingReservation) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: bookDoc.canBeIssued
          ? 'No copies available. You can place a reservation.'
          : 'This is a reference book and cannot be issued.',
      });
    }
  }

  // Check member eligibility
  const eligibility = memberDoc.checkBorrowEligibility();
  if (!eligibility.eligible) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: eligibility.issues[0],
      issues: eligibility.issues,
    });
  }

  const settings = await Settings.getSettings();
  const loanDays = memberDoc.maxLoanDays || settings.defaultLoanDaysStudent || 14;

  const currentYear = await AcademicYear.getCurrent();
  const currentTerm = await Term.getCurrent();

  // Find an available copy
  const availableCopy = bookDoc.copies?.find((c) => c.isAvailable);
  const copyNumber = availableCopy?.copyNumber || null;

  const issue = await BookIssue.issueBook({
    bookId: book,
    bookTitle: bookDoc.title,
    bookAccessionNumber: bookDoc.accessionNumber,
    bookCopyNumber: copyNumber,
    bookISBN: bookDoc.isbn,
    bookCategory: bookDoc.categoryName,
    bookAuthor: bookDoc.primaryAuthor,
    libraryMemberId: libraryMember,
    memberName: memberDoc.memberName,
    membershipId: memberDoc.membershipId,
    memberType: memberDoc.memberType,
    memberId: memberDoc.memberId,
    memberGrade: memberDoc.memberGrade,
    memberSection: memberDoc.memberSection,
    loanDays,
    finePerDay: bookDoc.finePerDay || 2,
    academicYearId: currentYear?._id,
    academicYearName: currentYear?.name,
    termId: currentTerm?._id,
    issuedBy: req.user._id,
    issuedByName: `${req.user.firstName} ${req.user.fatherName}`,
    notes,
  });

  // Mark copy as issued if specific copy
  if (copyNumber) {
    await bookDoc.issueCopy(copyNumber);
  }

  // Fulfill reservation if any
  const reservation = await BookReservation.findOne({
    book,
    libraryMember,
    status: 'available',
  });
  if (reservation) {
    await BookReservation.fulfillReservation(reservation._id, issue._id);
  }

  await auditLog({
    req,
    action: 'ISSUE',
    resource: 'book_issue',
    resourceId: issue._id,
    description: `Book issued: "${bookDoc.title}" to ${memberDoc.memberName} (${memberDoc.membershipId}). Due: ${issue.dueDate?.toLocaleDateString()}`,
  });

  return res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: `Book issued. Due date: ${issue.dueDate?.toLocaleDateString('en-ET')}`,
    data: { issue },
  });
});

exports.returnBook = catchAsync(async (req, res) => {
  const { returnCondition, returnRemarks, payFine, waiveFine, waivedAmount, waivedReason } =
    req.body;

  const issue = await BookIssue.findById(req.params.id)
    .populate('book', 'title accessionNumber finePerDay')
    .populate('libraryMember', 'memberName membershipId');

  if (!issue) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Book issue record not found.',
    });
  }

  if (issue.status === 'returned') {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'Book has already been returned.',
    });
  }

  const updatedIssue = await BookIssue.returnBook(issue._id, {
    returnCondition,
    returnRemarks,
    returnedTo: req.user._id,
    returnedToName: `${req.user.firstName} ${req.user.fatherName}`,
    payFine,
    waiveFine,
    waivedAmount,
    waivedBy: req.user._id,
    waivedReason,
  });

  // Return copy to book
  if (issue.bookCopyNumber) {
    const bookDoc = await Book.findById(issue.book);
    if (bookDoc) {
      await bookDoc.returnCopy(issue.bookCopyNumber, returnCondition);
    }
  }

  // Notify next in reservation queue
  const nextReservation = await BookReservation.notifyNextInQueue(issue.book);
  if (nextReservation) {
    try {
      const nextMember = await LibraryMember.findById(nextReservation.libraryMember)
        .populate('student teacher employee', 'user')
        .lean();

      const memberUser =
        nextMember?.student?.user || nextMember?.teacher?.user || nextMember?.employee?.user;
      if (memberUser) {
        await notifyBookAvailable(
          memberUser,
          issue.bookTitle,
          new Date(nextReservation.expiryDate).toLocaleDateString('en-ET'),
          nextReservation._id
        );
      }
    } catch (err) {
      console.error('Book available notification failed:', err.message);
    }
  }

  await auditLog({
    req,
    action: 'RETURN',
    resource: 'book_issue',
    resourceId: issue._id,
    description: `Book returned: "${issue.bookTitle}" by ${issue.memberName}. Fine: ETB ${updatedIssue.fineAmount || 0}`,
  });

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: `Book returned${updatedIssue.fineAmount > 0 ? `. Fine: ETB ${updatedIssue.outstandingFine}` : '.'}`,
    data: { issue: updatedIssue },
  });
});

exports.renewBook = catchAsync(async (req, res) => {
  const { additionalDays } = req.body;

  const issue = await BookIssue.renewBook(req.params.id, additionalDays || 7, req.user._id);

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: `Book renewed. New due date: ${issue.dueDate?.toLocaleDateString('en-ET')}`,
    data: { issue },
  });
});

exports.getAllIssues = catchAsync(async (req, res) => {
  const {
    status,
    memberType,
    grade,
    academicYear,
    search,
    page = 1,
    limit = 20,
    overdue,
  } = req.query;

  const filter = {};
  if (status) filter.status = status;
  if (memberType) filter.memberType = memberType;
  if (grade) filter.memberGrade = grade;

  if (academicYear) {
    filter.academicYear = academicYear;
  } else {
    const currentYear = await AcademicYear.getCurrent();
    if (currentYear) filter.academicYear = currentYear._id;
  }

  if (overdue === 'true') {
    filter.status = { $in: ['issued', 'overdue'] };
    filter.dueDate = { $lt: new Date() };
  }

  if (search) {
    Object.assign(
      filter,
      buildSearchQuery(search, ['memberName', 'membershipId', 'bookTitle', 'bookAccessionNumber'])
    );
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [issues, total] = await Promise.all([
    BookIssue.find(filter)
      .sort({ issueDate: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('book', 'title accessionNumber coverImage')
      .populate('libraryMember', 'memberName membershipId memberType memberPhoto')
      .lean(),
    BookIssue.countDocuments(filter),
  ]);

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Book issues fetched.',
    data: { issues },
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
      hasNextPage: parseInt(page) < Math.ceil(total / parseInt(limit)),
      hasPreviousPage: parseInt(page) > 1,
    },
  });
});

exports.getIssueById = catchAsync(async (req, res) => {
  const issue = await BookIssue.findById(req.params.id)
    .populate('book', 'title accessionNumber isbn coverImage finePerDay')
    .populate('libraryMember', 'memberName membershipId memberType memberPhoto')
    .populate('issuedBy', 'firstName fatherName')
    .populate('returnedTo', 'firstName fatherName')
    .lean();

  if (!issue) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Book issue not found.',
    });
  }

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Book issue fetched.',
    data: { issue },
  });
});

exports.payFine = catchAsync(async (req, res) => {
  const { amount, paidBy } = req.body;
  const issue = await BookIssue.findById(req.params.id);

  if (!issue) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Book issue not found.',
    });
  }

  if (issue.outstandingFine <= 0) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'No outstanding fine for this issue.',
    });
  }

  await issue.payIssueFine(amount, paidBy || `${req.user.firstName} ${req.user.fatherName}`);

  // Update member's fine balance
  if (issue.outstandingFine <= 0) {
    const member = await LibraryMember.findById(issue.libraryMember);
    if (member) {
      await member.payFine(amount);
    }
  }

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: `Fine payment of ETB ${amount} recorded.`,
    data: { issue },
  });
});

// ═══════════════════════════════════════════
// BOOK RESERVATION
// ═══════════════════════════════════════════

exports.placeReservation = catchAsync(async (req, res) => {
  const { book, libraryMember, notes } = req.body;

  const [bookDoc, memberDoc] = await Promise.all([
    Book.findById(book),
    LibraryMember.findById(libraryMember),
  ]);

  if (!bookDoc) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({ success: false, message: 'Book not found.' });
  }

  if (!memberDoc) {
    return res
      .status(HTTP_STATUS.NOT_FOUND)
      .json({ success: false, message: 'Library member not found.' });
  }

  if (memberDoc.status !== 'active') {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: `Member account is ${memberDoc.status}.`,
    });
  }

  if (bookDoc.isAvailable) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'Book is currently available. Please issue it directly instead of reserving.',
    });
  }

  const currentYear = await AcademicYear.getCurrent();

  const result = await BookReservation.placeReservation({
    bookId: book,
    bookTitle: bookDoc.title,
    bookAccessionNumber: bookDoc.accessionNumber,
    bookAuthor: bookDoc.primaryAuthor,
    bookCategory: bookDoc.categoryName,
    libraryMemberId: libraryMember,
    memberName: memberDoc.memberName,
    membershipId: memberDoc.membershipId,
    memberType: memberDoc.memberType,
    memberId: memberDoc.memberId,
    memberGrade: memberDoc.memberGrade,
    academicYearId: currentYear?._id,
    academicYearName: currentYear?.name,
    createdBy: req.user._id,
    notes,
  });

  if (!result.success) {
    return res.status(HTTP_STATUS.CONFLICT).json({
      success: false,
      message: result.message,
      data: result,
    });
  }

  return res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: result.message,
    data: { reservation: result.reservation },
  });
});

exports.cancelReservation = catchAsync(async (req, res) => {
  const { reason } = req.body;
  const reservation = await BookReservation.cancelReservation(req.params.id, req.user._id, reason);

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Reservation cancelled.',
    data: { reservation },
  });
});

exports.getAllReservations = catchAsync(async (req, res) => {
  const { status, memberType, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (memberType) filter.memberType = memberType;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [reservations, total] = await Promise.all([
    BookReservation.find(filter)
      .sort({ reservationDate: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('book', 'title accessionNumber coverImage')
      .populate('libraryMember', 'memberName membershipId memberType')
      .lean(),
    BookReservation.countDocuments(filter),
  ]);

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Reservations fetched.',
    data: { reservations },
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
    },
  });
});

// ═══════════════════════════════════════════
// LIBRARY DASHBOARD
// ═══════════════════════════════════════════

exports.getLibraryDashboard = catchAsync(async (req, res) => {
  const currentYear = await AcademicYear.getCurrent();

  const [
    bookStats,
    categoryStats,
    memberStats,
    issueStats,
    overdueIssues,
    recentIssues,
    popularBooks,
    readyForCollection,
  ] = await Promise.all([
    Book.getDashboardStats(),
    BookCategory.getDashboardStats(),
    LibraryMember.getDashboardStats(currentYear?._id),
    BookIssue.getDashboardStats(currentYear?._id),
    BookIssue.getOverdue().limit(10),
    BookIssue.getTodayIssues(),
    Book.getPopular(5),
    BookReservation.getReadyForCollection(),
  ]);

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Library dashboard fetched.',
    data: {
      bookStats,
      categoryStats,
      memberStats,
      issueStats,
      overdueIssues,
      recentIssues,
      popularBooks,
      readyForCollection,
    },
  });
});

// ─── Batch Overdue Check ──────────────────────
exports.checkOverdueBooks = catchAsync(async (req, res) => {
  const count = await BookIssue.markOverdueIssues();

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: `${count} book issue(s) marked as overdue.`,
    data: { markedOverdue: count },
  });
});

// ─── Send Overdue Notifications ───────────────
exports.sendOverdueNotifications = catchAsync(async (req, res) => {
  const overdueIssues = await BookIssue.getOverdue()
    .populate('libraryMember', 'student teacher employee memberName')
    .lean();

  let notified = 0;

  for (const issue of overdueIssues) {
    try {
      const member = issue.libraryMember;
      const userRef = member?.student || member?.teacher || member?.employee;
      if (!userRef) continue;

      const staffDoc = await (member.student
        ? Student.findById(userRef).select('user').lean()
        : member.teacher
          ? Teacher.findById(userRef).select('user').lean()
          : Employee.findById(userRef).select('user').lean());

      if (staffDoc?.user) {
        await notifyBookOverdue(
          staffDoc.user,
          issue.bookTitle,
          issue.currentDaysOverdue,
          issue.currentFine,
          issue._id
        );
        await issue.markOverdueNoticeSent();
        notified++;
      }
    } catch (err) {
      console.error('Overdue notification error:', err.message);
    }
  }

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: `Overdue notifications sent to ${notified} member(s).`,
    data: { notified },
  });
});
