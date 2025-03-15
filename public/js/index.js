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
      if (selectedTime === "lastyear" || selectedTime === "alltime") {
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
          maintainAspectRatio: false,
          scales: {
            yAxes: [{ ticks: { min: 0, max: maxY } }], // Rounded maxY
          },
        },
      });

      // Set chart container height
      document.getElementById("myChart").style.height = "300px";
    })
    .catch((error) => {
      console.error("Error:", error);
    });
}

function updateStreakCount(data) {
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Convert data object dates to Date objects and sort descending
  const dates = Object.keys(data)
    .map((dateStr) => new Date(dateStr))
    .sort((a, b) => b - a);

  if (dates.length === 0) {
    document.getElementById("streakCount").textContent = streak;
    return;
  }

  // Start counting streak from most recent entry
  let currentDate = dates[0];
  streak = 1;

  // If most recent entry is not today, check if it was yesterday
  if (currentDate.getTime() !== today.getTime()) {
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (currentDate.getTime() < yesterday.getTime()) {
      document.getElementById("streakCount").textContent = 0;
      return;
    }
  }

  // Count consecutive days
  for (let i = 1; i < dates.length; i++) {
    const expectedPrevDate = new Date(currentDate);
    expectedPrevDate.setDate(expectedPrevDate.getDate() - 1);

    if (dates[i].getTime() === expectedPrevDate.getTime()) {
      streak++;
      currentDate = dates[i];
    } else {
      break;
    }
  }

  document.getElementById("streakCount").textContent = streak;
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

  // Add updateStreakCount to the fetch callback
  fetch("/getrecords", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userid: userId }),
  })
    .then((response) => response.json())
    .then((data) => {
      updateStreakCount(data);
    })
    .catch((error) => {
      console.error("Error fetching records for streak:", error);
    });
});
