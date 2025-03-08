$(document).ready(function () {
  // Make POST request to get records
  fetch("/getrecords", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userid: userId }),
  })
    .then((response) => response.json())
    .then((data) => {
      // Convert data object into array of rows for DataTable
      const rows = [];
      for (const [date, entries] of Object.entries(data)) {
        entries.forEach((entry) => {
          rows.push([
            entry.id,
            date,
            entry.projectName,
            entry.category,
            entry.wc,
          ]);
        });
      }

      // Get existing DataTable instance
      const table = $("#myTable").DataTable({
        data: rows,
        columns: [
          { title: "ID", visible: false }, // Hidden ID column
          { title: "Date", className: "text-center" },
          { title: "Project Name", className: "text-center" },
          { title: "Category", className: "text-center" },
          { title: "Word Count", className: "text-center" },
          {
            title: "Actions",
            className: "text-center",
            render: function (data, type, row) {
              return `<button class="btn btn-danger btn-sm delete-btn" data-id="${row[0]}">Delete</button>`;
            },
          },
        ],
        order: [[1, "desc"]], // Sort by date descending (column index 1)
        pageLength: 5, // Default to 5 entries per page
        lengthMenu: [5, 10, 25],
        stripeClasses: ["odd", "even"], // Add striping classes
        stripe: true, // Enable row striping
      });

      // Add click handler for delete buttons
      $("#myTable tbody").on("click", ".delete-btn", function (e) {
        e.stopPropagation(); // Prevent row click handler from firing
        const id = $(this).data("id");
        const row = table.row($(this).closest("tr"));
        const data = row.data();

        // Create and show confirmation modal
        const modal = `
          <div class="modal fade" id="deleteConfirmModal" tabindex="-1">
            <div class="modal-dialog">
              <div class="modal-content">
                <div class="modal-header">
                  <h5 class="modal-title">Confirm Delete</h5>
                  <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                  Are you sure you want to delete this entry?<br><br>
                  Date: ${data[1]}<br>
                  Project: ${data[2]}<br>
                  Category: ${data[3]}<br>
                  Word Count: ${data[4]}
                </div>
                <div class="modal-footer">
                  <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                  <button type="button" class="btn btn-danger" id="confirmDelete">Delete</button>
                </div>
              </div>
            </div>
          </div>
        `;

        // Remove any existing modal
        $("#deleteConfirmModal").remove();

        // Add new modal to body and show it
        $("body").append(modal);
        const deleteModal = new bootstrap.Modal($("#deleteConfirmModal"));
        deleteModal.show();

        // Handle confirm delete
        $("#confirmDelete").on("click", function () {
          fetch("/delete", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ id: data[0] }),
          })
            .then((response) => {
              if (!response.ok) {
                throw new Error("Network response was not ok");
              }
              return response.json();
            })
            .then((data) => {
              if (data.message === "success") {
                console.log("Successfully deleted entry with ID:", id);
                deleteModal.hide();
                // Remove the row from the table directly instead of reloading
                row.remove().draw();
              } else {
                throw new Error(data.error || "Failed to delete entry");
              }
            })
            .catch((error) => {
              console.error("Error deleting entry:", error);
              alert("Failed to delete entry. Please try again.");
            });
        });
      });
    })
    .catch((error) => {
      console.error("Error fetching records:", error);
    });
});
