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
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalize to local midnight
  const todayString = today.toISOString().split("T")[0]; // Format as YYYY-MM-DD
  document.getElementById("startDate").setAttribute("max", todayString);

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
