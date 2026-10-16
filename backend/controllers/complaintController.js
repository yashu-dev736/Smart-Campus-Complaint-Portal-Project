const { db } = require("../config/firebase");
const {
  GeoPoint,
  Timestamp,
} = require("firebase-admin/firestore");

// =====================================================
// COLLECTIONS AND CONSTANTS
// =====================================================

const COMPLAINTS_COLLECTION = "complaints";
const NOTIFICATIONS_COLLECTION = "notifications";

const VALID_STATUSES = [
  "Pending",
  "In Progress",
  "Resolved",
  "Rejected",
  "Closed",
];

// =====================================================
// USER HELPERS
// =====================================================

const getUserId = (user) =>
  user?.uid || user?.id || user?.userId || null;

const getUserEmail = (user) =>
  String(user?.email || "").trim().toLowerCase();

const getUserName = (user) =>
  user?.name ||
  user?.fullName ||
  user?.displayName ||
  user?.userName ||
  user?.email ||
  "User";

const getUserRole = (user) =>
  String(user?.role || "").trim().toLowerCase();

const normalizeEmail = (email) =>
  String(email || "").trim().toLowerCase();

const requireAuthenticatedUser = (req, res) => {
  const userId = getUserId(req.user);

  if (!userId) {
    res.status(401).json({
      success: false,
      error: "Authentication required",
    });

    return null;
  }

  return userId;
};

// =====================================================
// TIMESTAMP HELPERS
// =====================================================

const formatTimestamp = (value) => {
  if (!value) return null;

  if (typeof value.toDate === "function") {
    return value.toDate().toISOString();
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (
    typeof value === "object" &&
    typeof value.seconds === "number"
  ) {
    return new Date(value.seconds * 1000).toISOString();
  }

  return value;
};

const formatEntries = (entries) =>
  (Array.isArray(entries) ? entries : []).map((item) => ({
    ...item,
    createdAt: formatTimestamp(item.createdAt),
  }));

// =====================================================
// ASSIGNMENT HELPERS
// =====================================================

const getAssignmentDetails = (value) => {
  if (!value) {
    return {
      id: null,
      name: null,
      email: null,
    };
  }

  if (typeof value === "string") {
    const normalized = value.trim();

    if (!normalized) {
      return {
        id: null,
        name: null,
        email: null,
      };
    }

    if (normalized.includes("@")) {
      return {
        id: null,
        name: normalized,
        email: normalized,
      };
    }

    return {
      id: normalized,
      name: null,
      email: null,
    };
  }

  if (typeof value === "object") {
    return {
      id:
        value.uid ||
        value.id ||
        value.userId ||
        value.staffId ||
        null,

      name:
        value.name ||
        value.fullName ||
        value.displayName ||
        value.userName ||
        null,

      email:
        value.email ||
        value.userEmail ||
        null,
    };
  }

  return {
    id: null,
    name: null,
    email: null,
  };
};

// =====================================================
// LOCATION HELPERS
// =====================================================

const formatLocation = (data) => {
  if (!data) return null;

  const location = data.location;

  let latitude;
  let longitude;

  if (
    location &&
    typeof location.latitude === "number" &&
    typeof location.longitude === "number"
  ) {
    latitude = location.latitude;
    longitude = location.longitude;
  } else if (
    location &&
    Number.isFinite(location._latitude) &&
    Number.isFinite(location._longitude)
  ) {
    latitude = location._latitude;
    longitude = location._longitude;
  }

  if (
    latitude === undefined ||
    longitude === undefined
  ) {
    return data.locationAddress
      ? {
          latitude: null,
          longitude: null,
          accuracy: data.locationAccuracy ?? null,
          address: data.locationAddress,
          capturedAt: formatTimestamp(
            data.locationCapturedAt
          ),
        }
      : null;
  }

  return {
    latitude,
    longitude,
    accuracy: data.locationAccuracy ?? null,

    address:
      data.locationAddress ||
      location?.address ||
      "",

    capturedAt: formatTimestamp(
      data.locationCapturedAt
    ),
  };
};

// =====================================================
// FORMAT COMPLAINT
// =====================================================

const formatComplaint = (doc) => {
  const data =
    typeof doc.data === "function"
      ? doc.data()
      : doc;

  const id =
    doc.id ||
    data.id ||
    data._id ||
    null;

  const assignedToDetails = getAssignmentDetails(
    data.assignedTo
  );

  const assignedStaffDetails = getAssignmentDetails(
    data.assignedStaff
  );

  const assignedToName =
    data.assignedToName ||
    data.assignedStaffName ||
    assignedToDetails.name ||
    assignedStaffDetails.name ||
    null;

  const assignedToEmail =
    data.assignedToEmail ||
    data.assignedStaffEmail ||
    assignedToDetails.email ||
    assignedStaffDetails.email ||
    null;

  const assignedToId =
    assignedToDetails.id ||
    assignedStaffDetails.id ||
    null;

  const userName =
    data.userName ||
    data.parentName ||
    data.staffName ||
    data.submittedByName ||
    data.createdByName ||
    data.name ||
    null;

  const userEmail =
    data.userEmail ||
    data.contactEmail ||
    data.email ||
    data.parentEmail ||
    data.staffEmail ||
    data.submittedByEmail ||
    data.createdByEmail ||
    null;

  return {
    ...data,

    id,
    _id: id,

    // Submitter information
    userName,
    userEmail,

    submittedByName:
      data.submittedByName || userName,

    submittedByEmail:
      data.submittedByEmail || userEmail,

    raisedBy:
      data.raisedBy || "unknown",

    // Assignment information
    assignedTo:
      data.assignedTo ?? null,

    assignedStaff:
      data.assignedStaff ?? null,

    assignedToId,
    assignedToName,
    assignedToEmail,

    // Location
    location: formatLocation(data),

    createdAt: formatTimestamp(data.createdAt),
    updatedAt: formatTimestamp(data.updatedAt),

    locationCapturedAt: formatTimestamp(
      data.locationCapturedAt
    ),

    // History and discussion
    history: formatEntries(data.history),
    statusHistory: formatEntries(
      data.statusHistory
    ),

    comments: formatEntries(data.comments),
    notes: formatEntries(data.notes),
    discussion: formatEntries(data.discussion),
  };
};

// =====================================================
// VISIBILITY HELPERS
// =====================================================

const isParentComplaint = (data) =>
  String(data.raisedBy || "").toLowerCase() === "parent";

const isStaffComplaint = (data) =>
  String(data.raisedBy || "").toLowerCase() === "staff";

const belongsToParent = (
  data,
  userId,
  userEmail
) => {
  const email = normalizeEmail(userEmail);

  return (
    data.parentId === userId ||
    data.userId === userId ||
    data.createdBy === userId ||
    (
      email &&
      [
        data.userEmail,
        data.email,
        data.contactEmail,
      ].some(
        (value) => normalizeEmail(value) === email
      )
    )
  );
};

const belongsToStaff = (
  data,
  userId,
  userEmail
) => {
  const email = normalizeEmail(userEmail);

  return (
    data.staffId === userId ||
    data.userId === userId ||
    data.createdBy === userId ||
    (
      email &&
      [
        data.userEmail,
        data.email,
        data.contactEmail,
      ].some(
        (value) => normalizeEmail(value) === email
      )
    )
  );
};

const canViewComplaint = (
  data,
  role,
  userId,
  userEmail
) => {
  if (role === "parent") {
    return belongsToParent(
      data,
      userId,
      userEmail
    );
  }

  if (role === "staff") {
    return (
      isParentComplaint(data) ||
      (
        isStaffComplaint(data) &&
        belongsToStaff(
          data,
          userId,
          userEmail
        )
      )
    );
  }

  if (role === "admin") {
    return isStaffComplaint(data);
  }

  return false;
};

// =====================================================
// NOTIFICATION HELPER
// =====================================================

const createNotification = async ({
  recipientRole,
  recipientId = null,
  recipientEmail = null,
  complaintId,
  title,
  message,
  type,
  previousStatus = null,
  status = null,
}) => {
  const notification = {
    recipientRole: String(recipientRole || "")
      .trim()
      .toLowerCase(),

    userId: recipientId,
    recipientId,

    recipientEmail: recipientEmail
      ? normalizeEmail(recipientEmail)
      : null,

    complaintId,
    title,
    message,
    type,

    previousStatus,
    status,

    read: false,
    createdAt: Timestamp.now(),
  };

  const ref = await db
    .collection(NOTIFICATIONS_COLLECTION)
    .add(notification);

  return ref.id;
};

// =====================================================
// CREATE COMPLAINT
// =====================================================

const createComplaint = async (req, res) => {
  try {
    const userId = requireAuthenticatedUser(
      req,
      res
    );

    if (!userId) return;

    const role = getUserRole(req.user);

    if (
      !["parent", "staff", "admin"].includes(role)
    ) {
      return res.status(403).json({
        success: false,
        error: "You are not authorized to create complaints",
      });
    }

    const {
      title,
      description,
      category,
      priority,
      location,
      contactEmail,
    } = req.body;

    if (
      typeof title !== "string" ||
      !title.trim() ||
      typeof description !== "string" ||
      !description.trim()
    ) {
      return res.status(400).json({
        success: false,
        error: "Title and description are required",
      });
    }

    const now = Timestamp.now();

    const userName = getUserName(req.user);
    const userEmail = getUserEmail(req.user);

    let complaintLocation = null;
    let locationAccuracy = null;
    let locationAddress = "";
    let locationCapturedAt = null;

    if (location && typeof location === "object") {
      const hasCoordinates =
        location.latitude != null &&
        location.longitude != null;

      if (hasCoordinates) {
        const latitude = Number(location.latitude);
        const longitude = Number(location.longitude);

        if (
          !Number.isFinite(latitude) ||
          !Number.isFinite(longitude) ||
          latitude < -90 ||
          latitude > 90 ||
          longitude < -180 ||
          longitude > 180
        ) {
          return res.status(400).json({
            success: false,
            error: "Invalid location coordinates",
          });
        }

        complaintLocation = new GeoPoint(
          latitude,
          longitude
        );
      }

      if (location.accuracy != null) {
        const accuracy = Number(location.accuracy);

        if (
          Number.isFinite(accuracy) &&
          accuracy >= 0
        ) {
          locationAccuracy = accuracy;
        }
      }

      if (typeof location.address === "string") {
        locationAddress = location.address.trim();
      }

      if (location.capturedAt) {
        const date = new Date(location.capturedAt);

        if (!Number.isNaN(date.getTime())) {
          locationCapturedAt =
            Timestamp.fromDate(date);
        }
      }

      if (!locationCapturedAt) {
        locationCapturedAt = now;
      }
    }

    const normalizedContactEmail =
      typeof contactEmail === "string" &&
      contactEmail.trim()
        ? contactEmail.trim().toLowerCase()
        : userEmail;

    const complaintData = {
      title: title.trim(),
      description: description.trim(),

      category:
        typeof category === "string" &&
        category.trim()
          ? category.trim()
          : "Other",

      priority:
        typeof priority === "string" &&
        priority.trim()
          ? priority.trim()
          : "Medium",

      status: "Pending",

      location: complaintLocation,
      locationAccuracy,
      locationAddress,
      locationCapturedAt,

      userId,
      createdBy: userId,

      parentId:
        role === "parent" ? userId : null,

      staffId:
        role === "staff" ? userId : null,

      raisedBy: role,

      // Save submitter information consistently.
      userName,
      userEmail,

      submittedByName: userName,
      submittedByEmail: userEmail,

      contactEmail: normalizedContactEmail,

      // No staff assignment is made automatically.
      assignedTo: null,
      assignedStaff: null,
      assignedToId: null,
      assignedToName: null,
      assignedToEmail: null,

      createdAt: now,
      updatedAt: now,

      history: [
        {
          status: "Pending",
          changedBy: userId,
          changedByName: userName,
          note: "Complaint created",
          createdAt: now,
        },
      ],

      comments: [],
      notes: [],
      discussion: [],
    };

    const complaintRef = await db
      .collection(COMPLAINTS_COLLECTION)
      .add(complaintData);

    // Notify the appropriate role.
    try {
      let recipientRole;
      let notificationTitle;

      if (role === "parent") {
        recipientRole = "staff";
        notificationTitle = "New Parent Complaint";
      } else if (role === "staff") {
        recipientRole = "admin";
        notificationTitle = "New Staff Complaint";
      } else {
        recipientRole = "staff";
        notificationTitle = "New Admin Complaint";
      }

      await createNotification({
        recipientRole,
        complaintId: complaintRef.id,
        title: notificationTitle,
        message:
          `${userName} submitted a new complaint: ` +
          `"${title.trim()}".`,
        type: "new_complaint",
        status: "Pending",
      });
    } catch (notificationError) {
      console.error(
        "Complaint saved, but notification creation failed:",
        notificationError
      );
    }

    const savedDoc = await complaintRef.get();

    return res.status(201).json({
      success: true,
      message: "Complaint created successfully",
      complaint: formatComplaint(savedDoc),
    });
  } catch (error) {
    console.error("Create complaint error:", error);

    return res.status(500).json({
      success: false,
      error: "Server error while creating complaint",
    });
  }
};

// =====================================================
// GET COMPLAINTS
// =====================================================

const getComplaints = async (req, res) => {
  try {
    const userId = requireAuthenticatedUser(
      req,
      res
    );

    if (!userId) return;

    const role = getUserRole(req.user);
    const email = getUserEmail(req.user);

    const snapshot = await db
      .collection(COMPLAINTS_COLLECTION)
      .get();

    const complaints = [];

    snapshot.forEach((doc) => {
      if (
        canViewComplaint(
          doc.data(),
          role,
          userId,
          email
        )
      ) {
        complaints.push(formatComplaint(doc));
      }
    });

    complaints.sort(
      (a, b) =>
        new Date(b.createdAt || 0).getTime() -
        new Date(a.createdAt || 0).getTime()
    );

    return res.status(200).json({
      success: true,
      count: complaints.length,
      complaints,
    });
  } catch (error) {
    console.error("Get complaints error:", error);

    return res.status(500).json({
      success: false,
      error: "Server error while fetching complaints",
    });
  }
};

// =====================================================
// GET PARENT COMPLAINTS
// =====================================================

const getParentComplaints = async (req, res) => {
  try {
    const userId = requireAuthenticatedUser(
      req,
      res
    );

    if (!userId) return;

    if (getUserRole(req.user) !== "parent") {
      return res.status(403).json({
        success: false,
        error: "Only parents can access this endpoint",
      });
    }

    const email = getUserEmail(req.user);

    const snapshot = await db
      .collection(COMPLAINTS_COLLECTION)
      .get();

    const complaints = [];

    snapshot.forEach((doc) => {
      if (
        belongsToParent(
          doc.data(),
          userId,
          email
        )
      ) {
        complaints.push(formatComplaint(doc));
      }
    });

    complaints.sort(
      (a, b) =>
        new Date(b.createdAt || 0).getTime() -
        new Date(a.createdAt || 0).getTime()
    );

    return res.status(200).json({
      success: true,
      count: complaints.length,
      complaints,
    });
  } catch (error) {
    console.error(
      "Get parent complaints error:",
      error
    );

    return res.status(500).json({
      success: false,
      error: "Server error while fetching parent complaints",
    });
  }
};

// =====================================================
// COMPLAINT STATISTICS
// =====================================================

const getComplaintStats = async (req, res) => {
  try {
    const userId = requireAuthenticatedUser(
      req,
      res
    );

    if (!userId) return;

    const role = getUserRole(req.user);
    const email = getUserEmail(req.user);

    const snapshot = await db
      .collection(COMPLAINTS_COLLECTION)
      .get();

    const stats = {
      total: 0,
      pending: 0,
      inProgress: 0,
      resolved: 0,
      rejected: 0,
      assigned: 0,
      unassigned: 0,
    };

    snapshot.forEach((doc) => {
      const data = doc.data();

      if (
        !canViewComplaint(
          data,
          role,
          userId,
          email
        )
      ) {
        return;
      }

      stats.total++;

      const status = String(
        data.status || "Pending"
      )
        .toLowerCase()
        .replace(/[\s_-]/g, "");

      if (status === "pending") {
        stats.pending++;
      } else if (status === "inprogress") {
        stats.inProgress++;
      } else if (status === "resolved") {
        stats.resolved++;
      } else if (status === "rejected") {
        stats.rejected++;
      }

      if (data.assignedTo || data.assignedStaff) {
        stats.assigned++;
      } else {
        stats.unassigned++;
      }
    });

    return res.status(200).json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error(
      "Get complaint stats error:",
      error
    );

    return res.status(500).json({
      success: false,
      error: "Server error while fetching complaint statistics",
    });
  }
};

// =====================================================
// UPDATE STATUS AND ASSIGNMENT
// =====================================================

const updateComplaintStatus = async (req, res) => {
  try {
    const userId = requireAuthenticatedUser(
      req,
      res
    );

    if (!userId) return;

    const role = getUserRole(req.user);
    const userEmail = getUserEmail(req.user);

    if (!["staff", "admin"].includes(role)) {
      return res.status(403).json({
        success: false,
        error: "You are not authorized to update complaints",
      });
    }

    const { id } = req.params;

    const {
      status,
      note,
      assignedTo,
      assignedStaff,
    } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: "Complaint ID is required",
      });
    }

    if (
      status !== undefined &&
      (
        typeof status !== "string" ||
        !VALID_STATUSES.includes(status)
      )
    ) {
      return res.status(400).json({
        success: false,
        error: "Invalid complaint status",
        validStatuses: VALID_STATUSES,
      });
    }

    const complaintRef = db
      .collection(COMPLAINTS_COLLECTION)
      .doc(id);

    const now = Timestamp.now();
    const userName = getUserName(req.user);

    let updatedComplaint;
    let statusChanged = false;
    let assignmentChanged = false;
    let previousStatus = null;
    let existingData;

    await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(
        complaintRef
      );

      if (!doc.exists) {
        throw new Error("COMPLAINT_NOT_FOUND");
      }

      existingData = doc.data();

      const allowed =
        role === "staff"
          ? (
              isParentComplaint(existingData) ||
              (
                isStaffComplaint(existingData) &&
                belongsToStaff(
                  existingData,
                  userId,
                  userEmail
                )
              )
            )
          : isStaffComplaint(existingData);

      if (!allowed) {
        throw new Error(
          "COMPLAINT_UPDATE_FORBIDDEN"
        );
      }

      previousStatus =
        existingData.status || "Pending";

      const updateData = {
        updatedAt: now,
      };

      if (status !== undefined) {
        statusChanged =
          previousStatus !== status;

        if (statusChanged) {
          const history = Array.isArray(
            existingData.history
          )
            ? existingData.history
            : [];

          const historyEntry = {
            status,
            previousStatus,
            changedBy: userId,
            changedByName: userName,
            note:
              typeof note === "string" &&
              note.trim()
                ? note.trim()
                : `Status changed from ${previousStatus} to ${status}`,
            createdAt: now,
          };

          updateData.status = status;
          updateData.history = [
            ...history,
            historyEntry,
          ];
        }
      }

      // Store assignment in a consistent format.
      if (assignedTo !== undefined) {
        const details =
          getAssignmentDetails(assignedTo);

        updateData.assignedTo =
          assignedTo || null;

        updateData.assignedToId = details.id;
        updateData.assignedToName =
          details.name;

        updateData.assignedToEmail =
          details.email;

        assignmentChanged = true;
      }

      if (assignedStaff !== undefined) {
        const details =
          getAssignmentDetails(assignedStaff);

        updateData.assignedStaff =
          assignedStaff || null;

        // Keep the display fields populated if the
        // assignedTo field was not supplied.
        if (assignedTo === undefined) {
          updateData.assignedToId =
            details.id;

          updateData.assignedToName =
            details.name;

          updateData.assignedToEmail =
            details.email;
        }

        assignmentChanged = true;
      }

      transaction.update(
        complaintRef,
        updateData
      );

      updatedComplaint = {
        ...existingData,
        ...updateData,
        id: complaintRef.id,
        _id: complaintRef.id,
      };
    });

    // Notify after a successful transaction.
    try {
      if (statusChanged) {
        if (role === "staff") {
          await createNotification({
            recipientRole: "admin",
            complaintId: id,
            title: "Complaint Updated by Staff",
            message:
              `${userName} changed ` +
              `"${existingData.title || "Complaint"}" ` +
              `from ${previousStatus} to ${status}.`,
            type: "complaint_status_update",
            previousStatus,
            status,
          });

          if (isParentComplaint(existingData)) {
            const parentId =
              existingData.parentId ||
              existingData.userId ||
              existingData.createdBy ||
              null;

            const parentEmail =
              existingData.userEmail ||
              existingData.contactEmail ||
              existingData.email ||
              null;

            if (parentId || parentEmail) {
              await createNotification({
                recipientRole: "parent",
                recipientId: parentId,
                recipientEmail: parentEmail,
                complaintId: id,
                title: "Your Complaint Status Updated",
                message:
                  `Your complaint ` +
                  `"${existingData.title || "Complaint"}" ` +
                  `changed from ${previousStatus} to ${status}.`,
                type: "complaint_status_update",
                previousStatus,
                status,
              });
            }
          }
        } else {
          await createNotification({
            recipientRole: "staff",
            complaintId: id,
            title: "Complaint Updated by Admin",
            message:
              `Admin changed ` +
              `"${existingData.title || "Complaint"}" ` +
              `from ${previousStatus} to ${status}.`,
            type: "complaint_status_update",
            previousStatus,
            status,
          });
        }
      }
    } catch (notificationError) {
      console.error(
        "Complaint updated, but notification creation failed:",
        notificationError
      );
    }

    return res.status(200).json({
      success: true,
      message: assignmentChanged
        ? "Complaint updated successfully"
        : "Complaint status updated successfully",

      statusChanged,
      assignmentChanged,

      complaint: formatComplaint(
        updatedComplaint
      ),
    });
  } catch (error) {
    if (error.message === "COMPLAINT_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        error: "Complaint not found",
      });
    }

    if (
      error.message === "COMPLAINT_UPDATE_FORBIDDEN"
    ) {
      return res.status(403).json({
        success: false,
        error: "You are not authorized to update this complaint",
      });
    }

    console.error(
      "Update complaint error:",
      error
    );

    return res.status(500).json({
      success: false,
      error: "Server error while updating complaint",
    });
  }
};

// =====================================================
// ADD COMMENT
// =====================================================

const addComment = async (req, res) => {
  try {
    const userId = requireAuthenticatedUser(
      req,
      res
    );

    if (!userId) return;

    const { id } = req.params;

    const commentText =
      req.body.comment || req.body.message;

    if (
      typeof commentText !== "string" ||
      !commentText.trim()
    ) {
      return res.status(400).json({
        success: false,
        error: "Comment is required",
      });
    }

    const complaintRef = db
      .collection(COMPLAINTS_COLLECTION)
      .doc(id);

    const doc = await complaintRef.get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: "Complaint not found",
      });
    }

    const data = doc.data();

    const role = getUserRole(req.user);

    const allowed =
      canViewComplaint(
        data,
        role,
        userId,
        getUserEmail(req.user)
      ) ||
      (
        role === "admin" &&
        isStaffComplaint(data)
      );

    if (!allowed) {
      return res.status(403).json({
        success: false,
        error: "You are not authorized to comment on this complaint",
      });
    }

    const now = Timestamp.now();

    const comment = {
      comment: commentText.trim(),
      message: commentText.trim(),

      userId,
      userName: getUserName(req.user),
      userEmail: getUserEmail(req.user),

      role,

      createdAt: now,
    };

    const comments = Array.isArray(data.comments)
      ? data.comments
      : [];

    const updatedComments = [
      ...comments,
      comment,
    ];

    await complaintRef.update({
      comments: updatedComments,
      notes: updatedComments,
      discussion: updatedComments,
      updatedAt: now,
    });

    return res.status(201).json({
      success: true,
      message: "Comment added successfully",

      comment: {
        ...comment,
        createdAt: formatTimestamp(now),
      },
    });
  } catch (error) {
    console.error(
      "Add comment error:",
      error
    );

    return res.status(500).json({
      success: false,
      error: "Server error while adding comment",
    });
  }
};

// =====================================================
// DELETE COMPLAINT
// =====================================================

const deleteComplaint = async (req, res) => {
  try {
    const userId = requireAuthenticatedUser(
      req,
      res
    );

    if (!userId) return;

    const role = getUserRole(req.user);
    const email = getUserEmail(req.user);

    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: "Complaint ID is required",
      });
    }

    if (!["staff", "admin"].includes(role)) {
      return res.status(403).json({
        success: false,
        error: "You are not authorized to delete complaints",
      });
    }

    const ref = db
      .collection(COMPLAINTS_COLLECTION)
      .doc(id);

    const doc = await ref.get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: "Complaint not found",
      });
    }

    const data = doc.data();

    const allowed =
      role === "staff"
        ? (
            isParentComplaint(data) ||
            (
              isStaffComplaint(data) &&
              belongsToStaff(
                data,
                userId,
                email
              )
            )
          )
        : isStaffComplaint(data);

    if (!allowed) {
      return res.status(403).json({
        success: false,
        error: "You are not authorized to delete this complaint",
      });
    }

    await ref.delete();

    return res.status(200).json({
      success: true,
      message: "Complaint deleted successfully",
      complaintId: id,
    });
  } catch (error) {
    console.error(
      "Delete complaint error:",
      error
    );

    return res.status(500).json({
      success: false,
      error: "Server error while deleting complaint",
    });
  }
};

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
  createComplaint,
  getComplaints,
  getParentComplaints,
  getComplaintStats,
  updateComplaintStatus,
  addComment,
  deleteComplaint,
};