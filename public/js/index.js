let myChart = null; // Store the chart instance globally

// Function to update the chart based on the selected time
function updateChart(selectedTime) {
  fetch("/initial", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userid: userId, time: selectedTime }),
  })
    .then((response) => response.json())
    .then((data) => {
      // For creating the graph
      console.log(data.data);
      const dates = Object.keys(data.data); // an array of dates
      const wordCountArray = dates.map((date) => {
        const totalwc = data.data[date].reduce(
          (sum, entry) => sum + entry.wc,
          0
        );
        return totalwc;
      }); // an array of word counts

      // Create array of dates from startDate to today
      const updatedDates = [];
      let startDate = new Date(data.startDate);
      const today = new Date();

      while (startDate <= today) {
        updatedDates.push(startDate.toISOString().split("T")[0]);
        startDate.setDate(startDate.getDate() + 1);
      }

      // Create array of word counts matching updatedDates
      const updatedWordCountArray = updatedDates.map((date) => {
        if (dates.includes(date)) {
          // If date exists in original data, use the word count
          return data.data[date].reduce((sum, entry) => sum + entry.wc, 0);
        } else {
          // For dates not in original data, use 0
          return 0;
        }
      });

      let monthlyData = {}; // Declare outside to fix scope

      // Special handling for Last Year view
      if (selectedTime === "lastyear") {
        // Group data by month
        monthlyData = {}; // Initialize the object
        updatedDates.forEach((date, index) => {
          const monthKey = date.substring(0, 7); // Get YYYY-MM format
          if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = 0;
          }
          monthlyData[monthKey] += updatedWordCountArray[index];
        });

        // Convert back to arrays for the chart
        const monthLabels = Object.keys(monthlyData);
        const monthWordCounts = Object.values(monthlyData);

        // Update the arrays used by the chart
        updatedDates.length = 0;
        updatedDates.push(...monthLabels);

        updatedWordCountArray.length = 0;
        updatedWordCountArray.push(...monthWordCounts);
      }

      const maxValue =
        selectedTime === "lastyear"
          ? Math.max(...Object.values(monthlyData))
          : Math.max(...updatedWordCountArray);

      // Find appropriate rounding increment based on max value
      let roundingIncrement;
      if (maxValue <= 100) {
        roundingIncrement = 25;
      } else if (maxValue <= 500) {
        roundingIncrement = 100;
      } else if (maxValue <= 2000) {
        roundingIncrement = 500;
      } else {
        roundingIncrement = 1000;
      }

      const maxY = maxValue
        ? Math.ceil(maxValue / roundingIncrement) * roundingIncrement
        : 100;

      // Update cumulative word count
      const cumulativeCount = updatedWordCountArray.reduce(
        (sum, count) => sum + count,
        0
      );
      document.getElementById("cumulativeCount").textContent = cumulativeCount;

      // Destroy existing chart instance before creating a new one
      if (myChart) {
        myChart.destroy();
      }

      myChart = new Chart("myChart", {
        type: "bar",
        data: {
          labels: updatedDates,
          datasets: [
            {
              fill: false,
              lineTension: 0,
              backgroundColor: "rgba(0,0,255,1.0)",
              borderColor: "rgba(0,0,255,0.1)",
              data: updatedWordCountArray,
            },
          ],
        },
        options: {
          legend: { display: false },
          scales: {
            yAxes: [{ ticks: { min: 0, max: maxY } }], // Rounded maxY
          },
        },
      });
    })
    .catch((error) => {
      console.error("Error:", error);
    });
}

$(document).ready(function () {
  $(".btn-group-toggle .btn").click(function () {
    // Remove 'active' class from all buttons in the group
    $(".btn-group-toggle .btn").removeClass("active");

    // Add 'active' class to the clicked button
    $(this).addClass("active");

    // Mark the corresponding radio input as checked
    $(this).find("input").prop("checked", true);

    //send data to server and modify the chart
    const selectedTime = $(this).find("input").attr("id");
    updateChart(selectedTime);
  });
  // Initial chart load
  updateChart("lastmonday");
});
