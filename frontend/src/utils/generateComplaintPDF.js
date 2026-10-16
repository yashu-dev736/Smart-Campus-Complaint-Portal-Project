import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// =====================================================
// HELPER: FORMAT DATE
// =====================================================

const formatDate = (value) => {
  if (!value) return "N/A";

  let date;

  try {
    // Handle Firestore Timestamp objects.
    if (typeof value === "object" && value !== null) {
      if (typeof value.toDate === "function") {
        date = value.toDate();
      } else if (typeof value.seconds === "number") {
        date = new Date(value.seconds * 1000);
      } else if (typeof value._seconds === "number") {
        date = new Date(value._seconds * 1000);
      } else {
        date = new Date(value);
      }
    } else {
      date = new Date(value);
    }

    if (Number.isNaN(date.getTime())) {
      return "N/A";
    }

    return date.toLocaleString();
  } catch (error) {
    console.error("Date formatting error:", error);
    return "N/A";
  }
};

// =====================================================
// HELPER: FORMAT TEXT
// =====================================================

const formatText = (value, fallback = "N/A") => {
  if (
    value === null ||
    value === undefined ||
    String(value).trim() === ""
  ) {
    return fallback;
  }

  return String(value);
};

// =====================================================
// MAIN FUNCTION: GENERATE COMPLAINT PDF
// =====================================================

export const generateComplaintPDF = (
  complaints,
  role = "User"
) => {
  // Validate complaint data.
  if (!Array.isArray(complaints)) {
    console.error(
      "PDF generation failed: complaints must be an array."
    );

    alert("Unable to generate the report. Invalid complaint data.");
    return;
  }

  if (complaints.length === 0) {
    alert("No complaints available to export.");
    return;
  }

  try {
    // Create landscape A4 PDF.
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    const pageWidth =
      doc.internal.pageSize.getWidth();

    const pageHeight =
      doc.internal.pageSize.getHeight();

    const generatedDate = new Date().toLocaleString();

    const normalizedRole =
      String(role).trim().toUpperCase();

    // =================================================
    // REPORT HEADER
    // =================================================

    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);

    doc.text(
      "SMART CAMPUS COMPLAINT PORTAL",
      14,
      18
    );

    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);

    doc.text(
      `${normalizedRole} COMPLAINT REPORT`,
      14,
      27
    );

    doc.setFontSize(9);

    doc.text(
      `Generated On: ${generatedDate}`,
      14,
      34
    );

    doc.text(
      `Total Complaints: ${complaints.length}`,
      14,
      40
    );

    // =================================================
    // COMPLAINT STATUS SUMMARY
    // =================================================

    const getStatus = (complaint) =>
      formatText(complaint.status, "Pending")
        .trim()
        .toLowerCase();

    const pendingCount = complaints.filter(
      (complaint) =>
        getStatus(complaint) === "pending"
    ).length;

    const resolvedCount = complaints.filter(
      (complaint) =>
        getStatus(complaint) === "resolved"
    ).length;

    const rejectedCount = complaints.filter(
      (complaint) =>
        getStatus(complaint) === "rejected"
    ).length;

    const closedCount = complaints.filter(
      (complaint) =>
        getStatus(complaint) === "closed"
    ).length;

    const assignedCount = complaints.filter(
      (complaint) =>
        getStatus(complaint) === "assigned"
    ).length;

    doc.setFontSize(9);

    doc.text(
      `Pending: ${pendingCount}   |   Assigned: ${assignedCount}   |   Resolved: ${resolvedCount}   |   Rejected: ${rejectedCount}   |   Closed: ${closedCount}`,
      14,
      47
    );

    // =================================================
    // TABLE DATA
    // =================================================

    const tableRows = complaints.map(
      (complaint, index) => [
        index + 1,

        formatText(
          complaint.id ||
          complaint.complaintId
        ),

        formatText(complaint.title),

        formatText(complaint.category),

        formatText(
          complaint.raisedBy ||
          complaint.createdBy ||
          complaint.role
        ),

        formatText(complaint.status, "Pending"),

        formatDate(complaint.createdAt),

        formatDate(complaint.updatedAt),
      ]
    );

    // =================================================
    // GENERATE COMPLAINT TABLE
    // =================================================

    autoTable(doc, {
      startY: 53,

      head: [
        [
          "S.No",
          "Complaint ID",
          "Title",
          "Category",
          "Raised By",
          "Status",
          "Created Date",
          "Updated Date",
        ],
      ],

      body: tableRows,

      theme: "grid",

      styles: {
        font: "helvetica",
        fontSize: 8,
        cellPadding: 3,
        overflow: "linebreak",
        valign: "middle",
        lineWidth: 0.1,
      },

      headStyles: {
        fillColor: [37, 99, 235],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        halign: "center",
      },

      alternateRowStyles: {
        fillColor: [245, 247, 250],
      },

      columnStyles: {
        0: { cellWidth: 12 },
        1: { cellWidth: 28 },
        2: { cellWidth: 48 },
        3: { cellWidth: 30 },
        4: { cellWidth: 23 },
        5: { cellWidth: 22 },
        6: { cellWidth: 35 },
        7: { cellWidth: 35 },
      },

      margin: {
        top: 12,
        left: 14,
        right: 14,
        bottom: 18,
      },

      didDrawPage: () => {
        // Footer on each page.
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");

        doc.text(
          "Smart Campus Complaint Portal",
          14,
          pageHeight - 8
        );

        const pageNumber =
          doc.internal.getCurrentPageInfo().pageNumber;

        doc.text(
          `Page ${pageNumber}`,
          pageWidth - 14,
          pageHeight - 8,
          { align: "right" }
        );
      },
    });

    // =================================================
    // COMPLAINT DESCRIPTION SECTION
    // =================================================

    doc.addPage();

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);

    doc.text(
      "COMPLAINT DETAILS",
      14,
      18
    );

    let currentY = 28;

    complaints.forEach((complaint, index) => {
      const title = formatText(
        complaint.title,
        "Untitled Complaint"
      );

      const description = formatText(
        complaint.description,
        "No description provided."
      );

      const category = formatText(
        complaint.category
      );

      const status = formatText(
        complaint.status,
        "Pending"
      );

      const complaintId = formatText(
        complaint.id ||
        complaint.complaintId,
        `Complaint ${index + 1}`
      );

      const raisedBy = formatText(
        complaint.raisedBy ||
        complaint.createdBy ||
        complaint.role
      );

      const createdAt = formatDate(
        complaint.createdAt
      );

      const updatedAt = formatDate(
        complaint.updatedAt
      );

      const details = [
        `Complaint ID: ${complaintId}`,
        `Title: ${title}`,
        `Category: ${category}`,
        `Raised By: ${raisedBy}`,
        `Status: ${status}`,
        `Created Date: ${createdAt}`,
        `Updated Date: ${updatedAt}`,
        `Description: ${description}`,
      ];

      const wrappedLines = [];

      details.forEach((detail) => {
        const lines = doc.splitTextToSize(
          detail,
          pageWidth - 32
        );

        wrappedLines.push(...lines);
      });

      const blockHeight =
        wrappedLines.length * 5 + 12;

      // Add a page if the complaint details
      // would overflow the current page.
      if (currentY + blockHeight > pageHeight - 15) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);

      doc.text(
        `Complaint ${index + 1}`,
        14,
        currentY
      );

      currentY += 6;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);

      wrappedLines.forEach((line) => {
        doc.text(line, 16, currentY);
        currentY += 5;
      });

      currentY += 7;
    });

    // =================================================
    // DOWNLOAD PDF
    // =================================================

    const safeRole = String(role)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-");

    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, "-");

    const filename =
      `${safeRole}-complaint-report-${timestamp}.pdf`;

    doc.save(filename);

    console.log(
      `${normalizedRole} complaint report generated successfully.`
    );
  } catch (error) {
    console.error(
      "PDF generation failed:",
      error
    );

    alert(
      "Unable to generate the PDF report. Please try again."
    );
  }
};