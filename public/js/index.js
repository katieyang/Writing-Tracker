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
        return data.data[date].reduce((sum, entry) => sum + entry.wc, 0);
      }); // an array of word counts

      const maxY = Math.round(Math.max(...wordCountArray) / 100) * 100 + 100;

      // Destroy existing chart instance before creating a new one
      if (myChart) {
        myChart.destroy();
      }

      myChart = new Chart("myChart", {
        type: "bar",
        data: {
          labels: dates,
          datasets: [
            {
              fill: false,
              lineTension: 0,
              backgroundColor: "rgba(0,0,255,1.0)",
              borderColor: "rgba(0,0,255,0.1)",
              data: wordCountArray,
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

document.addEventListener("DOMContentLoaded", function () {
  // Function to get all cookies as an object
  function getAllCookies() {
    const cookies = document.cookie.split("; ");
    const cookieObject = {};
    cookies.forEach((cookie) => {
      const [name, value] = cookie.split("=");
      cookieObject[name] = value;
    });
    return cookieObject;
  }
  // Function to set a cookie
  function setCookie(name, value, days) {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    const expires = "expires=" + date.toUTCString();
    document.cookie = name + "=" + value + ";" + expires + ";path=/";
  }

  // Function to check if a cookie exists and set it if it doesn't
  function checkAndSetCookie(name, value, days) {
    const cookies = getAllCookies();
    if (!cookies[name]) {
      setCookie(name, value, days);
      console.log(`Cookie ${name} set to ${value}`);
      return value;
    } else {
      console.log(`Cookie ${name} already exists with value ${cookies[name]}`);
      return cookies[name];
    }
  }

  // Function to generate a random user ID
  function generateRandomUserId(length) {
    const characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  }

  console.log(getAllCookies());
  const newUserId = generateRandomUserId(16);
  userId = checkAndSetCookie("userid", newUserId, 365 * 50);
  console.log(getAllCookies());

  // Set the max date for the start date input to today
  const today = new Date().toISOString().split("T")[0];
  document.getElementById("startDate").setAttribute("max", today);

  document
    .getElementById("wcupdate")
    .addEventListener("submit", function (event) {
      event.preventDefault(); // Prevent the default form submission

      // Collect form data
      const formData = new FormData(event.target);

      // Convert FormData to an object for easier handling
      const formObject = Object.fromEntries(formData.entries());
      formObject.userid = userId;

      // Log or display the results
      console.log("Form Data:", formObject);

      // Send the form data to the server
      fetch("/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formObject),
      })
        .then((response) => response.json())
        .then((data) => {
          console.log("Server Response:", data);
          location.reload();
        })
        .catch((error) => {
          console.error("Error:", error);
        });
    });
});
