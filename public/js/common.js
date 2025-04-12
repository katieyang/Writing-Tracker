document.addEventListener("DOMContentLoaded", function () {
  // Function to get all localStorage items as an object
  function getAllStorage() {
    const storageObject = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      storageObject[key] = localStorage.getItem(key);
    }
    return storageObject;
  }

  // Function to set a localStorage item
  function setStorage(name, value) {
    localStorage.setItem(name, value);
  }

  // Function to check if a localStorage item exists and set it if it isn't
  function checkAndSetStorage(name, value) {
    const storedValue = localStorage.getItem(name);
    if (!storedValue) {
      setStorage(name, value);
      console.log(`Storage ${name} set to ${value}`);
      return value;
    } else {
      console.log(`Storage ${name} already exists with value ${storedValue}`);
      return storedValue;
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

  console.log(getAllStorage());
  const newUserId = generateRandomUserId(16);
  userId = checkAndSetStorage("userid", newUserId);
  console.log(getAllStorage());

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
