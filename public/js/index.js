let myChart = null; // Store the chart instance globally
let myLineChart = null;

function getStartDateForPeriod(selectedTime) {
  // this is in local time zone
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let startDate;
  if (selectedTime === "lastmonday") {
    // Get last Monday
    const dayOfWeek = today.getDay();
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek;
    const lastMonday = new Date(today);
    lastMonday.setDate(today.getDate() - diff);
    startDate = lastMonday;
  } else if (selectedTime === "lastwk") {
    startDate = new Date(today);
    startDate.setDate(today.getDate() - 6);
  } else if (selectedTime === "last30days") {
    startDate = new Date(today);
    startDate.setDate(today.getDate() - 30);
  } else if (selectedTime === "lastyear") {
    startDate = new Date(today);
    startDate.setMonth(today.getMonth() - 11);
  } else if (selectedTime === "alltime") {
    startDate = new Date("2000-01-01");
  } else {
    startDate = new Date("2000-01-01");
  }
  return startDate;
}

// Function to update the chart based on the selected time
function updateChart(
  // default values
  selectedTime = "lastmonday",
  selectedAggregation = "category"
) {
  fetch("/getrecords", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userid: userId }),
  })
    .then((response) => response.json())
    .then((allData) => {
      // allData is { [date]: [entries] }
      // Filter dates based on selectedTime
      const startDate = getStartDateForPeriod(selectedTime);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      // Get all dates in the data
      const allDates = Object.keys(allData).sort();
      // Filter dates within the range
      const filteredDates = allDates.filter((dateStr) => {
        const [year, month, day] = dateStr.split("-").map(Number);
        const dateObj = new Date(year, month - 1, day);
        return dateObj >= startDate && dateObj <= today;
      });
      // Build filtered data object
      const data = {};
      filteredDates.forEach((date) => {
        data[date] = allData[date];
      });
      // Now, proceed as before, but with filtered data
      // For creating the graph
      const dates = Object.keys(data); // an array of dates
      const wordCountArray = dates.map((date) => {
        const totalwc = data[date].reduce((sum, entry) => sum + entry.wc, 0);
        return totalwc;
      });

      // Create array of dates from startDate to today
      const updatedDates = [];
      let iterDate = new Date(startDate);
      while (iterDate <= today) {
        const localDate = new Date(iterDate.getTime() + iterDate.getTimezoneOffset() * 60000);
        updatedDates.push(
          localDate.getFullYear() +
            "-" +
            String(localDate.getMonth() + 1).padStart(2, "0") +
            "-" +
            String(localDate.getDate()).padStart(2, "0")
        );
        iterDate.setDate(iterDate.getDate() + 1);
      }

      // Create array of word counts matching updatedDates
      let updatedWordCountArray = updatedDates.map((date) => {
        if (dates.includes(date)) {
          // If date exists in original data, use the word count
          return data[date].reduce((sum, entry) => sum + entry.wc, 0);
        } else {
          // For dates not in original data, use 0
          return 0;
        }
      });

      // Create a dictionary of categories with arrays of word counts matching updatedDates
      const categoryArray = {};
      //fetch all the unique categories
      const categories = new Set();
      dates.forEach((date) => {
        data[date].forEach((entry) => {
          categories.add(entry.category);
        });
      });

      for (const category of categories) {
        categoryArray[category] = updatedDates.map((date) => {
          if (dates.includes(date)) {
            // If date exists in original data, use the word count
            return data[date]
              .filter((entry) => entry.category === category)
              .reduce((sum, entry) => sum + entry.wc, 0);
          } else {
            // For dates not in original data, use 0
            return 0;
          }
        });
      }

      // Create a dictionary of projects with arrays of word counts matching updatedDates
      const projectArray = {};
      //fetch all the unique projects
      const projects = new Set();
      dates.forEach((date) => {
        data[date].forEach((entry) => {
          projects.add(entry.projectName);
        });
      });

      for (const project of projects) {
        projectArray[project] = updatedDates.map((date) => {
          if (dates.includes(date)) {
            // If date exists in original data, use the word count
            return data[date]
              .filter((entry) => entry.projectName === project)
              .reduce((sum, entry) => sum + entry.wc, 0);
          } else {
            // For dates not in original data, use 0
            return 0;
          }
        });
      }

      let monthlyData = {}; // Declare outside to fix scope

      // Special handling for Last Year and All Time views to aggregate monthly instead of daily
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

        //update categoryArray with monthly data
        monthlyCategoryData = {};
        for (const category of categories) {
          if (!monthlyCategoryData[category]) {
            monthlyCategoryData[category] = {}; // Initialize it as an object
          }

          updatedDates.forEach((date, index) => {
            const monthKey = date.substring(0, 7); // Get YYYY-MM format
            if (!monthlyCategoryData[category][monthKey]) {
              monthlyCategoryData[category][monthKey] = 0;
            }
            monthlyCategoryData[category][monthKey] +=
              categoryArray[category][index];
          });
        }

        //update projectArray with monthly data
        monthlyProjectData = {};
        for (const project of projects) {
          if (!monthlyProjectData[project]) {
            monthlyProjectData[project] = {}; // Initialize it as an object
          }

          updatedDates.forEach((date, index) => {
            const monthKey = date.substring(0, 7); // Get YYYY-MM format
            if (!monthlyProjectData[project][monthKey]) {
              monthlyProjectData[project][monthKey] = 0;
            }
            monthlyProjectData[project][monthKey] +=
              projectArray[project][index];
          });
        }

        // Update the arrays used by the chart
        updatedDates.length = 0;
        updatedDates.push(...monthLabels);

        updatedWordCountArray.length = 0;
        updatedWordCountArray.push(...monthWordCounts);

        // Update categoryArray with monthly data
        for (const category of categories) {
          // Ensure categoryArray[category] is reset to an empty list
          categoryArray[category] = [];

          // Push the monthly data (values) for the current category
          categoryArray[category].push(
            ...Object.values(monthlyCategoryData[category])
          );
        }

        // Update projectArray with monthly data
        for (const project of projects) {
          // Ensure projectArray[project] is reset to an empty list
          projectArray[project] = [];

          // Push the monthly data (values) for the current project
          projectArray[project].push(
            ...Object.values(monthlyProjectData[project])
          );
        }
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

      let maxY = maxValue
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

      if (selectedAggregation == "total") {
        myChart = new Chart("myChart", {
          type: "bar",
          data: {
            labels: updatedDates,
            datasets: [
              {
                fill: false,
                lineTension: 0,
                backgroundColor: "rgba(47, 55, 64, 1)",
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
      } else if (selectedAggregation == "bycategory") {
        const colors = [
          "rgba(47, 55, 64, 1)", // Dark Slate Blue
          "rgba(112, 128, 144, 1)", // Slate Gray
          "rgba(102, 163, 141, 1)", // Soft Green
          "rgba(169, 169, 169, 1)", // Cool Gray
          "rgba(188, 143, 143, 1)", // Dusty Rose
        ];

        // Convert categoryArray into datasets dynamically
        const datasets = Object.keys(categoryArray).map((category, index) => ({
          label: category,
          backgroundColor: colors[index % colors.length], // Assign colors cyclically
          data: categoryArray[category], // The data array for each category
        }));

        myChart = new Chart("myChart", {
          type: "bar",
          data: {
            labels: updatedDates, // X-axis labels (dates)
            datasets: datasets, // Dynamically generated datasets based on categoryArray
          },
          options: {
            maintainAspectRatio: false,
            legend: { display: true }, // Display legend
            scales: {
              xAxes: [
                {
                  stacked: true, // Stack bars on the x-axis
                },
              ],
              yAxes: [
                {
                  stacked: true, // Stack bars on the y-axis
                  ticks: {
                    beginAtZero: true, // Start y-axis from zero
                  },
                },
              ],
            },
          },
        });
      } else if (selectedAggregation == "byproject") {
        const colors = [
          "rgba(47, 55, 64, 1)", // Dark Slate Blue
          "rgba(112, 128, 144, 1)", // Slate Gray
          "rgba(102, 163, 141, 1)", // Soft Green
          "rgba(169, 169, 169, 1)", // Cool Gray
          "rgba(188, 143, 143, 1)", // Dusty Rose
        ];

        // Convert projectArray into datasets dynamically
        const datasets = Object.keys(projectArray).map((project, index) => ({
          label: project,
          backgroundColor: colors[index % colors.length], // Assign colors cyclically
          data: projectArray[project], // The data array for each project
        }));

        myChart = new Chart("myChart", {
          type: "bar",
          data: {
            labels: updatedDates, // X-axis labels (dates)
            datasets: datasets, // Dynamically generated datasets based on projectArray
          },
          options: {
            maintainAspectRatio: false,
            legend: { display: true }, // Display legend
            scales: {
              xAxes: [
                {
                  stacked: true, // Stack bars on the x-axis
                },
              ],
              yAxes: [
                {
                  stacked: true, // Stack bars on the y-axis
                  ticks: {
                    beginAtZero: true, // Start y-axis from zero
                  },
                },
              ],
            },
          },
        });
      }

      // Destroy existing line chart if it exists
      if (myLineChart) {
        myLineChart.destroy();
      }

      // Convert updatedWordCountArray to cumulative values
      let cumulativeSum = 0;
      updatedWordCountArray = updatedWordCountArray.map((count) => {
        cumulativeSum += count;
        return cumulativeSum;
      });

      // Create new line chart
      const dailyGoal = localStorage.getItem("dailyGoal");
      const datasets = [
        {
          label: "Actual",
          fill: false,
          lineTension: 0.4,
          backgroundColor: "rgba(47, 55, 64, 0.1)",
          borderColor: "rgba(47, 55, 64, 1)",
          pointBackgroundColor: "rgba(47, 55, 64, 1)",
          pointBorderColor: "rgba(47, 55, 64, 1)",
          pointRadius: 3,
          data: updatedWordCountArray,
        },
      ];

      // Add goal line (defaults to 0 if dailyGoal doesn't exist)
      const goalLine = [];
      let cumulativeGoal = 0;
      const dailyGoalValue = dailyGoal ? parseInt(dailyGoal) : 0;

      if (selectedTime === "lastyear" || selectedTime === "alltime") {
        // For monthly view, multiply daily goal by average days in month
        const daysInMonth = 30.44; // Average days per month
        for (let i = 0; i < updatedDates.length; i++) {
          cumulativeGoal += dailyGoalValue * daysInMonth;
          goalLine.push(cumulativeGoal);
        }
      } else {
        // For daily view, use regular daily goal
        for (let i = 0; i < updatedDates.length; i++) {
          cumulativeGoal += dailyGoalValue;
          goalLine.push(cumulativeGoal);
        }
      }

      datasets.push({
        label: "Goal",
        fill: false,
        lineTension: 0.4,
        backgroundColor: "rgba(255, 99, 132, 0.1)",
        borderColor: "rgba(52, 152, 219, 1)",
        pointBackgroundColor: "rgba(52, 152, 219, 1)",
        pointBorderColor: "rgba(52, 152, 219, 1)",
        pointRadius: 3,
        data: goalLine,
      });
      // Update maxY for the chart scale based on the higher of actual or goal values
      maxY =
        Math.ceil(
          Math.max(Math.max(...updatedWordCountArray), Math.max(...goalLine))
        ) || 100;

      myLineChart = new Chart("myLineChart", {
        type: "line",
        data: {
          labels: updatedDates,
          datasets: datasets,
        },
        options: {
          legend: { display: true },
          maintainAspectRatio: false,
          scales: {
            yAxes: [{ ticks: { min: 0, max: maxY } }],
          },
        },
      });
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
    .map((dateStr) => {
      const [year, month, day] = dateStr.split("-").map(Number);
      return new Date(year, month - 1, day); // Ensures local time interpretation
    })
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
  var selectedTime = "lastmonday";
  var selectedAggregation = "total";

  // Handling time buttons click
  $(".btn-group-toggle.time .btn").click(function () {
    // Remove 'active' class from all buttons in the group
    $(".btn-group-toggle.time .btn").removeClass("active");

    // Add 'active' class to the clicked button
    $(this).addClass("active");

    // Mark the corresponding radio input as checked
    $(this).find("input").prop("checked", true);

    // Send data to server and modify the chart
    selectedTime = $(this).find("input").attr("id");

    // Update chart with selected time and current aggregation
    updateChart(selectedTime, selectedAggregation);
  });

  // Handling aggregation buttons click with event delegation
  $(".btn-group-toggle.aggregation").on("click", ".btn", function () {
    // Remove 'active' class from all buttons in the group
    $(".btn-group-toggle.aggregation .btn").removeClass("active");

    // Add 'active' class to the clicked button
    $(this).addClass("active");

    // Mark the corresponding radio input as checked
    $(this).find("input").prop("checked", true);

    // Update the selected aggregation value
    selectedAggregation = $(this).find("input").attr("id");

    // Update the chart with the selected time and aggregation
    updateChart(selectedTime, selectedAggregation);

    // Debug logs
    console.log(selectedTime);
    console.log("THIS HAPPENED");
    console.log(selectedAggregation);
  });

  // Handle daily goal form submission
  $("#goalForm").on("submit", function (event) {
    event.preventDefault();
    const dailyGoal = $("#dailyGoal").val();
    // Store the daily goal in localStorage
    localStorage.setItem("dailyGoal", dailyGoal);

    // Fetch and log the stored daily goal
    const storedGoal = localStorage.getItem("dailyGoal");
    console.log("Stored daily goal:", storedGoal);

    // Refresh the page after storing the goal
    location.reload();
  });

  // Initial chart load with "lastmonday" as the default value
  updateChart("lastmonday", selectedAggregation);

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
