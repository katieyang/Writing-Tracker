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
          { title: "Date" },
          { title: "Project Name" },
          { title: "Category" },
          { title: "Word Count" },
        ],
        order: [[1, "desc"]], // Sort by date descending (column index 1)
        pageLength: 5, // Default to 5 entries per page
        lengthMenu: [5, 10, 25],
        stripeClasses: ["odd", "even"], // Add striping classes
        stripe: true, // Enable row striping
      });

      // Add click handler for table rows
      $("#myTable tbody").on("click", "tr", function () {
        var data = table.row(this).data(); // Get row data
        if (data) {
          alert(
            `ID: ${data[0]}\nDate: ${data[1]}\nProject: ${data[2]}\nCategory: ${data[3]}\nWord Count: ${data[4]}`
          );
        }
      });
    })
    .catch((error) => {
      console.error("Error fetching records:", error);
    });
});
