document.addEventListener("DOMContentLoaded", function () {
  document
    .getElementById("wcupdate")
    .addEventListener("submit", function (event) {
      event.preventDefault(); // Prevent the default form submission

      console.log("This is working");

      // Collect form data
      const formData = new FormData(event.target);

      // Convert FormData to an object for easier handling
      const formObject = Object.fromEntries(formData.entries());

      // Log or display the results
      console.log("Form Data:", formObject);

      document.getElementById("submission").innerText = JSON.stringify(
        formObject,
        null,
        2
      );

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
        })
        .catch((error) => {
          console.error("Error:", error);
        });
    });

  // fetching the data to initialize the chart
  // needs to have ability to handle if it's empty when initialized!
  fetch("/test", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: null,
  })
    .then((response) => response.json())
    .then((data) => {
      //for creating the graph
      const xValues = data.dates;
      const yValues = data.wc;
      maxY = Math.round(Math.max(...yValues) / 100) * 100 + 100;

      new Chart("myChart", {
        type: "bar",
        data: {
          labels: xValues,
          datasets: [
            {
              fill: false,
              lineTension: 0,
              backgroundColor: "rgba(0,0,255,1.0)",
              borderColor: "rgba(0,0,255,0.1)",
              data: yValues,
            },
          ],
        },
        options: {
          legend: { display: false },
          scales: {
            yAxes: [{ ticks: { min: 0, max: maxY } }], //want to figure out a way to make this flexible
          },
        },
      });
    })
    .catch((error) => {
      console.error("Error:", error);
    });
});
