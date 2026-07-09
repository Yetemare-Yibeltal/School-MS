// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// ROOM MODEL
// ============================================

'use strict';

const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema(
  {
    // ─── Room Identity ────────────────────────
    name: {
      type: String,
      required: [true, 'Room name is required'],
      unique: true,
      trim: true,
      maxlength: [100, 'Room name cannot exceed 100 characters'],
      index: true,
    },

    // Room number e.g. "101", "Lab-1", "C-12"
    roomNumber: {
      type: String,
      required: [true, 'Room number is required'],
      unique: true,
      trim: true,
      uppercase: true,
      maxlength: [20, 'Room number cannot exceed 20 characters'],
      index: true,
    },

    // ─── Room Type ────────────────────────────
    type: {
      type: String,
      required: [true, 'Room type is required'],
      enum: {
        values: [
          'Classroom',
          'Laboratory',
          'Computer Lab',
          'Library',
          'Sports Field',
          'Gymnasium',
          'Staff Room',
          'Office',
          'Hall',
          'Conference Room',
          'Music Room',
          'Art Room',
          'Storage',
          'Other',
        ],
        message: '{VALUE} is not a valid room type',
      },
      index: true,
    },

    // ─── Location ─────────────────────────────
    // Building or block
    building: {
      type: String,
      trim: true,
      default: 'Main Block',
    },

    // Floor number (0 = ground floor)
    floor: {
      type: Number,
      default: 0,
      min: 0,
      max: 10,
    },

    // Wing or section of the building
    wing: {
      type: String,
      trim: true,
      default: null,
    },

    // ─── Capacity ─────────────────────────────
    capacity: {
      type: Number,
      required: [true, 'Room capacity is required'],
      min: [1, 'Capacity must be at least 1'],
      max: [500, 'Capacity cannot exceed 500'],
    },

    // ─── Facilities ───────────────────────────
    facilities: {
      // Has projector/smart board
      hasProjector: {
        type: Boolean,
        default: false,
      },

      // Has whiteboard
      hasWhiteboard: {
        type: Boolean,
        default: true,
      },

      // Has blackboard
      hasBlackboard: {
        type: Boolean,
        default: true,
      },

      // Has air conditioning
      hasAC: {
        type: Boolean,
        default: false,
      },

      // Has computers
      hasComputers: {
        type: Boolean,
        default: false,
      },

      // Number of computers
      numberOfComputers: {
        type: Number,
        default: 0,
        min: 0,
      },

      // Has internet access
      hasInternet: {
        type: Boolean,
        default: false,
      },

      // Has lab equipment
      hasLabEquipment: {
        type: Boolean,
        default: false,
      },

      // Lab type if applicable
      labType: {
        type: String,
        enum: ['Physics', 'Chemistry', 'Biology', 'Combined Science', 'Computer', 'Language', ''],
        default: '',
      },

      // Has sound system
      hasSoundSystem: {
        type: Boolean,
        default: false,
      },

      // Has CCTV
      hasCCTV: {
        type: Boolean,
        default: false,
      },

      // Other facilities
      other: {
        type: [String],
        default: [],
      },
    },

    // ─── Assignment ───────────────────────────
    // Currently assigned section (home room)
    assignedSection: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Section',
      default: null,
    },

    // Assigned section name (cached)
    assignedSectionName: {
      type: String,
      default: null,
    },

    // ─── Availability ─────────────────────────
    // Whether room is available for scheduling
    isAvailableForTimetable: {
      type: Boolean,
      default: true,
    },

    // Days when room is not available
    unavailableDays: {
      type: [String],
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      default: [],
    },

    // Maintenance schedule
    maintenanceSchedule: [
      {
        startDate: { type: Date },
        endDate: { type: Date },
        reason: { type: String, trim: true },
        reportedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
      },
    ],

    // ─── Room Condition ───────────────────────
    condition: {
      type: String,
      enum: ['Excellent', 'Good', 'Fair', 'Poor', 'Under Maintenance'],
      default: 'Good',
    },

    // Last inspection date
    lastInspectionDate: {
      type: Date,
      default: null,
    },

    // ─── Photo ────────────────────────────────
    photo: {
      url: { type: String, default: null },
      publicId: { type: String, default: null },
    },

    // ─── Status ───────────────────────────────
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    // ─── Sort Order ───────────────────────────
    sortOrder: {
      type: Number,
      default: 0,
    },

    // ─── Notes ────────────────────────────────
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },

    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
    },

    // ─── Audit ────────────────────────────────
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

// ─── Indexes ──────────────────────────────────
roomSchema.index({ name: 1 }, { unique: true });
roomSchema.index({ roomNumber: 1 }, { unique: true });
roomSchema.index({ type: 1, isActive: 1 });
roomSchema.index({ isActive: 1 });
roomSchema.index({ isAvailableForTimetable: 1 });
roomSchema.index({ floor: 1, building: 1 });
roomSchema.index({
  name: 'text',
  roomNumber: 'text',
  type: 'text',
});

// ─── Virtuals ─────────────────────────────────
// Display name with number
roomSchema.virtual('displayName').get(function () {
  return `${this.name} (${this.roomNumber})`;
});

// Is under maintenance
roomSchema.virtual('isUnderMaintenance').get(function () {
  const now = new Date();
  return this.maintenanceSchedule.some(
    (m) => new Date(m.startDate) <= now && new Date(m.endDate) >= now
  );
});

// Location string
roomSchema.virtual('locationString').get(function () {
  const parts = [this.building];
  if (this.floor !== undefined) {
    parts.push(`Floor ${this.floor === 0 ? 'G' : this.floor}`);
  }
  if (this.wing) parts.push(`Wing ${this.wing}`);
  return parts.join(', ');
});

// ─── Static Methods ───────────────────────────

// Find rooms by type
roomSchema.statics.findByType = function (type) {
  return this.find({
    type,
    isActive: true,
    isAvailableForTimetable: true,
  }).sort({ sortOrder: 1, name: 1 });
};

// Find available classrooms
roomSchema.statics.findClassrooms = function () {
  return this.find({
    type: 'Classroom',
    isActive: true,
    isAvailableForTimetable: true,
  }).sort({ floor: 1, name: 1 });
};

// Find available labs
roomSchema.statics.findLabs = function (labType = '') {
  const query = {
    type: 'Laboratory',
    isActive: true,
    isAvailableForTimetable: true,
  };
  if (labType) {
    query['facilities.labType'] = labType;
  }
  return this.find(query).sort({ name: 1 });
};

// Find computer labs
roomSchema.statics.findComputerLabs = function () {
  return this.find({
    type: 'Computer Lab',
    isActive: true,
    isAvailableForTimetable: true,
  }).sort({ name: 1 });
};

// Find rooms with sufficient capacity
roomSchema.statics.findByCapacity = function (minCapacity) {
  return this.find({
    capacity: { $gte: minCapacity },
    isActive: true,
    isAvailableForTimetable: true,
  }).sort({ capacity: 1, name: 1 });
};

// Find all available rooms for timetable
roomSchema.statics.findAvailableForTimetable = function () {
  return this.find({
    isActive: true,
    isAvailableForTimetable: true,
  }).sort({ type: 1, floor: 1, name: 1 });
};

// Check if room is available at a specific time
roomSchema.statics.isAvailableAt = async function (
  roomId,
  day,
  period,
  academicYearId,
  excludeTimetableSlotId = null
) {
  const TimetableSlot = mongoose.model('TimetableSlot');

  const query = {
    room: roomId,
    day,
    period,
    academicYear: academicYearId,
    isActive: true,
  };

  if (excludeTimetableSlotId) {
    query._id = { $ne: excludeTimetableSlotId };
  }

  const existing = await TimetableSlot.findOne(query);
  return !existing;
};

// Get room usage statistics
roomSchema.statics.getRoomUsageStats = async function (academicYearId) {
  const TimetableSlot = mongoose.model('TimetableSlot');

  return TimetableSlot.aggregate([
    {
      $match: {
        academicYear: new mongoose.Types.ObjectId(academicYearId),
        isActive: true,
      },
    },
    {
      $group: {
        _id: '$room',
        slotsUsed: { $sum: 1 },
        days: { $addToSet: '$day' },
      },
    },
    {
      $lookup: {
        from: 'rooms',
        localField: '_id',
        foreignField: '_id',
        as: 'roomData',
      },
    },
    { $unwind: '$roomData' },
    {
      $project: {
        roomName: '$roomData.name',
        roomNumber: '$roomData.roomNumber',
        roomType: '$roomData.type',
        capacity: '$roomData.capacity',
        slotsUsed: 1,
        daysUsed: { $size: '$days' },
      },
    },
    { $sort: { slotsUsed: -1 } },
  ]);
};

// Seed default rooms for Kat School
roomSchema.statics.seedDefaultRooms = async function () {
  const rooms = [
    // ── Classrooms ─────────────────────────
    {
      name: 'Classroom 101',
      roomNumber: '101',
      type: 'Classroom',
      building: 'Main Block',
      floor: 1,
      capacity: 45,
      sortOrder: 1,
      facilities: {
        hasWhiteboard: true,
        hasBlackboard: true,
      },
    },
    {
      name: 'Classroom 102',
      roomNumber: '102',
      type: 'Classroom',
      building: 'Main Block',
      floor: 1,
      capacity: 45,
      sortOrder: 2,
      facilities: {
        hasWhiteboard: true,
        hasBlackboard: true,
      },
    },
    {
      name: 'Classroom 103',
      roomNumber: '103',
      type: 'Classroom',
      building: 'Main Block',
      floor: 1,
      capacity: 45,
      sortOrder: 3,
      facilities: {
        hasWhiteboard: true,
        hasBlackboard: true,
      },
    },
    {
      name: 'Classroom 104',
      roomNumber: '104',
      type: 'Classroom',
      building: 'Main Block',
      floor: 1,
      capacity: 45,
      sortOrder: 4,
      facilities: {
        hasWhiteboard: true,
        hasBlackboard: true,
      },
    },
    {
      name: 'Classroom 201',
      roomNumber: '201',
      type: 'Classroom',
      building: 'Main Block',
      floor: 2,
      capacity: 45,
      sortOrder: 5,
      facilities: {
        hasWhiteboard: true,
        hasBlackboard: true,
      },
    },
    {
      name: 'Classroom 202',
      roomNumber: '202',
      type: 'Classroom',
      building: 'Main Block',
      floor: 2,
      capacity: 45,
      sortOrder: 6,
      facilities: {
        hasWhiteboard: true,
        hasBlackboard: true,
      },
    },
    {
      name: 'Classroom 203',
      roomNumber: '203',
      type: 'Classroom',
      building: 'Main Block',
      floor: 2,
      capacity: 45,
      sortOrder: 7,
      facilities: {
        hasWhiteboard: true,
        hasBlackboard: true,
      },
    },
    {
      name: 'Classroom 204',
      roomNumber: '204',
      type: 'Classroom',
      building: 'Main Block',
      floor: 2,
      capacity: 45,
      sortOrder: 8,
      facilities: {
        hasWhiteboard: true,
        hasBlackboard: true,
      },
    },
    // ── Laboratories ────────────────────────
    {
      name: 'Physics Laboratory',
      roomNumber: 'LAB-PHY',
      type: 'Laboratory',
      building: 'Science Block',
      floor: 1,
      capacity: 35,
      sortOrder: 9,
      facilities: {
        hasLabEquipment: true,
        hasWhiteboard: true,
        labType: 'Physics',
      },
    },
    {
      name: 'Chemistry Laboratory',
      roomNumber: 'LAB-CHEM',
      type: 'Laboratory',
      building: 'Science Block',
      floor: 1,
      capacity: 35,
      sortOrder: 10,
      facilities: {
        hasLabEquipment: true,
        hasWhiteboard: true,
        labType: 'Chemistry',
      },
    },
    {
      name: 'Biology Laboratory',
      roomNumber: 'LAB-BIO',
      type: 'Laboratory',
      building: 'Science Block',
      floor: 2,
      capacity: 35,
      sortOrder: 11,
      facilities: {
        hasLabEquipment: true,
        hasWhiteboard: true,
        labType: 'Biology',
      },
    },
    // ── Computer Lab ────────────────────────
    {
      name: 'Computer Laboratory',
      roomNumber: 'LAB-ICT',
      type: 'Computer Lab',
      building: 'ICT Block',
      floor: 1,
      capacity: 40,
      sortOrder: 12,
      facilities: {
        hasComputers: true,
        numberOfComputers: 40,
        hasInternet: true,
        hasProjector: true,
        hasWhiteboard: true,
        labType: 'Computer',
      },
    },
    // ── Library ─────────────────────────────
    {
      name: 'School Library',
      roomNumber: 'LIB-01',
      type: 'Library',
      building: 'Main Block',
      floor: 0,
      capacity: 60,
      sortOrder: 13,
      isAvailableForTimetable: false,
      facilities: {
        hasWhiteboard: false,
        hasInternet: true,
      },
    },
    // ── Sports Field ─────────────────────────
    {
      name: 'Sports Field',
      roomNumber: 'FIELD-01',
      type: 'Sports Field',
      building: 'Outdoor',
      floor: 0,
      capacity: 200,
      sortOrder: 14,
      facilities: {
        hasSoundSystem: false,
      },
    },
    // ── Staff Room ───────────────────────────
    {
      name: 'Staff Room',
      roomNumber: 'STAFF-01',
      type: 'Staff Room',
      building: 'Main Block',
      floor: 0,
      capacity: 30,
      sortOrder: 15,
      isAvailableForTimetable: false,
      facilities: {
        hasWhiteboard: true,
        hasInternet: true,
      },
    },
    // ── Hall ─────────────────────────────────
    {
      name: 'Assembly Hall',
      roomNumber: 'HALL-01',
      type: 'Hall',
      building: 'Main Block',
      floor: 0,
      capacity: 500,
      sortOrder: 16,
      isAvailableForTimetable: false,
      facilities: {
        hasSoundSystem: true,
        hasProjector: true,
        hasCCTV: true,
      },
    },
  ];

  for (const room of rooms) {
    await this.findOneAndUpdate(
      { roomNumber: room.roomNumber },
      { $setOnInsert: { ...room, isActive: true } },
      { upsert: true, new: true }
    );
  }

  console.info(`✅ ${rooms.length} rooms seeded for Kat School`);
};

// Get all rooms grouped by type
roomSchema.statics.getGroupedByType = async function () {
  return this.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: '$type',
        rooms: {
          $push: {
            _id: '$_id',
            name: '$name',
            roomNumber: '$roomNumber',
            capacity: '$capacity',
            floor: '$floor',
            building: '$building',
            isAvailableForTimetable: '$isAvailableForTimetable',
            facilities: '$facilities',
          },
        },
        count: { $sum: 1 },
        totalCapacity: { $sum: '$capacity' },
      },
    },
    { $sort: { _id: 1 } },
  ]);
};

// Get dashboard stats
roomSchema.statics.getDashboardStats = async function () {
  const [total, byType, totalCapacity] = await Promise.all([
    this.countDocuments({ isActive: true }),
    this.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalCapacity: { $sum: '$capacity' },
        },
      },
      { $sort: { count: -1 } },
    ]),
    this.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          total: { $sum: '$capacity' },
        },
      },
    ]),
  ]);

  return {
    total,
    byType,
    totalCapacity: totalCapacity[0]?.total || 0,
  };
};

// ─── Instance Methods ─────────────────────────

// Check if room is currently under maintenance
roomSchema.methods.isCurrentlyUnderMaintenance = function () {
  const now = new Date();
  return this.maintenanceSchedule.some(
    (m) => new Date(m.startDate) <= now && new Date(m.endDate) >= now
  );
};

// Check if room can accommodate a number of students
roomSchema.methods.canAccommodate = function (count) {
  return this.capacity >= count;
};

// Get facility summary as string
roomSchema.methods.getFacilitySummary = function () {
  const facilities = [];
  if (this.facilities.hasProjector) facilities.push('Projector');
  if (this.facilities.hasWhiteboard) facilities.push('Whiteboard');
  if (this.facilities.hasComputers)
    facilities.push(`${this.facilities.numberOfComputers} Computers`);
  if (this.facilities.hasInternet) facilities.push('Internet');
  if (this.facilities.hasLabEquipment) facilities.push('Lab Equipment');
  if (this.facilities.hasAC) facilities.push('Air Conditioning');
  return facilities.join(', ') || 'Basic facilities';
};

// Add maintenance record
roomSchema.methods.addMaintenance = async function ({ startDate, endDate, reason, reportedBy }) {
  this.maintenanceSchedule.push({
    startDate,
    endDate,
    reason,
    reportedBy,
  });

  // Update condition if under maintenance
  const now = new Date();
  if (new Date(startDate) <= now && new Date(endDate) >= now) {
    this.condition = 'Under Maintenance';
  }

  await this.save();
  return this;
};

// ─── Create Model ─────────────────────────────
const Room = mongoose.model('Room', roomSchema);

module.exports = Room;
